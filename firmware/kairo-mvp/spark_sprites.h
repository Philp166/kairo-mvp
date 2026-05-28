#pragma once
#include <stdint.h>

// Color palette indices
enum SparkColor : uint8_t {
    COL_INK   = 0,  // #1A1538
    COL_CREAM = 1,  // #FAF6EC
    COL_LAV   = 2,  // #9B8EC4
    COL_WARM  = 3,  // #FF8559
};

// RGB565 color values
static const uint16_t SPARK_PALETTE[] = {
    0x18A7,  // INK    #1A1538
    0xFFBD,  // CREAM  #FAF6EC
    0x9C78,  // LAV    #9B8EC4
    0xFC2B,  // WARM   #FF8559
};

// Background colors per state (RGB565)
#define BG_DEFAULT  0xDAC6  // terracotta #D85A30
#define BG_SLEEP    0x18A7  // deep indigo #1A1538
#define BG_WORRIED  0x88C3  // dark red #8B1A1A
#define BG_BLACK    0x0000

// Pixel on the 16x16 grid
typedef struct {
    uint8_t x;
    uint8_t y;
    uint8_t color;
} SparkPixel;

// A single pose (static frame)
typedef struct {
    const SparkPixel* pixels;
    uint8_t count;
} SparkPose;

// Scheduling entry for pose cycling
typedef struct {
    uint8_t pose_idx;
    uint8_t weight;
    uint16_t dur_min;
    uint16_t dur_max;
} PoseSchedule;

// ============================================================
//  CALM STATE
// ============================================================

static const SparkPixel CALM_OPEN[] = {
    {4,7,0},{5,7,0},{4,8,0},{5,8,0},
    {10,7,0},{11,7,0},{10,8,0},{11,8,0},
    {6,11,0},{7,12,0},{8,12,0},{9,11,0},
    {3,10,2},{12,10,2},
};

static const SparkPixel CALM_BLINK[] = {
    {3,8,0},{4,8,0},{5,8,0},{6,8,0},
    {9,8,0},{10,8,0},{11,8,0},{12,8,0},
    {6,11,0},{7,12,0},{8,12,0},{9,11,0},
    {3,10,2},{12,10,2},
};

static const SparkPixel CALM_LOOKLEFT[] = {
    {3,7,0},{4,7,0},{3,8,0},{4,8,0},
    {9,7,0},{10,7,0},{9,8,0},{10,8,0},
    {6,11,0},{7,12,0},{8,12,0},{9,11,0},
    {3,10,2},{12,10,2},
};

static const SparkPixel CALM_LOOKRIGHT[] = {
    {5,7,0},{6,7,0},{5,8,0},{6,8,0},
    {11,7,0},{12,7,0},{11,8,0},{12,8,0},
    {6,11,0},{7,12,0},{8,12,0},{9,11,0},
    {3,10,2},{12,10,2},
};

static const SparkPixel CALM_SMILEWIDE[] = {
    {3,7,0},{4,8,0},{5,8,0},{6,7,0},
    {9,7,0},{10,8,0},{11,8,0},{12,7,0},
    {4,11,0},{5,12,0},{6,12,0},{7,12,0},{8,12,0},{9,12,0},{10,12,0},{11,11,0},
    {3,10,2},{12,10,2},
};

static const SparkPixel CALM_HUM[] = {
    {4,7,0},{5,7,0},{4,8,0},{5,8,0},
    {10,7,0},{11,7,0},{10,8,0},{11,8,0},
    {7,11,0},{8,11,0},
    {3,10,2},{12,10,2},
};

#define CALM_POSE_COUNT   6
#define CALM_BLINK_IDX    1

static const SparkPose CALM_POSES[CALM_POSE_COUNT] = {
    { CALM_OPEN,      sizeof(CALM_OPEN)/sizeof(SparkPixel) },
    { CALM_BLINK,     sizeof(CALM_BLINK)/sizeof(SparkPixel) },
    { CALM_LOOKLEFT,  sizeof(CALM_LOOKLEFT)/sizeof(SparkPixel) },
    { CALM_LOOKRIGHT, sizeof(CALM_LOOKRIGHT)/sizeof(SparkPixel) },
    { CALM_SMILEWIDE, sizeof(CALM_SMILEWIDE)/sizeof(SparkPixel) },
    { CALM_HUM,       sizeof(CALM_HUM)/sizeof(SparkPixel) },
};

