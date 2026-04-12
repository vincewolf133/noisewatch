# Noisewatch: Full System Tutorial & Setup Guide

Welcome to the **Noisewatch** project! This guide will take you through the entire setup, from wiring your hardware to deploying your live dashboard.

---

## 1. System Architecture
Noisewatch is an IoT-based sound monitoring system that detects noise triggers in multiple locations simultaneously.

1.  **Hardware (Sensors)**: Digital sound sensors detect when noise levels exceed a set threshold.
2.  **Edge Device (ESP8266)**: An ESP8266 microcontroller polls these sensors, calculates "noise intensity" (triggers per second), and sends data to the cloud.
3.  **Cloud (Firebase)**: Firebase Realtime Database stores live intensities and historical data.
4.  **Frontend (React Dashboard)**: A web application listens to Firebase and displays the data in real-time charts and leaderboards.

---

## 2. Hardware Setup

### Components Needed:
- 1x ESP8266 (NodeMCU or WeMos D1 Mini)
- 4x Digital Sound Sensors (usually the 3-pin or 4-pin modules)
- Jumper Wires & Breadboard

### Wiring Diagram:
Connect each sensor's **Digital Output (DO)** to the following ESP8266 pins:

| Sensor | ESP8266 Pin | GPIO Code |
| :--- | :--- | :--- |
| **Sensor 1** | D1 | GPIO 5 |
| **Sensor 2** | D2 | GPIO 4 |
| **Sensor 3** | D3 | GPIO 0 |
| **Sensor 4** | D4 | GPIO 2 |

- **VCC**: Connect all sensor VCC pins to the ESP8266 **3V3** or **VIN** (check sensor voltage).
- **GND**: Connect all sensor GND pins to the ESP8266 **GND**.

> [!TIP]
> **Calibration**: Most sound sensors have a small blue potentiometer (screw). Adjust this while the room is quiet until the onboard LED just turns off. When you clap, the LED should blink—this means it's detecting noise correctly!

---

## 3. Firmware Setup (Arduino IDE)

### Required Libraries:
In Arduino IDE, go to **Library Manager** and install:
- `Firebase ESP Client` by Mobizt

### Configuration:
Open [esp8266_firmware.ino](file:///c:/Users/kimjie/OneDrive/Desktop/noisewatch/esp8266_firmware/esp8266_firmware.ino) and update these lines:
```cpp
#define WIFI_SSID "Your_WiFi_Name"
#define WIFI_PASSWORD "Your_WiFi_Password"
```

### How the Code Works:
- it checks the sensors every millisecond for a "rising edge" (Transition from quiet to noisy).
- Every **1 second** (the `interval`), it sends the total count to Firebase.
- It pushes two types of data:
    - **Current**: Overwrites `/sensors/current/sensorX` (used for live gauges).
    - **History**: Pushes a new entry to `/sensors/history/sensorX` with a timestamp (used for graphs).

---

## 4. Firmware Function Breakdown
The ESP8266 code is divided into three main parts:

### A. Initialization (`setup`)
This function runs once when the device starts:
- **Pin Config**: Sets the 4 sensor pins to `INPUT` mode so it can listen for electrical triggers.
- **WiFi Connect**: Establishes a connection to your local network.
- **Firebase Init**: Sets up the communication pipeline to your project using your API Key and Database URL.
- **SSL Security**: Configures the BearSSL buffer (4096 bytes) to handle Firebase's secure certificate chain.

### B. Live Monitoring (`loop`)
This function runs thousands of times per second:
- **Edge Detection**: It doesn't just check if it's "noisy"; it checks if it *just became* noisy by comparing the current state with the previous state (`lastState`). This ensures it only counts a sound once per trigger.
- **Intensity Counting**: Whenever a trigger is detected, it increments `sensorCounts` for that specific room.

### C. Periodic Sync (Interval-based)
Every **1 second**, the loop triggers a sync:
- **`setInt`**: Overwrites the latest value at `/sensors/current`. This is what makes the gauges on your dashboard move instantly.
- **`pushJSON`**: Adds a new entry at `/sensors/history`. This grows your database over time, allowing the React chart to show historical trends.
- **`timestamp/.sv`**: This is a special instruction to Firebase to record the exact time the data reached the server, ensuring your charts are accurate.
- **Reset**: Clears the count back to 0 so the next second of monitoring is fresh.

---

## 5. Frontend Setup (ReactJS)

### Local Development:
1.  Open your terminal in the `web_dashboard` folder.
2.  Install dependencies: `npm install`
3.  Start dev server: `npm run dev`

### Firebase Integration:
The app uses [firebase.js](file:///c:/Users/kimjie/OneDrive/Desktop/noisewatch/web_dashboard/src/firebase.js) to connect. It exports:
- `db`: For fetching real-time noise data.
- `storage`: For future file uploads.
- `analytics`: To track dashboard usage.

### Key Logic:
- **`App.jsx`**: Uses `onValue()` from Firebase to update the React state whenever the ESP8266 sends a new reading. No page refresh needed!
- **`HistoryChart.jsx`**: Uses Chart.js to render the last 60 readings as a smooth line graph.

---

## 5. Deployment Guide

### Hosting & Storage:
To make your dashboard accessible from anywhere in the world:

1.  **Build the Project**:
    ```powershell
    cd web_dashboard
    npm run build
    ```
2.  **Deploy to Firebase**:
    From the root folder:
    ```powershell
    firebase deploy
    ```

### Security Rules:
-   **Database**: Ensure your `database.rules.json` allows the ESP8266 to write data.
-   **Storage**: Use `storage.rules` to manage who can access uploaded files.

---

## 6. Project Checklist
- [x] Hardware Wiring Completed
- [x] Firmware Uploaded to ESP8266
- [x] Firebase Project Created & Configured
- [x] Web Dashboard Built & Tested Locally
- [x] Deployment Successful

> [!NOTE]
> For any issues during deployment, check your Firebase Console console for errors or ensure you are logged in using `firebase login`.
