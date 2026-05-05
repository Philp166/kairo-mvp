// Auto-generated from dashboard/src/components/Spark/sprites.json
// DO NOT EDIT BY HAND — run scripts/gen_sprites.py instead.
#pragma once
#include <stdint.h>

#define SPARK_CELL      4
#define SPARK_VIEW_W    140
#define SPARK_VIEW_H    140
#define SPARK_SCREEN_CX 70
#define SPARK_SCREEN_CY 70
#define SPARK_SCREEN_R  50

#define PALETTE_BG 0xDAC6  // #D85A30
#define PALETTE_BG_WORRIED 0xE594  // #E5B0A0
#define PALETTE_INK 0x18A7  // #1A1538
#define PALETTE_GLINT 0xFFBD  // #FAF6EC
#define PALETTE_BEZEL 0xF75B  // #F0E8DC
#define PALETTE_BEZEL_EDGE 0xD656  // #D4C9B5

struct SparkPixel { uint8_t c; uint8_t r; };
struct SparkSprite {
  uint8_t w, h;
  uint16_t inkLen;
  const SparkPixel* ink;
  uint16_t glintLen;
  const SparkPixel* glint;
};
struct SparkItem { uint8_t spriteIdx; int16_t x; int16_t y; uint8_t anim; };
struct SparkStateDef { uint16_t bg; uint8_t itemCount; const SparkItem* items; };
struct SparkEventDef { uint8_t hideMouth; uint8_t itemCount; const SparkItem* items; };

#define ANIM_NONE       0
#define ANIM_PULSE           1
#define ANIM_Z_FLOAT         2
#define ANIM_EXCL_BLINK      3
#define ANIM_HEART_POP       4

// sprite: eyeOpen  (5×7)
static const SparkPixel SPRITE_eyeOpen_ink[] = { {1,0}, {2,0}, {3,0}, {0,1}, {1,1}, {2,1}, {3,1}, {4,1}, {0,2}, {1,2}, {2,2}, {3,2}, {4,2}, {0,3}, {1,3}, {2,3}, {3,3}, {4,3}, {0,4}, {1,4}, {2,4}, {3,4}, {4,4}, {0,5}, {1,5}, {2,5}, {3,5}, {4,5}, {1,6}, {2,6}, {3,6} };
static const SparkPixel SPRITE_eyeOpen_glint[] = { {2,1}, {3,1}, {4,1}, {2,2}, {3,2}, {4,2}, {2,3}, {3,3}, {4,3} };
static const SparkSprite SPRITE_eyeOpen = { 5, 7, 31, SPRITE_eyeOpen_ink, 9, SPRITE_eyeOpen_glint };

// sprite: eyeClosed  (5×3)
static const SparkPixel SPRITE_eyeClosed_ink[] = { {1,0}, {2,0}, {3,0}, {0,1}, {4,1}, {0,2}, {4,2} };
static const SparkPixel* const SPRITE_eyeClosed_glint = nullptr;
static const SparkSprite SPRITE_eyeClosed = { 5, 3, 7, SPRITE_eyeClosed_ink, 0, SPRITE_eyeClosed_glint };

// sprite: mouthCalm  (7×3)
static const SparkPixel SPRITE_mouthCalm_ink[] = { {0,0}, {1,1}, {2,2}, {3,2}, {4,2}, {5,1}, {6,0} };
static const SparkPixel* const SPRITE_mouthCalm_glint = nullptr;
static const SparkSprite SPRITE_mouthCalm = { 7, 3, 7, SPRITE_mouthCalm_ink, 0, SPRITE_mouthCalm_glint };

// sprite: mouthActive  (9×4)
static const SparkPixel SPRITE_mouthActive_ink[] = { {0,0}, {1,1}, {2,2}, {3,3}, {4,3}, {5,3}, {6,2}, {7,1}, {8,0} };
static const SparkPixel* const SPRITE_mouthActive_glint = nullptr;
static const SparkSprite SPRITE_mouthActive = { 9, 4, 9, SPRITE_mouthActive_ink, 0, SPRITE_mouthActive_glint };

// sprite: mouthSleepy  (5×1)
static const SparkPixel SPRITE_mouthSleepy_ink[] = { {0,0}, {1,0}, {2,0}, {3,0}, {4,0} };
static const SparkPixel* const SPRITE_mouthSleepy_glint = nullptr;
static const SparkSprite SPRITE_mouthSleepy = { 5, 1, 5, SPRITE_mouthSleepy_ink, 0, SPRITE_mouthSleepy_glint };

