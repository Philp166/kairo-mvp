/*
 *  KairoMVP — Spark on Waveshare ESP32-S3 Touch AMOLED 2.06"
 *  Children's smart bracelet firmware: pixel character + BLE health data
 */

#include <Wire.h>
#include <HWCDC.h>
#include "Arduino_GFX_Library.h"
#include "pin_config.h"
#include "spark_renderer.h"
#include "spark_animator.h"
#include "screens.h"
#include "sensors.h"
#include "ble_service.h"
#include "touch.h"

// ── USB Serial ──────────────────────────────────────────────
HWCDC USBSerial;

// ── Display ─────────────────────────────────────────────────
Arduino_DataBus *bus = new Arduino_ESP32QSPI(
    LCD_CS, LCD_SCLK, LCD_SDIO0, LCD_SDIO1, LCD_SDIO2, LCD_SDIO3);

Arduino_CO5300 *oled = new Arduino_CO5300(bus, LCD_RESET,
    0 /* rotation */, LCD_WIDTH, LCD_HEIGHT,
    22 /* col_offset1 */, 0, 0, 0);

Arduino_Canvas *gfx = new Arduino_Canvas(LCD_WIDTH, LCD_HEIGHT, oled);

// ── Brightness / dimming ────────────────────────────────────
static uint32_t _lastInteraction = 0;
static uint8_t _currentBrightness = 0xD0;

#define BRIGHT_FULL     0xD0
#define BRIGHT_DIM      0x60
#define BRIGHT_MIN      0x10
#define BRIGHT_OFF      0x00
#define DIM_TIMEOUT_MS  5000
#define MIN_TIMEOUT_MS  15000

// ── Navigation button (GPIO0 BOOT) ─────────────────────────
static bool _btnState = false;
static uint32_t _btnDownTime = 0;
static uint32_t _btnLastChange = 0;
static bool _btnLongFired = false;
static uint32_t _btnBootGuard = 0;
#define BTN_LONG_MS     2000
#define BTN_DEBOUNCE_MS 50

// ── Step goal ───────────────────────────────────────────────
#define STEP_GOAL 6000

// ── State machine ───────────────────────────────────────────
// TODO: calibrate thresholds on child's wrist — idle 0.01-0.05, walk 0.15-0.40, run 0.50+
#define MOTION_ACTIVE_THRESHOLD  0.25f
#define MOTION_LOW_THRESHOLD     0.05f
#define STATE_HOLD_MS            3000

// ── Helpers ─────────────────────────────────────────────────
static const char* stateNameStr(SparkState s) {
    switch (s) {
        case STATE_CALM:    return "calm";
        case STATE_ACTIVE:  return "active";
        case STATE_SLEEPY:  return "sleepy";
        case STATE_WORRIED: return "worried";
    }
    return "?";
}

// ── BLE command handler ─────────────────────────────────────
static void onBleCommand(const char* cmd) {
    if (strstr(cmd, "set_time")) {
        int h=0, m=0, s=0, d=1, mo=1, y=2026;
        const char* p;
        if ((p = strstr(cmd, "\"h\":")))  h = atoi(p + 4);
        if ((p = strstr(cmd, "\"m\":")))  m = atoi(p + 4);
        if ((p = strstr(cmd, "\"s\":")))  s = atoi(p + 4);
        if ((p = strstr(cmd, "\"d\":")))  d = atoi(p + 4);
        if ((p = strstr(cmd, "\"mo\":"))) mo = atoi(p + 5);
        if ((p = strstr(cmd, "\"y\":")))  y = atoi(p + 4);
        sensors_setTime(h, m, s, d, mo, y);
        USBSerial.printf("[BLE] time set to %02d:%02d:%02d %d/%d/%d\n", h, m, s, d, mo, y);
    } else if (strstr(cmd, "parent_touch")) {
        screens_notifyParentTouch();
        USBSerial.println("[BLE] parent_touch received");
    } else if (strstr(cmd, "silent_mode_on")) {
        screens_setSilentMode(true);
        USBSerial.println("[BLE] silent_mode ON");
    } else if (strstr(cmd, "silent_mode_off")) {
        screens_setSilentMode(false);
        USBSerial.println("[BLE] silent_mode OFF");
    }
}

