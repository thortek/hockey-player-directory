-- 001_scouting_schema.sql
-- Players, games, and scouting events for Sprint 3 (docs/scouting-data-requirements.md).
-- Design notes: docs/scouting-schema-notes.md

-- Players keep the text ids already used in bookmarks (/players/player-000).
create table public.players (
  id text primary key
    constraint players_id_format check (id ~ '^player-[0-9]{3}$'),
  full_name text not null
    constraint players_full_name_not_blank check (char_length(trim(full_name)) > 0),
  jersey_number smallint not null
    constraint players_jersey_number_range check (jersey_number between 0 and 99),
  position text not null
    constraint players_position_valid check (position in ('forward', 'defense', 'goalie')),
  team_name text not null default 'Utah Hockey Ops',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.games (
  id text primary key
    constraint games_id_format check (id ~ '^game-[0-9]{3}$'),
  played_at timestamptz not null,
  opponent text not null
    constraint games_opponent_not_blank check (char_length(trim(opponent)) > 0),
  is_home boolean not null default true,
  venue text,
  status text not null default 'upcoming'
    constraint games_status_valid check (status in ('upcoming', 'final')),
  created_at timestamptz not null default now()
);

-- One observation about one player in one game.
create table public.scouting_events (
  id uuid primary key default gen_random_uuid(),
  -- Restrict: removing a player or game must not silently erase scouting history.
  player_id text not null references public.players (id) on delete restrict,
  game_id text not null references public.games (id) on delete restrict,
  event_type text not null
    constraint scouting_events_type_valid check (
      event_type in ('goal', 'assist', 'shot', 'hit', 'takeaway', 'giveaway', 'save', 'penalty', 'note')
    ),
  period smallint
    constraint scouting_events_period_range check (period between 1 and 5),
  clock_seconds integer
    constraint scouting_events_clock_range check (clock_seconds between 0 and 1200),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scouting_events_player_id_idx on public.scouting_events (player_id);
create index scouting_events_game_id_idx on public.scouting_events (game_id);
create index games_played_at_idx on public.games (played_at);
create index players_position_idx on public.players (position);

-- Default deny: with RLS on and no policies, only the server's secret key can
-- read or write. Sprint 4 adds per-role policies for signed-in staff.
alter table public.players enable row level security;
alter table public.games enable row level security;
alter table public.scouting_events enable row level security;
