import { connectFirebase } from "./firebase.js";

const form = document.querySelector(".login-form");
const button = form.querySelector('button[type="submit"]');
const status = document.getElementById("loginStatus");
const password = document.getElementById("password");
const visibility = document.getElementById("passwordVisibility");
const buttonLabel = button.textContent;

function showPassword(visible) {
  password.type = visible ? "text" : "password";
  const label = visible ? "Hide password" : "Show password";
  visibility.setAttribute("aria-label", label);
  visibility.title = label;
}

visibility.addEventListener("click", () => showPassword(password.type === "password"));
visibility.hidden = false;

try {
  const { auth, authSdk } = await connectFirebase();
  auth.onAuthStateChanged((user) => {
    if (user) location.replace("dashboard.html");
  });
  await auth.authStateReady();

  if (!auth.currentUser) {
    status.classList.remove("is-loading");
    status.textContent = "";
    button.disabled = false;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "";
      showPassword(false);
      visibility.disabled = true;
      button.disabled = true;
      button.textContent = "Signing in…";
      button.classList.add("is-loading");
      try {
        const email = document.getElementById("email").value.trim();
        await authSdk.signInWithEmailAndPassword(auth, email, password.value);
      } catch (error) {
        const messages = {
          "auth/invalid-credential": "Check your email address and password.",
          "auth/network-request-failed": "Could not sign in. Check your internet connection and try again.",
          "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
          "auth/user-disabled": "This account has been disabled.",
        };
        status.textContent = messages[error.code] ?? "Could not sign in. Try again.";
        button.disabled = false;
      } finally {
        password.value = "";
        visibility.disabled = false;
        button.textContent = buttonLabel;
        button.classList.remove("is-loading");
      }
    });
  }
} catch (error) {
  status.classList.remove("is-loading");
  status.textContent = error.message;
}
