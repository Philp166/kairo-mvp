#include "spark_renderer.h"
#include "pin_config.h"
#include "pixel_font.h"
#include <math.h>

static Arduino_GFX* _gfx = nullptr;

void renderer_init(Arduino_GFX* gfx) {
    _gfx = gfx;
}

void renderer_clear() {
}

void renderer_drawFace(uint16_t bgColor, const SparkPose* pose, bool drawExtras, uint8_t extraType, float breathPeriod) {
    float t = millis() / 1000.0f;
    float scale = 1.0f + 0.04f * sinf(t * 2.0f * M_PI / breathPeriod);
    int16_t cell_scaled = (int16_t)(CELL_SIZE * scale);

    _gfx->fillCircle(FACE_CX, FACE_CY, FACE_RADIUS + 2, BG_BLACK);
    _gfx->fillCircle(FACE_CX, FACE_CY, FACE_RADIUS, bgColor);

    if (!pose || !pose->pixels) return;

    for (uint8_t i = 0; i < pose->count; i++) {
        const SparkPixel* p = &pose->pixels[i];
        int16_t px_orig = GRID_OX + p->x * CELL_SIZE;
        int16_t py_orig = GRID_OY + p->y * CELL_SIZE;
        int16_t px = FACE_CX + (int16_t)((px_orig - FACE_CX) * scale);
        int16_t py = FACE_CY + (int16_t)((py_orig - FACE_CY) * scale);
        uint16_t color = SPARK_PALETTE[p->color];
        _gfx->fillRect(px, py, cell_scaled, cell_scaled, color);
    }

    if (drawExtras && extraType > 0) {
        const SparkPixel* ext = nullptr;
        uint8_t extCount = 0;
        switch (extraType) {
            case 1: ext = EXTRA_SPARKLE; extCount = EXTRA_SPARKLE_COUNT; break;
            case 2: ext = EXTRA_Z;       extCount = EXTRA_Z_COUNT;       break;
            case 3: ext = EXTRA_SWEAT;   extCount = EXTRA_SWEAT_COUNT;   break;
        }
        if (ext) {
            for (uint8_t i = 0; i < extCount; i++) {
                int16_t px_orig = GRID_OX + ext[i].x * CELL_SIZE;
                int16_t py_orig = GRID_OY + ext[i].y * CELL_SIZE;
                int16_t px = FACE_CX + (int16_t)((px_orig - FACE_CX) * scale);
                int16_t py = FACE_CY + (int16_t)((py_orig - FACE_CY) * scale);
                uint16_t color = SPARK_PALETTE[ext[i].color];
                _gfx->fillRect(px, py, cell_scaled, cell_scaled, color);
            }
        }
    }
}

static void drawFontChar(int16_t x, int16_t y, const uint8_t bitmap[7], uint16_t color, uint8_t scale) {
    for (uint8_t row = 0; row < 7; row++) {
        for (uint8_t col = 0; col < 5; col++) {
            if (bitmap[row] & (0x10 >> col)) {
                _gfx->fillRect(
                    x + col * scale,
                    y + row * scale,
                    scale, scale, color
                );
            }
        }
    }
}

void renderer_drawPixelText(int16_t x, int16_t y, const char* text, uint16_t color, uint8_t scale) {
    int16_t cx = x;
    uint8_t charW = 5 * scale + scale; // 5 pixels + 1 pixel gap

    while (*text) {
        char c = *text++;
        int8_t idx = fontIndex(c);
        if (idx >= 0) {
            drawFontChar(cx, y, FONT_5X7[idx], color, scale);
        } else {
            int8_t ai = fontAlphaIndex(c);
            if (ai >= 0) {
                drawFontChar(cx, y, FONT_ALPHA[ai], color, scale);
            }
        }
        cx += charW;
    }
}

