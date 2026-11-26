# Mechanic push notifications

VAHANOVA sends a data-only Firebase Cloud Messaging (FCM) push when a new
pending document is created in `openRequests`, and sends a private alert when a
new booking is created with a mechanic already assigned. Open requests notify
all approved mechanics with an active public provider profile and a registered
device token; direct bookings notify only the assigned mechanic. The notification contains only the sanitized service
summary; customer phone numbers and exact addresses are never included.

## One-time Firebase setup

1. In Firebase Console, open **Project settings → Cloud Messaging → Web Push certificates** and generate a key pair if one does not exist.
2. Copy the **public key** only. In Vercel, add `NEXT_PUBLIC_FIREBASE_VAPID_KEY` with that value for Production (and Preview if needed), then redeploy the site.
3. Confirm Firebase Cloud Messaging is enabled for the Firebase project.
4. Cloud Functions require the Firebase **Blaze** billing plan. Enable billing for the same Firebase project before deploying the function.
5. From the repository root, authenticate/select the correct Firebase project, then deploy:
   ```sh
   firebase use <your-firebase-project-id>
   firebase deploy --only firestore:rules,functions
   ```
   The rules include the private `mechanicDevices/{uid}` token collection. Do not replace them with broad public read/write rules.

## Enable on each mechanic phone

1. Open the deployed VAHANOVA website in Chrome on Android and sign in with the approved mechanic account.
2. Open the mechanic dashboard and tap **Enable alerts**.
3. Allow browser notifications. For best reliability, install VAHANOVA from Chrome's **Add to Home screen** option and keep browser/system notification permissions enabled.

Each device registers its own FCM token. New open requests notify all active, registered mechanics; the existing Requests list still updates live and remains the fallback if notifications are blocked or offline.

## Test

1. Enable alerts on a mechanic phone.
2. From a separate customer account, create a new unassigned/emergency request.
3. Confirm the mechanic receives a notification with the service summary and that tapping it opens the Requests section.
4. Confirm the request counter increases while the mechanic dashboard is open.

Push delivery depends on browser/device permissions, network availability, and Firebase/Google messaging services; it is not a guaranteed emergency-response channel.
