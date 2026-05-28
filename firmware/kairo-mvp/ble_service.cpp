#include "ble_service.h"
#include "sensors.h"
#include "spark_animator.h"
#include <NimBLEDevice.h>

#define SERVICE_UUID        "4b414952-0001-0001-0001-000000000001"
#define DATA_CHAR_UUID      "4b414952-0001-0001-0001-000000000002"
#define CMD_CHAR_UUID       "4b414952-0001-0001-0001-000000000003"

static NimBLEServer* pServer = nullptr;
static NimBLECharacteristic* pDataChar = nullptr;
static NimBLECharacteristic* pCmdChar = nullptr;

static bool _connected = false;
static uint32_t _lastNotify = 0;
static BleCommandCallback _cmdCallback = nullptr;

#define NOTIFY_INTERVAL_MS  5000

static const char* stateToStr(SparkState s) {
    switch (s) {
        case STATE_CALM:    return "calm";
        case STATE_ACTIVE:  return "active";
        case STATE_SLEEPY:  return "sleepy";
        case STATE_WORRIED: return "worried";
    }
    return "calm";
}

class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pSrv, NimBLEConnInfo& connInfo) override {
        _connected = true;
    }
    void onDisconnect(NimBLEServer* pSrv, NimBLEConnInfo& connInfo, int reason) override {
        _connected = false;
        NimBLEDevice::startAdvertising();
    }
};

class CmdCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& connInfo) override {
        std::string val = pChar->getValue();
        if (val.length() > 0 && _cmdCallback) {
            _cmdCallback(val.c_str());
        }
    }
};

void ble_init() {
    NimBLEDevice::init("KairoSpark");
    NimBLEDevice::setPower(6);

    pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(new ServerCallbacks());

    NimBLEService* pService = pServer->createService(SERVICE_UUID);

    // Data characteristic — notify
    pDataChar = pService->createCharacteristic(
        DATA_CHAR_UUID,
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
    );

    // Command characteristic — write
    pCmdChar = pService->createCharacteristic(
        CMD_CHAR_UUID,
        NIMBLE_PROPERTY::WRITE
    );
    pCmdChar->setCallbacks(new CmdCallbacks());

    NimBLEAdvertising* pAdv = NimBLEDevice::getAdvertising();
    pAdv->addServiceUUID(SERVICE_UUID);
    pAdv->start();
}

void ble_update() {
    if (!_connected) return;

    uint32_t now = millis();
    if (now - _lastNotify < NOTIFY_INTERVAL_MS) return;
    _lastNotify = now;

    char buf[256];
    snprintf(buf, sizeof(buf),
        "{\"hr\":%d,\"spo2\":%d,\"temp\":%.1f,\"motion\":%.2f,"
        "\"state\":\"%s\",\"battery\":%d,\"worn\":%s,"
        "\"steps\":%lu,\"ts\":%lu}",
        sensors_getHR(),
        sensors_getSpO2(),
        sensors_getTemp(),
        sensors_getMotionLevel(),
        stateToStr(animator_getState()),
        sensors_getBatteryPct(),
        sensors_isWorn() ? "true" : "false",
        (unsigned long)sensors_getSteps(),
        (unsigned long)(millis() / 1000)
    );
    pDataChar->setValue(buf);
    pDataChar->notify();
}

bool ble_isConnected() {
    return _connected;
}

void ble_notifyEvent(const char* eventType) {
    if (!_connected || !pDataChar) return;
    char buf[64];
    snprintf(buf, sizeof(buf), "{\"event\":\"%s\",\"ts\":%lu}",
             eventType, (unsigned long)(millis() / 1000));
    pDataChar->setValue(buf);
    pDataChar->notify();
}

void ble_setCommandCallback(BleCommandCallback cb) {
    _cmdCallback = cb;
}
