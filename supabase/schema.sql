-- Life Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor → New Query)

-- Daily logs: the catch-all for prompted + passive data
create table if not exists daily_logs (
  id           uuid primary key default gen_random_uuid(),
  date         date not null unique,
  -- Prompted (user enters)
  mood_score   smallint check (mood_score between 1 and 10),
  energy_score smallint check (energy_score between 1 and 10),
  stress_score smallint check (stress_score between 1 and 5),
  hours_worked decimal(4,1),
  notes        text,
  -- Passive (pushed from Shortcuts)
  sleep_minutes   integer,
  sleep_start     timestamptz,
  sleep_end       timestamptz,
  resting_hr      decimal(5,1),
  hrv             decimal(5,1),
  steps           integer,
  active_calories integer,
  phone_pickups   integer,
  first_pickup_time time,
  screen_time_minutes integer,
  -- Weather (auto-fetched)
  weather_condition text,
  temp_high_f decimal(4,1),
  temp_low_f  decimal(4,1),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Workouts
create table if not exists workouts (
  id               uuid primary key default gen_random_uuid(),
  started_at       timestamptz not null,
  workout_type     text not null default 'other',
  duration_minutes integer not null,
  source           text default 'manual',
  notes            text,
  intensity        smallint check (intensity between 1 and 5),
  calories_burned  integer,
  created_at       timestamptz default now()
);

-- Contacts (relationship tracker)
create table if not exists contacts (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  relationship_type    text default 'friend',
  target_interval_days integer default 14,
  last_contacted_at    date,
  notes                text,
  created_at           timestamptz default now()
);

create table if not exists contact_logs (
  id           uuid primary key default gen_random_uuid(),
  contact_id   uuid references contacts(id) on delete cascade,
  contacted_at timestamptz default now(),
  medium       text not null default 'call',
  notes        text
);

-- Chores & maintenance
create table if not exists chores (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  area              text default 'general',
  interval_days     integer not null,
  last_completed_at date,
  notes             text,
  created_at        timestamptz default now()
);

create table if not exists chore_completions (
  id           uuid primary key default gen_random_uuid(),
  chore_id     uuid references chores(id) on delete cascade,
  completed_at timestamptz default now(),
  notes        text
);

-- Venues (restaurants, experiences)
create table if not exists venues (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  category   text default 'restaurant',
  address    text,
  created_at timestamptz default now()
);

create table if not exists venue_visits (
  id           uuid primary key default gen_random_uuid(),
  venue_id     uuid references venues(id) on delete cascade,
  visited_at   timestamptz default now(),
  occasion     text,
  rating       smallint check (rating between 1 and 5),
  amount_spent decimal(8,2),
  notes        text
);

-- Spirituality
create table if not exists spirituality_logs (
  id               uuid primary key default gen_random_uuid(),
  date             date not null unique,
  attended_service boolean default false,
  service_type     text,
  connection_score smallint check (connection_score between 1 and 10),
  notes            text
);

-- Spending (manual weekly entry)
create table if not exists spending_logs (
  id              uuid primary key default gen_random_uuid(),
  week_of         date not null,
  estimated_spend decimal(8,2),
  category        text,
  notes           text,
  was_unplanned   boolean default false,
  created_at      timestamptz default now()
);

-- Insights (generated)
create table if not exists insights (
  id           uuid primary key default gen_random_uuid(),
  generated_at timestamptz default now(),
  title        text not null,
  body         text not null,
  type         text not null,
  is_read      boolean default false,
  categories   text[]
);

-- Seed a few starter chores so the app isn't empty
insert into chores (name, area, interval_days) values
  ('Change AC Filter',   'general',  90),
  ('Clean Fridge',       'kitchen',  30),
  ('Clean Bathrooms',    'bathroom', 14),
  ('Vacuum',             'living_room', 7),
  ('Oil Change',         'car',      90),
  ('Mow Lawn',           'yard',      7)
on conflict do nothing;

-- Helpful view: contacts that are overdue
create or replace view overdue_contacts as
  select *,
    (current_date - last_contacted_at) as days_since_contact
  from contacts
  where last_contacted_at is null
     or (current_date - last_contacted_at) >= target_interval_days
  order by days_since_contact desc nulls first;

-- Helpful view: chores that are overdue or due within 14 days
create or replace view chores_status as
  select *,
    case
      when last_completed_at is null then null
      else last_completed_at + interval '1 day' * interval_days
    end as next_due_at,
    case
      when last_completed_at is null then 999
      else (current_date - (last_completed_at + interval_days * interval '1 day'))::integer
    end as days_overdue
  from chores
  order by days_overdue desc;