void renderer_drawPixelTextCentered(int16_t cy, const char* text, uint16_t color, uint8_t scale) {
    uint8_t len = strlen(text);
    uint8_t charW = 5 * scale + scale;
    int16_t totalW = len * charW - scale;
    int16_t x = (LCD_WIDTH - totalW) / 2;
    renderer_drawPixelText(x, cy, text, color, scale);
}

void renderer_drawStatusBar(bool bleConnected, uint8_t battPct, bool charging) {
    uint16_t textColor = 0x9CD3;
    uint16_t greenColor = 0x3E66;
    uint16_t dimColor = 0x4208;

    int16_t by = 15;

    if (bleConnected) {
        _gfx->fillCircle(LCD_WIDTH / 2 - 40, by + 3, 3, greenColor);
        renderer_drawPixelText(LCD_WIDTH / 2 - 32, by, "BLE", textColor, 1);
    } else {
        _gfx->fillCircle(LCD_WIDTH / 2 - 40, by + 3, 3, dimColor);
        renderer_drawPixelText(LCD_WIDTH / 2 - 32, by, "BLE", dimColor, 1);
    }

    int16_t bx = LCD_WIDTH / 2 + 10;

    if (battPct == 255) {
        renderer_drawPixelText(bx, by, "USB", 0xFFE0, 1);
    } else {
        _gfx->drawRect(bx, by, 18, 8, textColor);
        _gfx->fillRect(bx + 18, by + 2, 2, 4, textColor);
        uint8_t fillW = (uint8_t)((battPct / 100.0f) * 14);
        uint16_t fillColor = battPct > 20 ? greenColor : 0xF800;
        if (charging) fillColor = 0xFFE0;
        _gfx->fillRect(bx + 2, by + 2, fillW, 4, fillColor);
    }
}

void renderer_drawScreenDots(uint8_t current, uint8_t total) {
    int16_t dotY = LCD_HEIGHT - 20;
    int16_t totalW = total * 12 - 4;
    int16_t startX = (LCD_WIDTH - totalW) / 2;

    for (uint8_t i = 0; i < total; i++) {
        int16_t dx = startX + i * 12;
        if (i == current) {
            _gfx->fillCircle(dx + 3, dotY, 4, 0xFFBD); // cream
        } else {
            _gfx->fillCircle(dx + 3, dotY, 3, 0x4208); // dim
        }
    }
}

void renderer_drawProgressBar(int16_t x, int16_t y, int16_t w, int16_t h, float pct, uint16_t fg, uint16_t bg) {
    _gfx->fillRoundRect(x, y, w, h, h / 2, bg);
    int16_t fillW = (int16_t)(w * pct);
    if (fillW > 0) {
        _gfx->fillRoundRect(x, y, fillW, h, h / 2, fg);
    }
}

void renderer_drawHeart(int16_t cx, int16_t cy, uint8_t scale, uint16_t color) {
    // Heart on 14x14 grid, centered around (7,5.5)
    for (uint8_t i = 0; i < HEART_PX_COUNT; i++) {
        int16_t px = cx + (HEART_PX[i][0] - 7) * scale;
        int16_t py = cy + (HEART_PX[i][1] - 6) * scale;
        _gfx->fillRect(px, py, scale, scale, color);
    }
}

void renderer_drawShoe(int16_t cx, int16_t cy, uint8_t scale, uint16_t color) {
    for (uint8_t i = 0; i < SHOE_PX_COUNT; i++) {
        int16_t px = cx + (SHOE_PX[i][0] - 7) * scale;
        int16_t py = cy + (SHOE_PX[i][1] - 6) * scale;
        _gfx->fillRect(px, py, scale, scale, color);
    }
}

void renderer_drawRing(int16_t cx, int16_t cy, int16_t r, float startAngle, float endAngle, uint16_t color, uint8_t thickness) {
    for (float a = startAngle; a < endAngle; a += 0.02f) {
        int16_t x = cx + (int16_t)(cosf(a) * r);
        int16_t y = cy + (int16_t)(sinf(a) * r);
        _gfx->fillCircle(x, y, thickness, color);
    }
}
