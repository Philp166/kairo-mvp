// Kairo Track 2 — Waveshare ESP32-S3-Touch-AMOLED-2.06 (410×502, CO5300 QSPI)
//
// Boots, draws Spark v1 from sprites.json, cycles state on BOOT button.
// Final demo: 4 states + parent_touch heart on long press.

#include <Arduino.h>
#include <Arduino_GFX_Library.h>
#include "spark_sprites.h"
#include "spark_renderer.h"

// ---- Display wiring (Waveshare ESP32-S3-Touch-AMOLED-2.06, CO5300) ----
// QSPI pins per Waveshare schematic v1.1.
#define DISP_CS    9
#define DISP_SCK   10
#define DISP_D0    11
#define DISP_D1    12
#define DISP_D2    13
#define DISP_D3    14
#define DISP_RST   21
#define DISP_TE    -1

Arduino_DataBus *bus = new Arduino_ESP32QSPI(
    DISP_CS, DISP_SCK, DISP_D0, DISP_D1, DISP_D2, DISP_D3);
Arduino_GFX *gfx = new Arduino_CO5300(bus, DISP_RST, 0, false, KAIRO_DISPLAY_W, KAIRO_DISPLAY_H);

// ---- Spark renderer wiring ----
static void gfxFillRect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) {
  gfx->fillRect(x, y, w, h, color);
}

SparkRenderTarget target = {
    .cx = KAIRO_DISPLAY_W / 2,
    .cy = KAIRO_DISPLAY_H / 2,
    .scale = 3,  // 140-unit viewBox × 3 = 420px → fits 410-wide AMOLED
    .fillRect = gfxFillRect,
};

// ---- Demo state machine ----
static SparkStateIdx currentState = ST_CALM;
static const SparkEventDef* currentEvent = nullptr;
static unsigned long eventEndMs = 0;

#define BUTTON_PIN 0

void renderNow() {
  gfx->fillScreen(BLACK);
  sparkRenderState(target, currentState, currentEvent);
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  if (!gfx->begin()) {
    Serial.println("[kairo] gfx->begin() failed");
    while (true) delay(100);
  }
  gfx->fillScreen(BLACK);
  gfx->setBrightness(220);

  Serial.println("[kairo] track2 boot ok");
  Serial.printf("[kairo] sprites: %d, states: %d\n", SPARK_SPRITE_COUNT, ST_COUNT);

  renderNow();
}

void loop() {
  static unsigned long pressStartMs = 0;
  static bool pressed = false;

  const bool isDown = digitalRead(BUTTON_PIN) == LOW;
  const unsigned long now = millis();

  if (isDown && !pressed) {
    pressed = true;
    pressStartMs = now;
  } else if (!isDown && pressed) {
    pressed = false;
    const unsigned long held = now - pressStartMs;
    if (held >= 1500) {
      // Long press → fire parent_touch heart event
      currentEvent = &SPARK_EVENT_PARENT_TOUCH;
      eventEndMs = now + 1500;
    } else if (held >= 50) {
      // Short tap → cycle state
      currentState = (SparkStateIdx)((currentState + 1) % ST_COUNT);
      currentEvent = nullptr;
    }
    renderNow();
  }

  if (currentEvent && now >= eventEndMs) {
    currentEvent = nullptr;
    renderNow();
  }

  delay(10);
}
