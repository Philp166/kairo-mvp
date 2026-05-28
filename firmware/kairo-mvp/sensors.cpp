#include "sensors.h"
#include "pin_config.h"
#include <Wire.h>

#define XPOWERS_CHIP_AXP2101
#include "XPowersLib.h"
#include "SensorQMI8658.hpp"
#include "SensorPCF85063.hpp"

static XPowersPMU power;
static SensorQMI8658 qmi;
static SensorPCF85063 rtc;

static bool _powerOk = false;
static bool _imuOk = false;
static bool _rtcOk = false;

// Motion filtering
static float _motionLevel = 0.0f;
static float _motionSmooth = 0.0f;
static float _motionRaw = 0.0f;

// Step counter
static uint32_t _steps = 0;
static float _lastMag = 0.0f;
static bool _stepHigh = false;
static uint32_t _lastStepTime = 0;
#define STEP_THRESHOLD_HIGH  1.25f  // g
#define STEP_THRESHOLD_LOW   0.85f  // g
#define STEP_DEBOUNCE_MS     250

// Wake-on-wrist
static bool _wristRaised = false;
static uint32_t _lastWristCheck = 0;

// RTC cache
static uint8_t _hour = 12, _minute = 0, _second = 0;
static uint8_t _dayOfWeek = 1, _day = 26, _month = 5;
static uint32_t _lastRtcRead = 0;

// Battery cache
static uint8_t _battPct = 50;
static bool _charging = false;
static float _battV = 3.7f;
static uint32_t _lastBattRead = 0;

// Power key
static bool _pkeyShort = false;
static bool _pkeyLong = false;

static const char* DAY_NAMES[] = {"SUN","MON","TUE","WED","THU","FRI","SAT"};
static const char* MONTH_NAMES[] = {"JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"};

void sensors_init() {
    // I2C already started in main setup (Wire.begin)

    // Power management
    _powerOk = power.begin(Wire, AXP2101_SLAVE_ADDRESS, IIC_SDA, IIC_SCL);
    if (_powerOk) {
        power.disableTSPinMeasure();
        power.enableBattVoltageMeasure();
        power.enableBattDetection();

        power.setPowerKeyPressOffTime(XPOWERS_POWEROFF_4S);
        power.disableSleep();
        power.disableIRQ(XPOWERS_AXP2101_ALL_IRQ);
        power.clearIrqStatus();
    }

    // IMU
    _imuOk = qmi.begin(Wire, QMI8658_L_SLAVE_ADDRESS, IIC_SDA, IIC_SCL);
    if (_imuOk) {
        qmi.configAccelerometer(
            SensorQMI8658::ACC_RANGE_4G,
            SensorQMI8658::ACC_ODR_250Hz,
            SensorQMI8658::LPF_MODE_0
        );
        qmi.configGyroscope(
            SensorQMI8658::GYR_RANGE_512DPS,
            SensorQMI8658::GYR_ODR_224_2Hz,
            SensorQMI8658::LPF_MODE_0
        );
        qmi.enableAccelerometer();
        qmi.enableGyroscope();
    }

    // RTC
    _rtcOk = rtc.begin(Wire, IIC_SDA, IIC_SCL);
    if (_rtcOk) {
        const char *t = __TIME__;
        const char *d = __DATE__;
        uint8_t ch = (t[0] - '0') * 10 + (t[1] - '0');
        uint8_t cm = (t[3] - '0') * 10 + (t[4] - '0');
        uint8_t cs = (t[6] - '0') * 10 + (t[7] - '0');
        const char months[] = "JanFebMarAprMayJunJulAugSepOctNovDec";
        uint8_t cmo = 1;
        for (int i = 0; i < 12; i++) {
            if (d[0] == months[i*3] && d[1] == months[i*3+1] && d[2] == months[i*3+2]) {
                cmo = i + 1; break;
            }
        }
        uint8_t cd = (d[4] == ' ' ? 0 : (d[4] - '0')) * 10 + (d[5] - '0');
        uint16_t cy = (d[7]-'0')*1000 + (d[8]-'0')*100 + (d[9]-'0')*10 + (d[10]-'0');

        RTC_DateTime dt = rtc.getDateTime();
        bool needsSet = (dt.getYear() < cy) ||
                        (dt.getYear() == cy && dt.getMonth() < cmo) ||
                        (dt.getYear() == cy && dt.getMonth() == cmo && dt.getDay() < cd);
        if (needsSet) {
            rtc.setDateTime(cy, cmo, cd, ch, cm, cs);
            dt = rtc.getDateTime();
        }

        _hour = dt.getHour();
        _minute = dt.getMinute();
        _second = dt.getSecond();
        _dayOfWeek = dt.getWeek();
        _day = dt.getDay();
        _month = dt.getMonth();
    }
}

