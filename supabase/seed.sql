-- ============================================================================
-- Seed: precarga los datos del Dr. Raúl Farfán Samanez
--
-- USO: ejecutar DESPUÉS de:
--   1. Aplicar 20260519000000_initial_schema.sql
--   2. Crear el usuario del Dr. Farfán en Authentication > Users
--      (Add user > Create new user, marcar "Auto Confirm User")
--
-- Reemplazá el email abajo por el real con el que creaste al usuario.
-- ============================================================================

update public.doctors
set
  nombre_completo = 'Dr. Raúl Farfán Samanez',
  especialidad    = 'PEDIATRÍA / CIRUGÍA PEDIÁTRICA',
  cmp             = '27466',
  rne             = '17412 / 48994',
  celular         = '983 653822',
  horario         = 'Lunes a Sábado: 3:30 p.m a 8:00 p.m',
  clinica         = 'Clínica Mac Salud 5to piso Consultorio 502 Av. de la Cultura N° 1410 Cusco - Perú'
where id = (
  select id from auth.users
  where email = 'farfan@macsalud.com'  -- ⚠️ REEMPLAZAR por el email real
  limit 1
);

-- Verificar que se actualizó
select id, nombre_completo, especialidad, cmp from public.doctors;
