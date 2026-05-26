/**
 * Kairo Dashboard — i18n
 * Compact dictionary: each key maps to [en, ru].
 * Usage: const { t } = React.useContext(window.LangCtx); t('v.calm.l')
 */

window.T_DICT = {
  // ─── Header / chrome ─────────────────────────────────────
  "brand.sub":         ["phase 04/04 · parent surface",        "фаза 04/04 · родительский экран"],
  "child.age":         ["6 yrs · node_07",                     "6 лет · NODE_07"],
  "header.back":       ["← character",                         "← персонаж"],
  "header.theme.light":["Light",                               "Светлая"],
  "header.theme.dark": ["Dark",                                "Тёмная"],
  "ble.live":          ["● LIVE BLE",                          "● LIVE BLE"],
  "ble.mock":          ["MOCK",                                "МОК"],

  // ─── Hero ────────────────────────────────────────────────
  "hero.child":        ["CHILD/",                              "РЕБЁНОК/"],
  "hero.name":         ["MISHA · 6 yrs",                       "МИША · 6 ЛЕТ"],
  "hero.node":         ["NODE_07",                             "NODE_07"],
  "hero.live":         ["LIVE · 12s ago",                      "ОНЛАЙН · 12с НАЗАД"],
  "hero.scrub":        ["SCRUB @",                             "ПЕРЕМОТКА @"],
  "hero.scrub.hint":   ["drag the timeline below to scrub the day", "тащи таймлайн ниже — перемотка дня"],
  "hero.send":         ["SEND TO MISHA'S BAND · ONE-TAP",      "ОТПРАВИТЬ НА БРАСЛЕТ МИШИ · ОДНИМ КАСАНИЕМ"],
  "hero.send.foot":    ["no chat · no free text · band buzzes once · HAP-codes match firmware spec",
                        "без чата · без свободного текста · браслет вибрирует один раз · HAP-коды по спеке прошивки"],

  // verdicts
  "v.calm.l":          ["Calm.",                               "Спокойна."],
  "v.calm.s":          ["All signals nominal.",                "Все сигналы в норме."],
  "v.active.l":        ["Active.",                             "Активна."],
  "v.active.s":        ["Moving, energetic — at PE class right now.",
                        "В движении, бодрая — сейчас физкультура."],
  "v.sleepy.l":        ["Resting.",                            "Отдыхает."],
  "v.sleepy.s":        ["Wound down. Pulse stable. Worn.",     "Расслабилась. Пульс ровный. Носит браслет."],
  "v.worried.l":       ["Check on her.",                       "Проверь её."],
  "v.worried.s":       ["Pulse above normal band. 14-day temp delta +0.2°C.",
                        "Пульс выше нормы. Δ температуры за 14 дней +0.2°C."],

  // cartridges
  "cart.hug":          ["Hug",                                 "Обнять"],
  "cart.hug.sub":      ["2 soft taps",                         "2 мягких касания"],
  "cart.cheer":        ["Cheer",                               "Поддержать"],
  "cart.cheer.sub":    ["rising pulse",                        "нарастающий импульс"],
  "cart.bed":          ["Bedtime",                             "Спать"],
  "cart.bed.sub":      ["3 slow pulses",                       "3 медленных импульса"],
  "cart.ready":        ["READY",                               "ГОТОВ"],
  "cart.fire":         ["SENT · BUZZ",                         "ОТПРАВЛЕНО · ВИБРО"],

  // toasts
  "toast.hug.title":   ["Hug sent to Misha",                   "Обнятие отправлено Мише"],
  "toast.hug.sub":     ["2 soft taps · band buzzed",           "2 мягких касания · браслет завибрировал"],
  "toast.cheer.title": ["Cheer sent to Misha",                 "Поддержка отправлена Мише"],
  "toast.cheer.sub":   ["rising pulse · band buzzed",          "нарастающий импульс · браслет завибрировал"],
  "toast.bed.title":   ["Bedtime reminder sent",               "Напоминание о сне отправлено"],
  "toast.bed.sub":     ["3 slow pulses · band buzzed",         "3 медленных импульса · браслет завибрировал"],

  // ─── Section heads ──────────────────────────────────────
  "sec.vitals.title":  ["Live signals",                        "Живые сигналы"],
  "sec.vitals.sub":    ["hover any chip to expand · ranges from spec 4.3",
                        "наведи на чип чтобы развернуть · границы из спеки 4.3"],
  "sec.scrub.title":   ["Replay the day",                      "Перемотать день"],
  "sec.scrub.sub":     ["drag the handle · Spark above plays back the mood at that moment",
                        "тащи ручку · Spark наверху проигрывает настроение этого момента"],
  "sec.trends.title":  ["24h wellness",                        "Самочувствие · 24 часа"],
  "sec.trends.sub":    ["pediatric threshold lines · sleep windows shaded",
                        "детский порог пунктиром · сон затенён"],
  "sec.rhythm.title":  ["Day rhythm · where she is",           "Ритм дня · где она"],
  "sec.rhythm.sub":    ["geofence is zone-level — not precise GPS · wellness, not surveillance",
                        "геозоны зональные — не точный GPS · забота, не слежка"],
  "sec.tape.title":    ["Activity",                            "События"],
  "sec.tape.sub":      ["every event has its HAP waveform · child-side or parent-side, all logged",
                        "у каждого события свой HAP-сигнал · от ребёнка или от родителя, всё в логе"],

  // carousel labels
  "carousel.vitals":   ["LIVE SIGNALS",                        "ЖИВЫЕ СИГНАЛЫ"],
  "carousel.rhythm":   ["RHYTHM SLIDES",                       "СЛАЙДЫ РИТМА"],

  // ─── Vital chip strings (label + delta) ─────────────────
  "v.hr.label":        ["Pulse · heart rate",                  "Пульс · ЧСС"],
  "v.hr.delta":        ["baseline 78 · Δ",                     "БАЗА 78 · Δ"],
  "v.spo2.label":      ["Oxygen saturation",                   "Сатурация кислорода"],
  "v.spo2.delta":      ["within norm 95–100",                  "в пределах нормы 95–100"],
  "v.temp.label":      ["Skin temperature",                    "Температура кожи"],
  "v.temp.delta":      ["14-day baseline 36.3°C",              "БАЗА 14 ДНЕЙ 36.3°C"],
  "v.step.label":      ["Steps today",                         "Шаги сегодня"],
  "v.step.delta":      ["goal 6,000",                          "ЦЕЛЬ 6000"],
  "vital.range":       ["RANGE",                               "ДИАПАЗОН"],

  // ─── Stat tiles ─────────────────────────────────────────
  "stat.sleep.label":  ["Last night sleep",                    "Сон прошлой ночью"],
  "stat.sleep.sub":    ["Score 87 · GOOD · 1 wake @ 02:14",    "Оценка 87 · ХОРОШО · 1 пробуждение @ 02:14"],
  "stat.hrv.label":    ["Heart rate variability",              "Вариабельность пульса"],
  "stat.hrv.sub":      ["rmssd · last 5 min · resting band",   "rmssd · последние 5 мин · покой"],
  "hr.head.label":     ["HR_24H",                              "ЧСС_24Ч"],
  "hr.thresh":         ["PED.THRESHOLD 120BPM · DOTTED",       "ДЕТ.ПОРОГ 120BPM · ПУНКТИР"],
  "hr.leg.hr":         ["HR",                                  "ЧСС"],
  "hr.leg.thresh":     ["UPPER BAND",                          "ВЕРХ.ПОЛОСА"],
  "hr.leg.base":       ["BASELINE 78",                         "БАЗА 78"],
  "hr.leg.sleep":      ["SLEEP",                               "СОН"],

  // ─── Schedule arc ───────────────────────────────────────
  "sched.head":        ["DAILY RHYTHM",                        "РИТМ ДНЯ"],
  "sched.dial":        ["DIAL/",                               "ЦИФЕРБЛАТ/"],
  "sched.now":         ["NOW",                                 "СЕЙЧАС"],
  "sched.bed":         ["BEDTIME 21:30 → 07:00 HAP-04",        "СОН 21:30 → 07:00 HAP-04"],
  "sched.school":      ["SCHOOL MODE 08:30 → 14:00 SILENT · QUIET PING /20M",
                        "ШКОЛА 08:30 → 14:00 ТИХО · ПИНГ /20М"],
  "sched.bed.label":   ["BEDTIME",                             "СОН"],
  "sched.school.label":["SCHOOL MODE",                         "ШКОЛА"],
  "sched.silent":      ["SILENT · QUIET PING /20M",            "ТИХО · ПИНГ /20М"],

  // ─── Radar / Map ────────────────────────────────────────
  "map.head":          ["MAP/",                                "КАРТА/"],
  "map.geofence":      ["GEOFENCE",                            "ГЕОЗОНЫ"],
  "map.note":          ["ZONE-LEVEL · NO GPS",                 "ПО ЗОНАМ · БЕЗ GPS"],
  "map.zone.home":     ["HOME",                                "ДОМ"],
  "map.zone.school":   ["SCHOOL",                              "ШКОЛА"],
  "map.zone.park":     ["PARK",                                "ПАРК"],
  "map.zone.gym":      ["GYM",                                 "ЗАЛ"],
  "map.dur.home":      ["1H 32M",                              "1Ч 32М"],
  "map.dur.school":    ["5H 14M",                              "5Ч 14М"],
  "map.dur.none":      ["— TODAY",                             "— СЕГОДНЯ"],
  "map.misha":         ["MISHA",                               "МИША"],
  "map.scale":         ["~200 M",                              "~200 М"],
  "map.coord":         ["ZONE · SCHOOL · 55.75N 37.62E",       "ЗОНА · ШКОЛА · 55.75С 37.62В"],
  "map.current":       ["CURRENT",                             "ТЕКУЩАЯ"],
  "map.current.val":   ["SCHOOL · 5h 14m",                     "ШКОЛА · 5ч 14м"],
  "map.arrived":       ["ARRIVED 08:42",                       "ПРИБЫЛА 08:42"],
  "map.updated":       ["UPDATED 12s AGO",                     "ОБНОВЛЕНО 12с НАЗАД"],

  // ─── Activity tape ──────────────────────────────────────
  "tape.head":         ["TAPE/",                               "ЛОГ/"],
  "tape.today":        ["EVENTS · TODAY",                      "СОБЫТИЯ · СЕГОДНЯ"],
  "tape.entries":      ["ENTRIES",                             "ЗАПИСЕЙ"],
  "tape.just":         ["just now",                            "только что"],
  "ev.hug":            ["Hug sent to Misha",                   "Обнятие отправлено Мише"],
  "ev.arrive":         ["Arrived at School",                   "Пришла в школу"],
  "ev.sos":            ["SOS — long press detected",           "SOS — долгое нажатие"],
  "ev.sos.ok":         ["SOS resolved · 2m elapsed",           "SOS снят · прошло 2 мин"],
  "ev.spike":          ["HR spike — 128bpm for 4m",            "Скачок ЧСС — 128bpm в течение 4 мин"],
  "ev.leave":          ["Left School",                         "Вышла из школы"],

  // ─── Probe / footer ─────────────────────────────────────
  "probe.head":        ["PROBE/",                              "ПРОБА/"],
  "probe.title":       ["What Misha actually sees →",          "Что Миша на самом деле видит →"],
  "probe.sub":         ["Open the band-side preview to test screens and gestures",
                        "Открой превью со стороны браслета — экраны и жесты"],
  "footer.phases":     ["PHASES",                              "ФАЗЫ"],
  "footer.tag":        ["KAIRO · PARENT DASHBOARD · 2026.05",  "KAIRO · РОДИТЕЛЬСКИЙ ЭКРАН · 2026.05"],

  // ─── Mood scrub display ────────────────────────────────
  "scrub.head":        ["MOOD TIMELINE · 24h",                 "ТАЙМЛАЙН НАСТРОЕНИЯ · 24ч"],
  "scrub.tag":         ["SCRUB/",                              "ПЕРЕМОТКА/"],
  "scrub.mood":        ["MOOD_24H",                            "НАСТРОЕНИЕ_24Ч"],
  "scrub.hint":        ["DRAG · CLICK · KEYBOARD →",           "ТЯНИ · КЛИКНИ · КЛАВИШИ →"],
  "mood.calm":         ["CALM",                                "СПОКОЙНО"],
  "mood.active":       ["ACTIVE",                              "АКТИВНО"],
  "mood.sleepy":       ["SLEEPY",                              "СОН"],
  "mood.worried":      ["WORRIED",                             "ТРЕВОГА"],
};

window.LangCtx = React.createContext({
  lang: 'en',
  t: (k) => {
    const r = window.T_DICT[k];
    return r ? r[0] : k;
  },
});

window.makeT = function (lang) {
  const idx = lang === 'ru' ? 1 : 0;
  return (k, fallback) => {
    const row = window.T_DICT[k];
    if (!row) return fallback != null ? fallback : k;
    return row[idx] || row[0];
  };
};

window.useT = function () {
  return React.useContext(window.LangCtx);
};
