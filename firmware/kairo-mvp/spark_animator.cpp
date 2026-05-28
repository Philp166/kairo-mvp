#include "spark_animator.h"

// Per-state config table
struct StateConfig {
    const SparkPose* poses;
    uint8_t poseCount;
    const PoseSchedule* sched;
    uint8_t schedCount;
    int8_t blinkIdx;
    uint16_t blinkIntervalMin;
    uint16_t blinkIntervalMax;
    uint8_t blinkDur;
    uint16_t bgColor;
    uint8_t extraType; // 0=none, 1=sparkle, 2=z, 3=sweat
};

static const StateConfig STATE_CONFIGS[] = {
    // CALM
    {
        CALM_POSES, CALM_POSE_COUNT,
        CALM_SCHED, CALM_SCHED_COUNT,
        CALM_BLINK_IDX, 2400, 4200, 130,
        BG_DEFAULT, 0
    },
    // ACTIVE
    {
        ACTIVE_POSES, ACTIVE_POSE_COUNT,
        ACTIVE_SCHED, ACTIVE_SCHED_COUNT,
        ACTIVE_BLINK_IDX, 1800, 3000, 110,
        BG_DEFAULT, 1 // sparkle
    },
    // SLEEPY
    {
        SLEEPY_POSES, SLEEPY_POSE_COUNT,
        SLEEPY_SCHED, SLEEPY_SCHED_COUNT,
        -1, 0, 0, 0,
        BG_SLEEP, 2 // z-float
    },
    // WORRIED
    {
        WORRIED_POSES, WORRIED_POSE_COUNT,
        WORRIED_SCHED, WORRIED_SCHED_COUNT,
        -1, 0, 0, 0,
        BG_WORRIED, 3 // sweat
    },
};

static SparkState _state = STATE_CALM;
static uint8_t _currentPoseIdx = 0;
static bool _isBlinking = false;
static uint32_t _poseTimer = 0;
static uint32_t _poseDuration = 2000;
static uint32_t _blinkTimer = 0;
static uint32_t _blinkNextAt = 0;
static uint32_t _blinkEndAt = 0;

// Reaction overlay
static bool _rxActive = false;
static uint8_t _rxIdx = 0;
static uint32_t _rxEndAt = 0;

static uint8_t pickWeightedPose(const PoseSchedule* sched, uint8_t count) {
    uint16_t totalWeight = 0;
    for (uint8_t i = 0; i < count; i++) totalWeight += sched[i].weight;

    uint16_t r = random(0, totalWeight);
    for (uint8_t i = 0; i < count; i++) {
        if (r < sched[i].weight) return i;
        r -= sched[i].weight;
    }
    return 0;
}

static void scheduleNextPose() {
    const StateConfig& cfg = STATE_CONFIGS[_state];
    if (cfg.schedCount == 0) return;

    uint8_t schedIdx = pickWeightedPose(cfg.sched, cfg.schedCount);
    _currentPoseIdx = cfg.sched[schedIdx].pose_idx;
    _poseDuration = random(cfg.sched[schedIdx].dur_min, cfg.sched[schedIdx].dur_max);
    _poseTimer = millis();
}

static void scheduleNextBlink() {
    const StateConfig& cfg = STATE_CONFIGS[_state];
    if (cfg.blinkIdx < 0) return;
    uint32_t interval = random(cfg.blinkIntervalMin, cfg.blinkIntervalMax);
    _blinkNextAt = millis() + interval;
}

void animator_init() {
    randomSeed(analogRead(0) ^ micros());
    _state = STATE_CALM;
    _currentPoseIdx = 0;
    _isBlinking = false;
    _rxActive = false;
    scheduleNextPose();
    scheduleNextBlink();
}

void animator_setState(SparkState newState) {
    if (newState == _state) return;
    _state = newState;
    _isBlinking = false;
    _currentPoseIdx = (_state == STATE_SLEEPY) ? 0 : 0; // default pose
    scheduleNextPose();
    scheduleNextBlink();
}

SparkState animator_getState() {
    return _state;
}

void animator_update() {
    uint32_t now = millis();

    // Reaction timeout
    if (_rxActive && now >= _rxEndAt) {
        _rxActive = false;
    }

    if (_rxActive) return; // reaction overrides pose cycling

    const StateConfig& cfg = STATE_CONFIGS[_state];

    // Blink logic
    if (cfg.blinkIdx >= 0) {
        if (_isBlinking) {
            if (now >= _blinkEndAt) {
                _isBlinking = false;
                // Restore previous pose (already in _currentPoseIdx before blink)
            }
        } else if (now >= _blinkNextAt) {
            _isBlinking = true;
            _blinkEndAt = now + cfg.blinkDur;
            scheduleNextBlink();
        }
    }

    // Pose cycling
    if (!_isBlinking && (now - _poseTimer >= _poseDuration)) {
        scheduleNextPose();
    }
}

const SparkPose* animator_getCurrentPose() {
    if (_rxActive) {
        return &REACTION_POSES[_rxIdx];
    }

    const StateConfig& cfg = STATE_CONFIGS[_state];
    if (_isBlinking && cfg.blinkIdx >= 0) {
        return &cfg.poses[cfg.blinkIdx];
    }
    if (_currentPoseIdx < cfg.poseCount) {
        return &cfg.poses[_currentPoseIdx];
    }
    return &cfg.poses[0];
}

uint16_t animator_getBgColor() {
    if (_rxActive) {
        return RX_BG[_rxIdx];
    }
    return STATE_CONFIGS[_state].bgColor;
}

uint8_t animator_getExtraType() {
    if (_rxActive) return 0;
    return STATE_CONFIGS[_state].extraType;
}

float animator_getBreathPeriod() {
    switch (_state) {
        case STATE_CALM:    return 2.0f;
        case STATE_ACTIVE:  return 1.0f;
        case STATE_SLEEPY:  return 3.3f;
        case STATE_WORRIED: return 1.4f;
    }
    return 2.0f;
}

void animator_triggerReaction(uint8_t rxIdx, uint32_t durationMs) {
    _rxActive = true;
    _rxIdx = rxIdx;
    _rxEndAt = millis() + durationMs;
}

bool animator_isReactionActive() {
    return _rxActive;
}
