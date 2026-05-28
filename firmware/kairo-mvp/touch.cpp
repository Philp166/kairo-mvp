#include "touch.h"
#include "pin_config.h"
#include <Wire.h>
#include <HWCDC.h>
#include "Arduino_DriveBus_Library.h"

extern HWCDC USBSerial;

static std::shared_ptr<Arduino_IIC_DriveBus> IIC_Bus =
    std::make_shared<Arduino_HWIIC>(IIC_SDA, IIC_SCL, &Wire);

static void touchISR();

static std::unique_ptr<Arduino_IIC> _touch(new Arduino_FT3x68(
    IIC_Bus, FT3168_DEVICE_ADDRESS,
    DRIVEBUS_DEFAULT_VALUE, TP_INT, touchISR));

static void touchISR() {
    _touch->IIC_Interrupt_Flag = true;
}

static bool _ok = false;

// Gesture state machine
static bool _touching = false;
static int16_t _startX = 0, _startY = 0;
static int16_t _lastX = 0, _lastY = 0;
static uint32_t _touchStart = 0;
static TouchEvent _pendingEvent = TOUCH_NONE;

// Polling fallback
static uint32_t _lastPoll = 0;
#define POLL_INTERVAL_MS  50

#define SWIPE_MIN_PX     40
#define LONG_PRESS_MS   800
#define TAP_MAX_MS      400

bool touch_init() {
    // Hardware reset FT3168
    pinMode(TP_RESET, OUTPUT);
    digitalWrite(TP_RESET, LOW);
    delay(10);
    digitalWrite(TP_RESET, HIGH);
    delay(100);

    // Retry up to 5 times (FT3168 may need time after power-on)
    for (int i = 0; i < 5; i++) {
        _ok = _touch->begin();
        if (_ok) break;
        USBSerial.printf("[TOUCH] begin() attempt %d failed\n", i + 1);
        delay(200);
    }

    if (_ok) {
        _touch->IIC_Write_Device_State(
            Arduino_IIC_Touch::Device::TOUCH_POWER_MODE,
            Arduino_IIC_Touch::Device_Mode::TOUCH_POWER_MONITOR);

        int32_t id = _touch->IIC_Read_Device_ID();
        USBSerial.printf("[TOUCH] ID=0x%02X\n", id);
    }
    return _ok;
}

void touch_update() {
    if (!_ok) return;

    uint32_t now = millis();

    // Poll touch data if no IRQ (fallback)
    bool irq = _touch->IIC_Interrupt_Flag;
    bool doPoll = (!irq && (now - _lastPoll >= POLL_INTERVAL_MS));

    if (!irq && !doPoll) return;
    _lastPoll = now;

    if (irq) {
        _touch->IIC_Interrupt_Flag = false;
    }

    int fingers = (int)_touch->IIC_Read_Device_Value(
        Arduino_IIC_Touch::Value_Information::TOUCH_FINGER_NUMBER);
    int16_t x = (int16_t)_touch->IIC_Read_Device_Value(
        Arduino_IIC_Touch::Value_Information::TOUCH_COORDINATE_X);
    int16_t y = (int16_t)_touch->IIC_Read_Device_Value(
        Arduino_IIC_Touch::Value_Information::TOUCH_COORDINATE_Y);

    if (fingers > 0 && !_touching) {
        _touching = true;
        _startX = x;
        _startY = y;
        _lastX = x;
        _lastY = y;
        _touchStart = now;
        USBSerial.printf("[TOUCH] down x=%d y=%d\n", x, y);
    } else if (fingers > 0 && _touching) {
        _lastX = x;
        _lastY = y;
    } else if (fingers == 0 && _touching) {
        _touching = false;
        int16_t dx = _lastX - _startX;
        int16_t dy = _lastY - _startY;
        uint32_t dur = now - _touchStart;

        USBSerial.printf("[TOUCH] up dx=%d dy=%d dur=%lu\n", dx, dy, dur);

        if (abs(dx) > SWIPE_MIN_PX && abs(dx) > abs(dy)) {
            _pendingEvent = (dx > 0) ? TOUCH_SWIPE_RIGHT : TOUCH_SWIPE_LEFT;
        } else if (abs(dy) > SWIPE_MIN_PX && abs(dy) > abs(dx)) {
            _pendingEvent = (dy > 0) ? TOUCH_SWIPE_DOWN : TOUCH_SWIPE_UP;
        } else if (dur >= LONG_PRESS_MS) {
            _pendingEvent = TOUCH_LONG_PRESS;
        } else if (dur < TAP_MAX_MS) {
            _pendingEvent = TOUCH_TAP;
        }
    }
}

TouchEvent touch_getEvent() {
    TouchEvent e = _pendingEvent;
    _pendingEvent = TOUCH_NONE;
    return e;
}
