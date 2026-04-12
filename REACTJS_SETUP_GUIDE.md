# ReactJS Web Dashboard Setup Guide

This guide will help you set up your local development environment for the Noisewatch React Dashboard.

---

## 1. Prerequisites
Before starting, ensure you have the following installed on your computer:
1.  **Node.js**: [Download and install Node.js](https://nodejs.org/) (LTS version recommended).
2.  **Code Editor**: [Visual Studio Code](https://code.visualstudio.com/) is recommended for the best experience.

---

## 2. Project Setup
1.  Open your terminal or command prompt.
2.  Navigate to the `web_dashboard` folder:
    ```powershell
    cd web_dashboard
    ```
3.  Install all required dependencies (React, Chart.js, Firebase SDK, etc.):
    ```powershell
    npm install
    ```

---

## 3. Development Mode
To start working on the dashboard and see changes in real-time:

1.  Run the development server:
    ```powershell
    npm run dev
    ```
2.  Open your browser and go to the URL provided in the terminal (usually `http://localhost:5173`).
3.  **HMR (Hot Module Replacement)**: Any changes you make to the `.jsx` or `.css` files will instantly reflect in the browser without a manual refresh.

---

## 4. Project Structure Overview
- **`src/firebase.js`**: Contains your Firebase API keys and initialization.
- **`src/App.jsx`**: The main hub for state management and Firebase real-time listeners.
- **`src/components/`**: Reusable parts of the UI:
    - `SensorCard.jsx`: Real-time sensor tiles.
    - `HistoryChart.jsx`: Long-term trend graphs.
    - `Leaderboard.jsx`: Rankings table.
- **`src/App.css`**: All visual styling, gradients, and layout definitions.

---

## 5. Building for Production
When you are ready to deploy your site to Firebase Hosting:

1.  Stop the development server (Ctrl+C).
2.  Run the build command:
    ```powershell
    npm run build
    ```
3.  Vite will create a `dist/` folder containing your optimized, minified files. This folder is what gets uploaded to Firebase.

---

## 6. Common Development Tasks
- **Adding a Sensor**: Update the `SENSORS` array in `App.jsx` with a new ID and color.
- **Changing Colors**: Edit the CSS variables (e.g., `--accent-blue`) at the top of `App.css`.
- **Modifying Charts**: Update the `chartOptions` objects inside `HistoryChart.jsx` or `SensorCard.jsx`.

---

## 7. Troubleshooting
- **"npm is not recognized"**: Ensure Node.js is correctly installed and added to your system PATH.
- **Module not found**: Run `npm install` again to ensure all dependencies are properly downloaded.
- **Firebase data not showing**: Check your browser console (F12) for permission errors; you may need to update your Firebase Database Rules.
