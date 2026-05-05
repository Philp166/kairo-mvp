# Kairo Spec to Dashboard Grounding Report

**Source:** `_spec_extracted.txt` (~96 600 chars, single-line UTF-8)
**Document type:** Hardware/firmware engineering spec — *Kairo Band v1.0 Bill of Materials и инженерный справочник, Pre-Final Draft Investor Review, апрель 2026, 53 страницы.*
**Scope of this report:** Map every spec element that touches the parent dashboard, quote Russian verbatim, mark gaps where dashboard team must invent.

> **Critical framing:** This is a *hardware* spec. It is the source of truth for sensors, haptics, button UX, BLE link, power states, risk register and FDA strategy — but it is **silent on cloud architecture, app screens, JSON payloads, parent-app IA, COPPA mechanics and most product UX**. Dashboard work must ground in spec where spec speaks, and explicitly mark "spec-silent → product decision" everywhere else.

---

### 1. Sleep tracking

**On-device classifier — §5.3 «On-Device классификатор фаз сна»:**
> «Лёгкая ML-модель (нейросеть, оценочный размер 40 КБ) выполняется на application core nRF5340 во время ночного сна для классификации каждой 30-секундной эпохи как Wake / Light (N1/N2) / Deep (N3) / REM.»

**Inputs (verbatim):**
> «Входные признаки: RMSSD (из PPG), вариация амплитуды пульса, mean absolute deviation акселерометра BMI270 на эпоху, спектральные признаки HRV (LF/HF ratio через FFT).»

**Training data:**
> «Модель тренирована на парных данных детской полисомнографии и наручного PPG + акселерометра; целевая точность классификации ≥75% для Deep против non-Deep (соответствует производительности коммерческих взрослых wearables по опубликованной литературе). Модель обновляема через OTA.»

**Sampling cadence (§5.2):**
- PPG HR/HRV во сне: «Непрерывно raw 25 Гц во время сна. HRV рассчитывается за ночь; HR каждые 30 с во сне.»
- PPG SpO2 во сне: «Непрерывно за ночь (выборка каждые 5 мин, burst 20 с). ODI3 рассчитывается из ночной записи.»
- IMU во сне: «12,5 Гц (движение во сне внутри IMU; MCU читает каждые 60 с). Гироскоп выключен во сне для экономии.»

**Gen-2 path:** Apollo4 Blue Plus headroom for «LSTM или transformer-based» classifier.

**SPEC-SILENT (must invent):**
- Sleep score formula / numeric output (spec only mentions "≥75% Deep vs non-Deep classification accuracy").
- Sleep onset latency, awakenings count, time-in-bed vs time-asleep.
- Retention: only «24-часового ring buffer (во внешней SPI flash)» — anything older is not on device. Cloud retention is undefined.
- Parent-facing sleep card design.
- ODI3 thresholds for "abnormal" vs normal.

**Dashboard recommendation:** показать stages (Wake / Light / Deep / REM) как time-series от 30-сек эпох; sleep score — собственная формула dashboard-команды (типа Oura: 100 minus penalties за awakenings/low-deep/short-total). HRV (RMSSD) ночное — ключевая метрика, выводимая моделью.

---

### 2. Haptic patterns (§4.10)

Spec defines exactly **7 patterns** stored in DRV2605L ROM (effects 1–123) + custom firmware sequences:

| ID | Название | Описание | Триггер | Source |
|---|---|---|---|---|
| **HAP-01** | SOS Pulse | «3 коротких × 3 длинных × 3 коротких (Морзе SOS), срочный» | Длинное нажатие SOS (3 с) | **Child-triggered** |
| **HAP-02** | Goal Celebration | «5-импульсная нарастающая интенсивность» | Достижение цели Spark | **Device-triggered** |
| **HAP-03** | Parent Touch | «2-импульсное мягкое двойное касание, тёплое» | «Родитель отправляет прикосновение через приложение» | **Parent-triggered** ← dashboard must expose |
| **HAP-04** | Bedtime Reminder | «3-импульсный медленный, мягкий» | «Напоминание перед сном, заданное родителем» | **Parent-configured / scheduled** ← dashboard must expose schedule UI |
| **HAP-05** | School Mode Alert | «1 мягкий импульс каждые 20 минут» | Напоминание о фокус-интервале | **Parent-configured mode toggle** ← dashboard must expose |
| **HAP-06** | Incoming Message | «2-импульсный средний ритм» | «Получено сообщение от родителя» | **Parent-triggered** ← dashboard must expose |
| **HAP-07** | Low Battery | «4-импульсный быстрый» | «Заряд <15%» | **Device-triggered** |

