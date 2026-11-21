# SS Tex Invoice

The app runs as static HTML, CSS, and JavaScript. Firebase Authentication and Realtime Database provide sign-in, invoice history, and the customer and service catalog.

## Connect Firebase

1. In the [Firebase Console](https://console.firebase.google.com/), create or select a project, register a **Web app**, and create a **Realtime Database** in locked mode.
2. In **Authentication → Sign-in method**, enable **Email/Password**. In **Authentication → Users**, create the account your father will use, give it a new password, and copy its **User UID**.
3. Publish [database.rules.json](database.rules.json) under **Realtime Database → Rules**. The CLI equivalent is `firebase deploy --only database --project YOUR_PROJECT_ID`.
4. Under **Realtime Database → Data**, create a root child named `members`. Under `members`, set the account's UID to the Boolean value `true`. The resulting path is `members/YOUR_USER_UID`.
5. In **Project settings → Your apps**, select the Web app and paste its public web configuration into [firebase-config.js](firebase-config.js). Include `databaseURL`, which appears at the top of the Realtime Database Data tab.
6. Serve the static app over HTTPS on its usual host. For local use, run `python3 -m http.server 8000` from this directory and visit [localhost:8000](http://localhost:8000).

## Use the app

- Use **Customer Details** to save or edit customer billing details. Use **Service Items** to save or edit service descriptions with their unit price, HSN/SAC, and GST percentage.
- In **New Invoice**, choose saved entries and adjust the invoice fields as needed. **Preview invoice** saves an editable draft online and opens the review copy. You can download a marked draft PDF or reopen the draft from **Invoice History**. **Finalize invoice** moves the draft to the saved invoices and records the customer, service, tax, and total values it was issued with.
- **Invoice History** lists saved invoices and any pending invoices on this browser. Opening a pending invoice retries its Firebase save. The app shows **Saved to Invoice History** after Firebase confirms the write.
