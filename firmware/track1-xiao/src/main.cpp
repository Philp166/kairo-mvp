// Kairo Track 1 — production stack on breadboard.
//
// Stack:  XIAO ESP32-S3 + GC9A01 1.28" + MAX30102 + MLX90614 + MPU6050
// Bus:    SPI (TFT_eSPI) for display, I2C for sensors, BLE for sync.
//
// Pipeline (current MVP scope):
//   - Display Spark v1 from shared sprites.h
//   - Read sensors every 1 s (HR, SpO2, skin temp, accel-magnitude steps)
//   - Publish JSON snapshot over BLE GATT (one notify characteristic)
//   - Cycle Spark state via boot-button (placeholder until Spark autodetects)

#include <Arduino.h>
#include <Wire.h>
#include <TFT_eSPI.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>
#include "MAX30105.h"
#include "Adafruit_MLX90614.h"
#include "Adafruit_MPU6050.h"
#include "spark_sprites.h"
#include "spark_renderer.h"

// ---- Display ----
TFT_eSPI tft = TFT_eSPI();

static void tftFillRect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) {
  tft.fillRect(x, y, w, h, color);
}

SparkRenderTarget target = {
    .cx = KAIRO_DISPLAY_W / 2,
    .cy = KAIRO_DISPLAY_H / 2,
    .scale = 1,  // 140-unit viewBox ≈ 140 px (centered in 240×240, slight clip ok)
    .fillRect = tftFillRect,
};

static SparkStateIdx currentState = ST_CALM;
static const SparkEventDef* currentEvent = nullptr;

// ---- Sensors ----
MAX30105 ppg;
Adafruit_MLX90614 ir;
Adafruit_MPU6050 imu;

struct Snapshot {
  uint32_t ts;
  uint8_t hr;
  uint8_t spo2;
  float tempC;
  uint16_t steps;
  uint8_t battery;
  const char* state;
};
static Snapshot snap = {0, 0, 0, 36.6f, 0, 100, "calm"};

// ---- BLE ----
// UUIDs are placeholders — burn real ones before fleet deploy.
#define KAIRO_SERVICE_UUID        "5d7d0001-9b6e-4d51-92a1-7e73a1ce0001"
#define KAIRO_SNAPSHOT_CHAR_UUID  "5d7d0002-9b6e-4d51-92a1-7e73a1ce0001"

BLECharacteristic* snapshotChar = nullptr;
bool bleConnected = false;

class KairoBleCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer*) override { bleConnected = true; Serial.println("[ble] connected"); }
  void onDisconnect(BLEServer* s) override {
    bleConnected = false;
    Serial.println("[ble] disconnected, restart adv");
    s->getAdvertising()->start();
  }
};

