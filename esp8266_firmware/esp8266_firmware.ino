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
volatile int sensorCounts[4] = {0, 0, 0, 0};  // Stores triggers per interval
int lastState[4] = {LOW, LOW, LOW, LOW}; // Stores previous state for edge detection

// Output Devices (One for each sensor)
// D0 = GPIO16, D5 = GPIO14, D6 = GPIO12, D7 = GPIO13
const int ALARM_PINS[4] = {16, 14, 12, 13};  
#define ALERT_THRESHOLD 1000 // Same threshold used in the web dashboard

unsigned long previousMillis = 0;
// Data upload frequency (1 second)
const long interval = 1000;

// Interrupt Service Routines for the 4 sensors
// IRAM_ATTR is required for ESP8266 interrupts to run from RAM for speed
void IRAM_ATTR sensor1_ISR() { sensorCounts[0]++; }
void IRAM_ATTR sensor2_ISR() { sensorCounts[1]++; }
void IRAM_ATTR sensor3_ISR() { sensorCounts[2]++; }
void IRAM_ATTR sensor4_ISR() { sensorCounts[3]++; }

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

  // Configure Output Pins for Alarms (LEDs/Buzzers)
  for (int i = 0; i < 4; i++) {
    pinMode(ALARM_PINS[i], OUTPUT);
    digitalWrite(ALARM_PINS[i], LOW); // Ensure they start OFF
  }

  // Attach hardware interrupts to catch EVERY noise pulse accurately
  attachInterrupt(digitalPinToInterrupt(SENSOR_PINS[0]), sensor1_ISR, RISING);
  attachInterrupt(digitalPinToInterrupt(SENSOR_PINS[1]), sensor2_ISR, RISING);
  attachInterrupt(digitalPinToInterrupt(SENSOR_PINS[2]), sensor3_ISR, RISING);
  attachInterrupt(digitalPinToInterrupt(SENSOR_PINS[3]), sensor4_ISR, RISING);

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
 * Runs repeatedly to upload data to Firebase periodically.
 * Sensor polling is now handled automatically by hardware interrupts!
 */
void loop() {
  unsigned long currentMillis = millis();

  /* 
   * PERIODIC DATA UPLOAD (Defined by 'interval')
   * Every 1 second, we aggregate the counts and send them to the Cloud.
   */
  if (currentMillis - previousMillis >= interval) {
    // Copy the volatile counts safely and reset them immediately
    int currentCounts[4];
    bool isAlert[4] = {false, false, false, false};
    noInterrupts();
    for (int i = 0; i < 4; i++) {
      currentCounts[i] = sensorCounts[i];
      sensorCounts[i] = 0;
      
      // Check if threshold is breached for this specific sensor
      if (currentCounts[i] >= ALERT_THRESHOLD) {
        isAlert[i] = true;
      }
    }
    interrupts();

    // Trigger local alarms per-sensor (will stay on for 1 second if breached)
    for (int i = 0; i < 4; i++) {
      if (isAlert[i]) {
        digitalWrite(ALARM_PINS[i], HIGH);
      } else {
        digitalWrite(ALARM_PINS[i], LOW);
      }
    }

    // Check if Firebase is connected and ready
    if (Firebase.ready() && signupOK) {
      for (int i = 0; i < 4; i++) {
        
        // A. Real-time Update (Overwrites the latest value)
        // Path: /sensors/current/sensor1...sensor4
        String currentPath = "/sensors/current/sensor" + String(i + 1);
        if (Firebase.RTDB.setInt(&fbdo, currentPath.c_str(), currentCounts[i])) {
          Serial.printf("Sensor %d updated: %d\n", i + 1, currentCounts[i]);
        } else {
          Serial.printf("Sensor %d update failed: %s\n", i + 1, fbdo.errorReason().c_str());
        }

        // B. History Log (Appends a new record with a unique key)
        // Path: /sensors/history/sensor1...sensor4
        String historyPath = "/sensors/history/sensor" + String(i + 1);
        FirebaseJson historyJson;
        historyJson.set("intensity", currentCounts[i]);
        // .sv / timestamp = special Firebase instruction to use server-side time
        historyJson.set("timestamp/.sv", "timestamp");

        if (Firebase.RTDB.pushJSON(&fbdo, historyPath.c_str(), &historyJson)) {
          // Successfully recorded history without bloating the serial monitor
        } else {
          Serial.printf("Sensor %d history push failed: %s\n", i + 1, fbdo.errorReason().c_str());
        }

        // Prevent watchdog timer resets by yielding to the ESP background tasks
        yield();
      }
      Serial.println("--- Batch Sync Complete ---");
    }
    
    // Update previousMillis AFTER the blocking operations 
    // This guarantees we wait a full interval before uploading again
    previousMillis = millis();
  }
}
