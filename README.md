# Kairo MVP

Детский смарт-браслет 4–14 лет. Pre-investor demo.

**Структура:**
```
dashboard/                 родительская панель (React+Vite, единая правда)
firmware/
  shared/                  spark_sprites.h + spark_renderer.h + gen_sprites.py
  track1-xiao/             валидированный production-стек (XIAO + GC9A01 + sensors)
  track2-amoled/            wow-демо на руке (Waveshare AMOLED 2.06")
_spec_extracted.txt        исходная hardware-спека (53 страницы)
_spec_dashboard_report.md  карта "спека ↔ дашборд", где что груз и где gaps
```

## Быстрый старт

```bash
cd dashboard
npm install
npm run dev          # → http://localhost:5173
```

Дальше: переключай состояния в шапке (Спокойна / Активна / Засыпает / Тревога), кликай **Обнять**, **Сообщение**, **mock→live**.

## Демо-сценарий для Алексея (3 минуты)

**0:00 — Hero.** Открой dashboard. Маша 7 лет, Spark спокойный, "1 минуту назад", ключевые метрики.
> «Это первый экран что мама видит когда поднимает телефон»

**0:30 — Обнять.** Жми "Обнять". Сердце на Spark, в ленте событий появляется запись.
> «HAP-03 Parent Touch — мама шлёт прикосновение через приложение, браслет вибрирует у ребёнка»

**0:50 — Сообщение.** Открой диалог, выбери "молодец". Сообщение пробрасывается на циферблат под Spark.
> «HAP-06 Incoming Message + payload»

**1:10 — Тревога.** Кликни "Тревога" в шапке. Появляется красный SOS-баннер с кнопками **Позвонить / Видео / Принять**. Цвет Spark чувствует тревогу. Жми "Принять" — баннер становится серым.
> «HAP-01 SOS Pulse — ребёнок держит кнопку 3 секунды. Тут показано состояние с двумя путями: позвонить или подтвердить тревогу»

**1:40 — Карта.** Скроль до "Где сейчас". Видна схема Дом↔Школа с пульсирующей точкой ребёнка.
> «Геозоны 80м/120м, точка показывает реальное местоположение»

**2:00 — Расписание.** Скроль до "Расписание браслета". Покажи два свитча. Двигай time-picker.
> «HAP-04 перед сном, HAP-05 школьный режим. Расписание выполняется на самом браслете — телефон не нужен»

**2:30 — Прошлая ночь.** Покажи Sleep card.
> «On-device классификатор фаз — 30-сек эпохи, ≥75% точность Deep vs non-Deep, как у взрослых wearables»

**2:50 — Безопасность.** Скроль в самый низ.
> «Чек-лист, на котором стоит наш FDA-путь и compliance»

## Дашборд → железо

Spark v1 живёт в **одном** JSON: `dashboard/src/components/Spark/sprites.json`. Дашборд читает напрямую (TS-импорт). Прошивка — через генератор:

```bash
cd firmware/shared
python scripts/gen_sprites.py     # → firmware/shared/spark_sprites.h
```

Один источник, два рендерера: TSX и C++.

## Где живёт что

| Что | Где |
|---|---|
| Spark sprites (правда) | [dashboard/src/components/Spark/sprites.json](dashboard/src/components/Spark/sprites.json) |
| Дашборд app | [dashboard/src/App.tsx](dashboard/src/App.tsx) |
| Mock-данные двоих детей | [dashboard/src/mock.ts](dashboard/src/mock.ts) |
| BLE-клиент (Web Bluetooth) | [dashboard/src/lib/bleClient.ts](dashboard/src/lib/bleClient.ts) |
| Spark renderer для прошивки | [firmware/shared/spark_renderer.h](firmware/shared/spark_renderer.h) |
| Track 1 (XIAO + sensors) | [firmware/track1-xiao/](firmware/track1-xiao/) |
| Track 2 (AMOLED 2.06") | [firmware/track2-amoled/](firmware/track2-amoled/) |
| Карта "спека ↔ дашборд" | [_spec_dashboard_report.md](_spec_dashboard_report.md) |

## Статус доставок

- **Track 1 (XIAO + GC9A01 + sensors):** ETA 21 мая 2026
- **Track 2 (Waveshare AMOLED 2.06"):** ETA 20 мая 2026
- Прошивка к обоим — готова к сборке после первой генерации `spark_sprites.h`.

## Известные ограничения

- Прошивка не скомпилирована end-to-end (PlatformIO не установлен в рабочей среде).
- BLE-pairing — open advertising без SSP Passkey (per spec §5.5 нужен подвижный demo).
- HR/SpO2 — placeholder при finger-detect, реальный алгоритм поверх MAX30105 lib позже.
- Mock-LocationMap не двигает точку реально — она зависит от child.location.place mock-значения.
