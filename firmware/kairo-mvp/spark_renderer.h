#pragma once
#include <Arduino_GFX_Library.h>
#include "spark_sprites.h"

void renderer_init(Arduino_GFX* gfx);
void renderer_drawFace(uint16_t bgColor, const SparkPose* pose, bool drawExtras, uint8_t extraType, float breathPeriod = 2.0f);
void renderer_drawPixelText(int16_t x, int16_t y, const char* text, uint16_t color, uint8_t scale);
void renderer_drawPixelTextCentered(int16_t cy, const char* text, uint16_t color, uint8_t scale);
void renderer_drawStatusBar(bool bleConnected, uint8_t battPct, bool charging);
void renderer_drawScreenDots(uint8_t current, uint8_t total);
void renderer_drawProgressBar(int16_t x, int16_t y, int16_t w, int16_t h, float pct, uint16_t fg, uint16_t bg);
void renderer_drawHeart(int16_t cx, int16_t cy, uint8_t scale, uint16_t color);
void renderer_drawShoe(int16_t cx, int16_t cy, uint8_t scale, uint16_t color);
void renderer_drawRing(int16_t cx, int16_t cy, int16_t r, float startAngle, float endAngle, uint16_t color, uint8_t thickness);
void renderer_clear();
