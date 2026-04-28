# 🏆 Porra Mundial 2026

Web app para la porra del Mundial 2026 (USA · México · Canadá).

## ✏️ Cómo actualizar datos

Abre `src/App.jsx` y edita las dos constantes al principio del archivo:

### Añadir participantes
```js
const PARTICIPANTES = [
  { name: "Nombre", teams: ["Equipo1", "Equipo2", "Equipo3", "Equipo4", "Equipo5", "Equipo6", "Equipo7"] },
  // ...
];
```
Los equipos deben coincidir exactamente con los nombres en RESULTADOS.

### Actualizar resultados por equipo
```js
const RESULTADOS = [
  { team: "España", j1: 5, j2: 6, j3: 7, r32: 6, r16: 6, qf: 0, sf: 0, final: 0 },
  // j1/j2/j3 = jornadas de grupo
  // r32 = dieciseisavos, r16 = octavos, qf = cuartos, sf = semifinal, final = final
];
```

Los puntos de cada participante se calculan **automáticamente** cruzando sus equipos con los resultados.

## 🚀 Despliegue en Vercel

1. Sube esta carpeta a GitHub
2. En vercel.com → Add New Project → selecciona el repo
3. Deploy → ¡listo!

Cada vez que actualices el código y lo subas a GitHub, Vercel publica la nueva versión automáticamente.