void sensors_update() {
    uint32_t now = millis();

    // IMU — read when data ready
    if (_imuOk && qmi.getDataReady()) {
        float ax, ay, az, gx, gy, gz;
        if (qmi.getAccelerometer(ax, ay, az)) {
            float mag = sqrtf(ax * ax + ay * ay + az * az);
            float motion = fabsf(mag - 1.0f);
            _motionRaw = motion;
            _motionSmooth = _motionSmooth * 0.9f + motion * 0.1f;
            _motionLevel = constrain(_motionSmooth, 0.0f, 1.0f);

            // Step detection — peak detection on accel magnitude
            if (mag > STEP_THRESHOLD_HIGH && !_stepHigh) {
                _stepHigh = true;
                if (now - _lastStepTime > STEP_DEBOUNCE_MS) {
                    _steps++;
                    _lastStepTime = now;
                }
            } else if (mag < STEP_THRESHOLD_LOW) {
                _stepHigh = false;
            }
            _lastMag = mag;
        }
        if (qmi.getGyroscope(gx, gy, gz)) {
            // Wake-on-wrist: gyro Y > 150 deg/s — latch until consumed
            if (fabsf(gy) > 150.0f) {
                _wristRaised = true;
            }
        }
    }

    // RTC — read every 500ms
    if (_rtcOk && (now - _lastRtcRead > 500)) {
        _lastRtcRead = now;
        RTC_DateTime dt = rtc.getDateTime();
        _hour = dt.getHour();
        _minute = dt.getMinute();
        _second = dt.getSecond();
        _dayOfWeek = dt.getWeek();
        _day = dt.getDay();
        _month = dt.getMonth();
    }

    // Battery — read every 2s
    if (_powerOk && (now - _lastBattRead > 2000)) {
        _lastBattRead = now;
        _battPct = power.getBatteryPercent();
        _charging = power.isCharging();
        _battV = power.getBattVoltage() / 1000.0f;
    }

}

float sensors_getMotionLevel()  { return _motionLevel; }
float sensors_getMotionRaw()    { return _motionRaw; }
uint32_t sensors_getSteps()     { return _steps; }
bool sensors_wristRaised() {
    if (_wristRaised) { _wristRaised = false; return true; }
    return false;
}

uint8_t sensors_getHour()       { return _hour; }
uint8_t sensors_getMinute()     { return _minute; }
uint8_t sensors_getSecond()     { return _second; }
uint8_t sensors_getDayOfWeek()  { return _dayOfWeek; }
const char* sensors_getDayName(){ return DAY_NAMES[_dayOfWeek % 7]; }
uint8_t sensors_getDay()        { return _day; }
uint8_t sensors_getMonth()      { return _month; }
const char* sensors_getMonthName() {
    uint8_t m = _month;
    if (m < 1 || m > 12) m = 1;
    return MONTH_NAMES[m - 1];
}

void sensors_setTime(uint8_t h, uint8_t m, uint8_t s, uint8_t d, uint8_t mo, uint16_t y) {
    if (!_rtcOk) return;
    rtc.setDateTime(y, mo, d, h, m, s);
    _hour = h; _minute = m; _second = s;
    _day = d; _month = mo;
    _lastRtcRead = millis();
}

uint8_t sensors_getBatteryPct() { return _battPct; }
bool sensors_isCharging()       { return _charging; }
float sensors_getBattVoltage()  { return _battV; }

bool sensors_powerKeyShortPress() {
    if (_pkeyShort) { _pkeyShort = false; return true; }
    return false;
}
bool sensors_powerKeyLongPress() {
    if (_pkeyLong) { _pkeyLong = false; return true; }
    return false;
}

// Mocks
uint8_t sensors_getHR()    { return 0; }
uint8_t sensors_getSpO2()  { return 0; }
float sensors_getTemp()    { return 0.0f; }
bool sensors_isWorn()      { return false; }
