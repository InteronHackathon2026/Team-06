#include <Wire.h>
#include <ArduinoBLE.h>
#include "MAX30105.h"
#include "heartRate.h"

// ── GSR ───────────────────────────────────────────────────────────────────────
const int GSR_PIN = A0;
int baseline = 0;

// ── MAX30105 ──────────────────────────────────────────────────────────────────
MAX30105 particleSensor;

const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute = 0;
int beatAvg = 0;

// ── Timing ────────────────────────────────────────────────────────────────────
unsigned long lastPrint = 0;
const unsigned long PRINT_INTERVAL = 1000;

// ── BLE ───────────────────────────────────────────────────────────────────────
// Standard Heart Rate Service UUID
BLEService healthService("180D");

// Heart Rate Characteristic
BLEUnsignedShortCharacteristic bpmCharacteristic(
  "2A37",
  BLERead | BLENotify
);

// Stress Status Characteristic
BLEStringCharacteristic stressCharacteristic(
  "2A06",
  BLERead | BLENotify,
  20
);

// Custom GSR Characteristic
BLEUnsignedShortCharacteristic gsrCharacteristic(
  "12345678-1234-5678-1234-56789abcdef0",
  BLERead | BLENotify
);

bool bleConnected = false;

// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  // --- GSR Calibration (10 s) ---
  Serial.println("Calibrating GSR baseline, please relax...");
  long total = 0;
  for (int i = 0; i < 100; i++) {
    total += analogRead(GSR_PIN);
    delay(100);
  }

  baseline = total / 100;

  Serial.print("GSR Baseline: ");
  Serial.println(baseline);

  // --- MAX30105 Init ---
  Serial.println("Initializing MAX30105...");

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30105 not found. Check wiring/power.");
    while (1);
  }

  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0);

  // --- BLE Init ---
  Serial.println("Initializing BLE...");

  if (!BLE.begin()) {
    Serial.println("BLE failed to start.");
    while (1);
  }

  BLE.setLocalName("PulseGuard");
  BLE.setAdvertisedService(healthService);

  healthService.addCharacteristic(bpmCharacteristic);
  healthService.addCharacteristic(stressCharacteristic);
  healthService.addCharacteristic(gsrCharacteristic);

  BLE.addService(healthService);

  // Initial values
  bpmCharacteristic.writeValue((unsigned short)0);
  stressCharacteristic.writeValue("RELAXED");
  gsrCharacteristic.writeValue((unsigned short)0);

  BLE.advertise();

  Serial.println("BLE advertising as PulseGuard");
  Serial.println("Place your index finger on the sensor.");
  Serial.println("Ready!\n");
}

// ─────────────────────────────────────────────────────────────────────────────
void loop() {

  // Handle BLE connection
  BLEDevice central = BLE.central();

  if (central) {
    if (!bleConnected) {
      bleConnected = true;
      Serial.print("BLE connected: ");
      Serial.println(central.address());
    }
  } else {
    if (bleConnected) {
      bleConnected = false;
      Serial.println("BLE disconnected.");
      BLE.advertise();
    }
  }

  // Read MAX30105
  long irValue = particleSensor.getIR();

  if (checkForBeat(irValue)) {

    long delta = millis() - lastBeat;
    lastBeat = millis();

    beatsPerMinute = 60.0 / (delta / 1000.0);

    if (beatsPerMinute > 20 && beatsPerMinute < 255) {

      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;

      beatAvg = 0;

      for (byte i = 0; i < RATE_SIZE; i++) {
        beatAvg += rates[i];
      }

      beatAvg /= RATE_SIZE;
    }
  }

  // Once per second
  unsigned long now = millis();

  if (now - lastPrint >= PRINT_INTERVAL) {

    lastPrint = now;

    // Read GSR
    int gsrValue = analogRead(GSR_PIN);

    int difference = gsrValue - baseline;

    int stressScore = constrain(
      map(abs(difference), 0, 300, 0, 100),
      0,
      100
    );

    const char *arousal;

    if (stressScore > 70) {
      arousal = "HIGH STRESS";
    } else if (stressScore > 40) {
      arousal = "MODERATE STRESS";
    } else {
      arousal = "RELAXED";
    }

    bool fingerPresent = (irValue >= 50000);

    // ---------------- Serial ----------------

    Serial.println("---------------------------------------");

    Serial.print("GSR Raw: ");
    Serial.println(gsrValue);

    Serial.print("Stress Score: ");
    Serial.print(stressScore);
    Serial.println("%");

    Serial.print("Stress Level: ");
    Serial.println(arousal);

    Serial.print("IR: ");
    Serial.println(irValue);

    Serial.print("Current BPM: ");
    Serial.println(beatsPerMinute);

    Serial.print("Average BPM: ");
    Serial.println(beatAvg);

    if (!fingerPresent) {
      Serial.println("No finger detected.");
    }

    // ---------------- BLE ----------------

    if (bleConnected) {

      bpmCharacteristic.writeValue(
        fingerPresent ? (unsigned short)beatAvg : (unsigned short)0
      );

      stressCharacteristic.writeValue(arousal);

      // Send raw GSR value
      gsrCharacteristic.writeValue((unsigned short)gsrValue);

      Serial.print("BLE Sent -> BPM: ");
      Serial.print(fingerPresent ? beatAvg : 0);

      Serial.print("  Stress: ");
      Serial.print(arousal);

      Serial.print("  GSR: ");
      Serial.println(gsrValue);
    }
  }
}