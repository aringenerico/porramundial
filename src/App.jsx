import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://kvdtuogpkpklnqmbcjvo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZHR1b2dwa3BrbG5xbWJjanZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODY2MTQsImV4cCI6MjA5Mjk2MjYxNH0.wad92BnQtbkhH-J8Y1Zlas8_Kxk5wfULd1F9UXJzwNw";
const supabase    = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── FECHA LÍMITE INSCRIPCIÓN ─────────────────────────────────────────────────
// Las inscripciones cierran el 7 de junio de 2026 a las 23:59

const DEADLINE = new Date('2026-06-07T23:59:59');
const inscripcionAbierta = () => new Date() < DEADLINE;

// ─── DATA ─────────────────────────────────────────────────────────────────────

const GRUPOS = {
  g1: { name: "Grupo 1", label: "TOP", pick: 1, color: "#F5B731", badge: "⭐",
    teams: ["Argentina","Francia","Brasil","Inglaterra","España","Alemania","Portugal"] },
  g2: { name: "Grupo 2", label: "BUENOS", pick: 3, color: "#60AAFF", badge: "🔵",
    teams: ["Países Bajos","Bélgica","Croacia","Uruguay","Colombia","Marruecos","México",
            "Estados Unidos","Japón","Suiza","Austria","Ecuador","Corea del Sur","Irán",
            "Australia","Paraguay","Túnez","Argelia","Egipto","Noruega","Suecia"] },
  g3: { name: "Grupo 3", label: "NORMALES", pick: 2, color: "#40D490", badge: "🟢",
    teams: ["Canadá","Qatar","Arabia Saudí","Costa de Marfil","Ghana","Sudáfrica",
            "Escocia","Chequia","Turquía","Bosnia y Herzegovina","Uzbekistán","Jordania",
            "Cabo Verde","Panamá"] },
  g4: { name: "Grupo 4", label: "SORPRESAS", pick: 1, color: "#FF6B8A", badge: "🔮",
    teams: ["Nueva Zelanda","Curazao","Haití","Irak","R.D. Congo"] }
};

const FLAGS = {
  "Argentina":"🇦🇷","Francia":"🇫🇷","Brasil":"🇧🇷","Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","España":"🇪🇸","Alemania":"🇩🇪","Portugal":"🇵🇹",
  "Países Bajos":"🇳🇱","Bélgica":"🇧🇪","Croacia":"🇭🇷","Uruguay":"🇺🇾","Colombia":"🇨🇴","Marruecos":"🇲🇦","México":"🇲🇽",
  "Estados Unidos":"🇺🇸","Japón":"🇯🇵","Suiza":"🇨🇭","Austria":"🇦🇹","Ecuador":"🇪🇨","Corea del Sur":"🇰🇷","Irán":"🇮🇷",
  "Australia":"🇦🇺","Paraguay":"🇵🇾","Túnez":"🇹🇳","Argelia":"🇩🇿","Egipto":"🇪🇬","Noruega":"🇳🇴","Suecia":"🇸🇪",
  "Canadá":"🇨🇦","Qatar":"🇶🇦","Arabia Saudí":"🇸🇦","Costa de Marfil":"🇨🇮","Ghana":"🇬🇭","Sudáfrica":"🇿🇦",
  "Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Chequia":"🇨🇿","Turquía":"🇹🇷","Bosnia y Herzegovina":"🇧🇦","Uzbekistán":"🇺🇿","Jordania":"🇯🇴",
  "Cabo Verde":"🇨🇻","Panamá":"🇵🇦","Nueva Zelanda":"🇳🇿","Curazao":"🇨🇼","Haití":"🇭🇹","Irak":"🇮🇶","R.D. Congo":"🇨🇩"
};

const calcTotal = r =>
  (r?.j1||0)+(r?.j2||0)+(r?.j3||0)+(r?.r32||0)+(r?.r16||0)+(r?.qf||0)+(r?.sf||0)+(r?.final||0);

// ─── STYLES ──────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:      #06090f;
  --sur:     #0c1220;
  --sur2:    #111827;
  --brd:     #1a2438;
  --gold:    #F5B731;
  --gold2:   #c7921b;
  --green:   #22d48e;
  --blue:    #5a9fff;
  --pink:    #ff6b8a;
  --txt:     #c8d0e0;
  --mut:     #4e5e78;
  --white:   #eef2ff;
}

