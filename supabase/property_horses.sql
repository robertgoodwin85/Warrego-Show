-- Horses & Property section — run once in Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.

create table if not exists property_horses (
  id             text primary key,
  name           text not null,
  breed          text,
  sex            text,
  colour         text,
  dob            text,
  microchip      text,
  owner_type     text default 'own',   -- own | agist | training | other
  owner_name     text,
  owner_phone    text,
  location       text,                 -- paddock / yard
  arrival_date   date,
  departure_date date,                 -- null = still on the property
  rate_per_week  numeric,
  paid_up_to     date,
  feed_notes     text,
  notes          text,
  created_at     timestamptz default now()
);

create table if not exists property_care_log (
  id         text primary key,
  horse_id   text references property_horses(id) on delete cascade,
  type       text,                     -- farrier | worming | vaccination | dentist | vet | other
  date       date,
  next_due   date,
  notes      text,
  created_at timestamptz default now()
);

-- Which organiser logins can see Horses & Property (main "organiser" login always can)
alter table accounts add column if not exists property_access boolean default false;

-- Same open access model as the rest of the app's tables (anon key)
alter table property_horses   enable row level security;
alter table property_care_log enable row level security;
drop policy if exists "anon all" on property_horses;
drop policy if exists "anon all" on property_care_log;
create policy "anon all" on property_horses   for all to anon, authenticated using (true) with check (true);
create policy "anon all" on property_care_log for all to anon, authenticated using (true) with check (true);
grant all on property_horses, property_care_log to anon, authenticated;
