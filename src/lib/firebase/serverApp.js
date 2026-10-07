// Keep this module on the server so the session cookie is never bundled for the browser.
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

// Load the Next.js cookie store, which holds the Firebase ID token.
import { cookies } from "next/headers";
// Load the Firebase app factories used to mirror the client session on the server.
import { initializeServerApp, initializeApp } from "firebase/app";

// Load the Auth factory that reads the user from a server app.
import { getAuth } from "firebase/auth";

// Build a Firebase app for server rendering that uses the same user as the browser.
export async function getAuthenticatedAppForUser() {
  // Read the ID token that the header stored in the __session cookie.
  const authIdToken = (await cookies()).get("__session")?.value;

  // FirebaseServerApp lets server code use credentials that originated in the browser.
  // The token is optional, so signed-out requests still get a usable server app.
  // Create that server app from an automatically configured Firebase app.
  const firebaseServerApp = initializeServerApp(
    // initializeApp() with no arguments uses the App Hosting environment configuration.
    // https://github.com/firebase/firebase-js-sdk/issues/8863#issuecomment-2751401913
    initializeApp(),
    {
      // Pass the cookie token so server Security Rules see the signed-in user.
      authIdToken,
    },
  );

  // Get the Auth instance that belongs to this server app.
  const auth = getAuth(firebaseServerApp);
  // Wait until Auth has applied the token before reading currentUser.
  await auth.authStateReady();

  // Hand back the app for Firestore and the user for the header.
  return { firebaseServerApp, currentUser: auth.currentUser };
}
