# Firebase Setup & Deployment Guide

This guide provides a step-by-step tutorial on how to install, configure, and apply Firebase to your web application.

---

## Phase 1: Create Your Firebase Project
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add Project"** and follow the prompts to name your project (e.g., "noisewatch").
3.  Once created, click the **Web icon (`</>`)** on the Project Overview page to register your app.
4.  **Copy the `firebaseConfig` object** (you will need this for your code later).

---

## Phase 2: Enable Services
In the Firebase Sidebar, enable the following:

- **Realtime Database**: 
    - Click "Create Database".
    - Choose a location and start in **Test Mode** (to allow reads/writes while developing).
- **Storage**:
    - Click "Get Started".
    - Start in **Test Mode** and click "Done".
- **Hosting**:
    - Click "Get Started" and follow the wizard (you can skip the CLI steps if you follow Phase 3 below).

---

## Phase 3: Install Firebase CLI
To deploy your site, you need the Firebase Command Line Interface on your computer.

1.  Open your terminal (PowerShell or Command Prompt).
2.  Run the command:
    ```powershell
    npm install -g firebase-tools
    ```
3.  Login to your Google account:
    ```powershell
    firebase login
    ```

---

## Phase 4: Initialize Your Local Project
1.  Open your project folder in the terminal.
2.  Run the initialization command:
    ```powershell
    firebase init
    ```
3.  **Selection Steps**:
    - Use the arrow keys to select **Realtime Database**, **Hosting**, and **Storage**. Press `Space` to select, then `Enter`.
    - Select **"Use an existing project"** and choose your project from Phase 1.
    - **Database**: Press `Enter` to use the default rules file (`database.rules.json`).
    - **Hosting**: 
        - What do you want to use as your public directory? Type `web_dashboard/dist`.
        - Configure as a single-page app? Type `y`.
        - Set up automatic builds/deploys with GitHub? Type `n`.
    - **Storage**: Press `Enter` to use the default rules file (`storage.rules`).

---

## Phase 5: Apply Firebase to Your Code
1.  Install the Firebase SDK in your frontend folder:
    ```powershell
    cd web_dashboard
    npm install firebase
    ```
2.  Update your Configuration:
    Open `src/firebase.js` and paste the `firebaseConfig` you copied in Phase 1:
    ```javascript
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT.firebaseapp.com",
      // ... rest of your config
    };
    ```

---

## Phase 6: Build & Deploy
Whenever you make changes and want them live:

1.  **Build the App**:
    ```powershell
    cd web_dashboard
    npm run build
    ```
2.  **Deploy Everything**:
    From the **ROOT** folder of your project:
    ```powershell
    firebase deploy
    ```

---

## Troubleshooting Tips
- **Authentication Errors**: If `firebase deploy` fails, try `firebase login --reauth`.
- **403 Forbidden**: Check your `database.rules.json` and `storage.rules`. In test mode, they should have `".read": true, ".write": true`.
- **Vite Build Issues**: Ensure you are running `npm run build` inside the correct folder where `package.json` is located.
