#include "screens.h"
#include "spark_renderer.h"
#include "spark_animator.h"
#include "sensors.h"
#include "ble_service.h"
#include "pin_config.h"
#include <math.h>

static Arduino_GFX* _gfx = nullptr;
static ScreenID _current = SCREEN_SPARK;
static uint32_t _lastActivity = 0;
static uint32_t _lastRender = 0;
static bool _needsFullRedraw = true;

#define SPARK_FPS_MS     80     // ~12 FPS for animations
#define CLOCK_FPS_MS     500    // 2 FPS for colon blink
#define STEPS_FPS_MS     500
#define TOUCH_FPS_MS     500

static bool _silentMode = false;
static bool _hasParentTouch = false;
static uint32_t _parentTouchTime = 0;

static const uint16_t COL_INK_ON_ACCENT = 0x18A7; // #1A1538 on terracotta
static const uint16_t COL_CREAM_UI = 0xFFBD;

#define STEP_GOAL 6000

void screens_init(Arduino_GFX* gfx) {
    _gfx = gfx;
    _lastActivity = millis();
    _needsFullRedraw = true;
}

static void renderSpark() {
    animator_update();

    renderer_drawFace(
        animator_getBgColor(),
        animator_getCurrentPose(),
        true,
        animator_getExtraType(),
        animator_getBreathPeriod()
    );

    if (animator_getState() == STATE_WORRIED) {
        if ((millis() / 500) % 2 == 0) {
            renderer_drawPixelTextCentered(FACE_CY + 100, "SOS", 0xF800, 6);
        }
    }

    renderer_drawStatusBar(ble_isConnected(), sensors_getBatteryPct(), sensors_isCharging());
    renderer_drawScreenDots(_current, SCREEN_COUNT);
}

static void renderClock() {
    _gfx->fillCircle(FACE_CX, FACE_CY, FACE_RADIUS + 2, BG_BLACK);
    _gfx->fillCircle(FACE_CX, FACE_CY, FACE_RADIUS, BG_DEFAULT);

    char dateBuf[16];
    snprintf(dateBuf, sizeof(dateBuf), "%s . %s %d",
             sensors_getDayName(), sensors_getMonthName(), sensors_getDay());
    renderer_drawPixelTextCentered(FACE_CY - 90, dateBuf, 0x528A, 2);

    char timeBuf[6];
    const char* sep = (sensors_getSecond() % 2 == 0) ? ":" : " ";
    snprintf(timeBuf, sizeof(timeBuf), "%02d%s%02d", sensors_getHour(), sep, sensors_getMinute());
    renderer_drawPixelTextCentered(FACE_CY - 40, timeBuf, COL_INK_ON_ACCENT, 12);

    char secBuf[4];
    snprintf(secBuf, sizeof(secBuf), ":%02d", sensors_getSecond());
    renderer_drawPixelTextCentered(FACE_CY + 60, secBuf, 0x528A, 3);

    renderer_drawStatusBar(ble_isConnected(), sensors_getBatteryPct(), sensors_isCharging());
    renderer_drawScreenDots(_current, SCREEN_COUNT);
}

static void renderSteps() {
    _gfx->fillCircle(FACE_CX, FACE_CY, FACE_RADIUS + 2, BG_BLACK);
    _gfx->fillCircle(FACE_CX, FACE_CY, FACE_RADIUS, BG_DEFAULT);

    uint32_t steps = sensors_getSteps();
    float pct = (float)steps / STEP_GOAL;
    if (pct > 1.0f) pct = 1.0f;

    int16_t ringR = FACE_RADIUS - 20;
    renderer_drawRing(FACE_CX, FACE_CY, ringR, 0, 2.0f * M_PI, 0x528A, 1);
    if (pct > 0.0f) {
        float endAngle = -M_PI / 2.0f + 2.0f * M_PI * pct;
        renderer_drawRing(FACE_CX, FACE_CY, ringR, -M_PI / 2.0f, endAngle, COL_INK_ON_ACCENT, 2);
    }

    renderer_drawShoe(FACE_CX, FACE_CY - 55, 5, COL_INK_ON_ACCENT);

    char stepBuf[10];
    if (steps >= 1000) {
        snprintf(stepBuf, sizeof(stepBuf), "%lu,%03lu",
                 (unsigned long)(steps / 1000),
                 (unsigned long)(steps % 1000));
    } else {
        snprintf(stepBuf, sizeof(stepBuf), "%lu", (unsigned long)steps);
    }
    renderer_drawPixelTextCentered(FACE_CY + 5, stepBuf, COL_INK_ON_ACCENT, 8);

    char infoBuf[20];
    snprintf(infoBuf, sizeof(infoBuf), "%d%% . GOAL %d", (int)(pct * 100), STEP_GOAL);
    renderer_drawPixelTextCentered(FACE_CY + 75, infoBuf, 0x528A, 2);

    renderer_drawStatusBar(ble_isConnected(), sensors_getBatteryPct(), sensors_isCharging());
    renderer_drawScreenDots(_current, SCREEN_COUNT);
}