// Schedule excludes blink (idx 1) — blink is handled separately
static const PoseSchedule CALM_SCHED[] = {
    { 0, 42, 1800, 3200 },  // open
    { 2, 12,  600, 1000 },  // lookLeft
    { 3, 12,  600, 1000 },  // lookRight
    { 4, 18,  900, 1400 },  // smileWide
    { 5, 16,  700, 1200 },  // hum
};
#define CALM_SCHED_COUNT  5

// ============================================================
//  ACTIVE STATE
// ============================================================

static const SparkPixel ACTIVE_OPEN[] = {
    {4,6,0},{5,6,0},{6,6,0},
    {4,7,0},{5,7,1},{6,7,0},
    {4,8,0},{5,8,0},{6,8,0},
    {9,6,0},{10,6,0},{11,6,0},
    {9,7,0},{10,7,1},{11,7,0},
    {9,8,0},{10,8,0},{11,8,0},
    {7,11,0},{8,11,0},{7,12,0},{8,12,0},
    {2,9,3},{13,9,3},
};

static const SparkPixel ACTIVE_BLINK[] = {
    {4,7,0},{5,7,0},{6,7,0},
    {9,7,0},{10,7,0},{11,7,0},
    {7,11,0},{8,11,0},{7,12,0},{8,12,0},
    {2,9,3},{13,9,3},
};

static const SparkPixel ACTIVE_BIGSMILE[] = {
    {4,6,0},{5,6,0},{6,6,0},
    {4,7,0},{5,7,1},{6,7,0},
    {4,8,0},{5,8,0},{6,8,0},
    {9,6,0},{10,6,0},{11,6,0},
    {9,7,0},{10,7,1},{11,7,0},
    {9,8,0},{10,8,0},{11,8,0},
    {4,11,0},{5,12,0},{6,12,0},{7,12,0},{8,12,0},{9,12,0},{10,12,0},{11,11,0},
    {2,9,3},{13,9,3},
};

static const SparkPixel ACTIVE_EXCITED[] = {
    {4,6,0},{5,6,0},{6,6,0},
    {4,7,0},{5,7,1},{6,7,0},
    {4,8,0},{5,8,0},{6,8,0},
    {9,6,0},{10,6,0},{11,6,0},
    {9,7,0},{10,7,1},{11,7,0},
    {9,8,0},{10,8,0},{11,8,0},
    {4,4,0},{5,4,0},
    {10,4,0},{11,4,0},
    {7,11,0},{8,11,0},{7,12,0},{8,12,0},
    {2,9,3},{13,9,3},
};

static const SparkPixel ACTIVE_SIDEGLANCE[] = {
    {5,6,0},{6,6,0},{7,6,0},
    {5,7,0},{6,7,1},{7,7,0},
    {5,8,0},{6,8,0},{7,8,0},
    {10,6,0},{11,6,0},{12,6,0},
    {10,7,0},{11,7,1},{12,7,0},
    {10,8,0},{11,8,0},{12,8,0},
    {7,11,0},{8,11,0},{7,12,0},{8,12,0},
    {2,9,3},{13,9,3},
};

#define ACTIVE_POSE_COUNT  5
#define ACTIVE_BLINK_IDX   1

static const SparkPose ACTIVE_POSES[ACTIVE_POSE_COUNT] = {
    { ACTIVE_OPEN,       sizeof(ACTIVE_OPEN)/sizeof(SparkPixel) },
    { ACTIVE_BLINK,      sizeof(ACTIVE_BLINK)/sizeof(SparkPixel) },
    { ACTIVE_BIGSMILE,   sizeof(ACTIVE_BIGSMILE)/sizeof(SparkPixel) },
    { ACTIVE_EXCITED,    sizeof(ACTIVE_EXCITED)/sizeof(SparkPixel) },
    { ACTIVE_SIDEGLANCE, sizeof(ACTIVE_SIDEGLANCE)/sizeof(SparkPixel) },
};

