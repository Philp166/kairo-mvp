#pragma once
#include <Arduino.h>
#include <Arduino_GFX_Library.h>

enum ScreenID : uint8_t {
    SCREEN_SPARK  = 0,
    SCREEN_CLOCK  = 1,
    SCREEN_STEPS  = 2,
    SCREEN_TOUCH  = 3,
    SCREEN_COUNT  = 4,
};

void screens_init(Arduino_GFX* gfx);
void screens_update();
void screens_nextScreen();
void screens_prevScreen();
void screens_setScreen(ScreenID id);
ScreenID screens_current();

void screens_notifyParentTouch();
bool screens_hasParentTouch();

void screens_setSilentMode(bool on);
bool screens_isSilent();
