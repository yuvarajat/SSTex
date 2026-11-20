import { firebaseConfig } from "./firebase-config.js";

let connection;

export function connectFirebase() {
  connection ??= initializeFirebase();
  return connection;
}

async function initializeFirebase() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.databaseURL) {
    throw new Error("The app is unavailable. Please contact the administrator.");
  }

  try {
    const [appSdk, authSdk, databaseSdk] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js"),
    ]);
    const app = appSdk.initializeApp(firebaseConfig);
    return {
      auth: authSdk.getAuth(app),
      authSdk,
      database: databaseSdk.getDatabase(app),
      databaseSdk,
    };
  } catch {
    throw new Error("Could not connect. Check your internet connection and try again.");
  }
}

export async function requireAccount() {
  const firebase = await connectFirebase();
  await firebase.auth.authStateReady();
  const user = firebase.auth.currentUser;
  if (!user) {
    location.replace("index.html");
    return;
  }

  firebase.auth.onAuthStateChanged((currentUser) => {
    if (currentUser?.uid !== user.uid) {
      document.querySelector("[data-private]").hidden = true;
      location.replace("index.html");
    }
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) location.reload();
  });
  const signOutButton = document.getElementById("signOut");
  signOutButton?.addEventListener("click", async () => {
    try {
      await firebase.auth.signOut();
    } catch {
      const status = document.getElementById("pageStatus");
      status.textContent = "Could not sign out. Try again.";
      status.hidden = false;
    }
  });
  return { ...firebase, user };
}

export function databaseError(error, fallback) {
  if (error.code?.toLowerCase().includes("permission")) {
    return "Your account does not have permission to perform this action.";
  }
  return fallback;
}
