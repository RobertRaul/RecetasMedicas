-- ============================================================================
-- Soft delete para pacientes
--
-- Razón: las recetas referencian patients.id con ON DELETE RESTRICT, por lo que
-- no podemos eliminar pacientes que tienen historial. Usamos deleted_at para
-- "archivar" sin romper la integridad referencial.
-- ============================================================================

alter table public.patients
  add column if not exists deleted_at timestamptz;

-- Índice parcial: las queries normales filtran deleted_at IS NULL.
-- Un índice parcial es más pequeño y rápido que uno completo.
create index if not exists idx_patients_active
  on public.patients(doctor_id, nombre_completo)
  where deleted_at is null;
