create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  developer text,
  location text,
  property_type text,
  unit_types text,
  starting_price text,
  payment_plan text,
  handover_date text,
  main_usps text,
  target_audience text,
  language text default 'English',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.creative_briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  big_idea text,
  tension text,
  emotional_trigger text,
  buyer_objection text,
  hidden_desire text,
  campaign_angle text,
  desired_action text,
  avoid_list text,
  creative_clarity_score integer,
  buyer_psychology_score integer,
  differentiation_score integer,
  conversion_readiness_score integer,
  idea_score integer,
  unlock_generation boolean default false,
  ai_feedback jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.outputs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  brief_id uuid references public.creative_briefs(id),
  user_id uuid references auth.users(id) not null,
  type text not null check (
    type in (
      'headlines',
      'captions',
      'scripts',
      'lead_forms',
      'proofreading',
      'design_review'
    )
  ),
  platform text,
  tone text,
  language text,
  content jsonb not null,
  is_favorite boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  file_url text,
  file_name text,
  file_type text,
  purpose text,
  created_at timestamptz default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists creative_briefs_user_project_idx on public.creative_briefs(user_id, project_id);
create index if not exists outputs_user_project_idx on public.outputs(user_id, project_id);
create index if not exists uploads_user_project_idx on public.uploads(user_id, project_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_creative_briefs_updated_at on public.creative_briefs;
create trigger set_creative_briefs_updated_at
before update on public.creative_briefs
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.creative_briefs enable row level security;
alter table public.outputs enable row level security;
alter table public.uploads enable row level security;

drop policy if exists "Users can select own profile" on public.profiles;
create policy "Users can select own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
on public.profiles for delete
using (auth.uid() = id);

drop policy if exists "Users can select own projects" on public.projects;
create policy "Users can select own projects"
on public.projects for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects"
on public.projects for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects"
on public.projects for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects"
on public.projects for delete
using (auth.uid() = user_id);

drop policy if exists "Users can select own creative briefs" on public.creative_briefs;
create policy "Users can select own creative briefs"
on public.creative_briefs for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own creative briefs" on public.creative_briefs;
create policy "Users can insert own creative briefs"
on public.creative_briefs for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own creative briefs" on public.creative_briefs;
create policy "Users can update own creative briefs"
on public.creative_briefs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own creative briefs" on public.creative_briefs;
create policy "Users can delete own creative briefs"
on public.creative_briefs for delete
using (auth.uid() = user_id);

drop policy if exists "Users can select own outputs" on public.outputs;
create policy "Users can select own outputs"
on public.outputs for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own outputs" on public.outputs;
create policy "Users can insert own outputs"
on public.outputs for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own outputs" on public.outputs;
create policy "Users can update own outputs"
on public.outputs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own outputs" on public.outputs;
create policy "Users can delete own outputs"
on public.outputs for delete
using (auth.uid() = user_id);

drop policy if exists "Users can select own uploads" on public.uploads;
create policy "Users can select own uploads"
on public.uploads for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own uploads" on public.uploads;
create policy "Users can insert own uploads"
on public.uploads for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own uploads" on public.uploads;
create policy "Users can update own uploads"
on public.uploads for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own uploads" on public.uploads;
create policy "Users can delete own uploads"
on public.uploads for delete
using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), ''),
    'owner'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('project-uploads', 'project-uploads', false)
on conflict (id) do nothing;

drop policy if exists "Users can read own storage objects" on storage.objects;
create policy "Users can read own storage objects"
on storage.objects for select
using (
  bucket_id = 'project-uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can insert own storage objects" on storage.objects;
create policy "Users can insert own storage objects"
on storage.objects for insert
with check (
  bucket_id = 'project-uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update own storage objects" on storage.objects;
create policy "Users can update own storage objects"
on storage.objects for update
using (
  bucket_id = 'project-uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'project-uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own storage objects" on storage.objects;
create policy "Users can delete own storage objects"
on storage.objects for delete
using (
  bucket_id = 'project-uploads'
  and auth.uid()::text = (storage.foldername(name))[1]
);
