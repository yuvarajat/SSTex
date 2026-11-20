import { connectFirebase } from "./firebase.js";

const form = document.querySelector(".login-form");
const button = form.querySelector("button");
const status = document.getElementById("loginStatus");
const password = document.getElementById("password");
const loading = document.querySelectorAll(".loading-overlay, .loading-overlay-image-container");

try {
  const { auth, authSdk } = await connectFirebase();
  auth.onAuthStateChanged((user) => {
    if (user) location.replace("calc.html");
  });
  await auth.authStateReady();

  if (!auth.currentUser) {
    status.textContent = "";
    button.disabled = false;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "";
      button.disabled = true;
      loading.forEach((element) => { element.style.display = "block"; });
      try {
        const email = document.getElementById("email").value.trim();
        await authSdk.signInWithEmailAndPassword(auth, email, password.value);
      } catch (error) {
        const messages = {
          "auth/invalid-credential": "Check your email address and password.",
          "auth/network-request-failed": "Could not reach Firebase. Check your connection and try again.",
          "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
          "auth/user-disabled": "This account has been disabled.",
        };
        status.textContent = messages[error.code] ?? "Could not sign in. Check the Firebase Authentication setup.";
        button.disabled = false;
      } finally {
        password.value = "";
        loading.forEach((element) => { element.style.display = "none"; });
      }
    });
  }
} catch (error) {
  status.textContent = error.message;
}