// sprite: mouthWorried  (5×3)
static const SparkPixel SPRITE_mouthWorried_ink[] = { {0,2}, {1,1}, {2,0}, {3,1}, {4,2} };
static const SparkPixel* const SPRITE_mouthWorried_glint = nullptr;
static const SparkSprite SPRITE_mouthWorried = { 5, 3, 5, SPRITE_mouthWorried_ink, 0, SPRITE_mouthWorried_glint };

// sprite: indicatorSpark  (3×3)
static const SparkPixel SPRITE_indicatorSpark_ink[] = { {1,0}, {0,1}, {1,1}, {2,1}, {1,2} };
static const SparkPixel* const SPRITE_indicatorSpark_glint = nullptr;
static const SparkSprite SPRITE_indicatorSpark = { 3, 3, 5, SPRITE_indicatorSpark_ink, 0, SPRITE_indicatorSpark_glint };

// sprite: indicatorZ  (4×4)
static const SparkPixel SPRITE_indicatorZ_ink[] = { {0,0}, {1,0}, {2,0}, {3,0}, {2,1}, {1,2}, {0,3}, {1,3}, {2,3}, {3,3} };
static const SparkPixel* const SPRITE_indicatorZ_glint = nullptr;
static const SparkSprite SPRITE_indicatorZ = { 4, 4, 10, SPRITE_indicatorZ_ink, 0, SPRITE_indicatorZ_glint };

// sprite: indicatorExclamation  (1×5)
static const SparkPixel SPRITE_indicatorExclamation_ink[] = { {0,0}, {0,1}, {0,2}, {0,4} };
static const SparkPixel* const SPRITE_indicatorExclamation_glint = nullptr;
static const SparkSprite SPRITE_indicatorExclamation = { 1, 5, 4, SPRITE_indicatorExclamation_ink, 0, SPRITE_indicatorExclamation_glint };

// sprite: eventHeart  (5×5)
static const SparkPixel* const SPRITE_eventHeart_ink = nullptr;
static const SparkPixel SPRITE_eventHeart_glint[] = { {1,0}, {3,0}, {0,1}, {1,1}, {2,1}, {3,1}, {4,1}, {0,2}, {1,2}, {2,2}, {3,2}, {4,2}, {1,3}, {2,3}, {3,3}, {2,4} };
static const SparkSprite SPRITE_eventHeart = { 5, 5, 0, SPRITE_eventHeart_ink, 16, SPRITE_eventHeart_glint };

static const SparkSprite* const SPARK_SPRITES[] = {
  &SPRITE_eyeOpen,
  &SPRITE_eyeClosed,
  &SPRITE_mouthCalm,
  &SPRITE_mouthActive,
  &SPRITE_mouthSleepy,
  &SPRITE_mouthWorried,
  &SPRITE_indicatorSpark,
  &SPRITE_indicatorZ,
  &SPRITE_indicatorExclamation,
  &SPRITE_eventHeart,
};
#define SPARK_SPRITE_COUNT 10

static const SparkItem STATE_calm_items[] = { {0,44,48,0}, {0,76,48,0}, {2,56,92,0} };
static const SparkStateDef SPARK_STATE_CALM = { PALETTE_BG, 3, STATE_calm_items };

static const SparkItem STATE_active_items[] = { {0,44,48,0}, {0,76,48,0}, {3,52,88,0}, {6,88,32,1} };
static const SparkStateDef SPARK_STATE_ACTIVE = { PALETTE_BG, 4, STATE_active_items };

static const SparkItem STATE_sleepy_items[] = { {1,44,60,0}, {1,76,60,0}, {4,60,98,0}, {7,88,36,2} };
static const SparkStateDef SPARK_STATE_SLEEPY = { PALETTE_BG, 4, STATE_sleepy_items };

static const SparkItem STATE_worried_items[] = { {0,44,48,0}, {0,76,48,0}, {5,60,92,0}, {8,96,36,3} };
static const SparkStateDef SPARK_STATE_WORRIED = { PALETTE_BG_WORRIED, 4, STATE_worried_items };

enum SparkStateIdx { ST_CALM = 0, ST_ACTIVE, ST_SLEEPY, ST_WORRIED, ST_COUNT };
static const SparkStateDef* const SPARK_STATES[] = {
  &SPARK_STATE_CALM,
  &SPARK_STATE_ACTIVE,
  &SPARK_STATE_SLEEPY,
  &SPARK_STATE_WORRIED,
};

static const SparkItem EVENT_parent_touch_items[] = { {9,60,60,4} };
static const SparkEventDef SPARK_EVENT_PARENT_TOUCH = { 1, 1, EVENT_parent_touch_items };

