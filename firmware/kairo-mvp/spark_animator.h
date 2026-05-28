#pragma once
#include <Arduino.h>
#include "spark_sprites.h"

enum SparkState : uint8_t {
    STATE_CALM    = 0,
    STATE_ACTIVE  = 1,
    STATE_SLEEPY  = 2,
    STATE_WORRIED = 3,
};

void animator_init();
void animator_update();
void animator_setState(SparkState newState);
SparkState animator_getState();
const SparkPose* animator_getCurrentPose();
uint16_t animator_getBgColor();
uint8_t animator_getExtraType();  // 0=none, 1=sparkle, 2=z, 3=sweat

float animator_getBreathPeriod();

void animator_triggerReaction(uint8_t rxIdx, uint32_t durationMs = 2000);
bool animator_isReactionActive();