html, body { font-family: 'Barlow', sans-serif; background: var(--bg); color: var(--txt); min-height: 100vh; }

.hdr {
  background: linear-gradient(180deg, #0a1628 0%, #080e1c 100%);
  border-bottom: 1px solid var(--brd);
  padding: 0 20px;
  position: sticky; top: 0; z-index: 50;
}
.hdr-top { display: flex; align-items: center; gap: 14px; padding: 16px 0 12px; }
.hdr-icon { font-size: 30px; }
.hdr-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 900; font-size: 26px;
  letter-spacing: 3px; text-transform: uppercase;
  color: var(--gold); line-height: 1;
}
.hdr-sub { font-size: 11px; color: var(--mut); letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
.hdr-bote {
  margin-left: auto;
  background: rgba(245,183,49,0.1);
  border: 1px solid rgba(245,183,49,0.25);
  border-radius: 8px; padding: 6px 14px; text-align: right;
}
.hdr-bote-lbl { font-size: 10px; color: var(--mut); text-transform: uppercase; letter-spacing: 1px; }
.hdr-bote-val { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 20px; color: var(--gold); }

.hdr-logo { height: 22px; opacity: 0.3; mix-blend-mode: screen; transition: opacity .2s; }
.hdr-logo:hover { opacity: 0.5; }

.app-footer {
  text-align: center; padding: 32px 20px 24px;
  font-size: 11px; color: var(--mut);
  letter-spacing: 1px; border-top: 1px solid var(--brd);
  margin-top: 8px;
}

.nav { display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none; }
.nav::-webkit-scrollbar { display: none; }
.nav-btn {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700; font-size: 13px;
  letter-spacing: 1.5px; text-transform: uppercase;
  background: none; border: none; cursor: pointer;
  color: var(--mut); padding: 10px 16px;
  border-bottom: 2px solid transparent;
  white-space: nowrap; transition: color .2s;
}
.nav-btn:hover { color: var(--txt); }
.nav-btn.on { color: var(--gold); border-bottom-color: var(--gold); }

.page { padding: 24px 20px; max-width: 860px; margin: 0 auto; }

.card { background: var(--sur); border: 1px solid var(--brd); border-radius: 12px; padding: 20px; margin-bottom: 16px; }
.sect-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800; font-size: 20px;
  letter-spacing: 2px; text-transform: uppercase;
  color: var(--white); margin-bottom: 14px;
  display: flex; align-items: center; gap: 8px;
}

.hero {
  background: linear-gradient(135deg, #0e1e38, #091428);
  border: 1px solid var(--brd); border-radius: 16px;
  padding: 36px 28px; text-align: center; margin-bottom: 20px;
  position: relative; overflow: hidden;
}
.hero::before {
  content: '⚽'; font-size: 200px; position: absolute;
  top: -40px; right: -40px; opacity: 0.04; pointer-events: none;
}
.hero-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 900; font-size: 48px; letter-spacing: 4px;
  text-transform: uppercase; color: var(--gold);
  text-shadow: 0 0 40px rgba(245,183,49,0.3); line-height: 1;
}
.hero-sub { font-size: 14px; color: var(--mut); letter-spacing: 2px; text-transform: uppercase; margin-top: 6px; }
.hero-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 28px; }
.hero-stat { background: rgba(255,255,255,0.04); border: 1px solid var(--brd); border-radius: 10px; padding: 14px 10px; }
.hero-stat-val { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 28px; color: var(--white); }
.hero-stat-lbl { font-size: 11px; color: var(--mut); text-transform: uppercase; letter-spacing: 1px; }

.scoring-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.scoring-item { background: var(--sur2); border: 1px solid var(--brd); border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; }
.scoring-icon { font-size: 22px; width: 30px; text-align: center; }
.scoring-pts { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 22px; color: var(--gold); margin-left: auto; white-space: nowrap; }
.scoring-lbl { font-size: 13px; color: var(--txt); font-weight: 600; }
.scoring-note { font-size: 11px; color: var(--mut); }

.grupo-strip { display: flex; align-items: center; gap: 10px; background: var(--sur2); border: 1px solid var(--brd); border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; }
.grupo-badge { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 11px; letter-spacing: 1px; padding: 3px 10px; border-radius: 5px; text-transform: uppercase; min-width: 80px; text-align: center; }
.grupo-pick { font-size: 12px; color: var(--mut); margin-left: auto; }

