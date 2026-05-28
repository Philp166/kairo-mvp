-- Kairo MVP — PostgreSQL schema
-- Run once: psql $DATABASE_URL -f schema.sql

CREATE TABLE IF NOT EXISTS children (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  age         INT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- BLE snapshots — one row per reading (~every 10s when connected)
CREATE TABLE IF NOT EXISTS snapshots (
  id          BIGSERIAL PRIMARY KEY,
  child_id    TEXT NOT NULL REFERENCES children(id),
  hr          INT,
  spo2        INT,
  temp_c      REAL,
  steps       INT,
  battery     INT,
  state       TEXT,           -- calm | active | sleepy | worried
  ts          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_snap_child_ts ON snapshots(child_id, ts DESC);

-- Activity events — geofence, haptics, goals, SOS
CREATE TABLE IF NOT EXISTS events (
  id          BIGSERIAL PRIMARY KEY,
  child_id    TEXT NOT NULL REFERENCES children(id),
  kind        TEXT NOT NULL,  -- parent_touch, arrive_home, leave_home, goal, sleep_start, sleep_end, low_battery, sos, sos_ok, spike
  text        TEXT NOT NULL,
  ts          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evt_child_ts ON events(child_id, ts DESC);

-- Geofence zones
CREATE TABLE IF NOT EXISTS zones (
  id          TEXT PRIMARY KEY,
  child_id    TEXT NOT NULL REFERENCES children(id),
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'custom',  -- home | school | park | custom
  radius_m    INT DEFAULT 100,
  active      BOOLEAN DEFAULT true,
  last_event_type TEXT,      -- enter | exit
  last_event_ts   TIMESTAMPTZ
);

-- Sleep sessions — computed from sleep_start/sleep_end events + HR dip
CREATE TABLE IF NOT EXISTS sleep_sessions (
  id          BIGSERIAL PRIMARY KEY,
  child_id    TEXT NOT NULL REFERENCES children(id),
  bed_time    TIMESTAMPTZ NOT NULL,
  wake_time   TIMESTAMPTZ,
  total_min   INT,
  score       INT,           -- 0-100
  hr_avg      INT,
  hr_min      INT,
  awakenings  INT DEFAULT 0,
  ts          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sleep_child ON sleep_sessions(child_id, bed_time DESC);

-- Daily aggregates — computed nightly from snapshots
CREATE TABLE IF NOT EXISTS daily_stats (
  child_id    TEXT NOT NULL REFERENCES children(id),
  day         DATE NOT NULL,
  hr_avg      INT,
  hr_min      INT,
  hr_max      INT,
  spo2_avg    REAL,
  temp_avg    REAL,
  steps_total INT,
  hrv_rmssd   REAL,
  sleep_score INT,
  PRIMARY KEY (child_id, day)
);
