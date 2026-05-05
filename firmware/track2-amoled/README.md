# Kairo Track 2 — Waveshare ESP32-S3-Touch-AMOLED-2.06

Готовые часы Waveshare как donor-hardware для wow-демо. Прошивка выкидывает их firmware и заливает наш Spark v1 рендерер.

**Железо:**
- Waveshare ESP32-S3-Touch-AMOLED-2.06 (410×502 round AMOLED, CO5300 QSPI)
- ESP32-S3 N16R8 (16 MB flash, 8 MB PSRAM)
- BOOT button = GPIO0

**Что прошивка делает:**
- Грузит Spark sprites из C++ header (генерится из dashboard JSON)
- Рендерит 4 состояния: calm / active / sleepy / worried
- Короткое нажатие BOOT → следующее состояние
- Длинное нажатие (≥1.5с) → parent_touch heart event на 1.5с

## Генерация sprites.h

Spark — единая правда живёт в `dashboard/src/components/Spark/sprites.json`. Прошивка читает копию через C++ header, который **генерится** скриптом:

```bash
cd firmware/track2-amoled
python scripts/gen_sprites.py
```

Запускать каждый раз когда меняется JSON. CI должен прогонять автоматически (TODO).

## Сборка и заливка

```bash
# 1. Установи PlatformIO Core (один раз)
pip install platformio

# 2. Сгенерируй sprites.h
python scripts/gen_sprites.py

# 3. Подключи Waveshare-часы по USB-C, нажми BOOT при подключении
pio run -t upload
pio device monitor
```

Ожидаемый Serial-вывод:
```
[kairo] track2 boot ok
[kairo] sprites: 11, states: 4
```

## Что осталось

- [ ] Реальный compile-test (нужен `pio run`)
- [ ] Touch input — сейчас только BOOT button
- [ ] Анимации (pulse / z-float / excl-blink / heart-pop) — пока статика
- [ ] Battery monitor через ADC
- [ ] BLE GATT для синка с дашбордом (Этап 5)