.premio-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
.premio-card { border-radius: 10px; padding: 14px; text-align: center; border: 1px solid; }
.premio-medal { font-size: 28px; margin-bottom: 6px; }
.premio-pct { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 26px; }
.premio-lbl { font-size: 11px; color: var(--mut); text-transform: uppercase; letter-spacing: 1px; }

.sel-progress { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 20px; }
.sel-prog-item { border-radius: 10px; padding: 10px 12px; border: 1px solid; text-align: center; transition: all .2s; }
.sel-prog-g { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
.sel-prog-count { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 28px; line-height: 1.1; }

.group-section { margin-bottom: 20px; }
.group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.group-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 16px; letter-spacing: 1px; text-transform: uppercase; }
.group-limit { font-size: 12px; color: var(--mut); }

.teams-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; }
.team-btn {
  display: flex; align-items: center; gap: 8px;
  background: var(--sur2); border: 1px solid var(--brd);
  border-radius: 8px; padding: 8px 10px;
  cursor: pointer; transition: all .15s; text-align: left;
  font-family: 'Barlow', sans-serif; font-size: 13px; color: var(--txt);
}
.team-btn:hover { border-color: rgba(255,255,255,0.2); color: var(--white); }
.team-btn.sel { border-color: currentColor; color: var(--white); background: rgba(0,0,0,0.3); }
.team-btn.dis { opacity: 0.35; cursor: not-allowed; }
.team-flag { font-size: 16px; }

.sel-summary { background: rgba(245,183,49,0.06); border: 1px solid rgba(245,183,49,0.2); border-radius: 12px; padding: 16px 18px; margin-top: 4px; }
.sum-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }
.sum-teams { display: flex; flex-wrap: wrap; gap: 6px; }
.sum-chip { display: inline-flex; align-items: center; gap: 5px; background: var(--sur2); border: 1px solid var(--brd); border-radius: 6px; padding: 4px 10px; font-size: 12px; }

.inp {
  width: 100%; background: var(--sur2); border: 1px solid var(--brd);
  border-radius: 8px; padding: 10px 14px; color: var(--white);
  font-family: 'Barlow', sans-serif; font-size: 14px;
  outline: none; transition: border-color .2s; margin-bottom: 10px;
}
.inp:focus { border-color: var(--gold); }

.btn-primary {
  width: 100%; padding: 13px;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800; font-size: 15px; letter-spacing: 2px; text-transform: uppercase;
  background: var(--gold); color: #080c14;
  border: none; border-radius: 9px; cursor: pointer; transition: opacity .2s;
}
.btn-primary:hover { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

.success-box { background: rgba(34,212,142,0.08); border: 1px solid rgba(34,212,142,0.3); border-radius: 12px; padding: 20px; text-align: center; }
.error-box { background: rgba(255,107,138,0.08); border: 1px solid rgba(255,107,138,0.3); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 13px; color: #ff6b8a; }
.closed-box { background: rgba(78,94,120,0.15); border: 1px solid rgba(78,94,120,0.4); border-radius: 12px; padding: 40px 20px; text-align: center; }

.res-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.res-table th { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--mut); padding: 6px 10px; text-align: center; border-bottom: 1px solid var(--brd); }
.res-table th:first-child { text-align: left; }
.res-table td { padding: 10px; text-align: center; border-bottom: 1px solid rgba(30,41,64,0.5); }
.res-table td:first-child { text-align: left; }
.res-table tr:last-child td { border-bottom: none; }
.res-table tr:hover td { background: rgba(255,255,255,0.02); }
.res-team { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--white); }
.res-pts { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 15px; }
.res-zero { color: var(--mut); }
.res-total { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 16px; color: var(--gold); }

.podium { display: grid; grid-template-columns: 1fr 1.1fr 1fr; gap: 12px; margin-bottom: 20px; align-items: end; }
.podium-card { border-radius: 12px; border: 1px solid; padding: 16px 12px; text-align: center; }
.podium-medal { font-size: 32px; margin-bottom: 8px; }
.podium-name { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 18px; color: var(--white); text-transform: uppercase; letter-spacing: 1px; }
.podium-pts { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 28px; margin: 4px 0; }
.podium-pts span { font-size: 13px; color: var(--mut); }
.podium-premio { font-size: 13px; margin-top: 4px; font-weight: 600; }
.podium-teams { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; margin-top: 8px; }
.podium-team-chip { font-size: 10px; background: rgba(255,255,255,0.06); border-radius: 4px; padding: 2px 6px; }

