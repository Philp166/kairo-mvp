import { createContext, useContext, useMemo, type ReactNode } from 'react'

type Dict = Record<string, [string, string]>

const T_DICT: Dict = {
  "brand.sub":         ["PARENT DASHBOARD",                    "РОДИТЕЛЬСКИЙ ЭКРАН"],
  "child.age":         ["6 yrs · NODE_07",                     "6 лет · NODE_07"],
  "ble.live":          ["● LIVE BLE",                          "● LIVE BLE"],
  "ble.mock":          ["MOCK",                                "МОК"],
  "hero.child":        ["CHILD/",                              "РЕБЁНОК/"],
  "hero.name":         ["MISHA · 6 yrs",                       "МИША · 6 ЛЕТ"],
  "hero.node":         ["NODE_07",                             "NODE_07"],
  "hero.live":         ["LIVE · 12s ago",                      "ОНЛАЙН · 12с НАЗАД"],
  "hero.scrub":        ["SCRUB @",                             "ПЕРЕМОТКА @"],
  "hero.scrub.hint":   ["drag the timeline below to scrub the day", "тащи таймлайн ниже — перемотка дня"],
  "hero.send":         ["SEND TO BAND · ONE-TAP",              "ОТПРАВИТЬ НА БРАСЛЕТ · ОДНИМ КАСАНИЕМ"],
  "hero.send.foot":    ["no chat · no free text · band buzzes once",
                        "без чата · без свободного текста · браслет вибрирует один раз"],
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
  "cart.hug":          ["Hug",                                 "Обнять"],
  "cart.hug.sub":      ["2 soft taps",                         "2 мягких касания"],
  "cart.cheer":        ["Cheer",                               "Поддержать"],
  "cart.cheer.sub":    ["rising pulse",                        "нарастающий импульс"],
  "cart.bed":          ["Bedtime",                             "Спать"],
  "cart.bed.sub":      ["3 slow pulses",                       "3 медленных импульса"],
  "cart.ready":        ["READY",                               "ГОТОВ"],
  "cart.fire":         ["SENT · BUZZ",                         "ОТПРАВЛЕНО · ВИБРО"],
  "toast.hug.title":   ["Hug sent",                            "Обнятие отправлено"],
  "toast.hug.sub":     ["2 soft taps · band buzzed",           "2 мягких касания · браслет завибрировал"],
  "toast.cheer.title": ["Cheer sent",                          "Поддержка отправлена"],
  "toast.cheer.sub":   ["rising pulse · band buzzed",          "нарастающий импульс · браслет завибрировал"],
  "toast.bed.title":   ["Bedtime reminder sent",               "Напоминание о сне отправлено"],
  "toast.bed.sub":     ["3 slow pulses · band buzzed",         "3 медленных импульса · браслет завибрировал"],
  "sec.vitals.title":  ["Live signals",                        "Живые сигналы"],
  "sec.vitals.sub":    ["", ""],
  "sec.scrub.title":   ["Replay the day",                      "Перемотать день"],
  "sec.scrub.sub":     ["", ""],
  "sec.trends.title":  ["24h wellness",                        "Самочувствие · 24 часа"],
  "sec.trends.sub":    ["pediatric threshold lines · sleep windows shaded",
                        "детский порог пунктиром · сон затенён"],
  "sec.rhythm.title":  ["Day rhythm · where she is",           "Ритм дня · где она"],
  "sec.rhythm.sub":    ["geofence is zone-level — not precise GPS",
                        "геозоны зональные — не точный GPS"],
  "sec.tape.title":    ["Activity",                            "События"],
  "sec.tape.sub":      ["", ""],
  "v.hr.label":        ["Pulse · heart rate",                  "Пульс · ЧСС"],
  "v.hr.delta":        ["baseline 78 · Δ",                     "БАЗА 78 · Δ"],
  "v.spo2.label":      ["Oxygen saturation",                   "Сатурация кислорода"],
  "v.spo2.delta":      ["within norm 95–100",                  "в пределах нормы 95–100"],
  "v.temp.label":      ["Skin temperature",                    "Температура кожи"],
  "v.temp.delta":      ["14-day baseline 36.3°C",              "БАЗА 14 ДНЕЙ 36.3°C"],
  "v.step.label":      ["Steps today",                         "Шаги сегодня"],
  "v.step.delta":      ["goal 6,000",                          "ЦЕЛЬ 6000"],
  "vital.range":       ["RANGE",                               "ДИАПАЗОН"],
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
  "sched.head":        ["DAILY RHYTHM",                        "РИТМ ДНЯ"],
  "sched.dial":        ["DIAL/",                               "ЦИФЕРБЛАТ/"],
  "sched.now":         ["NOW",                                 "СЕЙЧАС"],
  "sched.bed.label":   ["BEDTIME",                             "СОН"],
  "sched.school.label":["SCHOOL MODE",                         "ШКОЛА"],
  "sched.silent":      ["SILENT · QUIET PING /20M",            "ТИХО · ПИНГ /20М"],
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
  "tape.head":         ["TAPE/",                               "ЛОГ/"],
  "tape.today":        ["EVENTS · TODAY",                      "СОБЫТИЯ · СЕГОДНЯ"],
  "tape.entries":      ["ENTRIES",                             "ЗАПИСЕЙ"],
  "tape.just":         ["just now",                            "только что"],
  "ev.hug":            ["Hug sent",                             "Обнятие отправлено"],
  "ev.arrive":         ["Arrived at School",                   "Пришла в школу"],
  "ev.sos":            ["SOS — long press detected",           "SOS — долгое нажатие"],
  "ev.sos.ok":         ["SOS resolved · 2m elapsed",           "SOS снят · прошло 2 мин"],
  "ev.spike":          ["HR spike — 128bpm for 4m",            "Скачок ЧСС — 128bpm в течение 4 мин"],
  "ev.leave":          ["Left School",                         "Вышла из школы"],
  "scrub.tag":         ["SCRUB/",                              "ПЕРЕМОТКА/"],
  "scrub.mood":        ["MOOD_24H",                            "НАСТРОЕНИЕ_24Ч"],
  "scrub.hint":        ["", ""],
  "mood.calm":         ["CALM",                                "СПОКОЙНО"],
  "mood.active":       ["ACTIVE",                              "АКТИВНО"],
  "mood.sleepy":       ["SLEEPY",                              "СОН"],
  "mood.worried":      ["WORRIED",                             "ТРЕВОГА"],
  "footer.tag":        ["KAIRO · PARENT DASHBOARD · 2026.05",  "KAIRO · РОДИТЕЛЬСКИЙ ЭКРАН · 2026.05"],
}

export type Lang = 'en' | 'ru'
export type TFn = (key: string, fallback?: string) => string

function makeT(lang: Lang): TFn {
  const idx = lang === 'ru' ? 1 : 0
  return (k, fallback) => {
    const row = T_DICT[k]
    if (!row) return fallback ?? k
    return row[idx] || row[0]
  }
}

interface LangCtx {
  lang: Lang
  t: TFn
}

export const LangContext = createContext<LangCtx>({
  lang: 'en',
  t: makeT('en'),
})

export function useT() {
  return useContext(LangContext)
}

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const t = useMemo(() => makeT(lang), [lang])
  return <LangContext.Provider value={{ lang, t }}>{children}</LangContext.Provider>
}