void setupBle() {
  BLEDevice::init("Kairo-Band");
  BLEServer* server = BLEDevice::createServer();
  server->setCallbacks(new KairoBleCallbacks());
  BLEService* service = server->createService(KAIRO_SERVICE_UUID);
  snapshotChar = service->createCharacteristic(
      KAIRO_SNAPSHOT_CHAR_UUID,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  snapshotChar->addDescriptor(new BLE2902());
  service->start();
  BLEAdvertising* adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(KAIRO_SERVICE_UUID);
  adv->setScanResponse(true);
  adv->start();
  Serial.println("[ble] advertising as Kairo-Band");
}

void publishSnapshot() {
  if (!snapshotChar) return;
  StaticJsonDocument<256> doc;
  doc["ts"] = snap.ts;
  doc["hr"] = snap.hr;
  doc["spo2"] = snap.spo2;
  doc["tempC"] = snap.tempC;
  doc["steps"] = snap.steps;
  doc["battery"] = snap.battery;
  doc["state"] = snap.state;
  char buf[256];
  size_t n = serializeJson(doc, buf, sizeof(buf));
  snapshotChar->setValue((uint8_t*)buf, n);
  if (bleConnected) snapshotChar->notify();
  Serial.printf("[snap] %s\n", buf);
}

// ---- Sensor task (runs on Core 0) ----
void readSensors() {
  // PPG: read raw IR + red, MAX30105 lib gives heart rate via beat-detect API
  // (replaced with a finger-detect placeholder for MVP — full HR/SpO2 algo
  // lives in pulse_oximeter.cpp, plug in when finger contact is reliable).
  long ir_avg = ppg.getIR();
  if (ir_avg < 50000) {
    snap.hr = 0;
    snap.spo2 = 0;
  } else {
    // Placeholder — real beat-detect uses checkForBeat() rolling buffer.
    snap.hr = 80 + (millis() / 500) % 20;
    snap.spo2 = 97 + (millis() / 1000) % 3;
  }

  // Skin temp: MLX90614 object temp ≈ skin
  snap.tempC = ir.readObjectTempC();

  // Accel magnitude → trivial step counter (proper one needs band-pass filter)
  sensors_event_t a, g, t;
  imu.getEvent(&a, &g, &t);
  static float prevMag = 0;
  float mag = sqrtf(a.acceleration.x * a.acceleration.x +
                    a.acceleration.y * a.acceleration.y +
                    a.acceleration.z * a.acceleration.z);
  if (fabsf(mag - prevMag) > 1.5f) snap.steps++;
  prevMag = mag;

  // Battery: ADC on GPIO2 with voltage divider (2.0× scale, 0–4.2V → 0–4096)
  uint16_t adc = analogRead(2);
  float vbat = (adc / 4095.0f) * 3.3f * 2.0f;
  snap.battery = (uint8_t)constrain((int)((vbat - 3.3f) / (4.2f - 3.3f) * 100), 0, 100);

  snap.state = currentState == ST_CALM ? "calm"
              : currentState == ST_ACTIVE ? "active"
              : currentState == ST_SLEEPY ? "sleepy"
              : "worried";
  snap.ts = millis();
}

// ---- Render ----
void renderNow() {
  tft.fillScreen(TFT_BLACK);
  sparkRenderState(target, currentState, currentEvent);
}

#define BUTTON_PIN 0

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  Wire.begin(KAIRO_I2C_SDA, KAIRO_I2C_SCL);

  tft.init();
  tft.setRotation(0);
  tft.fillScreen(TFT_BLACK);

  if (ppg.begin(Wire, I2C_SPEED_FAST)) {
    ppg.setup();  // default config
    Serial.println("[sensor] MAX30105 ok");
  } else Serial.println("[sensor] MAX30105 FAIL");

  if (ir.begin()) Serial.println("[sensor] MLX90614 ok");
  else Serial.println("[sensor] MLX90614 FAIL");

  if (imu.begin()) Serial.println("[sensor] MPU6050 ok");
  else Serial.println("[sensor] MPU6050 FAIL");

  setupBle();
  Serial.println("[kairo] track1 boot ok");

  renderNow();
}

void loop() {
  static unsigned long pressStartMs = 0;
  static bool pressed = false;
  static unsigned long lastSensorMs = 0;
  static unsigned long lastNotifyMs = 0;
  const unsigned long now = millis();

  // BOOT button: short = state cycle, long = parent_touch event
  const bool isDown = digitalRead(BUTTON_PIN) == LOW;
  if (isDown && !pressed) { pressed = true; pressStartMs = now; }
  else if (!isDown && pressed) {
    pressed = false;
    const unsigned long held = now - pressStartMs;
    if (held >= 1500) currentEvent = &SPARK_EVENT_PARENT_TOUCH;
    else if (held >= 50) {
      currentState = (SparkStateIdx)((currentState + 1) % ST_COUNT);
      currentEvent = nullptr;
    }
    renderNow();
  }
  if (currentEvent && now - pressStartMs > 3000) {
    currentEvent = nullptr;
    renderNow();
  }

  if (now - lastSensorMs >= 250) {
    readSensors();
    lastSensorMs = now;
  }
  if (now - lastNotifyMs >= 1000) {
    publishSnapshot();
    lastNotifyMs = now;
  }

  delay(5);
}
