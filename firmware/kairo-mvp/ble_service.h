#pragma once
#include <Arduino.h>

void ble_init();
void ble_update();
bool ble_isConnected();
void ble_notifyEvent(const char* eventType);

typedef void (*BleCommandCallback)(const char* cmd);
void ble_setCommandCallback(BleCommandCallback cb);