static const PoseSchedule ACTIVE_SCHED[] = {
    { 0, 35,  700, 1200 },  // open
    { 2, 28,  600, 1100 },  // bigSmile
    { 3, 20,  400,  800 },  // excited
    { 4, 17,  500,  900 },  // sideGlance
};
#define ACTIVE_SCHED_COUNT 4

// ============================================================
//  SLEEPY STATE
// ============================================================

static const SparkPixel SLEEPY_CLOSED[] = {
    {3,8,1},{4,8,1},{5,8,1},{6,8,1},
    {9,8,1},{10,8,1},{11,8,1},{12,8,1},
    {7,12,1},{8,12,1},
    {2,9,2},{13,9,2},
};

static const SparkPixel SLEEPY_YAWN[] = {
    {3,8,1},{4,8,1},{5,8,1},{6,8,1},
    {9,8,1},{10,8,1},{11,8,1},{12,8,1},
    {6,11,1},{7,11,1},{8,11,1},{9,11,1},
    {6,12,1},{7,12,1},{8,12,1},{9,12,1},
    {7,13,1},{8,13,1},
    {2,9,2},{13,9,2},
};

static const SparkPixel SLEEPY_PEEK[] = {
    {4,7,1},{5,7,1},
    {3,8,1},{4,8,1},{5,8,1},{6,8,1},
    {9,8,1},{10,8,1},{11,8,1},{12,8,1},
    {7,12,1},{8,12,1},
    {2,9,2},{13,9,2},
};

static const SparkPixel SLEEPY_DROWSE[] = {
    {3,7,1},{4,7,1},{5,8,1},{6,8,1},
    {9,8,1},{10,8,1},{11,7,1},{12,7,1},
    {8,12,1},
    {2,9,2},{13,9,2},
};

static const SparkPixel SLEEPY_MICRONAP[] = {
    {4,8,1},{5,8,1},
    {10,8,1},{11,8,1},
    {7,12,1},{8,12,1},
    {2,9,2},{13,9,2},
};

#define SLEEPY_POSE_COUNT  5
#define SLEEPY_BLINK_IDX   (-1)  // no blink — already closed

static const SparkPose SLEEPY_POSES[SLEEPY_POSE_COUNT] = {
    { SLEEPY_CLOSED,   sizeof(SLEEPY_CLOSED)/sizeof(SparkPixel) },
    { SLEEPY_YAWN,     sizeof(SLEEPY_YAWN)/sizeof(SparkPixel) },
    { SLEEPY_PEEK,     sizeof(SLEEPY_PEEK)/sizeof(SparkPixel) },
    { SLEEPY_DROWSE,   sizeof(SLEEPY_DROWSE)/sizeof(SparkPixel) },
    { SLEEPY_MICRONAP, sizeof(SLEEPY_MICRONAP)/sizeof(SparkPixel) },
};

static const PoseSchedule SLEEPY_SCHED[] = {
    { 0, 55, 2400, 4200 },  // closed
    { 3, 15, 1000, 1600 },  // drowse
    { 2, 10,  600, 1100 },  // peek
    { 1,  8,  900, 1300 },  // yawn
    { 4, 12, 1400, 2200 },  // micronap
};
#define SLEEPY_SCHED_COUNT 5

// ============================================================
//  WORRIED STATE
// ============================================================

static const SparkPixel WORRIED_OPEN[] = {
    {4,6,0},{5,6,0},{6,6,0},
    {4,7,0},{5,7,0},{6,7,0},
    {4,8,0},{5,8,0},{6,8,0},
    {9,6,0},{10,6,0},{11,6,0},
    {9,7,0},{10,7,0},{11,7,0},
    {9,8,0},{10,8,0},{11,8,0},
    {4,4,0},{5,4,0},{5,5,0},
    {10,4,0},{10,5,0},{11,4,0},
    {6,12,0},{7,11,0},{8,11,0},{9,12,0},
};

