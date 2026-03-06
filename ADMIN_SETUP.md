# Admin Dashboard Setup (Firebase)

## Grant Admin Role via Firebase Custom Claims

Admin access is controlled by Firebase **custom claims** (`admin: true`). Custom claims are stored in the user's ID token and verified on each request.

### 1. Get a service account JSON file

1. Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Service Accounts
2. Click **Generate new private key**
3. Save the JSON file somewhere on your machine (e.g. `./serviceAccountKey.json`)
4. **Never commit this file to the repository** — it is already in `.gitignore`

### 2. Set the environment variable

Point `GOOGLE_APPLICATION_CREDENTIALS` to your service account file:

**Windows (PowerShell):**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\serviceAccountKey.json"
```

**Windows (Cmd):**
```cmd
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccountKey.json
```

**macOS/Linux:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="./path/to/serviceAccountKey.json"
```

### 3. Run the script

```bash
node scripts/setAdmin.js user@email.com
```

Or with the npm script:
```bash
npm run set-admin -- user@email.com
```

### 4. Sign out and sign back in

**Important**: Firebase custom claims only take effect after the token is refreshed. The user must sign out and sign back in on the frontend.

### 5. Access the Admin Dashboard

Navigate to `/dashboard/admin`. The dashboard verifies `token.claims.admin === true` (or `role === 'admin'`) before loading data.

---

## Backend API Requirements

The admin dashboard calls these endpoints (proxied via `/api/backend`). Your backend should:

1. **Verify the Firebase ID token** from the `Authorization: Bearer <token>` header
2. **Check custom claims**: `decodedToken.claims.admin === true` or `decodedToken.claims.role === 'admin'`
3. Return 403 if the user is not an admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Platform statistics |
| GET | `/admin/users` | Paginated user list |
| POST | `/admin/users/:id/grant-plan` | Grant subscription |
| DELETE | `/admin/users/:id` | Delete user |

---

## Settings: Password Reset (Firebase)

Password management uses Firebase only. Users can:
- **Email users**: Click "Send Reset Email" in Settings → Account & Security. Firebase sends a password reset link.
- **Google users**: Password is managed by Google (no reset option in app).

There is no backend `change-password` endpoint—Firebase handles all password flows.
