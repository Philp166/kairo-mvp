// Pixel-grid renderer for Spark sprites. Display-driver-agnostic — caller
// supplies a fillRect(x, y, w, h, color565) callback so the same code paths
// run on Arduino_GFX (Track 2 AMOLED), TFT_eSPI (Track 1 GC9A01), or a unit
// test rig.
#pragma once
#include "spark_sprites.h"

typedef void (*FillRectFn)(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color);

struct SparkRenderTarget {
  int16_t cx;        // display center X (px)
  int16_t cy;        // display center Y (px)
  uint8_t scale;     // 1 spark pixel = scale × scale display pixels
  FillRectFn fillRect;
};

inline void sparkDrawSprite(const SparkRenderTarget& t,
                            const SparkSprite& sp,
                            int16_t srcX, int16_t srcY,
                            uint16_t inkColor, uint16_t glintColor) {
  // Map sprite-source coords (140×140 viewBox, origin top-left) to display
  // coords centered at (cx, cy). 1 cell = SPARK_CELL source-units = scale px.
  const int16_t cell = SPARK_CELL * t.scale;
  const int16_t baseX = t.cx + (srcX - SPARK_VIEW_W / 2) * t.scale;
  const int16_t baseY = t.cy + (srcY - SPARK_VIEW_H / 2) * t.scale;

  for (uint16_t i = 0; i < sp.inkLen; i++) {
    const SparkPixel& p = sp.ink[i];
    t.fillRect(baseX + p.c * cell, baseY + p.r * cell, cell, cell, inkColor);
  }
  for (uint16_t i = 0; i < sp.glintLen; i++) {
    const SparkPixel& p = sp.glint[i];
    t.fillRect(baseX + p.c * cell, baseY + p.r * cell, cell, cell, glintColor);
  }
}

inline void sparkDrawScreenFill(const SparkRenderTarget& t, uint16_t bg) {
  // Draw the screen circle background as a filled square — the watch face is
  // round, so the bezel mask outside this rect is invisible. AMOLED is OLED
  // anyway, so black pixels emit no light.
  const int16_t r = SPARK_SCREEN_R * t.scale;
  t.fillRect(t.cx - r, t.cy - r, 2 * r, 2 * r, bg);
}

inline void sparkRenderState(const SparkRenderTarget& t,
                             SparkStateIdx idx,
                             const SparkEventDef* event /* nullable */) {
  const SparkStateDef& s = *SPARK_STATES[idx];
  sparkDrawScreenFill(t, s.bg);

  const bool hideMouth = event && event->hideMouth;

  for (uint8_t i = 0; i < s.itemCount; i++) {
    const SparkItem& it = s.items[i];
    const SparkSprite& sp = *SPARK_SPRITES[it.spriteIdx];
    if (hideMouth) {
      // Sprite #2-5 in registry are mouths (mouthCalm/Active/Sleepy/Worried).
      // Cheap check: skip sprites whose width ∈ {5,7,9} AND height ≤ 4 except
      // eyeClosed (which is only drawn at sleepy state where event won't fire).
      const bool isMouth = (it.spriteIdx >= 2 && it.spriteIdx <= 5);
      if (isMouth) continue;
    }
    sparkDrawSprite(t, sp, it.x, it.y, PALETTE_INK, PALETTE_GLINT);
  }

  if (event) {
    for (uint8_t i = 0; i < event->itemCount; i++) {
      const SparkItem& it = event->items[i];
      const SparkSprite& sp = *SPARK_SPRITES[it.spriteIdx];
      sparkDrawSprite(t, sp, it.x, it.y, PALETTE_GLINT, PALETTE_GLINT);
    }
  }
}