static const SparkPixel WORRIED_DARTLEFT[] = {
    {4,7,0},{5,7,0},{4,8,0},{5,8,0},
    {9,7,0},{10,7,0},{9,8,0},{10,8,0},
    {4,4,0},{5,4,0},{5,5,0},
    {10,4,0},{10,5,0},{11,4,0},
    {6,12,0},{7,11,0},{8,11,0},{9,12,0},
};

static const SparkPixel WORRIED_DARTRIGHT[] = {
    {5,7,0},{6,7,0},{5,8,0},{6,8,0},
    {10,7,0},{11,7,0},{10,8,0},{11,8,0},
    {4,4,0},{5,4,0},{5,5,0},
    {10,4,0},{10,5,0},{11,4,0},
    {6,12,0},{7,11,0},{8,11,0},{9,12,0},
};

static const SparkPixel WORRIED_SQUEEZE[] = {
    {4,6,0},{6,6,0},{5,7,0},{4,8,0},{6,8,0},
    {9,6,0},{11,6,0},{10,7,0},{9,8,0},{11,8,0},
    {4,4,0},{5,4,0},{5,5,0},
    {10,4,0},{10,5,0},{11,4,0},
    {5,12,0},{6,11,0},{7,11,0},{8,11,0},{9,11,0},{10,12,0},
};

static const SparkPixel WORRIED_QUIVER[] = {
    {4,6,0},{5,6,0},{6,6,0},
    {4,7,0},{5,7,0},{6,7,0},
    {4,8,0},{5,8,0},{6,8,0},
    {9,6,0},{10,6,0},{11,6,0},
    {9,7,0},{10,7,0},{11,7,0},
    {9,8,0},{10,8,0},{11,8,0},
    {4,4,0},{5,4,0},{5,5,0},
    {10,4,0},{10,5,0},{11,4,0},
    {5,11,0},{6,12,0},{7,11,0},{8,12,0},{9,11,0},{10,12,0},
};

#define WORRIED_POSE_COUNT  5
#define WORRIED_BLINK_IDX   (-1)

static const SparkPose WORRIED_POSES[WORRIED_POSE_COUNT] = {
    { WORRIED_OPEN,      sizeof(WORRIED_OPEN)/sizeof(SparkPixel) },
    { WORRIED_DARTLEFT,  sizeof(WORRIED_DARTLEFT)/sizeof(SparkPixel) },
    { WORRIED_DARTRIGHT, sizeof(WORRIED_DARTRIGHT)/sizeof(SparkPixel) },
    { WORRIED_SQUEEZE,   sizeof(WORRIED_SQUEEZE)/sizeof(SparkPixel) },
    { WORRIED_QUIVER,    sizeof(WORRIED_QUIVER)/sizeof(SparkPixel) },
};

static const PoseSchedule WORRIED_SCHED[] = {
    { 0, 36,  700, 1200 },  // open
    { 1, 18,  350,  600 },  // dartLeft
    { 2, 18,  350,  600 },  // dartRight
    { 3, 12,  500,  900 },  // squeeze
    { 4, 16,  600, 1000 },  // quiver
};
#define WORRIED_SCHED_COUNT 5

// ============================================================
//  REACTIONS (transient expressions)
// ============================================================

static const SparkPixel RX_LOVE[] = {
    {4,6,0},{6,6,0},
    {4,7,0},{5,7,3},{6,7,0},
    {5,8,3},
    {9,6,0},{11,6,0},
    {9,7,0},{10,7,3},{11,7,0},
    {10,8,3},
    {4,11,0},{5,12,0},{6,12,0},{7,12,0},{8,12,0},{9,12,0},{10,12,0},{11,11,0},
    {2,9,3},{13,9,3},
};

static const SparkPixel RX_CELEBRATE[] = {
    {5,6,0},
    {4,7,0},{5,7,1},{6,7,0},
    {5,8,0},
    {10,6,0},
    {9,7,0},{10,7,1},{11,7,0},
    {10,8,0},
    {6,11,0},{7,11,0},{8,11,0},{9,11,0},
    {7,12,0},{8,12,0},
    {2,9,3},{13,9,3},
};