**Hardware floor:** «LRA, 4 мм × 10 мм coin… резонансная частота 150–200 Гц… пиковое ускорение ≥0,8 G на резонансной частоте.»

**Dashboard mapping (3 surfaces):**
1. **Big "Send Hug" button** → triggers HAP-03 Parent Touch.
2. **Quick Message** (canned phrases) → triggers HAP-06 + payload.
3. **Schedule controls**: Bedtime time picker (HAP-04), School Mode window with start/end (HAP-05).

---

### 3. BLE service / data envelope

**Stack (§5.1, §5.5, §5.6):**
- Zephyr RTOS on nRF5340. «BLE 5» / «AES-128 для всех соединений BLE (стандарт BLE 5)».
- Connection states (§5.6 power states): Active = «BLE Connected, интервал 500 мс»; Rest = «интервал 2000 мс»; Sleep mode (device) = «Только advertising, интервал 5 с».
- Disconnect rule: «Полный disconnect, если телефон родителя вне диапазона >10 мин.»

**Pairing (§5.5):**
- «Secure Simple Pairing (SSP) Passkey Entry; родительское приложение отображает 6-значный passkey, родитель вводит на телефоне для подтверждения сопряжения.»
- «Kairo Band хранит до 4 bonded-устройств (оба родителя, дедушка/бабушка, устройство школьной медсестры).»
- «Браслет принимает BLE-соединения только от bonded устройств.»

**OTA (§5.4):**
- MCUboot bootloader, ECDSA-P256 signed packages.
- «Родительское приложение скачивает подписанный пакет прошивки с CDN Kairo (AWS S3 + CloudFront).»
- «Пакет передаётся на браслет через BLE с использованием SMP (Simple Management Protocol) Zephyr поверх BLE.»
- «Лог обновления передаётся на бэкенд Kairo для fleet-мониторинга.»
- «Recovery mode логируется в бэкенд Kairo при следующем BLE-подключении.»

**Cellular (GPS clip-on only):** «Quectel BG77: LTE Cat M1 и NB2… позволяет геозон-уведомлениям достигать родителя, даже когда ребёнок вне BLE диапазона телефона.»

**On-device storage:** «нет постоянного хранения данных датчиков на браслете, кроме 24-часового ring buffer (во внешней SPI flash).»

**SPEC-SILENT (must invent):**
- **No "KairoSpark" GATT UUID, no characteristic list, no JSON envelope schema.** Spec mentions only SMP for OTA.
- Connectivity model implied: **phone is the gateway** (BLE Band ↔ phone ↔ AWS backend). GPS clip-on can also use LTE-M directly. There is no Wi-Fi, no cellular on Band itself.
- App-to-cloud API, sync cadence, conflict resolution, offline queue.
- Push-notification channels (APNs/FCM) for parent alerts.

**Dashboard recommendation:** Mock a JSON envelope per metric tile. Surface "last sync" timestamp. Treat "10-min disconnect → device sleep" as a real state (show "Out of range" badge).

---

### 4. Alert thresholds / pediatric reference values

**Hard numeric thresholds in spec:**
- **Temperature:** «Оповещение при отклонении 0,2°C от 14-дневного baseline» (§5.2 sampling table; also restated «отклонение ±0,2°C от 14-дневного baseline вызывает оповещение»). **NB:** This is *delta from personal baseline*, not absolute fever threshold.
- **Battery:** HAP-07 fires at «Заряд <15%».
- **PMIC safety:** «over-temperature shutdown при 60°C на PCB» (R-04 mitigation, not user-facing).

