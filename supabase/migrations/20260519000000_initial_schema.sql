-- ============================================================================
-- Sistema de Recetas Médicas - Schema inicial
-- Fase 2: tablas, índices, RLS y trigger de auto-creación de doctor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla: doctors
--    Cada fila representa un médico. Vinculado 1:1 con auth.users por id.
-- ----------------------------------------------------------------------------
create table if not exists public.doctors (
  id                uuid primary key references auth.users(id) on delete cascade,
  nombre_completo   text,
  especialidad      text,
  cmp               text,
  rne               text,
  celular           text,
  horario           text,
  clinica           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. Tabla: patients
-- ----------------------------------------------------------------------------
create table if not exists public.patients (
  id                uuid primary key default gen_random_uuid(),
  doctor_id         uuid not null references public.doctors(id) on delete cascade,
  nombre_completo   text not null,
  dni               text,
  fecha_nacimiento  date,
  telefono          text,
  notas             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_patients_doctor
  on public.patients(doctor_id);

create index if not exists idx_patients_nombre
  on public.patients(doctor_id, nombre_completo);

-- ----------------------------------------------------------------------------
-- 3. Tabla: prescriptions
--    doctor_snapshot guarda los datos del médico al momento de emitir.
-- ----------------------------------------------------------------------------
create table if not exists public.prescriptions (
  id                uuid primary key default gen_random_uuid(),
  doctor_id         uuid not null references public.doctors(id) on delete restrict,
  patient_id        uuid not null references public.patients(id) on delete restrict,
  diagnostico       text not null,
  contenido         text not null,
  fecha_emision     date not null default current_date,
  fecha_cita        date,
  doctor_snapshot   jsonb not null,
  created_at        timestamptz not null default now()
);

create index if not exists idx_prescriptions_doctor_fecha
  on public.prescriptions(doctor_id, fecha_emision desc);

create index if not exists idx_prescriptions_patient
  on public.prescriptions(patient_id);

-- Búsqueda full-text en español sobre diagnóstico + contenido
create index if not exists idx_prescriptions_fts
  on public.prescriptions
  using gin(to_tsvector('spanish', diagnostico || ' ' || contenido));

-- ----------------------------------------------------------------------------
-- 4. Trigger: actualizar updated_at automáticamente
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_doctors_updated_at on public.doctors;
create trigger trg_doctors_updated_at
  before update on public.doctors
  for each row execute function public.set_updated_at();

drop trigger if exists trg_patients_updated_at on public.patients;
create trigger trg_patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Trigger: al crear un usuario en auth.users, crear su fila en doctors
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.doctors (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 6. Row Level Security (RLS)
-- ----------------------------------------------------------------------------
alter table public.doctors        enable row level security;
alter table public.patients       enable row level security;
alter table public.prescriptions  enable row level security;

-- doctors: cada médico ve y edita SOLO su propia fila
drop policy if exists "doctors_select_own" on public.doctors;
create policy "doctors_select_own"
  on public.doctors for select
  using (auth.uid() = id);

drop policy if exists "doctors_update_own" on public.doctors;
create policy "doctors_update_own"
  on public.doctors for update
  using (auth.uid() = id);

-- patients: cada médico ve y manipula SOLO sus pacientes
drop policy if exists "patients_select_own" on public.patients;
create policy "patients_select_own"
  on public.patients for select
  using (auth.uid() = doctor_id);

drop policy if exists "patients_insert_own" on public.patients;
create policy "patients_insert_own"
  on public.patients for insert
  with check (auth.uid() = doctor_id);

drop policy if exists "patients_update_own" on public.patients;
create policy "patients_update_own"
  on public.patients for update
  using (auth.uid() = doctor_id);

drop policy if exists "patients_delete_own" on public.patients;
create policy "patients_delete_own"
  on public.patients for delete
  using (auth.uid() = doctor_id);

-- prescriptions: igual, scoped al doctor
drop policy if exists "prescriptions_select_own" on public.prescriptions;
create policy "prescriptions_select_own"
  on public.prescriptions for select
  using (auth.uid() = doctor_id);

drop policy if exists "prescriptions_insert_own" on public.prescriptions;
create policy "prescriptions_insert_own"
  on public.prescriptions for insert
  with check (auth.uid() = doctor_id);

drop policy if exists "prescriptions_update_own" on public.prescriptions;
create policy "prescriptions_update_own"
  on public.prescriptions for update
  using (auth.uid() = doctor_id);

-- No se permite DELETE de prescriptions desde el cliente (preservar historial legal)
-- Si se necesita eliminar, hacerlo con service_role desde el backend.