static const SparkPixel RX_OFF[] = {
    {3,8,0},{4,8,0},{5,8,0},{6,8,0},
    {9,8,0},{10,8,0},{11,8,0},{12,8,0},
};

static const SparkPixel RX_LOW_BATT[] = {
    {3,7,0},{4,8,0},{5,8,0},{6,7,0},
    {9,7,0},{10,8,0},{11,8,0},{12,7,0},
    {6,11,0},{7,11,0},{8,11,0},{9,11,0},
    {11,2,1},{12,2,1},{13,2,1},
    {11,3,1},{13,3,1},
    {11,4,1},{12,4,3},{13,4,1},
};

static const SparkPixel RX_BOOTUP[] = {
    {7,7,1},{8,7,1},
    {7,8,1},{8,8,1},
};

static const SparkPose REACTION_POSES[] = {
    { RX_LOVE,      sizeof(RX_LOVE)/sizeof(SparkPixel) },
    { RX_CELEBRATE, sizeof(RX_CELEBRATE)/sizeof(SparkPixel) },
    { RX_OFF,       sizeof(RX_OFF)/sizeof(SparkPixel) },
    { RX_LOW_BATT,  sizeof(RX_LOW_BATT)/sizeof(SparkPixel) },
    { RX_BOOTUP,    sizeof(RX_BOOTUP)/sizeof(SparkPixel) },
};

enum ReactionType : uint8_t {
    RX_NONE = 255,
    RX_IDX_LOVE = 0,
    RX_IDX_CELEBRATE = 1,
    RX_IDX_OFF = 2,
    RX_IDX_LOW_BATT = 3,
    RX_IDX_BOOTUP = 4,
};

// Background for each reaction
static const uint16_t RX_BG[] = {
    BG_DEFAULT,  // love
    BG_DEFAULT,  // celebrate
    BG_SLEEP,    // off
    BG_DEFAULT,  // low_batt
    BG_DEFAULT,  // bootup
};

// ============================================================
//  EXTRAS — sparkle, Z, sweat pixel overlays
// ============================================================

static const SparkPixel EXTRA_SPARKLE[] = {
    {13,2,1},
    {12,3,1},{14,3,1},
    {13,4,1},
    {2,13,1},{3,14,1},
};
#define EXTRA_SPARKLE_COUNT 6

static const SparkPixel EXTRA_Z[] = {
    {12,3,1},{13,3,1},{14,3,1},
    {13,4,1},
    {12,5,1},
    {12,6,1},{13,6,1},{14,6,1},
};
#define EXTRA_Z_COUNT 8

static const SparkPixel EXTRA_SWEAT[] = {
    {12,6,1},
    {11,7,1},{12,7,1},{13,7,1},
    {12,8,1},
};
#define EXTRA_SWEAT_COUNT 5

// ============================================================
//  HEART ICON (for parent touch screen)
// ============================================================

static const uint8_t HEART_PX[][2] = {
    {4,3},{5,3},{8,3},{9,3},
    {3,4},{4,4},{5,4},{6,4},{7,4},{8,4},{9,4},{10,4},
    {3,5},{4,5},{5,5},{6,5},{7,5},{8,5},{9,5},{10,5},
    {4,6},{5,6},{6,6},{7,6},{8,6},{9,6},
    {5,7},{6,7},{7,7},{8,7},
    {6,8},{7,8},
};
#define HEART_PX_COUNT 32

// ============================================================
//  BOOT ICON — shoe for steps screen
// ============================================================

static const uint8_t SHOE_PX[][2] = {
    {5,4},{6,4},{7,4},
    {4,5},{5,5},{6,5},{7,5},{8,5},
    {3,6},{4,6},{5,6},{6,6},{7,6},{8,6},{9,6},
    {3,7},{4,7},{5,7},{6,7},{7,7},{8,7},{9,7},{10,7},
    {3,8},{4,8},{5,8},{6,8},{7,8},{8,8},{9,8},{10,8},{11,8},
};
#define SHOE_PX_COUNT 32