.clasif-row { display: flex; align-items: center; gap: 14px; background: var(--sur); border: 1px solid var(--brd); border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; }
.clasif-pos { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 22px; color: var(--mut); width: 28px; text-align: center; }
.clasif-name { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 17px; color: var(--white); text-transform: uppercase; letter-spacing: 1px; }
.clasif-teams-mini { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 3px; }
.clasif-team-chip { font-size: 11px; color: var(--mut); }
.clasif-pts { margin-left: auto; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 26px; color: var(--gold); }
.clasif-pts span { font-size: 12px; color: var(--mut); }
`;

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function InicioPage({ participants, goTo }) {
  const bote   = participants.length * 10;
  const abierta = inscripcionAbierta();
  return (
    <div className="page">
      <div className="hero">
        <div className="hero-title">🏆 Porra Mundial 2026</div>
        <div className="hero-sub">USA · México · Canadá &nbsp;|&nbsp; 11 Jun – 19 Jul 2026</div>
        <div className="hero-grid">
          <div className="hero-stat">
            <div className="hero-stat-val">{participants.length}</div>
            <div className="hero-stat-lbl">Participantes</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val" style={{color:"var(--gold)"}}>€{bote}</div>
            <div className="hero-stat-lbl">Bote total</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val">7</div>
            <div className="hero-stat-lbl">Equipos/porra</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="sect-title">🎯 ¿Cómo funciona?</div>
        <div style={{display:"grid",gap:"10px"}}>
          {[
            {n:"1",t:"Elige 7 equipos",d:"1 TOP + 3 BUENOS + 2 NORMALES + 1 SORPRESA"},
            {n:"2",t:"Acumula puntos",d:"Tus equipos suman puntos por goles, victorias y fases superadas"},
            {n:"3",t:"Gana el bote",d:"El que más puntos acumule al final del torneo se lleva el 75%"},
          ].map(s => (
            <div key={s.n} style={{display:"flex",gap:"14px",alignItems:"flex-start",background:"var(--sur2)",border:"1px solid var(--brd)",borderRadius:"10px",padding:"14px"}}>
              <div style={{background:"var(--gold)",color:"#080c14",width:"28px",height:"28px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:"900",fontSize:"16px",flexShrink:0}}>{s.n}</div>
              <div>
                <div style={{fontWeight:"600",color:"var(--white)",marginBottom:"2px"}}>{s.t}</div>
                <div style={{fontSize:"13px",color:"var(--mut)"}}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{background:"linear-gradient(135deg,#0e1e38,#091428)"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",textAlign:"center"}}>
          {[{lbl:"1er Premio",pct:"75%",col:"var(--gold)",amt:Math.round(bote*0.75)},
            {lbl:"2º Premio",pct:"20%",col:"#c0c8d8",amt:Math.round(bote*0.20)},
            {lbl:"3er Premio",pct:"5%",col:"#a07040",amt:Math.round(bote*0.05)}].map(p=>(
            <div key={p.lbl} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${p.col}40`,borderRadius:"10px",padding:"14px"}}>
              <div style={{fontSize:"22px",marginBottom:"4px"}}>{p.lbl==="1er Premio"?"🥇":p.lbl==="2º Premio"?"🥈":"🥉"}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:"900",fontSize:"26px",color:p.col}}>{p.pct}</div>
              <div style={{fontSize:"11px",color:"var(--mut)"}}>{p.lbl}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:"700",fontSize:"16px",color:p.col,marginTop:"4px"}}>~€{p.amt}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:"14px",fontSize:"12px",color:"var(--mut)"}}>
          Inscripción: <strong style={{color:"var(--gold)"}}>10€</strong> por participante
        </div>
      </div>

      {abierta ? (
        <button className="btn-primary" onClick={() => goTo('seleccion')}>
          ⚡ Registrarme y elegir equipos
        </button>
      ) : (
        <div style={{textAlign:"center",padding:"14px 0",fontSize:"13px",color:"var(--mut)"}}>
          🔒 El plazo de inscripción finalizó el 7 de junio de 2026
        </div>
      )}
    </div>
  );
}

