/**
 * Set admin custom claim for a Firebase Auth user
 *
 * Usage: node scripts/setAdmin.js user@email.com
 *
 * Requires:
 * - firebase-serviceAccount.json in the project root (do NOT commit this file)
 * - firebase-admin package (npm install firebase-admin)
 */
const admin = require('firebase-admin');
const path = require('path');

let serviceAccount;
try {
  serviceAccount = require(path.join(__dirname, '..', 'firebase-serviceAccount.json'));
} catch (err) {
  console.error('Error: firebase-serviceAccount.json not found in project root.');
  console.error('Save your Firebase service account JSON as firebase-serviceAccount.json');
  console.error('and ensure it is listed in .gitignore.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const setAdminClaim = async (email) => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log('✅ Success! Admin claim set for:', email);
    console.log('   UID:', user.uid);
    console.log('');
    console.log('The user must sign out and sign back in for the claim to take effect.');
  } catch (err) {
    console.error('Error:', err.message);
    if (err.code === 'auth/user-not-found') {
      console.error('No user found with that email. The user must sign up first.');
    }
    process.exit(1);
  }
  process.exit(0);
};

// Get email from command line
const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/setAdmin.js user@email.com');
  process.exit(1);
}
if (!email.includes('@')) {
  console.error('Error: Please provide a valid email address.');
  process.exit(1);
}

setAdminClaim(email);