// ── State machine update ────────────────────────────────────
static SparkState _pendingState = STATE_CALM;
static uint32_t _pendingSince = 0;

static void updateStateMachine() {
    SparkState current = animator_getState();
    SparkState desired = current;
    float motion = sensors_getMotionLevel();
    uint8_t hour = sensors_getHour();

    if (current == STATE_WORRIED) return;

    if ((hour >= 22 || hour < 7) && motion < MOTION_LOW_THRESHOLD) {
        desired = STATE_SLEEPY;
    } else if (motion > MOTION_ACTIVE_THRESHOLD) {
        desired = STATE_ACTIVE;
    } else {
        desired = STATE_CALM;
    }

    if (desired != current) {
        if (desired != _pendingState) {
            _pendingState = desired;
            _pendingSince = millis();
        } else if (millis() - _pendingSince >= STATE_HOLD_MS) {
            animator_setState(desired);
            USBSerial.printf("[STATE] %d -> %d (motion=%.2f)\n", current, desired, motion);
        }
    } else {
        _pendingState = current;
    }
}

// ============================================================
//  SETUP
// ============================================================
void setup() {
    USBSerial.begin(115200);
    delay(500);
    USBSerial.println("=== KairoMVP booting ===");

    // I2C bus
    Wire.begin(IIC_SDA, IIC_SCL);
    Wire.setClock(400000);

    // Display
    gfx->begin();
    gfx->fillScreen(BG_BLACK);
    oled->setBrightness(0xD0);
    USBSerial.println("[OK] Display");

    // Sensors
    sensors_init();
    USBSerial.println("[OK] Sensors");

    // Animator
    animator_init();
    USBSerial.println("[OK] Animator");

    // Renderer
    renderer_init(gfx);

    // Screens
    screens_init(gfx);

    // Touch
    if (touch_init()) {
        USBSerial.println("[OK] Touch (FT3168)");
    } else {
        USBSerial.println("[FAIL] Touch");
    }

    // BLE
    ble_init();
    ble_setCommandCallback(onBleCommand);
    USBSerial.println("[OK] BLE advertising as KairoSpark");

    // Navigation button
    pinMode(BTN_NAV, INPUT_PULLUP);
    _btnState = (digitalRead(BTN_NAV) == LOW);
    _btnBootGuard = millis();
    USBSerial.println("[OK] NAV button (GPIO0 BOOT)");

    // Boot reaction
    animator_triggerReaction(RX_IDX_BOOTUP, 1500);

    _lastInteraction = millis();

    USBSerial.println("=== KairoMVP ready ===");
}