function NormasPage() {
  const scoring = [
    {icon:"⚽",lbl:"Gol marcado",pts:1,note:""},
    {icon:"🏆",lbl:"Partido ganado",pts:3,note:"No cuenta prórroga"},
    {icon:"🤝",lbl:"Partido empatado",pts:1,note:"No cuenta prórroga"},
    {icon:"➡️",lbl:"Pasar de fase",pts:6,note:"Por cada fase superada"},
    {icon:"🥇",lbl:"Ganar el campeonato",pts:10,note:"Bonus final"},
    {icon:"👟",lbl:"Pichichi del Mundial",pts:8,note:"Si está en tu selección"},
    {icon:"🛡️",lbl:"Equipo menos goleado",pts:6,note:"Solo semifinalistas"},
  ];
  return (
    <div className="page">
      <div className="card">
        <div className="sect-title">📋 Selección de Equipos</div>
        {Object.entries(GRUPOS).map(([key,g]) => (
          <div className="grupo-strip" key={key}>
            <div className="grupo-badge" style={{background:`${g.color}22`,color:g.color,border:`1px solid ${g.color}55`}}>
              {g.badge} {g.label}
            </div>
            <div style={{fontSize:"13px",color:"var(--txt)"}}>Elegir <strong style={{color:"var(--white)"}}>{g.pick}</strong> equipo{g.pick>1?"s":""}</div>
            <div className="grupo-pick">{g.teams.length} equipos disponibles</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="sect-title">⚡ Sistema de Puntuación</div>
        <div className="scoring-grid">
          {scoring.map((s,i) => (
            <div className="scoring-item" key={i}>
              <span className="scoring-icon">{s.icon}</span>
              <div>
                <div className="scoring-lbl">{s.lbl}</div>
                {s.note && <div className="scoring-note">{s.note}</div>}
              </div>
              <div className="scoring-pts">+{s.pts}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="sect-title">💰 Reparto de Premios</div>
        <div className="premio-grid">
          {[{medal:"🥇",pos:"Ganador",pct:75,col:"var(--gold)"},{medal:"🥈",pos:"2º Puesto",pct:20,col:"#b0b8cc"},{medal:"🥉",pos:"3er Puesto",pct:5,col:"#9a7050"}].map(p=>(
            <div className="premio-card" key={p.pos} style={{background:`${p.col}10`,borderColor:`${p.col}40`}}>
              <div className="premio-medal">{p.medal}</div>
              <div className="premio-pct" style={{color:p.col}}>{p.pct}%</div>
              <div className="premio-lbl">{p.pos}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:"12px",padding:"12px 14px",background:"rgba(245,183,49,0.06)",border:"1px solid rgba(245,183,49,0.15)",borderRadius:"8px",fontSize:"13px",color:"var(--mut)"}}>
          🎟️ Inscripción: <strong style={{color:"var(--gold)"}}>10€</strong> por participante · En caso de empate, el premio se reparte a partes iguales
        </div>
      </div>

      <div className="card">
        <div className="sect-title">📅 Formato del torneo</div>
        {[{fase:"Fase de Grupos",partidos:"Jornadas 1, 2 y 3"},{fase:"Dieciseisavos de Final",partidos:"32 equipos → 16"},{fase:"Octavos de Final",partidos:"16 equipos → 8"},{fase:"Cuartos de Final",partidos:"8 equipos → 4"},{fase:"Semifinales",partidos:"4 equipos → 2"},{fase:"Final",partidos:"Campeón del Mundo"}].map((f,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--brd)"}}>
            <span style={{fontWeight:"600",color:"var(--white)",fontSize:"14px"}}>{f.fase}</span>
            <span style={{fontSize:"12px",color:"var(--mut)"}}>{f.partidos}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeleccionPage({ onSubmit }) {
  const [name, setName]             = useState('');
  const [sel, setSel]               = useState({ g1: null, g2: [], g3: [], g4: null });
  const [done, setDone]             = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  if (!inscripcionAbierta()) return (
    <div className="page">
      <div className="closed-box">
        <div style={{fontSize:"52px",marginBottom:"16px"}}>🔒</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:"800",fontSize:"24px",color:"var(--white)",letterSpacing:"2px",marginBottom:"8px"}}>
          INSCRIPCIONES CERRADAS
        </div>
        <div style={{fontSize:"14px",color:"var(--mut)"}}>
          El plazo de inscripción finalizó el <strong style={{color:"var(--txt)"}}>7 de junio de 2026</strong>
        </div>
      </div>
    </div>
  );

  const toggle = (gKey, team) => {
    const g = GRUPOS[gKey];
    setSel(prev => {
      if (g.pick === 1) return { ...prev, [gKey]: prev[gKey] === team ? null : team };
      const arr = prev[gKey];
      if (arr.includes(team)) return { ...prev, [gKey]: arr.filter(t => t !== team) };
      if (arr.length >= g.pick) return prev;
      return { ...prev, [gKey]: [...arr, team] };
    });
  };

  const isSelected = (gKey, team) => GRUPOS[gKey].pick === 1 ? sel[gKey] === team : sel[gKey].includes(team);
  const countSel   = (gKey) => GRUPOS[gKey].pick === 1 ? (sel[gKey] ? 1 : 0) : sel[gKey].length;
  const allSelected = () => sel.g1 && sel.g2.length === 3 && sel.g3.length === 2 && sel.g4;
  const allTeams = () => {
    const t = [];
    if (sel.g1) t.push(sel.g1);
    t.push(...sel.g2, ...sel.g3);
    if (sel.g4) t.push(sel.g4);
    return t;
  };

  const handleSubmit = async () => {
    if (!name.trim() || !allSelected() || submitting) return;
    setSubmitting(true);
    setError('');
    const ok = await onSubmit({ name: name.trim(), teams: allTeams() });
    if (ok) {
      setDone(true);
    } else {
      setError('Ese nombre ya está registrado. Prueba con otro.');
      setSubmitting(false);
    }
  };

  if (done) return (
    <div className="page">
      <div className="success-box">
        <div style={{fontSize:"48px",marginBottom:"12px"}}>✅</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:"800",fontSize:"22px",color:"var(--green)",letterSpacing:"1px"}}>¡Inscripción completada!</div>
        <div style={{fontSize:"14px",color:"var(--mut)",marginTop:"6px"}}>Tus equipos han sido registrados. ¡Mucha suerte!</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",justifyContent:"center",marginTop:"16px"}}>
          {allTeams().map(t => <span key={t} className="sum-chip">{FLAGS[t]||"🏳️"} {t}</span>)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="card">
        <div className="sect-title">👤 Tu Nombre</div>
        {error && <div className="error-box">⚠️ {error}</div>}
        <input className="inp" placeholder="¿Cómo te llamas?" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="sel-progress">
        {Object.entries(GRUPOS).map(([key,g]) => {
          const c = countSel(key);
          const complete = c === g.pick;
          return (
            <div className="sel-prog-item" key={key} style={{
              background: complete ? `${g.color}15` : "var(--sur)",
              borderColor: complete ? `${g.color}60` : "var(--brd)"
            }}>
              <div className="sel-prog-g" style={{color: complete ? g.color : "var(--mut)"}}>{g.label}</div>
              <div className="sel-prog-count" style={{color: complete ? g.color : "var(--txt)"}}>
                {c}<span style={{fontSize:"14px",color:"var(--mut)"}}>/{g.pick}</span>
              </div>
            </div>
          );
        })}
      </div>

      {Object.entries(GRUPOS).map(([key,g]) => (
        <div className="card group-section" key={key}>
          <div className="group-header">
            <span className="grupo-badge" style={{background:`${g.color}20`,color:g.color,border:`1px solid ${g.color}50`}}>{g.badge} {g.label}</span>
            <span className="group-title" style={{color:"var(--white)"}}>{g.name}</span>
            <span className="group-limit">Elige {g.pick} · ({countSel(key)}/{g.pick})</span>
          </div>
          <div className="teams-grid">
            {g.teams.map(team => {
              const selected = isSelected(key, team);
              const disabled = !selected && countSel(key) >= g.pick;
              return (
                <button key={team}
                  className={`team-btn ${selected ? "sel" : ""} ${disabled ? "dis" : ""}`}
                  style={selected ? {color:g.color,borderColor:g.color,background:`${g.color}12`} : {}}
                  onClick={() => !disabled && toggle(key, team)}
                  disabled={disabled}
                >
                  <span className="team-flag">{FLAGS[team]||"🏳️"}</span>
                  <span style={{fontSize:"12px"}}>{team}</span>
                  {selected && <span style={{marginLeft:"auto",fontSize:"14px"}}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {allTeams().length > 0 && (
        <div className="sel-summary">
          <div className="sum-title">🗂️ Tus equipos seleccionados</div>
          <div className="sum-teams">
            {allTeams().map(t => <span key={t} className="sum-chip">{FLAGS[t]||"🏳️"} {t}</span>)}
          </div>
        </div>
      )}

      <div style={{marginTop:"16px"}}>
        <button className="btn-primary" onClick={handleSubmit} disabled={!name.trim() || !allSelected() || submitting}>
          {submitting ? "⏳ Guardando..." : allSelected() && name.trim() ? "✅ Confirmar inscripción" : `Selecciona todos los equipos (${allTeams().length}/7)`}
        </button>
      </div>
    </div>
  );
}

function ResultadosPage({ resultsMap, onRefresh }) {
  const cols = [
    {k:"j1",lbl:"J1"},{k:"j2",lbl:"J2"},{k:"j3",lbl:"J3"},
    {k:"r32",lbl:"1/32"},{k:"r16",lbl:"1/16"},{k:"qf",lbl:"QF"},
    {k:"sf",lbl:"SF"},{k:"final",lbl:"FIN"}
  ];

  const sorted = Object.values(resultsMap)
    .map(r => ({ ...r, _total: calcTotal(r) }))
    .sort((a, b) => b._total - a._total);

  if (sorted.length === 0) return (
    <div className="page">
      <div className="card" style={{textAlign:"center",padding:"48px 20px"}}>
        <div style={{fontSize:"48px",marginBottom:"12px"}}>⏳</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:"700",fontSize:"18px",color:"var(--mut)",letterSpacing:"1px"}}>
          LOS RESULTADOS SE PUBLICARÁN CUANDO ARRANQUE EL TORNEO
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="card">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
          <div className="sect-title" style={{marginBottom:0}}>📊 Resultados por Equipo</div>
          <button onClick={onRefresh} style={{background:"var(--sur2)",border:"1px solid var(--brd)",borderRadius:"7px",padding:"6px 12px",color:"var(--mut)",cursor:"pointer",fontSize:"12px",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"1px"}}>↻ Actualizar</button>
        </div>
        <div style={{overflowX:"auto"}}>
          <table className="res-table">
            <thead>
              <tr>
                <th style={{textAlign:"left"}}>Equipo</th>
                {cols.map(c => <th key={c.k}>{c.lbl}</th>)}
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={r.team}>
                  <td>
                    <div className="res-team">
                      <span style={{width:"22px",textAlign:"center",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:"700",fontSize:"13px",color:"var(--mut)"}}>{i+1}</span>
                      <span>{FLAGS[r.team]||"🏳️"}</span>
                      <span>{r.team}</span>
                    </div>
                  </td>
                  {cols.map(c => (
                    <td key={c.k} className={r[c.k] ? "res-pts" : "res-zero"}>{r[c.k] || "—"}</td>
                  ))}
                  <td className="res-total">{r._total || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ClasificacionPage({ participants, onRefresh }) {
  const sorted     = [...participants].sort((a, b) => b.total - a.total);
  const bote       = participants.length * 10;
  const top3       = sorted.slice(0, 3);
  const showPodium = top3.length >= 2;
  const rest       = showPodium ? sorted.slice(3) : sorted;
  const premios    = [Math.round(bote*0.75), Math.round(bote*0.20), Math.round(bote*0.05)];
  const medals     = ["🥇","🥈","🥉"];
  const podColors  = ["var(--gold)","#b0b8cc","#9a7050"];
  const podBg      = ["rgba(245,183,49,0.08)","rgba(176,184,204,0.06)","rgba(154,112,80,0.06)"];

  if (participants.length === 0) return (
    <div className="page">
      <div className="card" style={{textAlign:"center",padding:"48px 20px"}}>
        <div style={{fontSize:"48px",marginBottom:"12px"}}>👥</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:"700",fontSize:"18px",color:"var(--mut)",letterSpacing:"1px"}}>
          AÚN NO HAY PARTICIPANTES
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      {showPodium && (
        <div className="podium">
          {[top3[1], top3[0], top3[2]].filter(Boolean).map((p, i) => {
            const realIdx = i === 0 ? 1 : i === 1 ? 0 : 2;
            return (
              <div className="podium-card" key={p.name}
                style={{background:podBg[realIdx],borderColor:`${podColors[realIdx]}40`,
                        order: realIdx === 0 ? 2 : realIdx === 1 ? 1 : 3}}>
                <div className="podium-medal">{medals[realIdx]}</div>
                <div className="podium-name">{p.name}</div>
                <div className="podium-pts" style={{color:podColors[realIdx]}}>
                  {p.total}<span> pts</span>
                </div>
                <div className="podium-premio" style={{color:podColors[realIdx]}}>€{premios[realIdx]}</div>
                <div className="podium-teams">
                  {p.teams.map(t => <span key={t} className="podium-team-chip">{FLAGS[t]||"🏳️"} {t}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rest.map((p, i) => (
        <div className="clasif-row" key={p.name}>
          <div className="clasif-pos">{showPodium ? i + 4 : i + 1}</div>
          <div>
            <div className="clasif-name">{p.name}</div>
            <div className="clasif-teams-mini">
              {p.teams.map(t => <span key={t} className="clasif-team-chip">{FLAGS[t]||"🏳️"} {t} · </span>)}
            </div>
          </div>
          <div className="clasif-pts">{p.total}<span> pts</span></div>
        </div>
      ))}

      <div style={{textAlign:"center",padding:"14px",fontSize:"12px",color:"var(--mut)",marginTop:"8px"}}>
        Bote total: <strong style={{color:"var(--gold)"}}>€{bote}</strong> · {participants.length} participantes · 10€/inscripción
        <br/>
        <button onClick={onRefresh} style={{marginTop:"10px",background:"var(--sur2)",border:"1px solid var(--brd)",borderRadius:"7px",padding:"6px 16px",color:"var(--mut)",cursor:"pointer",fontSize:"12px",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"1px"}}>↻ Actualizar clasificación</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab]                   = useState('inicio');
  const [participants, setParticipants] = useState([]);
  const [resultsMap, setResultsMap]     = useState({});
  const [loading, setLoading]           = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [{ data: parts }, { data: res }] = await Promise.all([
      supabase.from('participants').select('*').order('created_at'),
      supabase.from('results').select('*')
    ]);
    setParticipants(parts || []);
    const map = {};
    (res || []).forEach(r => { map[r.team] = r; });
    setResultsMap(map);
    setLoading(false);
  }

  const calcParticipantTotal = (teams) =>
    (teams || []).reduce((sum, team) => sum + calcTotal(resultsMap[team] || {}), 0);

  const participantsWithTotals = participants.map(p => ({
    ...p,
    total: calcParticipantTotal(p.teams)
  }));

  async function handleRegister({ name, teams }) {
    const { error } = await supabase.from('participants').insert({ name, teams });
    if (!error) {
      await loadData();
      setTimeout(() => setTab('clasificacion'), 1500);
      return true;
    }
    return false;
  }

  const bote = participantsWithTotals.length * 10;

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--bg)"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"22px",color:"var(--gold)",letterSpacing:"4px",textTransform:"uppercase"}}>
          ⚽ Cargando...
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="hdr">
        <div className="hdr-top">
          <span className="hdr-icon">⚽</span>
          <div>
            <div className="hdr-name">Porra Mundial 2026</div>
            <div className="hdr-sub">USA · México · Canadá</div>
          </div>
          <div className="hdr-bote">
            <div className="hdr-bote-lbl">Bote</div>
            <div className="hdr-bote-val">€{bote}</div>
          </div>
          <img src="/timestamp-logo.png" alt="Timestamp" className="hdr-logo" />
        </div>
        <nav className="nav">
          {[{id:'inicio',l:'Inicio'},{id:'normas',l:'Normas'},{id:'seleccion',l:'Mis Equipos'},{id:'resultados',l:'Resultados'},{id:'clasificacion',l:'Clasificación'}].map(t=>(
            <button key={t.id} className={`nav-btn ${tab===t.id?'on':''}`}
              onClick={() => { setTab(t.id); if(t.id==='resultados'||t.id==='clasificacion') loadData(); }}>
              {t.l}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'inicio'        && <InicioPage participants={participantsWithTotals} goTo={setTab} />}
      {tab === 'normas'        && <NormasPage />}
      {tab === 'seleccion'     && <SeleccionPage onSubmit={handleRegister} />}
      {tab === 'resultados'    && <ResultadosPage resultsMap={resultsMap} onRefresh={loadData} />}
      {tab === 'clasificacion' && <ClasificacionPage participants={participantsWithTotals} onRefresh={loadData} />}

      <div className="app-footer">
        Created by Aitor Alegría &amp; Gorka Barroso
      </div>
    </>
  );
}
