# Firebase Setup Instructions

## Enable Email/Password Authentication

The error `auth/operation-not-allowed` means Email/Password authentication is not enabled in your Firebase project.

### Steps to Fix:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/sapphire-479610/authentication/providers

2. **Enable Email/Password Provider**
   - Click on "Email/Password" in the Sign-in providers list
   - Toggle "Email/Password" to **Enabled**
   - (Optional) Toggle "Email link (passwordless sign-in)" if desired
   - Click **Save**

3. **Configure Authorized Domains**
   - Go to: https://console.firebase.google.com/project/sapphire-479610/authentication/settings
   - Under "Authorized domains", ensure these are added:
     - `sapphire-479610.web.app`
     - `sapphire-479610.firebaseapp.com`
     - `localhost` (for development)

4. **Test the Fix**
   - Refresh the login page
   - Try signing up with a new email/password
   - Should now work without errors

---

## Firestore Setup (Required for User Data)

1. **Create Firestore Database**
   - Go to: https://console.firebase.google.com/project/sapphire-479610/firestore
   - Click "Create Database"
   - Select **Production mode** (we'll set rules later)
   - Choose location: `us-central` (or closest to your users)

2. **Set Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own profile
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Users can read all user profiles (for leaderboard)
       match /users/{userId} {
         allow read: if request.auth != null;
       }
       
       // Users can write their own votes
       match /daily_votes/{voteId} {
         allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
         allow read: if request.auth != null;
       }
       
       // Users can read their own points history
       match /points_history/{pointId} {
         allow read: if request.auth != null && resource.data.uid == request.auth.uid;
       }
     }
   }
   ```

3. **Create Indexes** (if needed)
   - Firestore will prompt you to create indexes when queries require them
   - Follow the auto-generated links in error messages

---

## Firebase Admin SDK (Backend)

For the backend to access Firestore, you need a service account:

1. **Create Service Account Key**
   - Go to: https://console.firebase.google.com/project/sapphire-479610/settings/serviceaccounts/adminsdk
   - Click "Generate new private key"
   - Download the JSON file

2. **Add to Cloud Run**
   ```bash
   # Upload as secret
   gcloud secrets create firebase-admin-key --data-file=./service-account-key.json
   
   # Mount to Cloud Run
   gcloud run services update cloud-trader \
     --region=northamerica-northeast1 \
     --update-secrets=GOOGLE_APPLICATION_CREDENTIALS=/secrets/firebase-admin-key:latest
   ```

3. **Alternative: Use Application Default Credentials**
   - Cloud Run automatically has service account with Firestore access
   - No additional setup needed if using same GCP project

---

## Verification

After setup, test:
1. ✅ Sign up with new email/password
2. ✅ Check Firestore for new user document in `users` collection
3. ✅ Submit a vote and verify in `daily_votes` collection
4. ✅ Check leaderboard loads correctly
