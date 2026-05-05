#!/usr/bin/env python3
"""
Generate include/spark_sprites.h from dashboard/src/components/Spark/sprites.json.

This is the bridge between the dashboard's single source of truth and the
firmware. Run it whenever the JSON changes:

    python scripts/gen_sprites.py

The generated header defines:
  - SPARK_CELL                cell size in source units (1 unit = 1px on 140×140 SVG)
  - SPARK_VIEW_W / SPARK_VIEW_H
  - SPARK_SCREEN_CX / _CY / _R
  - PALETTE_BG / _BG_WORRIED / _INK / _GLINT / _BEZEL / _BEZEL_EDGE  (RGB565)
  - SparkSprite, SparkPixel, SparkItem, SparkStateDef, SparkEventDef
  - SPARK_STATE_CALM / _ACTIVE / _SLEEPY / _WORRIED  (SparkStateDef)
  - SPARK_EVENT_PARENT_TOUCH                        (SparkEventDef)
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]  # KAIRO PROJ
JSON_PATH = ROOT / "dashboard" / "src" / "components" / "Spark" / "sprites.json"
OUT = Path(__file__).resolve().parents[1] / "spark_sprites.h"


def hex_to_rgb565(hex_color: str) -> int:
    h = hex_color.lstrip("#")
    r = int(h[0:2], 16)
    g = int(h[2:4], 16)
    b = int(h[4:6], 16)
    return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)


def main() -> int:
    if not JSON_PATH.exists():
        print(f"sprites.json not found at {JSON_PATH}", file=sys.stderr)
        return 1
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))

    cell = data["cell"]
    vw, vh = data["viewBox"]
    screen = data["screen"]
    palette = data["palette"]
    sprites = data["sprites"]
    states = data["states"]
    events = data.get("events", {})

    sprite_names = list(sprites.keys())
    sprite_index = {name: i for i, name in enumerate(sprite_names)}

    lines = []
    lines.append("// Auto-generated from dashboard/src/components/Spark/sprites.json")
    lines.append("// DO NOT EDIT BY HAND — run scripts/gen_sprites.py instead.")
    lines.append("#pragma once")
    lines.append("#include <stdint.h>")
    lines.append("")
    lines.append(f"#define SPARK_CELL      {cell}")
    lines.append(f"#define SPARK_VIEW_W    {vw}")
    lines.append(f"#define SPARK_VIEW_H    {vh}")
    lines.append(f"#define SPARK_SCREEN_CX {screen['cx']}")
    lines.append(f"#define SPARK_SCREEN_CY {screen['cy']}")
    lines.append(f"#define SPARK_SCREEN_R  {screen['r']}")
    lines.append("")

    for key, hex_color in palette.items():
        const = "PALETTE_" + (
            "BG" if key == "bg"
            else "BG_WORRIED" if key == "bgWorried"
            else "INK" if key == "ink"
            else "GLINT" if key == "glint"
            else "BEZEL" if key == "bezel"
            else "BEZEL_EDGE" if key == "bezelEdge"
            else key.upper()
        )
        lines.append(f"#define {const} 0x{hex_to_rgb565(hex_color):04X}  // {hex_color}")
    lines.append("")

    lines.append("struct SparkPixel { uint8_t c; uint8_t r; };")
    lines.append("struct SparkSprite {")
    lines.append("  uint8_t w, h;")
    lines.append("  uint16_t inkLen;")
    lines.append("  const SparkPixel* ink;")
    lines.append("  uint16_t glintLen;")
    lines.append("  const SparkPixel* glint;")
    lines.append("};")
    lines.append("struct SparkItem { uint8_t spriteIdx; int16_t x; int16_t y; uint8_t anim; };")
    lines.append("struct SparkStateDef { uint16_t bg; uint8_t itemCount; const SparkItem* items; };")
    lines.append("struct SparkEventDef { uint8_t hideMouth; uint8_t itemCount; const SparkItem* items; };")
    lines.append("")

    # Animation enum (simple ints)
    anim_map = {None: 0, "pulse": 1, "z-float": 2, "excl-blink": 3, "heart-pop": 4}
    for k, v in anim_map.items():
        if k is None:
            lines.append(f"#define ANIM_NONE       {v}")
        else:
            lines.append(f"#define ANIM_{k.replace('-', '_').upper():15} {v}")
    lines.append("")

    # Emit each sprite's pixel arrays + struct
    for name, sp in sprites.items():
        w, h = sp["size"]
        ink = sp["ink"]
        glint = sp["glint"]
        lines.append(f"// sprite: {name}  ({w}×{h})")
        if ink:
            ink_str = ", ".join(f"{{{c},{r}}}" for c, r in ink)
            lines.append(f"static const SparkPixel SPRITE_{name}_ink[] = {{ {ink_str} }};")
        else:
            lines.append(f"static const SparkPixel* const SPRITE_{name}_ink = nullptr;")
        if glint:
            gl_str = ", ".join(f"{{{c},{r}}}" for c, r in glint)
            lines.append(f"static const SparkPixel SPRITE_{name}_glint[] = {{ {gl_str} }};")
        else:
            lines.append(f"static const SparkPixel* const SPRITE_{name}_glint = nullptr;")
        lines.append(
            f"static const SparkSprite SPRITE_{name} = {{ {w}, {h}, "
            f"{len(ink)}, SPRITE_{name}_ink, "
            f"{len(glint)}, SPRITE_{name}_glint }};"
        )
        lines.append("")

    # Sprite registry indexed by sprite_index
    lines.append("static const SparkSprite* const SPARK_SPRITES[] = {")
    for name in sprite_names:
        lines.append(f"  &SPRITE_{name},")
    lines.append("};")
    lines.append(f"#define SPARK_SPRITE_COUNT {len(sprite_names)}")
    lines.append("")

    # Helper to emit items
    def emit_items(arr_name: str, items: list[dict]) -> None:
        flat = []
        for it in items:
            sp_idx = sprite_index[it["sprite"]]
            x, y = it["at"]
            anim = anim_map.get(it.get("anim"), 0)
            flat.append(f"{{{sp_idx},{x},{y},{anim}}}")
        if flat:
            lines.append(f"static const SparkItem {arr_name}[] = {{ {', '.join(flat)} }};")
        else:
            lines.append(f"static const SparkItem* const {arr_name} = nullptr;")

    bg_to_palette = {
        "bg": "PALETTE_BG",
        "bgWorried": "PALETTE_BG_WORRIED",
    }

    for state_name, sd in states.items():
        emit_items(f"STATE_{state_name}_items", sd["items"])
        bg_macro = bg_to_palette.get(sd["bg"], f"PALETTE_{sd['bg'].upper()}")
        lines.append(
            f"static const SparkStateDef SPARK_STATE_{state_name.upper()} = "
            f"{{ {bg_macro}, {len(sd['items'])}, STATE_{state_name}_items }};"
        )
        lines.append("")

    # All-states registry, indexed by SparkStateIdx
    lines.append("enum SparkStateIdx { ST_CALM = 0, ST_ACTIVE, ST_SLEEPY, ST_WORRIED, ST_COUNT };")
    lines.append("static const SparkStateDef* const SPARK_STATES[] = {")
    for state_name in ["calm", "active", "sleepy", "worried"]:
        lines.append(f"  &SPARK_STATE_{state_name.upper()},")
    lines.append("};")
    lines.append("")

    for ev_name, ed in events.items():
        emit_items(f"EVENT_{ev_name}_items", ed.get("items", []))
        hide = 1 if ed.get("hideMouth") else 0
        lines.append(
            f"static const SparkEventDef SPARK_EVENT_{ev_name.upper()} = "
            f"{{ {hide}, {len(ed.get('items', []))}, EVENT_{ev_name}_items }};"
        )
        lines.append("")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}  ({len(lines)} lines)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
