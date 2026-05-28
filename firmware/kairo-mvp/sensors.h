#pragma once
#include <Arduino.h>

void sensors_init();
void sensors_update();

// IMU
float sensors_getMotionLevel();   // 0.0 - 1.0 normalized (EMA smoothed)
float sensors_getMotionRaw();     // unfiltered |mag - 1.0| for calibration
uint32_t sensors_getSteps();
bool sensors_wristRaised();       // gyro-based wake gesture

// RTC
uint8_t sensors_getHour();
uint8_t sensors_getMinute();
uint8_t sensors_getSecond();
uint8_t sensors_getDayOfWeek();   // 0=Sun..6=Sat
const char* sensors_getDayName();
uint8_t sensors_getDay();
uint8_t sensors_getMonth();
const char* sensors_getMonthName();
void sensors_setTime(uint8_t h, uint8_t m, uint8_t s, uint8_t d, uint8_t mo, uint16_t y);

// Battery
uint8_t sensors_getBatteryPct();
bool sensors_isCharging();
float sensors_getBattVoltage();

// Power key (AXP2101)
bool sensors_powerKeyShortPress();
bool sensors_powerKeyLongPress();

// Mock sensors (not connected yet)
uint8_t sensors_getHR();     // always 0
uint8_t sensors_getSpO2();   // always 0
float sensors_getTemp();     // always 0.0
bool sensors_isWorn();       // always false (no PPG sensor)