static void renderTouch() {
    _gfx->fillCircle(FACE_CX, FACE_CY, FACE_RADIUS + 2, BG_BLACK);
    _gfx->fillCircle(FACE_CX, FACE_CY, FACE_RADIUS, BG_DEFAULT);

    renderer_drawPixelTextCentered(FACE_CY - 100, "PARENT TOUCH", 0x528A, 2);

    if (_hasParentTouch) {
        renderer_drawHeart(FACE_CX, FACE_CY - 25, 12, COL_CREAM_UI);
        renderer_drawPixelTextCentered(FACE_CY + 50, "MAMA", COL_INK_ON_ACCENT, 6);

        uint32_t ago = (millis() - _parentTouchTime) / 1000;
        char timeBuf[16];
        if (ago < 60) {
            snprintf(timeBuf, sizeof(timeBuf), "JUST NOW");
        } else if (ago < 3600) {
            snprintf(timeBuf, sizeof(timeBuf), "%lum AGO", (unsigned long)(ago / 60));
        } else {
            snprintf(timeBuf, sizeof(timeBuf), "%luh AGO", (unsigned long)(ago / 3600));
        }
        renderer_drawPixelTextCentered(FACE_CY + 95, timeBuf, 0x528A, 2);
    } else {
        animator_update();
        const SparkPose* pose = animator_getCurrentPose();
        if (pose && pose->pixels) {
            int16_t halfCell = CELL_SIZE / 2;
            int16_t miniOx = FACE_CX - (GRID_COLS * halfCell) / 2;
            int16_t miniOy = FACE_CY - (GRID_ROWS * halfCell) / 2 - 20;
            for (uint8_t i = 0; i < pose->count; i++) {
                const SparkPixel* p = &pose->pixels[i];
                int16_t px = miniOx + p->x * halfCell;
                int16_t py = miniOy + p->y * halfCell;
                _gfx->fillRect(px, py, halfCell, halfCell, SPARK_PALETTE[p->color]);
            }
        }
        renderer_drawPixelTextCentered(FACE_CY + 80, "WAITING...", 0x528A, 3);
    }

    renderer_drawStatusBar(ble_isConnected(), sensors_getBatteryPct(), sensors_isCharging());
    renderer_drawScreenDots(_current, SCREEN_COUNT);
}

void screens_update() {
    uint32_t now = millis();
    uint32_t interval;

    switch (_current) {
        case SCREEN_SPARK:  interval = SPARK_FPS_MS;  break;
        case SCREEN_CLOCK:  interval = CLOCK_FPS_MS;  break;
        case SCREEN_STEPS:  interval = STEPS_FPS_MS;  break;
        case SCREEN_TOUCH:  interval = TOUCH_FPS_MS;  break;
        default:            interval = SPARK_FPS_MS;   break;
    }

    if (!_needsFullRedraw && (now - _lastRender < interval)) return;
    _lastRender = now;
    bool fullRedraw = _needsFullRedraw;
    _needsFullRedraw = false;

    if (fullRedraw) {
        _gfx->fillScreen(BG_BLACK);
    }

    switch (_current) {
        case SCREEN_SPARK:  renderSpark();  break;
        case SCREEN_CLOCK:  renderClock();  break;
        case SCREEN_STEPS:  renderSteps();  break;
        case SCREEN_TOUCH:  renderTouch();  break;
    }

    // Auto-return to Spark after timeout
    if (_current != SCREEN_SPARK && (now - _lastActivity > 10000)) {
        _current = SCREEN_SPARK;
        _needsFullRedraw = true;
    }
}

void screens_nextScreen() {
    _current = (ScreenID)((_current + 1) % SCREEN_COUNT);
    _lastActivity = millis();
    _needsFullRedraw = true;
}

void screens_prevScreen() {
    _current = (ScreenID)((_current + SCREEN_COUNT - 1) % SCREEN_COUNT);
    _lastActivity = millis();
    _needsFullRedraw = true;
}

void screens_setScreen(ScreenID id) {
    _current = id;
    _lastActivity = millis();
    _needsFullRedraw = true;
}

ScreenID screens_current() {
    return _current;
}

void screens_notifyParentTouch() {
    _hasParentTouch = true;
    _parentTouchTime = millis();
    animator_triggerReaction(RX_IDX_LOVE, 2000);
}

bool screens_hasParentTouch() {
    return _hasParentTouch;
}

void screens_setSilentMode(bool on) {
    _silentMode = on;
}

bool screens_isSilent() {
    return _silentMode;
}
