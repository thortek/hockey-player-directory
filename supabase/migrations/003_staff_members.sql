-- 003_staff_members.sql
-- One staff role per Supabase Auth user (docs/security/role-access-matrix.md,
-- open question 1). Admins insert rows; the app never writes roles.

create table public.staff_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null
    constraint staff_members_role_valid check (role in ('coaching', 'scouting', 'medical')),
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.staff_members enable row level security;

-- Each signed-in user may read only their own role row; no insert/update/delete policies.
create policy staff_members_read_own on public.staff_members
  for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.staff_members to authenticated;
grant select, insert, update, delete on public.staff_members to service_role;
