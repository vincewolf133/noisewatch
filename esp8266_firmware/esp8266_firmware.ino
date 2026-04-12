#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>

// Provide the token generation process info.
#include "addons/TokenHelper.h"
// Provide the RTDB payload printing info and other helper functions.
#include "addons/RTDBHelper.h"

// Insert your WiFi credentials
#define WIFI_SSID "noisewatch"
#define WIFI_PASSWORD "noisewatch"

// Firebase Project Configuration
#define API_KEY "AIzaSyCxzEn_TSLnk7TQAGwLyYMiEsEJUZ9jCcI"
#define DATABASE_URL "noisewatch-dadea-default-rtdb.firebaseio.com" // Without https:// and trailing /
#define FIREBASE_PROJECT_ID "noisewatch-dadea"
#define FIREBASE_AUTH_DOMAIN "noisewatch-dadea.firebaseapp.com"
#define FIREBASE_STORAGE_BUCKET "noisewatch-dadea.firebasestorage.app"
#define FIREBASE_MESSAGING_SENDER_ID "110446670194"
#define FIREBASE_APP_ID "1:110446670194:web:fd6e85b3cc2b8b013eadeb"
#define FIREBASE_MEASUREMENT_ID "G-QFQSQKLSRF"

// Firebase objects for data transfer, authentication, and configuration
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool signupOK = false;

// Hardware Configuration: Mapping sensors to GPIO pins
// D1 = GPIO5, D2 = GPIO4, D3 = GPIO0, D4 = GPIO2
const int SENSOR_PINS[4] = {5, 4, 0, 2};
int sensorCounts[4] = {0, 0, 0, 0};  // Stores triggers per interval
int lastState[4] = {LOW, LOW, LOW, LOW}; // Stores previous state for edge detection

unsigned long previousMillis = 0;
// Data upload frequency (1 second)
const long interval = 1000;

/**
 * @brief Standard Arduino setup function.
 * Initializes serial communication, hardware pins, WiFi, and Firebase.
 */
void setup() {
  Serial.begin(115200);

  // Configure sensor pins as inputs to read digital signals from modules
  for (int i = 0; i < 4; i++) {
    pinMode(SENSOR_PINS[i], INPUT);
  }

  // Connect to the specified WiFi network
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  // Configure Firebase Client
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // In this bypass mode, we use "Test Mode" rules (Public Database)
  // Real authentication should be used for production environments.
  config.signer.test_mode = true;
  signupOK = true;
  Serial.println("Firebase Auth Bypassed for Public Database test mode");

  // Assign callback for token generation tasks
  config.token_status_callback = tokenStatusCallback;

  // Optimize buffer for SSL certificates (important for ESP8266 security)
  fbdo.setBSSLBufferSize(4096, 1024);

  // Initialize Firebase with configuration
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

/**
 * @brief Standard Arduino loop function.
 * Runs repeatedly to poll sensors and periodically upload data to Firebase.
 */
void loop() {
  unsigned long currentMillis = millis();

  /* 
   * STEP 1: SENSOR POLLING (High Frequency)
   * We check the sensors every time the loop runs.
   * We look for a "Rising Edge" (LOW to HIGH transition).
   * This indicates the sound sensor has triggered due to noise.
   */
  for (int i = 0; i < 4; i++) {
    int currentState = digitalRead(SENSOR_PINS[i]);
    if (currentState == HIGH && lastState[i] == LOW) {
      sensorCounts[i]++; // Noise confirmed, increment the counter
    }
    lastState[i] = currentState;
  }

  /* 
   * STEP 2: PERIODIC DATA UPLOAD (Defined by 'interval')
   * Every 1 second, we aggregate the counts and send them to the Cloud.
   */
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    // Check if Firebase is connected and ready
    if (Firebase.ready() && signupOK) {
      for (int i = 0; i < 4; i++) {
        
        // A. Real-time Update (Overwrites the latest value)
        // Path: /sensors/current/sensor1...sensor4
        String currentPath = "/sensors/current/sensor" + String(i + 1);
        if (Firebase.RTDB.setInt(&fbdo, currentPath.c_str(), sensorCounts[i])) {
          Serial.printf("Sensor %d updated: %d\n", i + 1, sensorCounts[i]);
        } else {
          Serial.printf("Sensor %d update failed: %s\n", i + 1, fbdo.errorReason().c_str());
        }

        // B. History Log (Appends a new record with a unique key)
        // Path: /sensors/history/sensor1...sensor4
        String historyPath = "/sensors/history/sensor" + String(i + 1);
        FirebaseJson historyJson;
        historyJson.set("intensity", sensorCounts[i]);
        // .sv / timestamp = special Firebase instruction to use server-side time
        historyJson.set("timestamp/.sv", "timestamp");

        if (Firebase.RTDB.pushJSON(&fbdo, historyPath.c_str(), &historyJson)) {
          // Successfully recorded history without bloating the serial monitor
        } else {
          Serial.printf("Sensor %d history push failed: %s\n", i + 1, fbdo.errorReason().c_str());
        }

        // C. Reset Local Counter
        // We clear the count so the next 1-second interval starts fresh
        sensorCounts[i] = 0;
      }
      Serial.println("--- Batch Sync Complete ---");
    }
  }
}