// ============================================================
//  LOOP
// ============================================================
void loop() {
    uint32_t now = millis();

    // ── Sensors ─────────────────────────────────────
    sensors_update();

    // ── Wake on wrist raise ────────────────────────
    if (sensors_wristRaised()) {
        _lastInteraction = now;
    }

    // ── Touch input ────────────────────────────────
    touch_update();
    TouchEvent te = touch_getEvent();
    if (te != TOUCH_NONE) {
        _lastInteraction = now;
        switch (te) {
            case TOUCH_TAP:
            case TOUCH_SWIPE_LEFT:
                screens_nextScreen();
                USBSerial.printf("[TOUCH] next -> %d\n", screens_current());
                break;
            case TOUCH_SWIPE_RIGHT:
                screens_prevScreen();
                USBSerial.printf("[TOUCH] prev -> %d\n", screens_current());
                break;
            case TOUCH_SWIPE_UP:
            case TOUCH_SWIPE_DOWN:
                screens_setScreen(SCREEN_SPARK);
                USBSerial.println("[TOUCH] home");
                break;
            case TOUCH_LONG_PRESS:
                if (animator_getState() == STATE_WORRIED) {
                    animator_setState(STATE_CALM);
                    ble_notifyEvent("sos_clear");
                    USBSerial.println("[TOUCH] SOS cleared");
                } else {
                    animator_setState(STATE_WORRIED);
                    ble_notifyEvent("sos");
                    USBSerial.println("[TOUCH] SOS TRIGGERED");
                }
                screens_setScreen(SCREEN_SPARK);
                break;
            default: break;
        }
    }

    // ── NAV button (GPIO0 BOOT) ──────────────────────
    if (now - _btnBootGuard > 1000) {
        bool raw = (digitalRead(BTN_NAV) == LOW);
        if (raw != _btnState && (now - _btnLastChange > BTN_DEBOUNCE_MS)) {
            _btnLastChange = now;
            _btnState = raw;
            if (raw) {
                _btnDownTime = now;
                _btnLongFired = false;
            } else if (!_btnLongFired) {
                _lastInteraction = now;
                screens_nextScreen();
                USBSerial.printf("[BTN] next -> %d\n", screens_current());
            }
        }
        if (_btnState && !_btnLongFired && (now - _btnDownTime >= BTN_LONG_MS)) {
            _btnLongFired = true;
            _lastInteraction = now;
            if (animator_getState() == STATE_WORRIED) {
                animator_setState(STATE_CALM);
                ble_notifyEvent("sos_clear");
                USBSerial.println("[BTN] SOS cleared");
            } else {
                animator_setState(STATE_WORRIED);
                ble_notifyEvent("sos");
                USBSerial.println("[BTN] SOS TRIGGERED");
            }
            screens_setScreen(SCREEN_SPARK);
        }
    }

    // ── State machine ───────────────────────────────
    if (!animator_isReactionActive() && animator_getState() != STATE_WORRIED) {
        static uint32_t lastStateUpdate = 0;
        if (now - lastStateUpdate > 1000) {
            lastStateUpdate = now;
            updateStateMachine();
        }
    }

    // ── Step goal celebrate ────────────────────────
    static bool _goalReached = false;
    if (!_goalReached && sensors_getSteps() >= STEP_GOAL) {
        _goalReached = true;
        animator_triggerReaction(RX_IDX_CELEBRATE, 3000);
        ble_notifyEvent("goal_reached");
        USBSerial.println("[GOAL] Step goal reached!");
    }
    if (sensors_getHour() == 0 && sensors_getMinute() == 0) {
        _goalReached = false;
    }

    // ── Low battery reaction ────────────────────────
    static uint32_t lastBattCheck = 0;
    if (now - lastBattCheck > 30000) {
        lastBattCheck = now;
        if (sensors_getBatteryPct() < 15 && !sensors_isCharging()) {
            animator_triggerReaction(RX_IDX_LOW_BATT, 3000);
        }
    }


    // ── Render ──────────────────────────────────────
    screens_update();
    gfx->flush();

    // ── BLE ─────────────────────────────────────────
    ble_update();

    // ── Motion log (1 Hz) ────────────────────────────
    static uint32_t lastMotionLog = 0;
    if (now - lastMotionLog > 1000) {
        lastMotionLog = now;
        USBSerial.printf("[MOTION] raw=%.3f smooth=%.3f state=%d thresh_active=%.2f thresh_low=%.2f\n",
            sensors_getMotionRaw(), sensors_getMotionLevel(),
            animator_getState(), MOTION_ACTIVE_THRESHOLD, MOTION_LOW_THRESHOLD);
    }

    // ── Diagnostic (5s) ────────────────────────────
    static uint32_t lastDiag = 0;
    if (now - lastDiag > 5000) {
        lastDiag = now;
        USBSerial.printf("[DIAG] t=%lu scr=%d state=%s(%d) motion=%.2f steps=%lu batt=%d%% bright=0x%02X ble=%s rtc=%02d:%02d:%02d\n",
            now / 1000, screens_current(),
            stateNameStr(animator_getState()), animator_getState(),
            sensors_getMotionLevel(),
            (unsigned long)sensors_getSteps(),
            sensors_getBatteryPct(),
            _currentBrightness,
            ble_isConnected() ? "yes" : "no",
            sensors_getHour(), sensors_getMinute(), sensors_getSecond());
    }
}
