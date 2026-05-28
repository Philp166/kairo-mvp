#pragma once
#include <Arduino.h>

enum TouchEvent : uint8_t {
    TOUCH_NONE = 0,
    TOUCH_TAP,
    TOUCH_SWIPE_LEFT,
    TOUCH_SWIPE_RIGHT,
    TOUCH_SWIPE_UP,
    TOUCH_SWIPE_DOWN,
    TOUCH_LONG_PRESS,
};

bool touch_init();
void touch_update();
TouchEvent touch_getEvent();
