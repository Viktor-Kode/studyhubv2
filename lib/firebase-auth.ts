import {
    signInWithPopup,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/lib/store/authStore'
import type { AppRole, AppUser } from '@/lib/types/auth'

export type { AppRole, AppUser }

// ─── Backend Sync Helpers ─────────────────────────────────────────────────────

/**
 * Fetch the user's data from Firestore.
 * Role can be overridden by Firebase custom claims (e.g. admin).
 */
export async function fetchAppUser(
    uid: string,
    firebaseUser?: FirebaseUser
): Promise<AppUser | null> {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid))
        const userData = userDoc.exists() ? userDoc.data() : {}

        let role: AppRole = (userData.role as AppRole) || 'student'

        // Firebase custom claims override Firestore for role (e.g. admin)
        if (firebaseUser) {
            try {
                const tokenResult = await firebaseUser.getIdTokenResult(false)
                const claimRole = tokenResult.claims.role as string
                const claimAdmin = tokenResult.claims.admin === true
                if (claimAdmin) {
                    role = 'admin'
                } else if (claimRole === 'admin' || claimRole === 'teacher' || claimRole === 'student') {
                    role = claimRole as AppRole
                }
            } catch {
                // Ignore token errors
            }
        }

        return {
            uid: uid,
            email: userData.email || firebaseUser?.email || '',
            name: userData.name || firebaseUser?.displayName || 'User',
            role,
            avatar: userData.avatar || firebaseUser?.photoURL || undefined,
            provider: (userData.provider as 'google' | 'password') || (firebaseUser?.providerData[0]?.providerId === 'google.com' ? 'google' : 'password')
        }
    } catch (error) {
        console.error('[fetchAppUser] Failed:', error)
        return null
    }
}

/**
 * Update the user's profile in Firestore.
 */
export async function saveUserRole(
    uid: string,
    role: AppRole,
    name?: string,
    email?: string
): Promise<void> {
    await setDoc(doc(db, 'users', uid), {
        role,
        ...(name && { name }),
        ...(email && { email }),
        updatedAt: new Date()
    }, { merge: true })
}

/**
 * Check if a user has a role already assigned in Firestore.
 * @deprecated Use fetchAppUser instead
 */
export async function checkUserRoleInFirestore(uid: string): Promise<AppRole | null> {
    const user = await fetchAppUser(uid)
    return user?.role || null
}

/**
 * Build an AppUser from a FirebaseUser + resolved role.
 */
export function buildAppUser(firebaseUser: FirebaseUser, role: AppRole): AppUser {
    return {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        role,
        avatar: firebaseUser.photoURL ?? undefined,
        provider: (firebaseUser.providerData[0]?.providerId === 'google.com'
            ? 'google'
            : 'password') as 'google' | 'password',
    }
}

// ─── Auth Actions ─────────────────────────────────────────────────────────────

/** Sign in with Google using a popup window. */
export async function signInWithGoogle(): Promise<{ appUser: AppUser | null; firebaseUser: FirebaseUser }> {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const { user } = await signInWithPopup(auth, provider)

    // 1. Check Firestore + custom claims for role
    const appUser = await fetchAppUser(user.uid, user)

    return { appUser, firebaseUser: user }
}

/** Register a new user with email + password. */
export async function signUpWithEmail(
    email: string,
    password: string,
    name: string,
    role: AppRole = 'student'
): Promise<AppUser> {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    // Update display name in Firebase Auth
    const { updateProfile } = await import('firebase/auth')
    await updateProfile(user, { displayName: name })

    // Set initial role/name in Firestore
    await saveUserRole(user.uid, role, name, email)
    return buildAppUser(user, role)
}

/** Sign in an existing user with email + password. */
export async function loginWithEmail(
    email: string,
    password: string
): Promise<AppUser> {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    const appUser = await fetchAppUser(user.uid, user)
    return appUser || buildAppUser(user, 'student')
}

/** Sign out of Firebase. */
export async function firebaseSignOut(): Promise<void> {
    await signOut(auth)
}

/**
 * Subscribe to Firebase auth state changes.
 * Syncs with backend on every change.
 */
export function subscribeToAuthState(
    onLoaded?: () => void
): () => void {
    const { setUser, setLoading, logout } = useAuthStore.getState()

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            // Optimistically set the user from Firebase data first so the UI can render
            const localUser = buildAppUser(firebaseUser, 'student')
            setUser(localUser)
            setLoading(false) // Stop the global loader early

            try {
                // Sync with Firestore for full profile; merge Firebase custom claims (e.g. admin) for role
                const appUser = await fetchAppUser(firebaseUser.uid, firebaseUser)
                if (appUser) {
                    setUser(appUser)
                }
                await useAuthStore.getState().refreshUser()
            } catch (err) {
                console.error('[AuthState] Firestore sync failed:', err)
            }
        } else {
            logout()
            setLoading(false)
        }
        onLoaded?.()
    })

    return unsubscribe
}
