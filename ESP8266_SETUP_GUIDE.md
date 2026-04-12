# ESP8266 Firmware Setup & Hardware Guide

This guide will walk you through setting up your computer to program the ESP8266 and flashing the Noisewatch firmware.

---

## 1. Prepare Arduino IDE
1.  Download and install [Arduino IDE](https://www.arduino.cc/en/software).
2.  Open Arduino IDE and go to **File > Preferences**.
3.  In "Additional Boards Manager URLs", paste this link:
    `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
4.  Go to **Tools > Board > Boards Manager...**, search for **"esp8266"**, and install the latest version.

---

## 2. Install Required Libraries
The project relies on external libraries for Firebase communication and SSL security.

1.  In Arduino IDE, go to **Sketch > Include Library > Manage Libraries...**.
2.  Search for and install:
    - **Firebase ESP Client** (by Mobizt)
    
> [!NOTE]
> The helper files `addons/TokenHelper.h` and `addons/RTDBHelper.h` are included automatically with the Firebase ESP Client library. 

---

## 3. Configure the Firmware
Open the [esp8266_firmware.ino](file:///c:/Users/kimjie/OneDrive/Desktop/noisewatch/esp8266_firmware/esp8266_firmware.ino) file and update your credentials:

1.  **WiFi Settings**:
    ```cpp
    #define WIFI_SSID "Your_WiFi_Name"
    #define WIFI_PASSWORD "Your_WiFi_Password"
    ```
2.  **Firebase Settings**:
    - Get these from your Firebase Console (Project Settings > Web App).
    - Ensure your `DATABASE_URL` does NOT include `https://`.

---

## 4. Hardware Connection
Connect your ESP8266 to your computer via a micro-USB cable.

1.  Select your board: **Tools > Board > ESP8266 Boards > NodeMCU 1.0 (ESP-12E Module)** (or your specific board model).
2.  Select the port: **Tools > Port** (usually COM3, COM4, etc. on Windows).
3.  Set the speed: **Tools > Upload Speed > 115200**.

---

## 5. Upload & Verify
1.  Click the **Upload** arrow icon (top left) in Arduino IDE.
2.  Wait for the progress bar to reach 100%.
3.  Open the **Serial Monitor** (**Tools > Serial Monitor**).
4.  Set the baud rate in the bottom right corner to **115200**.
5.  **Success**: You should see "Connecting to Wi-Fi...", followed by an IP address and "Sensor updated: X".

---

## 6. Troubleshooting
- **"Board not found"**: Ensure you have the [CH340 drivers](https://sparks.gogo.co.nz/ch340.html) installed (common for NodeMCU clones).
- **"Connection Failed"**: Double-check your WiFi SSID and Password (the ESP8266 only supports 2.4GHz WiFi).
- **"SSL Error"**: Ensure your `fbdo.setBSSLBufferSize(4096, 1024);` is in the code (it's there by default in this project).
- **Random Characters in Serial Monitor**: Ensure your baud rate is set exactly to **115200**.
