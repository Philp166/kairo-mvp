# Kairo Track 1 — XIAO breadboard production stack

Валидированный sensor-stack на XIAO ESP32-S3. Это — путь в production-железо после демо.

**Железо (~6000₽):**
- Seeed Studio XIAO ESP32-S3 (плата-донор)
- GC9A01 1.28" round IPS 240×240 (SPI display)
- MAX30102 (PPG: HR + SpO2, I2C 0x57)
- MLX90614 (IR-термометр, I2C 0x5A)
- MPU6050 (6-axis IMU, I2C 0x68)

**Что прошивка делает:**
- Spark v1 на 240×240 (тот же JSON что и Track 2)
- Сенсорный pipeline в loop @ 4 Hz (грубый MVP, без фильтров)
- Snapshot JSON по BLE GATT каждую секунду (`Kairo-Band` advertising)
- BOOT button: короткое = переключение state, длинное = parent_touch

## Pin map (XIAO ESP32-S3)

| Сигнал | GPIO | Назначение |
|---|---|---|
| TFT_MOSI | 9 | GC9A01 DIN |
| TFT_SCLK | 8 | GC9A01 CLK |
| TFT_CS | 44 | GC9A01 CS |
| TFT_DC | 43 | GC9A01 DC |
| TFT_RST | 21 | GC9A01 RST |
| I2C SDA | 5 | MAX30102 + MLX90614 + MPU6050 |
| I2C SCL | 6 | (общий I2C) |
| BAT_ADC | 2 | напряжение через делитель 1:2 |
| BUTTON | 0 | BOOT |

## BLE protocol

- **Service:** `5d7d0001-9b6e-4d51-92a1-7e73a1ce0001`
- **Snapshot characteristic** (read + notify): `5d7d0002-...`

Payload (JSON, ~120 bytes):
```json
{ "ts": 12345, "hr": 84, "spo2": 98, "tempC": 36.6, "steps": 4823, "battery": 78, "state": "calm" }
```

UUIDs — placeholders. Перед fleet deploy выбить свой namespace из IEEE OUI.

## Сборка

```bash
cd firmware/track1-xiao
python ../shared/scripts/gen_sprites.py     # обновить sprites.h
pio run -t upload
pio device monitor
```

## Что не сделано (TODO)

- [ ] Реальный HR / SpO2 алгоритм (сейчас placeholder при finger-detect)
- [ ] Step counter с band-pass фильтром (сейчас простая |Δmag| > 1.5)
- [ ] Sleep classifier (нужен LSTM в эпохах)
- [ ] OTA через MCUboot + ECDSA (per spec §5.4)
- [ ] Pairing SSP Passkey (per spec §5.5) — сейчас open advertising