**Reference base for HR (Appendix D):**
> «Fleming et al. (Lancet, 2011, DOI: 10.1016/S0140-6736(10)62226-X): Перцентильные графики ЧСС и частоты дыхания для детей 0–18 лет, формирующие доказательную базу для возраст-скорректированных порогов оповещения по HR в прошивке Kairo.»

That is the *only* explicit HR-threshold source. Spec does not enumerate per-age HR/RR cutoffs — it points to Fleming 2011 as the empirical base the firmware must implement.

**SpO2:** «исследование точности SpO2 по ISO 80601-2-61 Annex GG… 200+ субъектов, возраст 4–14, по тонам кожи Fitzpatrick I–VI, при SaO2 70–100%.» No SpO2 alert floor stated.

**SPEC-SILENT (must invent or import from Fleming):**
- Per-age HR min/max bands (e.g., 4y resting 65–110, 14y resting 60–100 — must be looked up in Fleming, not in this spec).
- Absolute fever cutoff (e.g., 38.0°C). Spec uses delta-from-baseline only.
- SpO2 alert floor (industry default ~92% for kids, but spec doesn't say).
- "Elevated" vs "Critical" zone labels and colours.
- Push-trigger logic (debounce, sustained-N-minutes, etc.).

**Wellness vs Medical (§8.3):**
> «Wellness-запуск (Day 1, Месяц 18): Без медицинских заявлений. HR, HRV, SpO2, температура представлены как wellness-метрики. Без диагностических заявлений.»

**Critical UX implication:** alerts at launch must be framed as wellness signals, not medical. SaMD warning: «Если приложение Kairo делает индивидуализированные клинические рекомендации… приложение становится Software as a Medical Device (SaMD).»

---

### 5. Location / GPS clip-on (§4.11)

**Form factor:** «Отдельный SKU ($49 розница, BOM ~$12) — небольшой clip-on модуль, прикрепляющийся к ремешку Kairo Band (не к корпусу) через плотный силиконовый чехол.»

**Connectivity duality:**
> «Связь с модулем Kairo Band через BLE (модуль GPS имеет собственный BLE-радио) или напрямую со смартфоном родителя через LTE-M/NB-IoT.»

**Battery:** «GPS-модуль имеет собственную батарею (200 мАч), обеспечивающую 24 часа GPS-трекинга на одном заряде.»

**GNSS chips:**
- u-blox MAX-M10S — primary, multi-constellation (GPS, Galileo, GLONASS, BeiDou), 99 каналов, чувствительность −167 дБм.
- Quectel L76-M33 — second source.
- Cellular: Quectel BG77 (LTE-M + NB2 + GNSS) или Nordic nRF9160.
- eSIM (GSMA SGP.02 M2M), data ~$1,50–3,00/мес.

**Geofence:**
> «Quectel BG77… позволяет геозон-уведомлениям достигать родителя, даже когда ребёнок вне BLE диапазона телефона (например, в школе, парке).»

This is the *only* mention of geofencing — no zone shapes, radii or count are specified.

**Dashboard surfaces (grounded):**
- Last-known GPS position (used by SOS payload — see §6).
- 24-hour track (clip-on battery limit).
- Geofence creation UI (zones — invent shape/radius/count rules).
- "Clip-on attached / detached / battery%" status tile.
- Cellular vs BLE-relay path indicator (different update latencies).

**SPEC-SILENT:** position update rate to phone, accuracy radius (typical u-blox <2.5 m CEP, but not stated), max number of geofences, breach-event payload.

---

### 6. SOS button / button modes (§2.7)

**Verbatim button matrix:**

> «Функции кнопки:
> • Короткое нажатие: переключение режима дисплея (Spark Avatar → Часы → Шагомер → Сообщение от родителя → возврат к Spark Avatar)
> • Длинное нажатие (3 секунды): активация SOS (тактильное подтверждение, затем BLE пинг SOS в родительское приложение с последней известной GPS-позицией, если подключён GPS-модуль)
> • Двойное касание: переключение тихого режима (подавление вибрации в школьном/сенсорном режиме)»

**Mechanical:** «поверхность 12 мм × 8 мм, минимальный ход 1 мм, усилие срабатывания 150–250 гс… утоплена на 0,8 мм относительно края корпуса для предотвращения случайного срабатывания.»

**SOS payload (implicit):** BLE ping + last-known GPS. Spec does not define call-tree, escalation, or audio (no mic/speaker on Band — see §10 future roadmap).

**Dashboard surfaces:**
- Real-time SOS banner with timestamp + GPS pin + acknowledge action.
- SOS history log.
- Quiet-mode (double-tap) state mirror — show whether haptics are silenced.

**SPEC-SILENT:** SOS escalation flow (what if first parent doesn't ack within X minutes?), audio recording (none), call-out to emergency services (none — just BLE ping to parent app). Multi-parent fan-out logic.

---

### 7. Display modes (§2.6 + §4.9 + §2.7)

**Carousel order (verbatim §2.7):**
> «Spark Avatar → Часы → Шагомер → Сообщение от родителя → возврат к Spark Avatar.»

So **4 display screens**, looped by short-press.

**Spark Avatar (§2.6):**
- «цветной e-paper дисплей 0,96 дюйма, эффективное разрешение слоя Spark 128 × 64 пикселей, рендеринг в 4096 цветах.»
- «Аватар Spark "дышит" (плавная анимация, частота кадров 0,5 Гц, обновление 200 мс за цикл).»
- «Анимация подавляется в режиме сна (дисплей замораживается на последнем состоянии Spark) для экономии заряда.»

**Display tech (§4.9):**
- Aspirational: «0,96-дюймовый цветной e-ink Spark display» — "это остаётся аспирационной целью."
- Practical P0/P1: «монохромный memory LCD Sharp LS010B7DH01 с кастомным аватаром Spark в градациях серого для функциональной валидации.»
- Refresh: «1–2 Гц для полного цвета; 6–8 Гц для монохромного fast mode.»
- Cold weather risk (R-06): refresh замедляется в 3–5× при −10°C → heater trace 0.5W/2s impulse.

**Dashboard implication:** existing **4-state Spark + animations** matches spec. The "watch face / step counter / parent message" screens are the **physical-device** carousel — dashboard should mirror them as a "what your child sees right now" preview tile (huge wow factor).

**SPEC-SILENT:** Spark emotional states semantics, what triggers happy/sad/sleepy. Dashboard's current 4 states are an invention — keep them but document them.

---

### 8. Parent → child capabilities

**Grounded in HAP table:**
- **Parent Touch (HAP-03):** «Родитель отправляет прикосновение через приложение.» → Hug button.
- **Incoming Message (HAP-06):** «Получено сообщение от родителя.» Watch screen 4 = «Сообщение от родителя».
- **Bedtime Reminder (HAP-04):** parent-configured schedule.
- **School Mode Alert (HAP-05):** parent-configured 20-min focus pulses.

**No voice / no calls in Gen 1:**
> «BLE Audio (изохронные каналы) — не используется в Gen 1, но сохраняет опцию для аудиоуведомлений или голосовой связи родитель-ребёнок в будущем.»

**Roadmap audio:** Gen 2+. Dashboard must NOT add call/voice.

**SPEC-SILENT:** message format on watch (text? icon? canned-phrase set?). Display is 128×64 px, ~3-bit color → realistically 1–2 short lines or icon glyph. Dashboard recommendation: emoji + ≤ 20-char canned phrases ("Скучаю", "Молодец", "Скоро домой").

---

### 9. Multi-child / multi-parent / privacy

**Bond list (§5.5):** «до 4 bonded-устройств (оба родителя, дедушка/бабушка, устройство школьной медсестры).» This is *device pairings*, not app accounts.

**Strap swap (§3 family ergonomics):**
> «Ребёнок (или родитель) может извлечь корпусный модуль из изношенного или ставшего тесным ремешка и установить на запасной ремешок, приобретённый отдельно ($12 розница). Это снижает стоимость апгрейда для семей с несколькими детьми.»
And: «Механизм быстрого освобождения для передачи между сиблингами.»

**Wear detection:** capacitive electrode on backside (§4.5) — used for «метрик соблюдения времени ношения, отчитываемых родителям.»

**SPEC-SILENT (large gap):**
- Multi-child account model in app.
- Per-parent permissions / read-only grandparent / school-nurse limited view.
- COPPA mechanics — spec mentions FDA, FCC, CE, RoHS, REACH, but **the string "COPPA" does not appear**. HIPAA also absent. This is a regulatory gap dashboard team should flag.
- Account creation flow.

**Dashboard recommendation:** keep 2-child switcher (Маша/Артём), add role badge (Mom / Dad / Guardian / School). Wear-time compliance ring is grounded.

---

### 10. Onboarding / pairing

**Pairing flow (§5.5):**
1. Parent app shows 6-digit passkey.
2. Parent enters it on phone to confirm.
3. AES-128 BLE link established.
4. Up to 4 bonded devices total.

**Anti-counterfeit (R-09):**
> «NFC challenge-response IC (Maxim DS28C36 или аналог) для аутентификации устройства; родительское приложение аутентифицирует устройство при сопряжении и отклоняет нераспознанное железо.»

**Wellness onboarding banner (§8.3):** at launch, no medical claims.

**SPEC-SILENT:**
- Child profile creation (DOB → age band → which Fleming HR cutoffs apply).
- Skin-tone selection (relevant to PPG calibration per §4.2 / Fitzpatrick I–VI).
- Strap size selection (S 4–9y, M 9–14y per §2.3).
- Parent account creation, COPPA verifiable consent flow.

**Dashboard recommendation:** age-gated defaults: child 4–8 → softer thresholds, larger Spark; child 9–14 → cleaner UI, more numeric data.

---

### 11. Trends / retention / history

**On-device:** «24-часового ring buffer (во внешней SPI flash)». Anything older than 24h is cloud-only.

**Sample cadences (§5.2 condensed):**

| Sensor | Active | Rest | Sleep |
|---|---|---|---|
| PPG HR/HRV | 1 Hz updates (raw 25 Hz burst) | 1 read/min | continuous 25 Hz |
| PPG SpO2 | manual spot | off | every 5 min, 20-s burst |
| Temp | 30 s | 5 min | 10 min |
| IMU | 25 Hz | 12.5 Hz steps-only | 12.5 Hz, MCU reads/60 s |
| Cap-wear | 1 Hz | 1 Hz | 0.1 Hz |

**Cloud:** spec mentions «бэкенд Kairo» and «CDN Kairo (AWS S3 + CloudFront)» but **no retention policy.**

**SPEC-SILENT:** how long cloud keeps history; weekly/monthly aggregation rules; data export formats; account-deletion flow.

**Dashboard recommendation:** day / week / month / 90-day toggles on every metric. Sleep + HRV + temp baseline benefit most from longer windows.

---

### 12. Risk register & regulatory UI items (§10)

**R-01 PPG accuracy:** UI must NOT show clinical-grade certainty for HR. Use confidence band, not single sharp number. Wellness framing.

**R-02 Silicone sensitisation:** UI surface — strap-swap flow, hypoallergenic strap order CTA.

**R-03 Clasp retention:** UI surface — "child resistance" tutorial during onboarding.

**R-04 Battery swelling on submersion:** UI must not advertise swimming/saltwater. IP68 ≠ pool/sea. «Предупреждение в упаковке против солёной воды.»

**R-06 Cold-weather display:** UI may show "warming display" indicator below 5°C.

**R-07 Magnet interference (CRITICAL):**
> «IFU предупреждение на видном месте: "Не использовать рядом с кардиостимуляторами или имплантированными кардиоустройствами"… консультация ISO 14117.»

→ **Mandatory onboarding screen** in parent app: pacemaker/ICD/cochlear-implant/insulin-pump warning with explicit acknowledge.

**R-09 Counterfeit:** NFC auth on pairing; UI "verified device" badge.

**FDA / regulatory flags (§8.3):**
- Wellness disclaimer on every metric tile at launch.
- No diagnostic suggestions ("этот тренд указывает на апноэ" → forbidden until SaMD clearance).
- IFU document linked from app (per R-07).

**Dashboard recommendation:** add a "Safety & Compliance" hub: pacemaker warning ack, IFU link, IP68 limits, wellness disclaimer, hypoallergenic strap order, cold-weather note.

---

### 13. Demo / wow factors

**Spec is investor-targeted** («Pre-Final Draft — Investor Review»). The visceral demo elements:
- **Spark "breathing" avatar (0.5 Hz)** — already implemented; emphasise this is THE brand touchpoint per §2.6.
- **Always-on display** — close-to-zero static draw (e-paper / memory-LCD). UI metaphor: "your child's pulse, always alive on the wrist".
- **7-day battery** — surface it prominently (current battery tile).
- **Send-Hug haptic** (HAP-03) — the single most demoable parent → child gesture. Animate the hug travelling from dashboard → Spark.
- **Multi-constellation GPS clip-on with geofence** — show last-known dot + breach alert.
- **Sleep architecture (REM / Deep / Light / Wake)** — pediatric-trained model = differentiator vs adult wearables.
- **Multi-child / sibling strap swap** — family economics narrative.
- **De Novo FDA pathway** badge ("clinical-grade trajectory") — investor catnip but legally must NOT yet imply medical claim.
- **No competitors trained on pediatric polysomnography** — quote: «Модель тренирована на парных данных детской полисомнографии.»

**Dashboard demo script idea:** three children switcher → live Spark mirror → press "Hug" → screen flashes haptic icon → log entry "HAP-03 Parent Touch sent 13:42".

---

### 14. SPEC GAPS — dashboard team must invent

The hardware spec leaves **most of the parent-facing software undefined**. Concrete gaps + recommendations:

1. **GATT service / characteristic UUIDs.** Spec only names "BLE 5 + AES-128 + SMP for OTA". No service called "KairoSpark" exists in spec. → Dashboard mocks a JSON envelope per metric; firmware team designs real GATT later.
2. **JSON payload schemas** for HR / SpO2 / temp / steps / sleep epoch / SOS / location. → Define these in `dashboard/src/types/` from clean assumptions; document as "pending firmware confirmation".
3. **Cloud retention windows.** → Recommend: 90 days hot, 13 months cold, full export on request (GDPR Art 20).
4. **Per-age HR/RR thresholds.** → Hard-code Fleming 2011 percentile bands (P3 / P50 / P97) in age buckets 4–6, 7–9, 10–12, 13–14.
5. **Fever absolute cutoff.** → Recommend: alert when (delta>+0.5°C from 14-day baseline) AND (absolute >37.8°C). Spec only requires delta-from-baseline alert.
6. **SpO2 floor.** → Recommend: 92% sustained 5+ min during sleep = elevated; 88% = critical (Owlet predicate).
7. **Sleep score formula.** → Build a 0–100 score from total sleep time, deep%, REM%, awakenings, latency.
8. **Geofence semantics.** → Up to 5 zones, circular, 50 m–2 km radius, enter/exit events.
9. **Push-notification triggers list.** → SOS, fever delta, low battery, wear-off >2h during day, geofence breach, low SpO2 sustained, device disconnect >30 min during day.
10. **Account model.** → Family = 1+ adults (roles: primary, co-parent, viewer) × 1+ children. Bond list mirrors this on device.
11. **COPPA verifiable parental consent flow.** Spec ignores it entirely. → Required for US ≤ 13.
12. **Canned messages library.** → 12 short Russian phrases + emoji set, parent-edited.
13. **Schedule UI** for HAP-04 bedtime + HAP-05 school-mode windows.
14. **Wear-time compliance ring.** Spec confirms cap-wear feeds this metric; UI surface is invented.
15. **Onboarding flow** (passkey, age, skin tone, strap size, IFU/pacemaker ack).
16. **SOS escalation tree** (multi-parent fan-out, ack timeout).
17. **Quiet-mode / school-mode mirrored state** in app, since the Band toggles via double-tap.
18. **Recovery-mode banner** — spec says recovery image «отображает экран обслуживания на дисплее Spark» and logs to backend; app should also flag it.
19. **Counterfeit-detection state surface** (NFC auth result, "verified device" badge).
20. **Spark emotional state semantics** — dashboard already has 4 states; document mapping (e.g., happy = HR-in-range + worn + battery>20%).

---

### 15. Out of scope (explicit "do not build")

Items the spec explicitly excludes from Gen 1 — **do not let dashboard naively add them:**

- **Voice / calls / two-way audio.** «BLE Audio (изохронные каналы) — не используется в Gen 1, но сохраняет опцию… в будущем.» → No call button, no voice memo.
- **ECG / single-lead EKG.** «В Kairo Band (Gen 1) нет ECG-электрода.» Gen 2 only. → No "ECG strip" tile.
- **Blood pressure.** Not in sensor stack at all.
- **Direction finding (AoA/AoD).** «Не используется в Gen 1.» → No "find my child indoor compass."
- **GPS on Band itself.** GPS exists only as **opt-in clip-on** ($49 SKU). → Dashboard must gracefully render the "no GPS attached" state — not assume location.
- **Blood glucose, blood alcohol, hydration, stress score.** None mentioned.
- **Fall detection (production feature).** Spec: «BMI270 даёт хук в прошивке для будущей функции экстренного уведомления о падении для детей старшего возраста.» Hook only, not a Gen-1 feature.
- **Medical-grade claims at launch.** «Без медицинских заявлений… без диагностических заявлений.» → No "your child may have apnea" surfaces. Wellness language only.
- **Saltwater / pool swimming endorsement.** IP68 = 1.5 m × 30 min freshwater per IEC 60529. R-04 explicitly warns against saltwater.
- **Infant / under-4 use.** Spec age band is 4–14; «Kairo Infant Ankle Band (0–4 года)» is Year-4 roadmap, separate FDA submission.
- **On-device long-term history.** 24h ring buffer only. → Don't build "show last week from device only" — sync via phone is mandatory.
- **Wi-Fi.** Band has no Wi-Fi radio. Connectivity = BLE only (or LTE-M via clip-on).
- **Camera.** None on Band. Roadmap mentions Sleep Sensor explicitly «без камеры».
- **Always-listening mic.** None.
- **Direct child-to-child messaging.** Not in spec, not in roadmap; would change regulatory class.

---

## Quick file-grounding cheat-sheet for dashboard PRs

| Dashboard element | Spec section | Verbatim anchor |
|---|---|---|
| Spark "breathing" 0.5 Hz | §2.6 | «частота кадров 0,5 Гц, обновление 200 мс» |
| 4 watch screens | §2.7 | «Spark Avatar → Часы → Шагомер → Сообщение от родителя» |
| Send-Hug button | §4.10 HAP-03 | «Parent Touch… Родитель отправляет прикосновение» |
| Bedtime schedule UI | §4.10 HAP-04 | «Напоминание перед сном, заданное родителем» |
| School Mode toggle | §4.10 HAP-05 + §2.7 | «1 мягкий импульс каждые 20 минут» / «двойное касание» |
| SOS banner + GPS pin | §2.7 | «BLE пинг SOS… с последней известной GPS-позицией» |
| Battery ≤15% alert | §4.10 HAP-07 | «Заряд <15%» |
| Temperature delta alert | §5.2 | «отклонение 0,2°C от 14-дневного baseline» |
| Sleep stages chart | §5.3 | «Wake / Light (N1/N2) / Deep (N3) / REM» |
| Pacemaker warning screen | §10 R-07 | «IFU предупреждение на видном месте» |
| Wellness disclaimer | §8.3 | «Без медицинских заявлений… wellness-метрики» |
| Cap-wear compliance ring | §4.5 | «метрик соблюдения времени ношения, отчитываемых родителям» |
| 2-child switcher | §3 family | «Механизм быстрого освобождения для передачи между сиблингами» |
| GPS clip-on tile | §4.11 | «Отдельный SKU ($49)… 24 часа GPS-трекинга» |
| Geofence creation | §4.11 | «геозон-уведомлений достигать родителя… в школе, парке» |
| Multi-parent (4 bonds) | §5.5 | «до 4 bonded-устройств» |
| OTA update banner | §5.4 | «restricted mode, если обновление отклонено >72 часов» |

---

**End of report.** Spec coverage: hardware/firmware/regulatory = strong, parent-app product UX = mostly silent (intentional — that's the dashboard team's design space). Recommend treating this report as the contract: anything quoted is grounded in spec; everything in §14 must be invented and documented as such in dashboard code.
