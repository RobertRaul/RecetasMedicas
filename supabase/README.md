# Supabase — Fase 2

Migraciones SQL para crear el schema del sistema de recetas.

## Cómo aplicar (PRIMERA VEZ)

### Paso 1 — Aplicar el schema

1. Abrir el dashboard de Supabase del proyecto.
2. Ir a **SQL Editor** (icono `</>` en la barra lateral).
3. Crear una nueva query.
4. Copiar el contenido completo de [`migrations/20260519000000_initial_schema.sql`](migrations/20260519000000_initial_schema.sql) y pegarlo.
5. Click en **Run** (o `Ctrl+Enter`).
6. Verificar que aparezca "Success. No rows returned" sin errores.

Esto crea:
- Tablas `doctors`, `patients`, `prescriptions`
- Índices (incluyendo full-text search en español)
- Trigger `handle_new_user`: cada vez que se cree un `auth.users`, se inserta automáticamente una fila en `doctors`
- Políticas RLS: cada médico solo ve sus propios datos

### Paso 2 — Deshabilitar registro público (registro restringido)

1. En el dashboard de Supabase, ir a **Authentication → Sign In / Up → Email**.
2. Desactivar la opción **"Enable sign-ups"** (o **"Allow new users to sign up"**).
3. Guardar.

Esto bloquea que cualquier persona se registre desde la aplicación. Solo el admin crea cuentas manualmente.

### Paso 3 — Crear la cuenta del Dr. Farfán

1. Ir a **Authentication → Users → Add user → Create new user**.
2. Email: el correo del Dr. Farfán (ej. `farfan@macsalud.com`).
3. Password: una contraseña temporal segura.
4. Marcar **"Auto Confirm User"** (para que no tenga que verificar email).
5. Click **Create user**.

> El trigger `handle_new_user` crea automáticamente una fila vacía en `public.doctors` con el `id` igual al `id` de auth.

### Paso 4 — Precargar los datos del Dr. Farfán (opcional)

1. Abrir [`seed.sql`](seed.sql) y reemplazar `'farfan@macsalud.com'` por el email real con el que creaste al usuario.
2. En el SQL Editor, pegar y ejecutar el contenido de `seed.sql`.
3. Verificar que el resultado del `select` final muestra la fila con los datos del Dr.

Si preferís que el doctor llene su propio perfil al primer login, **podés saltar este paso** y dejarlo entrar a `/perfil` para completarlo.

---

## Cómo aplicar migraciones FUTURAS

Cuando agreguemos nuevas migraciones (por ejemplo, un campo nuevo o una tabla nueva), seguir este patrón:

1. Crear `migrations/YYYYMMDDHHMMSS_descripcion.sql`.
2. Aplicar el SQL desde el SQL Editor del dashboard.

Más adelante (cuando el proyecto crezca) se puede instalar la Supabase CLI y aplicar migraciones con `supabase db push`, pero por ahora el flujo manual del dashboard es suficiente.

---

## Estructura

```
supabase/
├── migrations/
│   └── 20260519000000_initial_schema.sql   # Schema base (Fase 2)
├── seed.sql                                 # Datos iniciales del Dr. Farfán
└── README.md                                # Este archivo
```
