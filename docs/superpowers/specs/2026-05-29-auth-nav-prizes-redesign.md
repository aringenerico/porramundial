# Spec: Auth + Nav + Prizes Redesign
**Fecha**: 2026-05-29
**Proyecto**: porramundial (aringenerico/porramundial)
**Estado**: Aprobado

---

## Resumen

Tres cambios coordinados sobre la app existente de porra de equipos del Mundial 2026:

1. **Premios** — actualizar de TBD a premios Smartbox confirmados
2. **Autenticación** — añadir Supabase Auth magic link (sin contraseña), igual que porra DANI
3. **Fusión auth + registro** — primer login lleva a selección de equipos; posteriores van directo al inicio
4. **Navegación** — barra inferior con iconos como porra DANI
5. **HomePage tras login** — personalizada con posición actual y premios reales

---

## 1. Premios

Sustituir todos los textos TBD y la constante `prizeCards` por:

| Puesto | Premio | Importe | URL |
|--------|--------|---------|-----|
| 🥇 1º | Restaurantes para dos | 49,90€ | https://www.smartbox.com/es/nuestras-smartbox/gastronomia/restaurantes-para-dos-849954.html |
| 🥈 2º | Sensaciones de bienestar | 29,90€ | https://www.smartbox.com/es/nuestras-smartbox/bienestar/sensaciones-de-bienestar-1250516.html |
| 🥉 3º | Entradas de cine para dos | 16,90€ | https://www.smartbox.com/es/nuestras-smartbox/momentos-magicos/entradas-de-cine-para-dos-1237890.html |

Eliminar el aviso "Los premios están pendientes de decisión".
Cada card de premio incluye nombre, importe y enlace clickable a Smartbox.

---

## 2. Autenticación — Supabase Auth Magic Link

### Stack
- `@supabase/supabase-js` (ya en package.json o añadir)
- Variables de entorno: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- Sin nueva infraestructura backend

### Flujo de sesión

```
App carga
  ├── No sesión activa → <LoginPage>
  └── Sesión activa
        ├── participant.user_id no existe → <OnboardingPage> (selección equipos)
        └── participant registrado → <HomePage> + nav normal
```

### LoginPage
- Campo email + botón "Enviar enlace mágico"
- Tras enviar: mensaje "Revisa tu correo, te hemos enviado un enlace"
- Sin contraseña, sin registro separado
- Hero de presentación visible (nombre app, descripción, premios) para usuarios no autenticados

### Sesión persistente
- `supabase.auth.onAuthStateChange` en el root de App para detectar login/logout
- Sesión guardada automáticamente por Supabase en localStorage

---

## 3. Fusión Auth + Registro (Onboarding)

### BD: tabla `participants`
Añadir columna:
```sql
ALTER TABLE participants ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE UNIQUE INDEX participants_user_id_idx ON participants(user_id);
```

El campo `name` se mantiene (alias visible). En el onboarding se puede pedir un alias o usar la parte local del email como nombre por defecto.

### OnboardingPage
- Solo se muestra una vez (cuando `user_id` no tiene `participant` asociado)
- Contenido: campo alias (opcional, pre-rellenado con email) + selección de 7 equipos (1 TOP, 3 STRONG, 2 AVERAGE, 1 SURPRISE) + predicciones — igual que `RegistrationPage` actual
- Al guardar: inserta en `participants` con `user_id = session.user.id`
- La actual `RegistrationPage` pública desaparece — sustituida por OnboardingPage

### Página "Mi selección" (antes ResultsPage)
- Muestra los equipos elegidos por el usuario logueado
- Si todos los partidos han terminado, muestra puntuación detallada
- Accesible desde la nav como "Mi selección"

---

## 4. Navegación

### Antes
Tabs horizontales superiores sin iconos.

### Después
Barra fija en la parte inferior, misma estructura que porra DANI:

```
[ 🏠 Inicio ] [ 📋 Normas ] [ ⚽ Mi selección ] [ 🏆 Ranking ] [ ⚙️ Admin* ]
```
*Admin solo visible si el usuario es admin (comparar `user.email` con lista de admins o campo en BD).

- Header superior minimalista: logo/título a la izquierda + botón logout (icono) a la derecha
- La antigua pestaña "Resultados" (búsqueda por nombre) se elimina — cada usuario ve sus propios datos en "Mi selección"

### Estilo
Mismos tokens CSS que porra DANI: `--surface1`, `--accent`, `--txt`, barra con `backdrop-filter: blur`.

---

## 5. HomePage tras login

### Bloque "Tu posición"
Card personalizada con:
- Badge de posición (#N)
- Puntos totales
- Diferencia con el líder (`+X pts para el 1º`)
- Tres mini-tiles: equipos vivos / equipos eliminados / predicciones correctas

### Bloque "Premios"
Cards de los tres premios con importe y link Smartbox. Siempre visible.

### Lo que desaparece
- Contador regresivo de inscripción (ya no hay fecha límite pública — el onboarding está detrás del login)
- Descripción genérica de "4 pasos"
- Premios TBD

---

## 6. Fuera de scope

- Migración de participantes existentes (se parte de cero o el admin asigna manualmente `user_id` a registros existentes)
- Edición de selección de equipos post-registro (igual que ahora)
- Notificaciones push o email de resultados
