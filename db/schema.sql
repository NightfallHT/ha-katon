-- Małopolski Hub Innowacji Społecznych — database schema
-- Source of truth: AGENTS.md §5. Owner: Ola. Do not change without updating AGENTS.md.
--
-- Run against a Supabase Postgres project in an EU region (see docs/setup-deploy.md):
--   supabase db push      (or paste this file into the Supabase SQL editor)
--
-- RLS is intentionally OFF for the prototype. "RLS + real auth" is on the roadmap slide.
-- Auth is replaced by a demo role switcher (cookie `role`, cookie `demo_email`) — AGENTS.md §3.
--
-- EMBEDDING DIMENSION: vector(1536) is provisional. Janek picks the embedding model
-- (agents/janek.md task 2) and confirms N with Ola. If it changes, it must change in
-- BOTH places below: innovations.embedding and match_innovations(query_embedding).

create extension if not exists vector;

-- CATEGORIES — fixed list, use exactly these slugs (AGENTS.md §5):
--   starzenie, zdrowie_psychiczne, samotnosc, wykluczenie_cyfrowe, dostep_do_uslug,
--   niepelnosprawnosc, integracja_spoleczna, rodzina_dzieci,
--   wspolpraca_miedzysektorowa, inne
-- Polish display labels live in /web/lib/categories.ts.

create table if not exists innovations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,              -- 1–2 plain-language sentences
  description text,
  category text not null,             -- see CATEGORIES above
  target_groups text[] default '{}',
  tags text[] default '{}',
  stage text,                         -- 'pomysł' | 'testowana' | 'wdrożona'
  region text,                        -- powiat or 'cała Małopolska'
  video_url text, image_url text, image_alt text,
  source_url text, contact_org text,
  avg_rating numeric default 0, ratings_count int default 0,
  published boolean default true,
  embedding vector(1536),             -- see EMBEDDING DIMENSION note above
  created_at timestamptz default now()
);

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text, category text,
  powiat text, indicator_name text, indicator_value numeric, source text
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  title text not null, type text,     -- 'raport' | 'poradnik' | 'film' | 'canvas'
  url text, description text, tags text[] default '{}'
);

create table if not exists needs (   -- every matchmaking query, feeds admin trends
  id uuid primary key default gen_random_uuid(),
  text text not null, category text, target_group text, location text,
  keywords text[] default '{}', role text, created_at timestamptz default now()
);

create table if not exists calls (   -- nabory grantowe
  id uuid primary key default gen_random_uuid(),
  name text not null, description text, is_open boolean default false,
  deadline date, budget_max numeric, regulamin_url text
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null,                 -- 'idea' | 'good_practice' | 'grant_application' | 'contact' | 'test_signup'
  title text not null,
  author_name text, author_email text not null, author_role text,
  payload jsonb default '{}',         -- type-specific fields, see AGENTS.md §6
  status text default 'nowe',         -- 'nowe' | 'w_ocenie' | 'zaakceptowane' | 'odrzucone'
  ai_summary text, ai_tags text[] default '{}', ai_category text,
  innovation_id uuid references innovations(id),
  call_id uuid references calls(id),
  created_at timestamptz default now()
);

create table if not exists messages (  -- admin <-> author thread per submission
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  sender text not null,               -- 'admin' | 'author'
  body text not null, created_at timestamptz default now()
);

create table if not exists reviews (   -- Tester innowacji
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid references innovations(id) on delete cascade,
  rating int check (rating between 1 and 5),
  feedback text, improvement text, author_email text,
  created_at timestamptz default now()
);

create table if not exists gminas (    -- for Middleman profiles (public statistics only)
  id uuid primary key default gen_random_uuid(),
  name text not null, powiat text, type text,   -- 'miejska' | 'wiejska' | 'miejsko-wiejska'
  population int, population_trend text         -- 'spada' | 'stabilna' | 'rośnie'
);

-- vector search used by /ai/match
create or replace function match_innovations(query_embedding vector(1536), match_count int)
returns table (id uuid, title text, summary text, category text, similarity float)
language sql stable as $$
  select id, title, summary, category, 1 - (embedding <=> query_embedding) as similarity
  from innovations where published and embedding is not null
  order by embedding <=> query_embedding limit match_count;
$$;
