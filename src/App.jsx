import { useState } from "react";

// ─── DATOS ────────────────────────────────────────────────────────────────────
// ✏️  EDITA AQUÍ: añade o quita participantes
const PARTICIPANTES = [
  { name: "Gorka",  teams: ["España", "Colombia", "Marruecos", "México", "Corea del Sur", "Irán", "Australia"] },
  { name: "Iker",   teams: ["Argentina", "Francia", "México", "Japón", "Chequia", "Escocia", "Nueva Zelanda"] },
  { name: "Amaia",  teams: ["Brasil", "Colombia", "Suiza", "Noruega", "Ghana", "Turquía", "Curazao"] },
  { name: "Josu",   teams: ["España", "Países Bajos", "Uruguay", "Ecuador", "Arabia Saudí", "Bosnia y Herzegovina", "Haití"] },
  { name: "Miren",  teams: ["Francia", "Japón", "Australia", "Noruega", "Sudáfrica", "Jordania", "Irak"] },
];

// ✏️  EDITA AQUÍ: actualiza los puntos por equipo tras cada jornada
const RESULTADOS = [
  // { team: "NombreEquipo", j1: 0, j2: 0, j3: 0, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Argentina",     j1: 8, j2: 7, j3: 5, r32: 6, r16: 6, qf: 6, sf: 7, final: 0 },
  { team: "Francia",       j1: 9, j2: 8, j3: 6, r32: 6, r16: 6, qf: 6, sf: 6, final: 6 },
  { team: "Brasil",        j1: 7, j2: 8, j3: 7, r32: 6, r16: 6, qf: 6, sf: 6, final: 0 },
  { team: "España",        j1: 5, j2: 6, j3: 7, r32: 6, r16: 6, qf: 2, sf: 0, final: 0 },
  { team: "Marruecos",     j1: 4, j2: 6, j3: 4, r32: 6, r16: 6, qf: 6, sf: 0, final: 0 },
  { team: "Colombia",      j1: 5, j2: 7, j3: 4, r32: 6, r16: 6, qf: 0, sf: 0, final: 0 },
  { team: "México",        j1: 6, j2: 4, j3: 6, r32: 6, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Corea del Sur", j1: 4, j2: 5, j3: 4, r32: 6, r16: 6, qf: 0, sf: 0, final: 0 },
  { team: "Australia",     j1: 3, j2: 5, j3: 4, r32: 6, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Irán",          j1: 4, j2: 5, j3: 6, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Japón",         j1: 6, j2: 5, j3: 4, r32: 6, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Noruega",       j1: 3, j2: 4, j3: 3, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Suiza",         j1: 4, j2: 3, j3: 5, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Uruguay",       j1: 5, j2: 6, j3: 4, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Ecuador",       j1: 3, j2: 4, j3: 3, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Países Bajos",  j1: 6, j2: 5, j3: 7, r32: 6, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Chequia",       j1: 3, j2: 4, j3: 3, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Ghana",         j1: 3, j2: 3, j3: 2, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Turquía",       j1: 4, j2: 3, j3: 4, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Sudáfrica",     j1: 2, j2: 3, j3: 2, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Escocia",       j1: 2, j2: 3, j3: 3, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Jordania",      j1: 2, j2: 2, j3: 2, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Irak",          j1: 1, j2: 2, j3: 1, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Nueva Zelanda", j1: 2, j2: 1, j3: 2, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Bosnia y Herzegovina", j1: 2, j2: 3, j3: 2, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Arabia Saudí",  j1: 2, j2: 2, j3: 3, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Haití",         j1: 1, j2: 1, j3: 2, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
  { team: "Curazao",       j1: 1, j2: 2, j3: 1, r32: 0, r16: 0, qf: 0, sf: 0, final: 0 },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const COLS = [
  { k: "j1", l: "J1" }, { k: "j2", l: "J2" }, { k: "j3", l: "J3" },
  { k: "r32", l: "1/32" }, { k: "r16", l: "1/16" }, { k: "qf", l: "QF" },
  { k: "sf", l: "SF" }, { k: "final", l: "FIN" },
];

const FLAGS = {
  "Argentina":"🇦🇷","Francia":"🇫🇷","Brasil":"🇧🇷","Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","España":"🇪🇸","Alemania":"🇩🇪","Portugal":"🇵🇹",
  "Países Bajos":"🇳🇱","Bélgica":"🇧🇪","Croacia":"🇭🇷","Uruguay":"🇺🇾","Colombia":"🇨🇴","Marruecos":"🇲🇦","México":"🇲🇽",
  "Estados Unidos":"🇺🇸","Japón":"🇯🇵","Suiza":"🇨🇭","Austria":"🇦🇹","Ecuador":"🇪🇨","Corea del Sur":"🇰🇷","Irán":"🇮🇷",
  "Australia":"🇦🇺","Paraguay":"🇵🇾","Túnez":"🇹🇳","Argelia":"🇩🇿","Egipto":"🇪🇬","Noruega":"🇳🇴","Suecia":"🇸🇪",
  "Canadá":"🇨🇦","Qatar":"🇶🇦","Arabia Saudí":"🇸🇦","Costa de Marfil":"🇨🇮","Ghana":"🇬🇭","Sudáfrica":"🇿🇦",
  "Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Chequia":"🇨🇿","Turquía":"🇹🇷","Bosnia y Herzegovina":"🇧🇦","Uzbekistán":"🇺🇿","Jordania":"🇯🇴",
  "Cabo Verde":"🇨🇻","Panamá":"🇵🇦","Nueva Zelanda":"🇳🇿","Curazao":"🇨🇼","Haití":"🇭🇹","Irak":"🇮🇶","R.D. Congo":"🇨🇩",
};

const totEquipo = (r) => COLS.reduce((s, c) => s + (r[c.k] || 0), 0);

// Calcula puntos de un participante cruzando sus equipos con los resultados
const calcPuntos = (teams) => {
  return teams.reduce((sum, teamName) => {
    const r = RESULTADOS.find((r) => r.team === teamName);
    return sum + (r ? totEquipo(r) : 0);
  }, 0);
};

// Participantes con puntos calculados automáticamente
const participantesConPuntos = PARTICIPANTES.map((p) => ({
  ...p,
  total: calcPuntos(p.teams),
})).sort((a, b) => b.total - a.total);

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #06090f; --sur: #0c1220; --sur2: #111827; --brd: #1a2438;
  --gold: #F5B731; --green: #22d48e; --txt: #c8d0e0; --mut: #4e5e78; --white: #eef2ff;
}
html, body { font-family: 'Barlow', sans-serif; background: var(--bg); color: var(--txt); min-height: 100vh; }
.hdr { background: linear-gradient(180deg,#0a1628,#080e1c); border-bottom: 1px solid var(--brd); padding: 0 20px; position: sticky; top: 0; z-index: 50; }
.hdr-top { display: flex; align-items: center; gap: 14px; padding: 14px 0 10px; }
.hdr-name { font-family: 'Barlow Condensed',sans-serif; font-weight: 900; font-size: 24px; letter-spacing: 3px; text-transform: uppercase; color: var(--gold); line-height: 1; }
.hdr-sub { font-size: 10px; color: var(--mut); letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
.hdr-bote { margin-left: auto; background: rgba(245,183,49,0.1); border: 1px solid rgba(245,183,49,0.25); border-radius: 8px; padding: 5px 14px; text-align: right; }
.hdr-bote-lbl { font-size: 9px; color: var(--mut); text-transform: uppercase; letter-spacing: 1px; }
.hdr-bote-val { font-family: 'Barlow Condensed',sans-serif; font-weight: 700; font-size: 20px; color: var(--gold); }
.nav { display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none; }
.nav::-webkit-scrollbar { display: none; }
.nav-btn { font-family: 'Barlow Condensed',sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; background: none; border: none; cursor: pointer; color: var(--mut); padding: 9px 15px; border-bottom: 2px solid transparent; white-space: nowrap; transition: color .2s; }
.nav-btn:hover { color: var(--txt); }
.nav-btn.on { color: var(--gold); border-bottom-color: var(--gold); }
.page { padding: 22px 18px; max-width: 900px; margin: 0 auto; }
.card { background: var(--sur); border: 1px solid var(--brd); border-radius: 12px; padding: 18px; margin-bottom: 14px; }
.sect-title { font-family: 'Barlow Condensed',sans-serif; font-weight: 800; font-size: 18px; letter-spacing: 2px; text-transform: uppercase; color: var(--white); margin-bottom: 14px; }
.hero { background: linear-gradient(135deg,#0e1e38,#091428); border: 1px solid var(--brd); border-radius: 14px; padding: 32px 22px; text-align: center; margin-bottom: 16px; position: relative; overflow: hidden; }
.hero::before { content: '⚽'; font-size: 180px; position: absolute; top: -30px; right: -30px; opacity: 0.04; pointer-events: none; }
.hero-title { font-family: 'Barlow Condensed',sans-serif; font-weight: 900; font-size: 44px; letter-spacing: 4px; text-transform: uppercase; color: var(--gold); text-shadow: 0 0 40px rgba(245,183,49,0.3); line-height: 1; }
.hero-sub { font-size: 12px; color: var(--mut); letter-spacing: 2px; text-transform: uppercase; margin-top: 6px; }
.hero-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-top: 22px; }
.hero-stat { background: rgba(255,255,255,0.04); border: 1px solid var(--brd); border-radius: 10px; padding: 12px 8px; }
.hero-stat-val { font-family: 'Barlow Condensed',sans-serif; font-weight: 800; font-size: 28px; color: var(--white); }
.hero-stat-lbl { font-size: 10px; color: var(--mut); text-transform: uppercase; letter-spacing: 1px; }
.step-row { display: flex; gap: 12px; align-items: flex-start; background: var(--sur2); border: 1px solid var(--brd); border-radius: 10px; padding: 13px; margin-bottom: 8px; }
.step-num { background: var(--gold); color: #080c14; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Barlow Condensed',sans-serif; font-weight: 900; font-size: 15px; flex-shrink: 0; }
.step-lbl { font-weight: 600; color: var(--white); font-size: 13px; margin-bottom: 2px; }
.step-desc { font-size: 12px; color: var(--mut); }
.premio-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
.premio-card { border-radius: 10px; border: 1px solid; padding: 14px; text-align: center; }
.scoring-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.scoring-item { background: var(--sur2); border: 1px solid var(--brd); border-radius: 10px; padding: 11px 12px; display: flex; align-items: center; gap: 10px; }
.scoring-pts { font-family: 'Barlow Condensed',sans-serif; font-weight: 800; font-size: 20px; color: var(--gold); margin-left: auto; white-space: nowrap; }
.scoring-lbl { font-size: 12px; color: var(--txt); font-weight: 600; }
.scoring-note { font-size: 10px; color: var(--mut); }
.res-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.res-table th { font-family: 'Barlow Condensed',sans-serif; font-weight: 700; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--mut); padding: 5px 8px; text-align: center; border-bottom: 1px solid var(--brd); }
.res-table th:first-child { text-align: left; }
.res-table td { padding: 9px 8px; text-align: center; border-bottom: 1px solid rgba(30,41,64,0.5); }
.res-table td:first-child { text-align: left; }
.res-table tr:last-child td { border-bottom: none; }
.res-table tr:hover td { background: rgba(255,255,255,0.02); }
.res-pts { font-family: 'Barlow Condensed',sans-serif; font-weight: 700; font-size: 14px; }
.res-zero { color: var(--mut); }
.res-total { font-family: 'Barlow Condensed',sans-serif; font-weight: 800; font-size: 15px; color: var(--gold); }
.podium { display: grid; grid-template-columns: 1fr 1.1fr 1fr; gap: 12px; margin-bottom: 18px; align-items: end; }
.podium-card { border-radius: 12px; border: 1px solid; padding: 16px 12px; text-align: center; }
.podium-medal { font-size: 30px; margin-bottom: 6px; }
.podium-name { font-family: 'Barlow Condensed',sans-serif; font-weight: 800; font-size: 17px; color: var(--white); text-transform: uppercase; letter-spacing: 1px; }
.podium-pts { font-family: 'Barlow Condensed',sans-serif; font-weight: 900; font-size: 26px; margin: 4px 0; }
.podium-pts span { font-size: 11px; color: var(--mut); }
.podium-premio { font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.podium-teams { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; }
.podium-tc { font-size: 10px; background: rgba(255,255,255,0.06); border-radius: 4px; padding: 2px 6px; }
.clasif-row { display: flex; align-items: center; gap: 14px; background: var(--sur); border: 1px solid var(--brd); border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; }
.clasif-pos { font-family: 'Barlow Condensed',sans-serif; font-weight: 900; font-size: 22px; color: var(--mut); width: 26px; text-align: center; }
.clasif-name { font-family: 'Barlow Condensed',sans-serif; font-weight: 700; font-size: 16px; color: var(--white); text-transform: uppercase; letter-spacing: 1px; }
.clasif-pts { margin-left: auto; font-family: 'Barlow Condensed',sans-serif; font-weight: 900; font-size: 24px; color: var(--gold); }
.clasif-pts span { font-size: 11px; color: var(--mut); }
.chip { display: inline-flex; align-items: center; gap: 4px; background: var(--sur2); border: 1px solid var(--brd); border-radius: 6px; padding: 3px 8px; font-size: 11px; }
.team-detail { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.team-detail-chip { font-size: 10px; color: var(--mut); }
`;

// ─── PÁGINAS ──────────────────────────────────────────────────────────────────

function Inicio({ goTo }) {
  const bote = PARTICIPANTES.length * 10;
  return (
    <div className="page">
      <div className="hero">
        <div className="hero-title">🏆 Porra Mundial 2026</div>
        <div className="hero-sub">USA · México · Canadá &nbsp;|&nbsp; 11 Jun – 19 Jul 2026</div>
        <div className="hero-grid">
          <div className="hero-stat">
            <div className="hero-stat-val">{PARTICIPANTES.length}</div>
            <div className="hero-stat-lbl">Participantes</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val" style={{ color: "var(--gold)" }}>€{bote}</div>
            <div className="hero-stat-lbl">Bote total</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val">7</div>
            <div className="hero-stat-lbl">Equipos / porra</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="sect-title">🎯 ¿Cómo funciona?</div>
        {[
          ["1", "Elige 7 equipos", "1 TOP · 3 BUENOS · 2 NORMALES · 1 SORPRESA"],
          ["2", "Acumula puntos", "Goles, victorias, fases superadas…"],
          ["3", "Gana el bote", "El que más puntos tenga al final se lleva el 75%"],
        ].map(([n, t, d]) => (
          <div className="step-row" key={n}>
            <div className="step-num">{n}</div>
            <div>
              <div className="step-lbl">{t}</div>
              <div className="step-desc">{d}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ background: "linear-gradient(135deg,#0e1e38,#091428)" }}>
        <div className="premio-grid">
          {[
            ["🥇", "1er Premio", 75, "var(--gold)"],
            ["🥈", "2º Premio", 20, "#b0b8cc"],
            ["🥉", "3er Premio", 5, "#9a7050"],
          ].map(([medal, label, pct, col]) => (
            <div className="premio-card" key={label} style={{ background: `${col}10`, borderColor: `${col}40` }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{medal}</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 24, color: col }}>{pct}%</div>
              <div style={{ fontSize: 10, color: "var(--mut)" }}>{label}</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: col, marginTop: 4 }}>
                ~€{Math.round(bote * pct / 100)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "var(--mut)" }}>
          Inscripción: <strong style={{ color: "var(--gold)" }}>10€</strong> · En caso de empate se reparte el premio
        </div>
      </div>

      <button
        onClick={() => goTo("clasificacion")}
        style={{ width: "100%", padding: 13, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: 2, textTransform: "uppercase", background: "var(--gold)", color: "#080c14", border: "none", borderRadius: 9, cursor: "pointer" }}
      >
        🏅 Ver clasificación actual
      </button>
    </div>
  );
}

function Normas() {
  const scoring = [
    ["⚽", "Gol marcado", 1, ""],
    ["🏆", "Partido ganado", 3, "No cuenta prórroga"],
    ["🤝", "Partido empatado", 1, "No cuenta prórroga"],
    ["➡️", "Pasar de fase", 6, "Por cada fase superada"],
    ["🥇", "Ganar el campeonato", 10, "Bonus final"],
    ["👟", "Pichichi del Mundial", 8, "Si está en tu selección"],
    ["🛡️", "Equipo menos goleado", 6, "Solo semifinalistas"],
  ];
  const grupos = [
    ["⭐ TOP", "#F5B731", "1 equipo", "Argentina, Francia, Brasil, Inglaterra, España, Alemania, Portugal"],
    ["🔵 BUENOS", "#60AAFF", "3 equipos", "Países Bajos, Bélgica, Croacia, Uruguay, Colombia, Marruecos, México, EE.UU., Japón…"],
    ["🟢 NORMALES", "#40D490", "2 equipos", "Canadá, Qatar, Arabia Saudí, Costa de Marfil, Ghana, Escocia, Chequia, Turquía…"],
    ["🔮 SORPRESAS", "#FF6B8A", "1 equipo", "Nueva Zelanda, Curazao, Haití, Irak, R.D. Congo"],
  ];
  return (
    <div className="page">
      <div className="card">
        <div className="sect-title">📋 Selección de Equipos</div>
        {grupos.map(([label, col, pick, teams]) => (
          <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "var(--sur2)", border: "1px solid var(--brd)", borderRadius: 10, padding: "11px 13px", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 10, padding: "2px 10px", borderRadius: 5, textTransform: "uppercase", background: `${col}20`, color: col, border: `1px solid ${col}50`, whiteSpace: "nowrap", marginTop: 2 }}>{label}</span>
            <div>
              <span style={{ fontSize: 13, color: "var(--white)", fontWeight: 600 }}>Elegir {pick} </span>
              <div style={{ fontSize: 11, color: "var(--mut)", marginTop: 2 }}>{teams}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="sect-title">⚡ Sistema de Puntuación</div>
        <div className="scoring-grid">
          {scoring.map(([icon, lbl, pts, note]) => (
            <div className="scoring-item" key={lbl}>
              <span style={{ fontSize: 20, width: 26, textAlign: "center" }}>{icon}</span>
              <div>
                <div className="scoring-lbl">{lbl}</div>
                {note && <div className="scoring-note">{note}</div>}
              </div>
              <div className="scoring-pts">+{pts}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="sect-title">💰 Reparto de Premios</div>
        <div className="premio-grid">
          {[["🥇","Ganador",75,"var(--gold)"],["🥈","2º Puesto",20,"#b0b8cc"],["🥉","3er Puesto",5,"#9a7050"]].map(([m, l, p, c]) => (
            <div className="premio-card" key={l} style={{ background: `${c}10`, borderColor: `${c}40` }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{m}</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 26, color: c }}>{p}%</div>
              <div style={{ fontSize: 10, color: "var(--mut)" }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: "10px 13px", background: "rgba(245,183,49,0.06)", border: "1px solid rgba(245,183,49,0.15)", borderRadius: 8, fontSize: 12, color: "var(--mut)" }}>
          🎟️ Inscripción: <strong style={{ color: "var(--gold)" }}>10€</strong> por participante
        </div>
      </div>
    </div>
  );
}

function Resultados() {
  const sorted = [...RESULTADOS].sort((a, b) => totEquipo(b) - totEquipo(a));
  return (
    <div className="page">
      <div className="card">
        <div className="sect-title">📊 Puntos por Equipo</div>
        <div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 12 }}>
          ✏️ Actualiza los valores en <code style={{ color: "var(--gold)", background: "rgba(245,183,49,0.1)", padding: "1px 6px", borderRadius: 4 }}>src/App.jsx</code> → constante <code style={{ color: "var(--gold)", background: "rgba(245,183,49,0.1)", padding: "1px 6px", borderRadius: 4 }}>RESULTADOS</code>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="res-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Equipo</th>
                {COLS.map((c) => <th key={c.k}>{c.l}</th>)}
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={r.team}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 20, textAlign: "center", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: "var(--mut)" }}>{i + 1}</span>
                      <span>{FLAGS[r.team] || "🏳️"}</span>
                      <span style={{ fontWeight: 600, color: "var(--white)", fontSize: 12 }}>{r.team}</span>
                    </div>
                  </td>
                  {COLS.map((c) => (
                    <td key={c.k} className={r[c.k] ? "res-pts" : "res-zero"}>{r[c.k] || "—"}</td>
                  ))}
                  <td className="res-total">{totEquipo(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Clasificacion() {
  const bote = PARTICIPANTES.length * 10;
  const top3 = participantesConPuntos.slice(0, 3);
  const rest = participantesConPuntos.slice(3);
  const premios = [Math.round(bote * 0.75), Math.round(bote * 0.20), Math.round(bote * 0.05)];
  const pColors = ["var(--gold)", "#b0b8cc", "#9a7050"];
  const pBg = ["rgba(245,183,49,0.08)", "rgba(176,184,204,0.06)", "rgba(154,112,80,0.06)"];
  const medals = ["🥇", "🥈", "🥉"];
  // Pódium: 2º, 1º, 3º
  const podOrder = [1, 0, 2].filter((i) => top3[i]);

  return (
    <div className="page">
      {top3.length >= 2 && (
        <div className="podium">
          {podOrder.map((ri) => {
            const p = top3[ri];
            return (
              <div className="podium-card" key={p.name} style={{ background: pBg[ri], borderColor: `${pColors[ri]}40`, order: ri === 0 ? 2 : ri === 1 ? 1 : 3 }}>
                <div className="podium-medal">{medals[ri]}</div>
                <div className="podium-name">{p.name}</div>
                <div className="podium-pts" style={{ color: pColors[ri] }}>{p.total}<span> pts</span></div>
                <div className="podium-premio" style={{ color: pColors[ri] }}>€{premios[ri]}</div>
                <div className="podium-teams">
                  {p.teams.map((t) => <span key={t} className="podium-tc">{FLAGS[t] || "🏳️"} {t}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rest.map((p, i) => (
        <div className="clasif-row" key={p.name}>
          <div className="clasif-pos">{i + 4}</div>
          <div>
            <div className="clasif-name">{p.name}</div>
            <div className="team-detail">
              {p.teams.map((t) => <span key={t} className="team-detail-chip">{FLAGS[t] || "🏳️"} {t} · </span>)}
            </div>
          </div>
          <div className="clasif-pts">{p.total}<span> pts</span></div>
        </div>
      ))}

      <div style={{ textAlign: "center", padding: 14, fontSize: 11, color: "var(--mut)", marginTop: 6 }}>
        Bote total: <strong style={{ color: "var(--gold)" }}>€{bote}</strong> · {PARTICIPANTES.length} participantes · 10€/inscripción
      </div>
    </div>
  );
}

// ─── GRUPOS (para el selector) ───────────────────────────────────────────────
const GRUPOS = {
  g1: { name: "Grupo 1", label: "TOP",      pick: 1, color: "#F5B731", teams: ["Argentina","Francia","Brasil","Inglaterra","España","Alemania","Portugal"] },
  g2: { name: "Grupo 2", label: "BUENOS",   pick: 3, color: "#60AAFF", teams: ["Países Bajos","Bélgica","Croacia","Uruguay","Colombia","Marruecos","México","Estados Unidos","Japón","Suiza","Austria","Ecuador","Corea del Sur","Irán","Australia","Paraguay","Túnez","Argelia","Egipto","Noruega","Suecia"] },
  g3: { name: "Grupo 3", label: "NORMALES", pick: 2, color: "#40D490", teams: ["Canadá","Qatar","Arabia Saudí","Costa de Marfil","Ghana","Sudáfrica","Escocia","Chequia","Turquía","Bosnia y Herzegovina","Uzbekistán","Jordania","Cabo Verde","Panamá"] },
  g4: { name: "Grupo 4", label: "SORPRESAS",pick: 1, color: "#FF6B8A", teams: ["Nueva Zelanda","Curazao","Haití","Irak","R.D. Congo"] },
};

// ─── REGISTRO ─────────────────────────────────────────────────────────────────
function Registro() {
  const [name, setName]       = useState("");
  const [sel, setSel]         = useState({ g1: null, g2: [], g3: [], g4: null });
  const [submitted, setSubmitted] = useState(false);

  const countSel = (gk) => GRUPOS[gk].pick === 1 ? (sel[gk] ? 1 : 0) : sel[gk].length;
  const isSel    = (gk, t) => GRUPOS[gk].pick === 1 ? sel[gk] === t : sel[gk].includes(t);
  const allTeams = () => { const t = []; if (sel.g1) t.push(sel.g1); t.push(...sel.g2, ...sel.g3); if (sel.g4) t.push(sel.g4); return t; };
  const isValid  = () => sel.g1 && sel.g2.length === 3 && sel.g3.length === 2 && sel.g4 && name.trim();

  const toggle = (gk, team) => {
    const g = GRUPOS[gk];
    setSel(prev => {
      if (g.pick === 1) return { ...prev, [gk]: prev[gk] === team ? null : team };
      const arr = prev[gk];
      if (arr.includes(team)) return { ...prev, [gk]: arr.filter(t => t !== team) };
      if (arr.length >= g.pick) return prev;
      return { ...prev, [gk]: [...arr, team] };
    });
  };

  if (submitted) return (
    <div className="page">
      <div className="card" style={{ background: "rgba(34,212,142,0.08)", border: "1px solid rgba(34,212,142,0.3)", textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 22, color: "var(--green)", letterSpacing: 1 }}>¡Inscripción completada!</div>
        <div style={{ fontSize: 13, color: "var(--mut)", marginTop: 6, marginBottom: 16 }}>
          Hola <strong style={{ color: "var(--white)" }}>{name}</strong>, tus equipos han sido registrados.<br/>
          <span style={{ fontSize: 11 }}>(Recuerda que el administrador deberá añadirte manualmente al archivo para que aparezcas en la clasificación)</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
          {allTeams().map(t => <span key={t} className="chip">{FLAGS[t] || "🏳️"} {t}</span>)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      {/* Nombre */}
      <div className="card">
        <div className="sect-title">👤 Tu Nombre</div>
        <input
          className="inp"
          placeholder="¿Cómo te llamas?"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      {/* Progress */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {Object.entries(GRUPOS).map(([k, g]) => {
          const c = countSel(k), done = c === g.pick;
          return (
            <div key={k} style={{ background: done ? `${g.color}15` : "var(--sur)", border: `1px solid ${done ? g.color+"60" : "var(--brd)"}`, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: done ? g.color : "var(--mut)" }}>{g.label}</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 24, color: done ? g.color : "var(--txt)" }}>
                {c}<span style={{ fontSize: 13, color: "var(--mut)" }}>/{g.pick}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selectores por grupo */}
      {Object.entries(GRUPOS).map(([k, g]) => (
        <div className="card" key={k} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 10, padding: "2px 10px", borderRadius: 5, textTransform: "uppercase", background: `${g.color}20`, color: g.color, border: `1px solid ${g.color}50` }}>{g.label}</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--white)" }}>{g.name}</span>
            <span style={{ fontSize: 11, color: "var(--mut)", marginLeft: "auto" }}>Elige {g.pick} · ({countSel(k)}/{g.pick})</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5 }}>
            {g.teams.map(team => {
              const selected = isSel(k, team);
              const disabled = !selected && countSel(k) >= g.pick;
              return (
                <button key={team}
                  onClick={() => !disabled && toggle(k, team)}
                  disabled={disabled}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: selected ? `${g.color}15` : "var(--sur2)",
                    border: `1px solid ${selected ? g.color : "var(--brd)"}`,
                    borderRadius: 8, padding: "7px 9px", cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.3 : 1, color: selected ? g.color : "var(--txt)",
                    fontFamily: "'Barlow',sans-serif", fontSize: 12, width: "100%",
                  }}>
                  <span style={{ fontSize: 14 }}>{FLAGS[team] || "🏳️"}</span>
                  <span>{team}</span>
                  {selected && <span style={{ marginLeft: "auto" }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Resumen */}
      {allTeams().length > 0 && (
        <div style={{ background: "rgba(245,183,49,0.06)", border: "1px solid rgba(245,183,49,0.2)", borderRadius: 12, padding: "13px 16px", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>🗂️ Tu selección</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {allTeams().map(t => <span key={t} className="chip">{FLAGS[t] || "🏳️"} {t}</span>)}
          </div>
        </div>
      )}

      <button
        onClick={() => setSubmitted(true)}
        disabled={!isValid()}
        style={{ width: "100%", padding: 13, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: 2, textTransform: "uppercase", background: "var(--gold)", color: "#080c14", border: "none", borderRadius: 9, cursor: isValid() ? "pointer" : "not-allowed", opacity: isValid() ? 1 : 0.4 }}
      >
        {isValid() ? "✅ Confirmar inscripción" : `Selecciona todos los equipos (${allTeams().length}/7)`}
      </button>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("inicio");
  const bote = PARTICIPANTES.length * 10;

  return (
    <>
      <style>{CSS}</style>
      <div className="hdr">
        <div className="hdr-top">
          <span style={{ fontSize: 28 }}>⚽</span>
          <div>
            <div className="hdr-name">Porra Mundial 2026</div>
            <div className="hdr-sub">USA · México · Canadá</div>
          </div>
          <div className="hdr-bote">
            <div className="hdr-bote-lbl">Bote</div>
            <div className="hdr-bote-val">€{bote}</div>
          </div>
        </div>
        <nav className="nav">
          {[["inicio","Inicio"],["normas","Normas"],["registro","Mis Equipos"],["resultados","Resultados"],["clasificacion","Clasificación"]].map(([id, label]) => (
            <button key={id} className={`nav-btn ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
      </div>

      {tab === "inicio"        && <Inicio goTo={setTab} />}
      {tab === "normas"        && <Normas />}
      {tab === "registro"      && <Registro />}
      {tab === "resultados"    && <Resultados />}
      {tab === "clasificacion" && <Clasificacion />}
    </>
  );
}
