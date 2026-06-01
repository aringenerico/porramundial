import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { FlagChip } from './design/FlagChip';
import { Icon } from './design/Icon';

const SUPABASE_URL = "https://kvdtuogpkpklnqmbcjvo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZHR1b2dwa3BrbG5xbWJjanZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODY2MTQsImV4cCI6MjA5Mjk2MjYxNH0.wad92BnQtbkhH-J8Y1Zlas8_Kxk5wfULd1F9UXJzwNw";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEADLINE    = new Date('2026-06-07T23:59:59');
const AWARD_BONUS = 10;
const PAGE_SIZE   = 20;
const norm = s => (s||'').trim().toLowerCase();
const isRegistrationOpen = () => new Date() < DEADLINE;

const GROUPS = {
  g1: { name:"Group 1", label:"TOP",      pick:1, color:"#F5B731",
    teams:["Argentina","France","Brazil","England","Spain","Germany","Portugal"] },
  g2: { name:"Group 2", label:"STRONG",   pick:3, color:"#60AAFF",
    teams:["Netherlands","Belgium","Croatia","Uruguay","Colombia","Morocco","Mexico",
           "United States","Japan","Switzerland","Austria","Ecuador","South Korea","Iran",
           "Australia","Paraguay","Tunisia","Algeria","Egypt","Norway","Sweden"] },
  g3: { name:"Group 3", label:"AVERAGE",  pick:2, color:"#40D490",
    teams:["Canada","Qatar","Saudi Arabia","Ivory Coast","Ghana","South Africa",
           "Scotland","Czech Republic","Turkey","Bosnia and Herzegovina","Uzbekistan","Jordan",
           "Cape Verde","Panama"] },
  g4: { name:"Group 4", label:"SURPRISE", pick:1, color:"#FF6B8A",
    teams:["New Zealand","Curacao","Haiti","Iraq","DR Congo"] }
};


const AWARD_CONFIG = [
  { key:"top_scorer",      col:"top_scorer",      label:"Top Scorer",             icon:"boot"  },
  { key:"mvp",             col:"mvp",             label:"Tournament MVP",          icon:"mvp"   },
  { key:"best_young",      col:"best_young",      label:"Best Young Player (U21)", icon:"star"  },
  { key:"best_goalkeeper", col:"best_goalkeeper", label:"Best Goalkeeper",         icon:"glove" },
];

const calcTotal = r =>
  (r?.j1||0)+(r?.j2||0)+(r?.j3||0)+(r?.r32||0)+(r?.r16||0)+(r?.qf||0)+(r?.sf||0)+(r?.final||0);

// ── Tier helpers ──────────────────────────────────────────────
const TEAM_TIER = (() => {
  const map = {};
  Object.entries(GROUPS).forEach(([key,g]) => g.teams.forEach(t => { map[t] = key; }));
  return map;
})();
const tierOf = team => GROUPS[TEAM_TIER[team]] || null;

// ── Team status helpers ───────────────────────────────────────
const ROUND_ORDER = ['j1','j2','j3','r32','r16','qf','sf','final'];
const ROUND_LABEL = {
  j1:'Jornada 1', j2:'Jornada 2', j3:'Jornada 3',
  r32:'Dieciseisavos', r16:'Octavos', qf:'Cuartos', sf:'Semifinal', final:'Final',
};
function tournamentStage(resultsMap) {
  let maxIdx = -1;
  Object.values(resultsMap||{}).forEach(r => {
    ROUND_ORDER.forEach((col,i) => { if ((r?.[col]||0) > 0 && i > maxIdx) maxIdx = i; });
  });
  return maxIdx;
}
function teamStatus(team, resultsMap) {
  const r = resultsMap?.[team];
  const stageIdx = tournamentStage(resultsMap);
  if (stageIdx < 0 || !r) return { state:'pending', reachedIdx:-1, label:'Por empezar' };
  let reachedIdx = -1;
  ROUND_ORDER.forEach((col,i) => { if ((r[col]||0) > 0) reachedIdx = i; });
  if ((r.final||0) > 0 && stageIdx === ROUND_ORDER.length - 1)
    return { state:'champion', reachedIdx, label:'Campeón' };
  if (reachedIdx >= stageIdx)
    return { state:'alive', reachedIdx, label: ROUND_LABEL[ROUND_ORDER[reachedIdx]] || '—' };
  return { state:'out', reachedIdx, label:`Cayó en ${ROUND_LABEL[ROUND_ORDER[reachedIdx]]||'grupos'}` };
}

// ── Tiebreaker scoring (same formula as Porra Dani) ──────────
// +0.5 home goals exact · +0.5 away goals exact · +1 result (W/D/L) · +1 exact score bonus
// Max 3 pts per match. Does NOT add to general score — only used for tie-breaking.
function calcTbScore(pred, match) {
  if (!match || match.home_goals == null || match.away_goals == null) return { total: 0, exact: 0 };
  let pts = 0;
  if (pred.home_goals === match.home_goals) pts += 0.5;
  if (pred.away_goals === match.away_goals) pts += 0.5;
  const ps = Math.sign(pred.home_goals - pred.away_goals);
  const ms = Math.sign(match.home_goals - match.away_goals);
  if (ps === ms) pts += 1;
  const exact = pred.home_goals === match.home_goals && pred.away_goals === match.away_goals;
  if (exact) pts += 1;
  return { total: pts, exact: exact ? 1 : 0 };
}

// Admin access is controlled server-side via the `admins` table in Supabase (Phase 3).
const FD_TEAM_MAP = {
  'Korea Republic':'South Korea',"Côte d'Ivoire":'Ivory Coast','IR Iran':'Iran',
  'Congo DR':'DR Congo','Democratic Republic of Congo':'DR Congo','Curaçao':'Curacao',
  'Bosnia-Herzegovina':'Bosnia and Herzegovina','USA':'United States',
};
const normTeam = n => FD_TEAM_MAP[n] || n;
const STAGE_COL = {
  'ROUND_OF_32':'r32','LAST_32':'r32','ROUND_OF_16':'r16','LAST_16':'r16',
  'QUARTER_FINALS':'qf','SEMI_FINALS':'sf','FINAL':'final',
};

const ALL_TEAMS = Object.values(GROUPS).flatMap(g=>g.teams).sort();
const KNOCKOUT_ROUNDS = [
  {col:'r32',label:'Dieciseisavos'},{col:'r16',label:'Octavos'},
  {col:'qf',label:'Cuartos'},{col:'sf',label:'Semifinal'},{col:'final',label:'Final'},
];

const FIXTURES = {
  j1:[
    {home:'Mexico',away:'South Africa',group:'A'},
    {home:'South Korea',away:'Czech Republic',group:'A'},
    {home:'Canada',away:'Bosnia and Herzegovina',group:'B'},
    {home:'United States',away:'Paraguay',group:'D'},
    {home:'Qatar',away:'Switzerland',group:'B'},
    {home:'Brazil',away:'Morocco',group:'C'},
    {home:'Haiti',away:'Scotland',group:'C'},
    {home:'Australia',away:'Turkey',group:'D'},
    {home:'Germany',away:'Curacao',group:'E'},
    {home:'Netherlands',away:'Japan',group:'F'},
    {home:'Ivory Coast',away:'Ecuador',group:'E'},
    {home:'Sweden',away:'Tunisia',group:'F'},
    {home:'Spain',away:'Cape Verde',group:'H'},
    {home:'Belgium',away:'Egypt',group:'G'},
    {home:'Saudi Arabia',away:'Uruguay',group:'H'},
    {home:'Iran',away:'New Zealand',group:'G'},
    {home:'France',away:'Senegal',group:'I'},
    {home:'Iraq',away:'Norway',group:'I'},
    {home:'Argentina',away:'Algeria',group:'J'},
    {home:'Austria',away:'Jordan',group:'J'},
    {home:'Portugal',away:'DR Congo',group:'K'},
    {home:'England',away:'Croatia',group:'L'},
    {home:'Ghana',away:'Panama',group:'L'},
    {home:'Uzbekistan',away:'Colombia',group:'K'},
  ],
  j2:[
    {home:'Czech Republic',away:'South Africa',group:'A'},
    {home:'Switzerland',away:'Bosnia and Herzegovina',group:'B'},
    {home:'Canada',away:'Qatar',group:'B'},
    {home:'Mexico',away:'South Korea',group:'A'},
    {home:'United States',away:'Australia',group:'D'},
    {home:'Scotland',away:'Morocco',group:'C'},
    {home:'Brazil',away:'Haiti',group:'C'},
    {home:'Turkey',away:'Paraguay',group:'D'},
    {home:'Netherlands',away:'Sweden',group:'F'},
    {home:'Germany',away:'Ivory Coast',group:'E'},
    {home:'Ecuador',away:'Curacao',group:'E'},
    {home:'Tunisia',away:'Japan',group:'F'},
    {home:'Spain',away:'Saudi Arabia',group:'H'},
    {home:'Belgium',away:'Iran',group:'G'},
    {home:'Uruguay',away:'Cape Verde',group:'H'},
    {home:'New Zealand',away:'Egypt',group:'G'},
    {home:'Argentina',away:'Austria',group:'J'},
    {home:'France',away:'Iraq',group:'I'},
    {home:'Norway',away:'Senegal',group:'I'},
    {home:'Jordan',away:'Algeria',group:'J'},
    {home:'Portugal',away:'Uzbekistan',group:'K'},
    {home:'England',away:'Ghana',group:'L'},
    {home:'Panama',away:'Croatia',group:'L'},
    {home:'Colombia',away:'DR Congo',group:'K'},
  ],
  j3:[
    {home:'Switzerland',away:'Canada',group:'B'},
    {home:'Bosnia and Herzegovina',away:'Qatar',group:'B'},
    {home:'Scotland',away:'Brazil',group:'C'},
    {home:'Morocco',away:'Haiti',group:'C'},
    {home:'Czech Republic',away:'Mexico',group:'A'},
    {home:'South Africa',away:'South Korea',group:'A'},
    {home:'Curacao',away:'Ivory Coast',group:'E'},
    {home:'Ecuador',away:'Germany',group:'E'},
    {home:'Japan',away:'Sweden',group:'F'},
    {home:'Tunisia',away:'Netherlands',group:'F'},
    {home:'Turkey',away:'United States',group:'D'},
    {home:'Paraguay',away:'Australia',group:'D'},
    {home:'Norway',away:'France',group:'I'},
    {home:'Senegal',away:'Iraq',group:'I'},
    {home:'Cape Verde',away:'Saudi Arabia',group:'H'},
    {home:'Uruguay',away:'Spain',group:'H'},
    {home:'Egypt',away:'Iran',group:'G'},
    {home:'New Zealand',away:'Belgium',group:'G'},
    {home:'Panama',away:'England',group:'L'},
    {home:'Croatia',away:'Ghana',group:'L'},
    {home:'Colombia',away:'Portugal',group:'K'},
    {home:'DR Congo',away:'Uzbekistan',group:'K'},
    {home:'Algeria',away:'Austria',group:'J'},
    {home:'Jordan',away:'Argentina',group:'J'},
  ],
};

// Tournament groups A-L (for bracket resolution)
const TOURNEY_GROUPS = {
  A:['Mexico','South Africa','South Korea','Czech Republic'],
  B:['Canada','Bosnia and Herzegovina','Qatar','Switzerland'],
  C:['Brazil','Morocco','Haiti','Scotland'],
  D:['United States','Paraguay','Australia','Turkey'],
  E:['Germany','Curacao','Ivory Coast','Ecuador'],
  F:['Netherlands','Japan','Sweden','Tunisia'],
  G:['Belgium','Egypt','Iran','New Zealand'],
  H:['Spain','Cape Verde','Saudi Arabia','Uruguay'],
  I:['France','Senegal','Iraq','Norway'],
  J:['Argentina','Algeria','Austria','Jordan'],
  K:['Portugal','DR Congo','Uzbekistan','Colombia'],
  L:['England','Croatia','Ghana','Panama'],
};

// Full knockout bracket template
// Slot codes: 'A1'=Group A winner, 'B2'=runner-up, 'T1'-'T8'=best 3rd-place
// Tiebreaker slot definitions — maps slot name to bracket match + round
// Used to resolve teams from results without requiring a matches DB row
const TB_SLOTS = [
  { slot:'sf_1',  round_col:'sf',    bm:null }, // populated below after BRACKET
  { slot:'sf_2',  round_col:'sf',    bm:null },
  { slot:'final', round_col:'final', bm:null },
];

// 'r32_Nw'=winner of r32 match N, etc.
const BRACKET = {
  r32:[
    {n:1,home:'A1',away:'B2'},{n:2,home:'C1',away:'D2'},
    {n:3,home:'B1',away:'A2'},{n:4,home:'D1',away:'C2'},
    {n:5,home:'E1',away:'F2'},{n:6,home:'G1',away:'H2'},
    {n:7,home:'F1',away:'E2'},{n:8,home:'H1',away:'G2'},
    {n:9,home:'I1',away:'J2'},{n:10,home:'K1',away:'L2'},
    {n:11,home:'J1',away:'I2'},{n:12,home:'L1',away:'K2'},
    {n:13,home:'T1',away:'T2'},{n:14,home:'T3',away:'T4'},
    {n:15,home:'T5',away:'T6'},{n:16,home:'T7',away:'T8'},
  ],
  r16:[
    {n:1,home:'r32_1w',away:'r32_2w'},{n:2,home:'r32_3w',away:'r32_4w'},
    {n:3,home:'r32_5w',away:'r32_6w'},{n:4,home:'r32_7w',away:'r32_8w'},
    {n:5,home:'r32_9w',away:'r32_10w'},{n:6,home:'r32_11w',away:'r32_12w'},
    {n:7,home:'r32_13w',away:'r32_14w'},{n:8,home:'r32_15w',away:'r32_16w'},
  ],
  qf:[
    {n:1,home:'r16_1w',away:'r16_2w'},{n:2,home:'r16_3w',away:'r16_4w'},
    {n:3,home:'r16_5w',away:'r16_6w'},{n:4,home:'r16_7w',away:'r16_8w'},
  ],
  sf:[
    {n:1,home:'qf_1w',away:'qf_2w'},{n:2,home:'qf_3w',away:'qf_4w'},
  ],
  final:[
    {n:1,home:'sf_1w',away:'sf_2w'},
  ],
};
// Wire TB_SLOTS to actual bracket match objects
TB_SLOTS[0].bm = BRACKET.sf[0];
TB_SLOTS[1].bm = BRACKET.sf[1];
TB_SLOTS[2].bm = BRACKET.final[0];

const LANGS = {
  es: {
    pot:'Participantes', nav_home:'Inicio', nav_rules:'Normas', nav_teams:'Mis Equipos',
    nav_results:'Resultados', nav_leaderboard:'Clasificación',
    countdown_label:'Inscripción cierra en',
    days:'Días', hrs:'Hrs', min:'Min', sec:'Seg',
    participants:'Participantes', total_pot:'Bote total', teams_entry:'Equipos / inscripción',
    how_title:'¿Cómo funciona?',
    step1_t:'Elige 7 equipos',         step1_d:'1 TOP + 3 STRONG + 2 AVERAGE + 1 SURPRISE',
    step2_t:'Predicciones de premios', step2_d:'Pichichi, MVP, Mejor Joven y Portero (+10 pts cada uno)',
    step3_t:'Acumula puntos',          step3_d:'Tus equipos ganan puntos por goles, victorias y rondas avanzadas',
    step4_t:'Gana el premio',          step4_d:'Más puntos al final se lleva el 1er premio',
    prize1:'1er Premio', prize2:'2º Premio', prize3:'3er Premio',
    prize_tbd:'Por confirmar',
    prize_tbd_note:'',
    prize1_name:'Restaurantes para dos', prize2_name:'Sensaciones de bienestar', prize3_name:'Entradas de cine para dos',
    prize1_price:'49,90€', prize2_price:'29,90€', prize3_price:'16,90€',
    prize1_url:'https://www.smartbox.com/es/nuestras-smartbox/gastronomia/restaurantes-para-dos-849954.html',
    prize2_url:'https://www.smartbox.com/es/nuestras-smartbox/bienestar/sensaciones-de-bienestar-1250516.html',
    prize3_url:'https://www.smartbox.com/es/nuestras-smartbox/momentos-magicos/entradas-de-cine-para-dos-1237890.html',
    my_position:'Tu Posición', for_leader:'para el líder', you_lead:'¡Vas primero!',
    login_title:'Acceder a la Porra', login_desc:'Introduce tu correo y te enviamos un enlace mágico para entrar sin contraseña.',
    login_email_ph:'tu@email.com', login_btn:'Enviar enlace mágico',
    login_sent_title:'¡Revisa tu correo!', login_sent_desc:'Te hemos enviado un enlace. Haz clic en él para acceder.',
    logout:'Cerrar sesión',
    register_btn:'Inscribirme y elegir mis equipos',
    reg_closed_msg:'Inscripción cerrada el 7 de junio de 2026',
    team_selection:'Selección de Equipos', group_label:'Grupo',
    pick_team:'Elige', pick_team_s:'equipo', pick_team_p:'equipos',
    teams_available:'equipos disponibles',
    scoring_title:'Sistema de Puntuación',
    sc_goal:'Gol marcado', sc_win:'Partido ganado', sc_win_n:'No cuenta prórroga',
    sc_draw:'Partido empatado', sc_draw_n:'No cuenta prórroga',
    sc_adv:'Avanzar una ronda', sc_adv_n:'Por ronda avanzada',
    sc_champ:'Ganar el torneo', sc_champ_n:'Bonus final',
    sc_top:'Máximo goleador del torneo', sc_top_n:'Si está en tu selección',
    sc_def:'Menos goles encajados', sc_def_n:'Solo semifinalistas',
    award_bonus_title:'Bonus Predicciones de Premios',
    award_bonus_desc:'Predice los 4 premios del torneo al inscribirte. Cada predicción correcta añade',
    award_bonus_max:'Máximo',
    prize_title:'Premios',
    winner:'Ganador', second:'2º Puesto', third:'3er Puesto',
    format_title:'Formato del Torneo',
    format:[
      {phase:'Fase de Grupos',detail:'Jornadas 1, 2 y 3'},
      {phase:'Octavos de Final',detail:'32 equipos → 16'},
      {phase:'Dieciseisavos',detail:'16 equipos → 8'},
      {phase:'Cuartos de Final',detail:'8 equipos → 4'},
      {phase:'Semifinales',detail:'4 equipos → 2'},
      {phase:'Final',detail:'Campeón del Mundo'},
    ],
    reg_closed_title:'INSCRIPCIONES CERRADAS', reg_closed_date:'La inscripción terminó el', reg_closed_end:'7 de junio de 2026',
    step_name:'Nombre', step_teams:'Equipos', step_awards:'Premios', step_confirm:'Confirmar',
    your_name:'Tu Nombre', full_name:'Nombre completo', full_name_hint:'Nombre + Apellido',
    name_placeholder:'ej. Pedro Sánchez',
    err_duplicate:'Ese nombre ya está inscrito. Prueba con otro nombre completo.',
    err_general:'Error al inscribirse. Comprueba tu conexión e inténtalo de nuevo.',
    teams_summary:'Tus equipos seleccionados',
    award_preds:'Predicciones de Premios', pts_each:'+10 pts cada uno', x_selected:'seleccionados',
    btn_name:'Introduce tu nombre para continuar', btn_teams:'Elige todos tus equipos',
    btn_awards:'Elige las 4 predicciones de premios', btn_confirm:'Confirmar inscripción', btn_saving:'Guardando…',
    reg_ok_title:'¡Inscripción completada!', reg_ok_sub:'Tus equipos y predicciones se han guardado. ¡Buena suerte!',
    your_award_preds:'TUS PREDICCIONES DE PREMIOS',
    select_player:'Selecciona jugador', loading_players:'Cargando jugadores…',
    search_players:'Buscar jugadores…', no_results_for:'Sin resultados para',
    search_title:'Buscar Participante', search_ph:'Nombre del participante…', search_btn:'BUSCAR',
    not_found_pre:'No se encontró ningún participante con el nombre', not_found_post:'Comprueba la ortografía e inténtalo de nuevo.',
    teams_selected:'equipos seleccionados', total_pts:'Pts totales', rank_label:'Pos',
    award_preds_label:'Predicciones de Premios', points_by_team:'Puntos por Equipo',
    refresh:'↻ Actualizar', no_results_title:'LOS RESULTADOS ESTARÁN DISPONIBLES AL INICIO DEL TORNEO',
    no_results_date:'11 de junio de 2026',
    award_winners:'Ganadores de Premios', no_part_title:'SIN PARTICIPANTES AÚN', no_part_sub:'Sé el primero en inscribirte',
    pts:'pts', pot_footer:'Participantes', part_footer:'participantes', entry_short:'',
    refresh_lb:'↻ Actualizar clasificación', page_of:'de',
    rival_label:'Tu rival', rival_leads:'te lleva', rank_changed:'vs. última visita',
    rank_up:'subiste', rank_down:'bajaste', rank_same:'sin cambios',
    share_btn:'Compartir posición',
    onboard_title:'¡Únete a la porra!', onboard_sub:'Son 5 minutos. Sin contraseña.',
    onboard_1:'Inicia sesión con tu email', onboard_2:'Elige tus 7 equipos', onboard_3:'Acumula puntos y sube en la tabla',
    onboard_cta:'Inscribirme ahora',
    empty_soon:'El torneo arranca el 11 de junio de 2026',
    empty_lb_sub:'Inscríbete para aparecer en la clasificación',
    tb_title:'DESEMPATE', tb_subtitle:'Pronósticos de Semifinal y Final',
    tb_desc:'Predice el marcador exacto de las Semifinales y la Final. Si empatas a puntos con otro jugador, tus aciertos en estos partidos decidirán quién gana.',
    tb_rules_btn:'Ver normas', tb_preds_btn:'Mis pronósticos',
    tb_locked:'Partido en juego — pronósticos cerrados',
    tb_pending:'Los pronósticos se abrirán cuando se determinen los cruces de Semifinales.',
    tb_save:'Guardar pronóstico', tb_saved:'✅ Guardado',
    tb_note:'No suma a tu puntuación · Solo sirve para desempatar',
    tb_section_title:'⚖️ Pronósticos de Desempate',
    tb_rules_title:'⚖️ Sistema de Desempate',
    tb_rules_desc:'Si dos jugadores terminan empatados a puntos, se aplica el sistema de desempate basado en los pronósticos de Semifinales y Final:',
    tb_rules_max:'Máx. 3 pts por partido · 2 Semifinales + 1 Final = 9 pts máx. de desempate. Los pronósticos se abren fase a fase y cualquier usuario registrado puede participar aunque no haya inscrito sus equipos.',
  },
  en: {
    pot:'Participants', nav_home:'Home', nav_rules:'Rules', nav_teams:'My Teams',
    nav_results:'Results', nav_leaderboard:'Leaderboard',
    countdown_label:'Registration closes in',
    days:'Days', hrs:'Hrs', min:'Min', sec:'Sec',
    participants:'Participants', total_pot:'Total pot', teams_entry:'Teams / entry',
    how_title:'How does it work?',
    step1_t:'Pick 7 teams',             step1_d:'1 TOP + 3 STRONG + 2 AVERAGE + 1 SURPRISE',
    step2_t:'Make award predictions',   step2_d:'Top Scorer, MVP, Best Young Player & Goalkeeper (+10 pts each)',
    step3_t:'Accumulate points',        step3_d:'Your teams earn points for goals, wins and advancing rounds',
    step4_t:'Win the prize',            step4_d:'Most points at the end wins the 1st prize',
    prize1:'1st Prize', prize2:'2nd Prize', prize3:'3rd Prize',
    prize_tbd:'To be confirmed',
    prize_tbd_note:'',
    prize1_name:'Restaurants for Two', prize2_name:'Wellness Sensations', prize3_name:'Cinema Tickets for Two',
    prize1_price:'49.90€', prize2_price:'29.90€', prize3_price:'16.90€',
    prize1_url:'https://www.smartbox.com/es/nuestras-smartbox/gastronomia/restaurantes-para-dos-849954.html',
    prize2_url:'https://www.smartbox.com/es/nuestras-smartbox/bienestar/sensaciones-de-bienestar-1250516.html',
    prize3_url:'https://www.smartbox.com/es/nuestras-smartbox/momentos-magicos/entradas-de-cine-para-dos-1237890.html',
    my_position:'Your Position', for_leader:'to the leader', you_lead:"You're leading!",
    login_title:'Join the Pool', login_desc:"Enter your email and we'll send you a magic link — no password needed.",
    login_email_ph:'you@email.com', login_btn:'Send magic link',
    login_sent_title:'Check your inbox!', login_sent_desc:"We've sent you a link. Click it to sign in.",
    logout:'Sign out',
    register_btn:'Register and pick my teams',
    reg_closed_msg:'Registration closed on June 7, 2026',
    team_selection:'Team Selection', group_label:'Group',
    pick_team:'Pick', pick_team_s:'team', pick_team_p:'teams',
    teams_available:'teams available',
    scoring_title:'Scoring System',
    sc_goal:'Goal scored', sc_win:'Match won', sc_win_n:'Does not count extra time',
    sc_draw:'Match drawn', sc_draw_n:'Does not count extra time',
    sc_adv:'Advancing a round', sc_adv_n:'Per round advanced',
    sc_champ:'Winning the tournament', sc_champ_n:'Final bonus',
    sc_top:'Tournament top scorer', sc_top_n:'If in your selection',
    sc_def:'Fewest goals conceded', sc_def_n:'Semi-finalists only',
    award_bonus_title:'Award Predictions Bonus',
    award_bonus_desc:'Predict the 4 tournament awards when registering. Each correct prediction adds',
    award_bonus_max:'Maximum',
    prize_title:'Prizes',
    winner:'Winner', second:'2nd Place', third:'3rd Place',
    format_title:'Tournament Format',
    format:[
      {phase:'Group Stage',detail:'Match days 1, 2 and 3'},
      {phase:'Round of 32',detail:'32 teams → 16'},
      {phase:'Round of 16',detail:'16 teams → 8'},
      {phase:'Quarter-finals',detail:'8 teams → 4'},
      {phase:'Semi-finals',detail:'4 teams → 2'},
      {phase:'Final',detail:'World Champion'},
    ],
    reg_closed_title:'REGISTRATION CLOSED', reg_closed_date:'Registration ended on', reg_closed_end:'June 7, 2026',
    step_name:'Name', step_teams:'Teams', step_awards:'Awards', step_confirm:'Confirm',
    your_name:'Your Name', full_name:'Full name', full_name_hint:'First name + Last name',
    name_placeholder:'e.g. Pedro Sánchez',
    err_duplicate:'That name is already registered. Please try another full name.',
    err_general:'Registration failed. Please check your connection and try again.',
    teams_summary:'Your selected teams',
    award_preds:'Award Predictions', pts_each:'+10 pts each', x_selected:'selected',
    btn_name:'Enter your name to continue', btn_teams:'Pick all your teams',
    btn_awards:'Pick all 4 award predictions', btn_confirm:'Confirm registration', btn_saving:'Saving…',
    reg_ok_title:'Registration complete!', reg_ok_sub:'Your teams and predictions have been saved. Good luck!',
    your_award_preds:'YOUR AWARD PREDICTIONS',
    select_player:'Select player', loading_players:'Loading players…',
    search_players:'Search players…', no_results_for:'No results for',
    search_title:'Search by Participant', search_ph:'Enter participant name…', search_btn:'SEARCH',
    not_found_pre:'No participant found with the name', not_found_post:'Check the spelling and try again.',
    teams_selected:'teams selected', total_pts:'Total pts', rank_label:'Rank',
    award_preds_label:'Award Predictions', points_by_team:'Points by Team',
    refresh:'↻ Refresh', no_results_title:'RESULTS WILL BE AVAILABLE ONCE THE TOURNAMENT BEGINS',
    no_results_date:'June 11, 2026',
    award_winners:'Award Winners', no_part_title:'NO PARTICIPANTS YET', no_part_sub:'Be the first to register',
    pts:'pts', pot_footer:'Participants', part_footer:'participants', entry_short:'',
    refresh_lb:'↻ Refresh leaderboard', page_of:'of',
    rival_label:'Your rival', rival_leads:'leads by', rank_changed:'vs. last visit',
    rank_up:'up', rank_down:'down', rank_same:'no change',
    share_btn:'Share position',
    onboard_title:'Join the pool!', onboard_sub:'5 minutes. No password needed.',
    onboard_1:'Sign in with your email', onboard_2:'Pick your 7 teams', onboard_3:'Earn points and climb the table',
    onboard_cta:'Register now',
    empty_soon:'The tournament starts on June 11, 2026',
    empty_lb_sub:'Register to appear on the leaderboard',
    tb_title:'TIEBREAKER', tb_subtitle:'Semi-final & Final Predictions',
    tb_desc:'Predict the exact score of the Semi-finals and Final. If you are level on points with another player, your accuracy in these matches will decide the winner.',
    tb_rules_btn:'View rules', tb_preds_btn:'My predictions',
    tb_locked:'Match in play — predictions closed',
    tb_pending:'Predictions will open once the Semi-final draw is made.',
    tb_save:'Save prediction', tb_saved:'✅ Saved',
    tb_note:'Does not add to your score · Only used for tie-breaking',
    tb_section_title:'⚖️ Tiebreaker Predictions',
    tb_rules_title:'⚖️ Tiebreaker System',
    tb_rules_desc:'If two players finish level on points, the tiebreaker system based on Semi-final and Final predictions applies:',
    tb_rules_max:'Max. 3 pts per match · 2 Semi-finals + 1 Final = 9 pts max. tiebreaker. Predictions open phase by phase and any registered user may participate even without picking teams.',
  },
  pt: {
    pot:'Participantes', nav_home:'Início', nav_rules:'Regras', nav_teams:'Meus Times',
    nav_results:'Resultados', nav_leaderboard:'Classificação',
    countdown_label:'Inscrições encerram em',
    days:'Dias', hrs:'Hrs', min:'Min', sec:'Seg',
    participants:'Participantes', total_pot:'Prêmio total', teams_entry:'Times / inscrição',
    how_title:'Como funciona?',
    step1_t:'Escolha 7 times',          step1_d:'1 TOP + 3 STRONG + 2 AVERAGE + 1 SURPRISE',
    step2_t:'Faça previsões de prêmios',step2_d:'Artilheiro, MVP, Melhor Jovem e Goleiro (+10 pts cada)',
    step3_t:'Acumule pontos',           step3_d:'Seus times ganham pontos por gols, vitórias e fases avançadas',
    step4_t:'Ganhe o prêmio',           step4_d:'Quem tiver mais pontos no final ganha o 1º prêmio',
    prize1:'1º Prêmio', prize2:'2º Prêmio', prize3:'3º Prêmio',
    prize_tbd:'A confirmar',
    prize_tbd_note:'',
    prize1_name:'Restaurantes para Dois', prize2_name:'Sensações de Bem-estar', prize3_name:'Entradas de Cinema para Dois',
    prize1_price:'49,90€', prize2_price:'29,90€', prize3_price:'16,90€',
    prize1_url:'https://www.smartbox.com/es/nuestras-smartbox/gastronomia/restaurantes-para-dos-849954.html',
    prize2_url:'https://www.smartbox.com/es/nuestras-smartbox/bienestar/sensaciones-de-bienestar-1250516.html',
    prize3_url:'https://www.smartbox.com/es/nuestras-smartbox/momentos-magicos/entradas-de-cine-para-dos-1237890.html',
    my_position:'Sua Posição', for_leader:'para o líder', you_lead:'Você está na frente!',
    login_title:'Entrar na Porra', login_desc:'Digite seu e-mail e enviaremos um link mágico para entrar sem senha.',
    login_email_ph:'seu@email.com', login_btn:'Enviar link mágico',
    login_sent_title:'Verifique seu e-mail!', login_sent_desc:'Enviamos um link. Clique nele para entrar.',
    logout:'Sair',
    register_btn:'Inscrever-me e escolher meus times',
    reg_closed_msg:'Inscrições encerradas em 7 de junho de 2026',
    team_selection:'Seleção de Times', group_label:'Grupo',
    pick_team:'Escolha', pick_team_s:'time', pick_team_p:'times',
    teams_available:'times disponíveis',
    scoring_title:'Sistema de Pontuação',
    sc_goal:'Gol marcado', sc_win:'Partida vencida', sc_win_n:'Não conta prorrogação',
    sc_draw:'Partida empatada', sc_draw_n:'Não conta prorrogação',
    sc_adv:'Avançar uma fase', sc_adv_n:'Por fase avançada',
    sc_champ:'Ganhar o torneio', sc_champ_n:'Bônus final',
    sc_top:'Artilheiro do torneio', sc_top_n:'Se estiver na sua seleção',
    sc_def:'Menos gols sofridos', sc_def_n:'Apenas semifinalistas',
    award_bonus_title:'Bônus de Previsões de Prêmios',
    award_bonus_desc:'Preveja os 4 prêmios do torneio ao se inscrever. Cada previsão correta adiciona',
    award_bonus_max:'Máximo',
    prize_title:'Prêmios',
    winner:'Vencedor', second:'2º Lugar', third:'3º Lugar',
    format_title:'Formato do Torneio',
    format:[
      {phase:'Fase de Grupos',detail:'Rodadas 1, 2 e 3'},
      {phase:'Oitavas de Final',detail:'32 times → 16'},
      {phase:'Dezesseis avos',detail:'16 times → 8'},
      {phase:'Quartas de Final',detail:'8 times → 4'},
      {phase:'Semifinais',detail:'4 times → 2'},
      {phase:'Final',detail:'Campeão do Mundo'},
    ],
    reg_closed_title:'INSCRIÇÕES ENCERRADAS', reg_closed_date:'As inscrições encerraram em', reg_closed_end:'7 de junho de 2026',
    step_name:'Nome', step_teams:'Times', step_awards:'Prêmios', step_confirm:'Confirmar',
    your_name:'Seu Nome', full_name:'Nome completo', full_name_hint:'Nome + Sobrenome',
    name_placeholder:'ex. Pedro Sánchez',
    err_duplicate:'Esse nome já está cadastrado. Por favor, tente outro nome completo.',
    err_general:'Falha ao se inscrever. Verifique sua conexão e tente novamente.',
    teams_summary:'Seus times selecionados',
    award_preds:'Previsões de Prêmios', pts_each:'+10 pts cada', x_selected:'selecionados',
    btn_name:'Digite seu nome para continuar', btn_teams:'Escolha todos os seus times',
    btn_awards:'Escolha as 4 previsões de prêmios', btn_confirm:'Confirmar inscrição', btn_saving:'Salvando…',
    reg_ok_title:'Inscrição concluída!', reg_ok_sub:'Seus times e previsões foram salvos. Boa sorte!',
    your_award_preds:'SUAS PREVISÕES DE PRÊMIOS',
    select_player:'Selecione jogador', loading_players:'Carregando jogadores…',
    search_players:'Buscar jogadores…', no_results_for:'Sem resultados para',
    search_title:'Buscar Participante', search_ph:'Digite o nome do participante…', search_btn:'BUSCAR',
    not_found_pre:'Nenhum participante encontrado com o nome', not_found_post:'Verifique a ortografia e tente novamente.',
    teams_selected:'times selecionados', total_pts:'Pts totais', rank_label:'Pos',
    award_preds_label:'Previsões de Prêmios', points_by_team:'Pontos por Time',
    refresh:'↻ Atualizar', no_results_title:'OS RESULTADOS ESTARÃO DISPONÍVEIS QUANDO O TORNEIO COMEÇAR',
    no_results_date:'11 de junho de 2026',
    award_winners:'Vencedores de Prêmios', no_part_title:'SEM PARTICIPANTES AINDA', no_part_sub:'Seja o primeiro a se inscrever',
    pts:'pts', pot_footer:'Participantes', part_footer:'participantes', entry_short:'',
    refresh_lb:'↻ Atualizar classificação', page_of:'de',
    rival_label:'Seu rival', rival_leads:'está à frente por', rank_changed:'vs. última visita',
    rank_up:'subiu', rank_down:'caiu', rank_same:'sem mudança',
    share_btn:'Compartilhar posição',
    onboard_title:'Entre na bolão!', onboard_sub:'5 minutos. Sem senha.',
    onboard_1:'Entre com seu e-mail', onboard_2:'Escolha seus 7 times', onboard_3:'Acumule pontos e suba na tabela',
    onboard_cta:'Inscrever-me agora',
    empty_soon:'O torneio começa em 11 de junho de 2026',
    empty_lb_sub:'Inscreva-se para aparecer na classificação',
    tb_title:'DESEMPATE', tb_subtitle:'Previsões de Semifinal e Final',
    tb_desc:'Preveja o placar exato das Semifinais e da Final. Se empatar em pontos com outro jogador, seus acertos nesses jogos decidirão o vencedor.',
    tb_rules_btn:'Ver regras', tb_preds_btn:'Minhas previsões',
    tb_locked:'Bloqueado · resultado oficial', tb_pending:'Os jogos de Semifinal e Final ainda não estão disponíveis. Volte quando as equipas estiverem definidas!',
    tb_save:'Guardar previsão', tb_saved:'✓ Salvo!',
    tb_note:'Estes pontos não se somam à pontuação geral — servem apenas para desempate.',
    tb_section_title:'⚖️ Previsões de Desempate',
    tb_rules_title:'⚖️ Sistema de Desempate',
    tb_rules_desc:'Se dois jogadores terminarem com a mesma pontuação, o sistema de desempate baseado nas previsões de Semifinal e Final aplica-se:',
    tb_rules_max:'Máx. 3 pts por jogo · 2 Semifinais + 1 Final = 9 pts máx. de desempate. Previsões abertas fase a fase e qualquer utilizador registado pode participar mesmo sem escolher equipas.',
  },
};

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0a1628;--sur:#132040;--sur2:#1a2d52;--sur3:#0e1d3a;--brd:rgba(255,255,255,0.08);--brd2:rgba(255,255,255,0.16);--gold:#F5B731;--gold2:#c98e15;--gold-glow:rgba(245,183,49,0.18);--green:#4ADE80;--blue:#60AAFF;--pink:#FF4D6D;--txt:#f8fafc;--mut:#A8BCCE;--white:#f8fafc;--r:16px;--tr:all .18s ease;--f-mono:'Geist Mono',ui-monospace,'SF Mono',monospace;--f-ui:'Geist','Inter',system-ui,sans-serif;--f-display:'Archivo Black','Archivo',system-ui,sans-serif}
html{scroll-behavior:smooth}
html,body{font-family:'Geist','Inter',system-ui,sans-serif;background:var(--bg);color:var(--txt);min-height:100vh;overflow-x:hidden}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.skeleton{background:linear-gradient(90deg,var(--sur) 25%,var(--sur2) 50%,var(--sur) 75%);background-size:200% 100%;animation:shimmer 1.6s ease-in-out infinite;border-radius:8px}
.num{font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-weight:700;letter-spacing:-0.01em}
@media(prefers-reduced-motion:reduce){.skeleton{animation:none;background:var(--sur2)}*,*::before,*::after{transition-duration:.01ms !important;animation-duration:.01ms !important}}
.hdr{background:linear-gradient(180deg,#0a1628 0%,#080e1c 100%);border-bottom:1px solid var(--brd);padding:0 20px;position:sticky;top:0;z-index:50}
.hdr-top{display:flex;align-items:center;gap:10px;padding:16px 0 12px}
.hdr-icon{display:flex;align-items:center}
.hdr-name{font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:900;font-size:26px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);line-height:1}
.hdr-sub{font-size:11px;color:var(--mut);letter-spacing:2px;text-transform:uppercase;margin-top:2px}
.hdr-bote{margin-left:auto;background:rgba(245,183,49,0.1);border:1px solid rgba(245,183,49,0.25);border-radius:8px;padding:6px 14px;text-align:right;transition:background .2s}
.hdr-bote:hover{background:rgba(245,183,49,0.16)}
.hdr-bote-lbl{font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:1px}
.hdr-bote-val{font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-weight:700;font-size:20px;color:var(--gold)}
.lang-sel{display:flex;gap:3px;align-items:center;flex-shrink:0}
.lang-btn{background:none;border:1px solid transparent;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px;color:var(--mut);font-family:var(--f-ui);font-weight:600;letter-spacing:0.5px;transition:var(--tr);display:flex;align-items:center;gap:3px;min-height:30px;touch-action:manipulation;white-space:nowrap}
.lang-btn:hover{color:var(--txt);border-color:var(--brd)}
.lang-btn.active{color:var(--gold);border-color:rgba(245,183,49,0.45);background:rgba(245,183,49,0.08)}
.lang-btn:focus-visible{outline:2px solid var(--gold);outline-offset:2px;border-radius:5px}
.app-footer{text-align:center;padding:32px 20px calc(72px + env(safe-area-inset-bottom,0px));font-size:12px;color:var(--mut);letter-spacing:0.5px;border-top:1px solid var(--brd);margin-top:8px}
.nav{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.nav-btn{font-family:var(--f-ui);font-weight:600;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;background:none;border:none;cursor:pointer;color:var(--mut);padding:10px 16px;border-bottom:2px solid transparent;white-space:nowrap;transition:color .2s;min-height:44px;touch-action:manipulation}
.nav-btn:hover{color:var(--txt)}
.nav-btn.on{color:var(--gold);border-bottom-color:var(--gold)}
.nav-btn:focus-visible{outline:2px solid var(--gold);outline-offset:-2px;border-radius:4px}
.page{padding:24px 20px 90px;max-width:860px;margin:0 auto}
.card{background:var(--sur);border:1px solid var(--brd);border-radius:var(--r);padding:20px;margin-bottom:16px;transition:border-color .2s}
.sect-title{font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:800;font-size:18px;letter-spacing:1.5px;text-transform:uppercase;color:var(--white);margin-bottom:14px;display:flex;align-items:center;gap:8px}
.sect-title::before{content:'';width:3px;height:16px;background:var(--gold);border-radius:2px;flex-shrink:0;box-shadow:0 0 8px var(--gold-glow)}
.hero{background:linear-gradient(135deg,#0e1e38,#091428);border:1px solid var(--brd);border-radius:16px;padding:36px 28px;text-align:center;margin-bottom:20px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,var(--gold-glow) 0%,transparent 70%);pointer-events:none}
.hero-title{font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:900;font-size:48px;letter-spacing:4px;text-transform:uppercase;color:var(--gold);text-shadow:0 0 40px rgba(245,183,49,0.3);line-height:1}
.hero-sub{font-size:14px;color:var(--mut);letter-spacing:2px;text-transform:uppercase;margin-top:6px}
.hero-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:28px}
.hero-stat{background:rgba(255,255,255,0.04);border:1px solid var(--brd);border-radius:10px;padding:14px 10px;transition:var(--tr)}
.hero-stat:hover{border-color:var(--brd2);background:rgba(255,255,255,0.07)}
.hero-stat-val{font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-weight:700;font-size:28px;color:var(--white);text-shadow:0 0 20px rgba(245,183,49,0.2)}
.hero-stat-lbl{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:1px}
.scoring-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.scoring-item{background:var(--sur2);border:1px solid var(--brd);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:12px;transition:var(--tr)}
.scoring-item:hover{border-color:var(--brd2)}
.scoring-icon{font-size:22px;width:30px;text-align:center}
.scoring-pts{font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-weight:700;font-size:22px;color:var(--gold);margin-left:auto;white-space:nowrap}
.scoring-lbl{font-size:13px;color:var(--txt);font-weight:600}
.scoring-note{font-size:11px;color:var(--mut)}
.grupo-strip{display:flex;align-items:center;gap:10px;background:var(--sur2);border:1px solid var(--brd);border-radius:10px;padding:12px 14px;margin-bottom:8px;transition:var(--tr)}
.grupo-strip:hover{border-color:var(--brd2)}
.grupo-badge{font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:800;font-size:11px;letter-spacing:1px;padding:3px 10px;border-radius:5px;text-transform:uppercase;min-width:80px;text-align:center}
.grupo-pick{font-size:12px;color:var(--mut);margin-left:auto}
.premio-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.premio-card{border-radius:10px;padding:14px;text-align:center;border:1px solid;transition:transform .18s,box-shadow .18s}
.premio-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.4)}
.premio-medal{font-size:28px;margin-bottom:6px}
.premio-tbd{font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;margin:4px 0 2px}
.premio-lbl{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:1px}
.premio-price{font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:800;font-size:20px;margin:4px 0 2px}
.premio-link{font-size:11px;color:var(--mut);text-decoration:none;letter-spacing:0.5px;transition:color .2s}
.premio-link:hover{color:var(--gold)}
.sel-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px}
.sel-prog-item{border-radius:10px;padding:10px 12px;border:1px solid;text-align:center;transition:var(--tr)}
.sel-prog-g{font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:700;font-size:12px;letter-spacing:1px;text-transform:uppercase}
.sel-prog-count{font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:900;font-size:28px;line-height:1.1}
.step-indicator{display:flex;margin-bottom:20px;border-radius:10px;overflow:hidden;border:1px solid var(--brd)}
.step-item{flex:1;padding:9px 6px;text-align:center;font-family:var(--f-ui);font-weight:600;font-size:12px;letter-spacing:0.2px;text-transform:uppercase;color:var(--mut);background:var(--sur2);border-right:1px solid var(--brd);transition:var(--tr)}
.step-item:last-child{border-right:none}
.step-item.done{background:rgba(34,212,142,0.08);color:var(--green)}
.step-item.active{background:rgba(245,183,49,0.1);color:var(--gold)}
.group-section{margin-bottom:20px}
.group-header{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}
.group-title{font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:800;font-size:16px;letter-spacing:1px;text-transform:uppercase}
.group-limit{font-size:12px;color:var(--mut)}
.teams-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.team-btn{display:flex;align-items:center;gap:8px;background:var(--sur2);border:1px solid var(--brd);border-radius:8px;padding:10px;cursor:pointer;transition:var(--tr);text-align:left;font-family:'Geist','Inter',system-ui,sans-serif;font-size:13px;color:var(--txt);min-height:44px;touch-action:manipulation}
.team-btn:hover:not(.dis){border-color:rgba(255,255,255,0.2);color:var(--white);background:var(--sur3)}
.team-btn:active:not(.dis){transform:scale(0.97)}
.team-btn:focus-visible{outline:2px solid var(--gold);outline-offset:1px}
.team-btn.sel{border-color:currentColor;color:var(--white);background:rgba(0,0,0,0.3)}
.team-btn.dis{opacity:0.3;cursor:not-allowed}
.team-flag{font-size:16px;flex-shrink:0}
.sel-summary{background:rgba(245,183,49,0.06);border:1px solid rgba(245,183,49,0.2);border-radius:var(--r);padding:16px 18px;margin-top:4px}
.sum-title{font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:var(--gold);margin-bottom:10px}
.sum-teams{display:flex;flex-wrap:wrap;gap:6px}
.sum-chip{display:inline-flex;align-items:center;gap:5px;background:var(--sur2);border:1px solid var(--brd);border-radius:6px;padding:4px 10px;font-size:12px}
.inp{width:100%;background:var(--sur2);border:1px solid var(--brd);border-radius:8px;padding:11px 14px;color:var(--white);font-family:'Geist','Inter',system-ui,sans-serif;font-size:16px;outline:none;transition:border-color .2s;margin-bottom:10px;min-height:44px}
.inp:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(245,183,49,0.12)}
.inp::placeholder{color:var(--mut);font-size:14px}
.award-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:4px}
.award-item{position:relative}
.award-item label{display:flex;align-items:center;gap:6px;font-family:var(--f-ui);font-weight:500;font-size:13px;letter-spacing:0;text-transform:none;color:var(--mut);margin-bottom:6px}
.award-trigger{width:100%;display:flex;align-items:center;gap:8px;background:var(--sur2);border:1px solid var(--brd);border-radius:8px;padding:10px 12px;cursor:pointer;transition:var(--tr);font-family:'Geist','Inter',system-ui,sans-serif;font-size:13px;color:var(--mut);min-height:44px;text-align:left;touch-action:manipulation}
.award-trigger:hover{border-color:var(--brd2);color:var(--txt)}
.award-trigger:focus-visible{outline:2px solid var(--gold);outline-offset:1px}
.award-trigger.filled{border-color:rgba(245,183,49,0.45);color:var(--white)}
.award-trigger.open{border-color:var(--gold)}
.award-trigger-icon{font-size:18px;flex-shrink:0}
.award-trigger-val{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.award-chevron{font-size:10px;color:var(--mut);transition:transform .2s;flex-shrink:0}
.award-chevron.up{transform:rotate(180deg)}
.award-dropdown{position:absolute;top:calc(100% + 6px);left:0;min-width:100%;width:max-content;max-width:320px;background:var(--sur);border:1px solid var(--gold);border-radius:10px;z-index:200;box-shadow:0 16px 40px rgba(0,0,0,0.7);overflow:hidden}
.award-search{width:100%;background:var(--sur2);border:none;border-bottom:1px solid var(--brd);padding:10px 14px;color:var(--white);font-family:'Geist','Inter',system-ui,sans-serif;font-size:13px;outline:none}
.award-search::placeholder{color:var(--mut)}
.award-list{max-height:210px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--brd) transparent}
.award-list::-webkit-scrollbar{width:4px}
.award-list::-webkit-scrollbar-thumb{background:var(--brd);border-radius:2px}
.award-opt{display:flex;align-items:center;justify-content:space-between;width:100%;padding:9px 14px;background:none;border:none;border-bottom:1px solid rgba(26,36,56,0.5);color:var(--txt);font-family:'Geist','Inter',system-ui,sans-serif;font-size:13px;cursor:pointer;transition:background .1s;text-align:left;min-height:40px;gap:8px}
.award-opt:last-child{border-bottom:none}
.award-opt:hover{background:var(--sur2);color:var(--white)}
.award-opt.active{color:var(--gold);background:rgba(245,183,49,0.07)}
.award-opt-team{font-size:11px;color:var(--mut);white-space:nowrap;flex-shrink:0}
.award-empty{padding:16px;text-align:center;color:var(--mut);font-size:13px}
.award-pick{background:var(--sur2);border:1px solid var(--brd);border-radius:10px;padding:12px 14px}
.award-pick-lbl{font-size:13px;color:var(--mut);text-transform:none;letter-spacing:0;margin-bottom:6px;font-family:var(--f-ui);font-weight:500}
.award-pick-val{font-size:13px;color:var(--white);font-weight:600}
.award-correct{border-color:rgba(34,212,142,0.5);background:rgba(34,212,142,0.08)}
.award-correct .award-pick-val{color:var(--green)}
.btn-primary{width:100%;padding:14px;font-family:var(--f-ui);font-weight:700;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#080c14;border:none;border-radius:12px;cursor:pointer;transition:opacity .2s,transform .15s,box-shadow .2s;min-height:48px;touch-action:manipulation;box-shadow:0 6px 20px var(--gold-glow)}
.btn-primary:hover:not(:disabled){opacity:0.9}
.btn-primary:active:not(:disabled){transform:scale(0.98)}
.btn-primary:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
.btn-primary:disabled{opacity:0.35;cursor:not-allowed}
.btn-ghost{background:var(--sur2);border:1px solid var(--brd);border-radius:7px;padding:7px 14px;color:var(--mut);cursor:pointer;font-size:13px;font-family:var(--f-ui);font-weight:500;letter-spacing:0;transition:var(--tr);min-height:36px;white-space:nowrap;touch-action:manipulation}
.btn-ghost:hover{border-color:var(--brd2);color:var(--txt)}
.btn-ghost:active{transform:scale(0.97)}
.btn-ghost:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.success-box{background:rgba(34,212,142,0.08);border:1px solid rgba(34,212,142,0.3);border-radius:var(--r);padding:24px 20px;text-align:center}
.error-box{background:rgba(255,107,138,0.08);border:1px solid rgba(255,107,138,0.3);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#ff6b8a}
.closed-box{background:rgba(78,94,120,0.15);border:1px solid rgba(78,94,120,0.4);border-radius:var(--r);padding:48px 20px;text-align:center}
.res-table{width:100%;border-collapse:collapse;font-size:13px}
.res-table th{font-family:var(--f-ui);font-weight:600;font-size:12px;letter-spacing:0.5px;text-transform:uppercase;color:var(--mut);padding:6px 10px;text-align:center;border-bottom:1px solid var(--brd)}
.res-table th:first-child{text-align:left}
.res-table td{padding:10px;text-align:center;border-bottom:1px solid rgba(30,41,64,0.5)}
.res-table td:first-child{text-align:left}
.res-table tr:last-child td{border-bottom:none}
.res-table tbody tr:nth-child(even) td{background:rgba(255,255,255,0.025)}
.res-table tr:hover td{background:rgba(255,255,255,0.045)}
.res-team{display:flex;align-items:center;gap:8px;font-weight:600;color:var(--white)}
.res-pts{font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-weight:700;font-size:15px}
.res-zero{color:var(--mut)}
.res-total{font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-weight:700;font-size:16px;color:var(--gold)}
.podium{display:grid;grid-template-columns:1fr 1.1fr 1fr;gap:12px;margin-bottom:20px;align-items:end}
.podium-card{border-radius:12px;border:1px solid;padding:16px 12px;text-align:center}
.podium-medal{margin-bottom:4px}
.podium-name{font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:800;font-size:18px;color:var(--white);text-transform:uppercase;letter-spacing:1px;line-height:1.2}
.podium-pts{font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-weight:700;font-size:28px;margin:4px 0;text-shadow:0 0 20px rgba(245,183,49,0.25)}
.podium-pts span{font-size:13px;color:var(--mut)}
.podium-premio{font-size:12px;margin-top:4px;font-weight:600;opacity:0.7;letter-spacing:0.5px}
.podium-teams{display:flex;flex-wrap:wrap;gap:3px;justify-content:center;margin-top:8px}
.podium-team-chip{font-size:10px;background:rgba(255,255,255,0.06);border-radius:4px;padding:2px 6px}
.clasif-row{display:flex;align-items:center;gap:14px;background:var(--sur);border:1px solid var(--brd);border-radius:10px;padding:12px 16px;margin-bottom:8px;transition:var(--tr);border-left:3px solid transparent}
.clasif-pos{font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-weight:700;font-size:14px;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:var(--sur2);border:1px solid var(--brd);color:var(--mut);flex-shrink:0}
.clasif-name{font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:700;font-size:17px;color:var(--white);text-transform:uppercase;letter-spacing:1px}
.clasif-teams-mini{display:flex;flex-wrap:wrap;gap:3px;margin-top:3px}
.clasif-team-chip{font-size:11px;color:var(--mut)}
.clasif-pts{margin-left:auto;font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-weight:700;font-size:26px;color:var(--gold);text-align:right;flex-shrink:0}
.clasif-pts span{font-size:12px;color:var(--mut)}
.bonus-badge{display:inline-block;background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.35);color:var(--green);font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-weight:700;font-size:11px;padding:2px 8px;border-radius:5px;margin-left:6px;letter-spacing:0.5px}
.clasif-row{cursor:pointer;transition:border-color .15s,transform .15s,background .15s}
.clasif-row:hover{border-color:var(--brd2);background:var(--sur3)}
.clasif-row:active{transform:scale(0.995)}
.clasif-row.me{background:rgba(245,183,49,0.06);border-color:rgba(245,183,49,0.4)}
.clasif-row.me .clasif-name{color:var(--gold)}
.me-pin{font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:800;font-size:8.5px;letter-spacing:0.08em;color:var(--bg);background:var(--gold);padding:1px 6px;border-radius:99px;margin-left:7px;text-transform:uppercase;vertical-align:middle}
.contrib-bar{display:flex;gap:2px;height:4px;border-radius:99px;overflow:hidden;max-width:170px;margin-top:6px;background:var(--sur2)}
.lb-legend{display:flex;flex-wrap:wrap;gap:12px;padding:0 2px 12px;font-size:10px;color:var(--mut);font-weight:600}
.lb-legend span{display:flex;align-items:center;gap:5px}
.lb-legend i{width:8px;height:8px;border-radius:2px;display:inline-block;flex-shrink:0}
.jump-fab{position:fixed;right:16px;bottom:90px;z-index:40;background:var(--sur);color:var(--gold);border:1.5px solid rgba(245,183,49,0.45);border-radius:99px;padding:10px 16px;font-family:var(--f-ui);font-weight:600;font-size:12px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.4);animation:fadeIn .25s ease;backdrop-filter:blur(8px)}
.sheet-backdrop{position:fixed;inset:0;background:rgba(5,16,31,0.75);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:flex-end}
.sheet{background:var(--sur);width:100%;max-height:82vh;overflow:auto;border-radius:22px 22px 0 0;padding:14px 18px calc(20px + env(safe-area-inset-bottom));border-top:1px solid var(--brd2);animation:sheetUp .25s ease}
.sheet-grab{width:40px;height:4px;border-radius:99px;background:var(--brd2);margin:0 auto 16px}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@media(max-width:480px){.page{padding:16px 14px 90px}.card{padding:16px}.hero{padding:28px 16px}.hero-title{font-size:34px;letter-spacing:2px}.teams-grid{grid-template-columns:repeat(2,1fr)}.scoring-grid{grid-template-columns:1fr}.award-grid{grid-template-columns:1fr}.award-dropdown{max-width:calc(100vw - 48px)}.sel-progress{gap:5px}.sel-prog-count{font-size:22px}.sel-prog-g{font-size:10px}.hdr-name{font-size:20px;letter-spacing:2px}.podium{gap:8px}.podium-name{font-size:14px}.podium-pts{font-size:24px}.podium-card{padding:14px 8px}.lang-btn{font-size:10px;padding:3px 5px}.hdr-bote{display:none}.hdr-logout-txt{display:none}.hdr-logout{padding:6px 8px}.hdr-sub{display:none}}
@media(max-width:360px){.teams-grid{grid-template-columns:repeat(2,1fr)}.hero-title{font-size:28px}}
.rank-badge{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;font-family:var(--f-ui);vertical-align:middle;margin-left:6px}
.rank-up{background:rgba(74,222,128,0.15);color:var(--green)}
.rank-down{background:rgba(255,77,109,0.15);color:var(--pink)}
.rank-same{background:var(--sur2);color:var(--mut)}
.rival-row{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--mut);margin-top:6px;flex-wrap:wrap}
.rival-name{color:var(--txt);font-weight:600}
.rival-gap{color:var(--pink);font-weight:700;font-family:var(--f-mono)}
.onboard-card{background:linear-gradient(135deg,rgba(245,183,49,0.06),rgba(245,183,49,0.02));border:1px solid rgba(245,183,49,0.22);border-radius:var(--r);padding:20px;margin-bottom:16px}
.onboard-steps{display:flex;flex-direction:column;gap:8px;margin:14px 0 18px}
.onboard-step{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--txt)}
.onboard-num{width:24px;height:24px;border-radius:50%;background:rgba(245,183,49,0.15);border:1px solid rgba(245,183,49,0.3);color:var(--gold);font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.empty-state{text-align:center;padding:48px 20px}
.empty-state-icon{font-size:48px;margin-bottom:12px}
.empty-state-title{font-family:var(--f-display);font-weight:700;font-size:16px;color:var(--mut);letter-spacing:1px;margin-bottom:6px}
.empty-state-sub{font-size:13px;color:var(--mut)}
.admin-log{margin-top:10px;padding:10px 14px;background:var(--sur2);border:1px solid var(--brd);border-radius:8px;font-size:12px;color:var(--txt);font-family:monospace;line-height:1.6;white-space:pre-wrap}
.admin-divider{border:none;border-top:1px solid var(--brd);margin:20px 0}
.match-tabs{display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap}
.match-tab{padding:6px 14px;border-radius:7px;border:1px solid var(--brd);background:var(--sur2);color:var(--mut);font-family:var(--f-ui);font-size:12px;font-weight:600;letter-spacing:0.3px;cursor:pointer;transition:var(--tr);text-transform:uppercase}
.match-tab.on{background:rgba(245,183,49,0.12);border-color:rgba(245,183,49,0.4);color:var(--gold)}
.match-group-hdr{font-size:10px;color:var(--mut);font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:12px 0 5px 2px}
.match-row{display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;border:1px solid var(--brd);border-left:3px solid var(--brd);margin-bottom:5px;background:var(--sur);transition:border-color .15s}
.match-row.saved{border-left-color:var(--green)}
.match-card{border-radius:8px;border:1px solid var(--brd);border-left:3px solid var(--brd);background:var(--sur);transition:border-color .15s}
.match-card.saved{border-left-color:var(--green)}
.match-team{display:flex;align-items:center;gap:5px;flex:1;min-width:0}
.match-team-home{justify-content:flex-end}
.match-name{font-size:11px;font-weight:600;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80px}
.match-score{display:flex;align-items:center;gap:5px;flex-shrink:0}
.score-inp{width:34px;height:34px;text-align:center;background:var(--sur2);border:1px solid var(--brd);border-radius:6px;color:var(--white);font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-weight:700;font-size:16px;outline:none;transition:border-color .15s}
.score-inp:focus{border-color:var(--gold)}
.score-sep{color:var(--mut);font-weight:700;font-size:14px}
.match-save-btn{width:34px;height:34px;border-radius:6px;border:1px solid var(--brd);background:var(--sur2);color:var(--mut);cursor:pointer;font-size:13px;flex-shrink:0;transition:var(--tr);display:flex;align-items:center;justify-content:center}
.match-save-btn:not(:disabled):hover{border-color:var(--gold);color:var(--gold)}
.match-save-btn.saved{border-color:rgba(74,222,128,0.4);color:var(--green);background:rgba(74,222,128,0.08)}
.penalty-row{display:flex;align-items:center;gap:6px;padding:4px 10px 6px;margin-top:-4px;margin-bottom:5px;background:var(--sur);border:1px solid var(--brd);border-top:none;border-radius:0 0 8px 8px;border-left:3px solid var(--brd)}
.penalty-row.saved-pen{border-left-color:var(--green)}
.penalty-lbl{font-size:10px;color:var(--mut);white-space:nowrap;flex-shrink:0}
.penalty-btn{flex:1;padding:3px 6px;border-radius:5px;border:1px solid var(--brd);background:var(--sur2);color:var(--mut);font-size:11px;font-weight:600;cursor:pointer;transition:var(--tr);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}
.penalty-btn:hover{border-color:var(--gold);color:var(--gold)}
.penalty-btn.active{border-color:var(--green);color:var(--green);background:rgba(74,222,128,0.1)}
.match-save-btn:disabled{opacity:0.35;cursor:default}
.elim-form{background:var(--sur2);border:1px solid var(--brd);border-radius:10px;padding:14px;margin-bottom:14px}
.pin-input{background:var(--sur2);border:1px solid var(--brd);border-radius:6px;padding:7px 12px;color:var(--white);font-size:14px;outline:none;width:140px;transition:border-color .2s}
.pin-input:focus{border-color:var(--gold)}
.pin-input.err{border-color:var(--pink)}
.squad-tier-group{margin-bottom:14px}
.squad-tier-hdr{display:flex;align-items:center;gap:8px;margin:0 2px 8px;font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:800;font-size:11px;letter-spacing:0.1em;text-transform:uppercase}
.squad-tier-hdr .pick{margin-left:auto;font-size:10px;color:var(--mut);font-weight:600;font-family:'Geist','Inter',system-ui,sans-serif}
.squad-card{display:flex;align-items:center;gap:12px;background:var(--sur);border:1px solid var(--brd);border-radius:12px;padding:11px 13px;margin-bottom:7px;position:relative;transition:border-color .15s ease}
.squad-card:hover{border-color:var(--brd2)}
.squad-main{flex:1;min-width:0}
.squad-top{display:flex;align-items:center;gap:6px}
.squad-name{font-weight:700;font-size:14px;color:var(--white);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.squad-sub{display:flex;align-items:center;gap:6px;font-size:11px;margin-top:2px}
.tier-tag{font-weight:800;letter-spacing:0.06em;text-transform:uppercase;font-size:10px}
.squad-dot{color:#64748B}
.squad-bar{height:4px;background:var(--sur2);border-radius:99px;overflow:hidden;margin-top:7px;max-width:200px}
.squad-bar>div{height:100%;border-radius:99px;transition:width .3s ease}
.pre-banner{display:flex;align-items:center;gap:8px;background:rgba(245,183,49,0.07);border:1px solid rgba(245,183,49,0.2);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--mut);margin-bottom:14px;line-height:1.4}
.squad-summary{display:flex;gap:14px;font-size:11px;color:var(--mut);font-weight:600;margin:-4px 0 14px}
.squad-summary span{display:flex;align-items:center;gap:5px}
.squad-summary .dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0}
.squad-pts{display:flex;flex-direction:column;align-items:flex-end;min-width:42px;flex-shrink:0}
.squad-pts .num{font-size:17px;color:var(--white);line-height:1}
.squad-pts-sub{font-size:9px;color:var(--mut);text-transform:uppercase;letter-spacing:0.06em;margin-top:2px}
.squad-state{position:absolute;top:9px;right:11px;font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:800;font-size:8.5px;letter-spacing:0.08em;padding:2px 7px;border-radius:99px}
.mini-squad{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.mini-squad-item{position:relative}
.mini-dot{position:absolute;bottom:-2px;right:-2px;width:8px;height:8px;border-radius:50%;border:2px solid var(--bg)}
.search-drop{position:absolute;top:calc(100% + 6px);left:0;right:0;background:var(--sur);border:1px solid var(--gold);border-radius:12px;z-index:100;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.6)}
.search-drop-item{display:flex;align-items:center;justify-content:space-between;width:100%;padding:10px 14px;background:none;border:none;border-bottom:1px solid var(--brd);color:var(--txt);font-size:13px;cursor:pointer;transition:background .1s;text-align:left;min-height:44px;gap:8px}
.search-drop-item:last-child{border-bottom:none}
.search-drop-item:hover{background:var(--sur2)}
.bnav{position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(10,22,40,0.96);border-top:1px solid var(--brd);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);display:flex;align-items:stretch;padding-bottom:env(safe-area-inset-bottom,0px)}
.bnav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;background:none;border:none;cursor:pointer;color:var(--mut);padding:10px 4px;font-family:var(--f-ui);font-size:10px;font-weight:600;letter-spacing:0.3px;text-transform:uppercase;transition:color .18s;min-height:56px;touch-action:manipulation;position:relative}
.bnav-btn:hover{color:var(--txt)}
.bnav-btn.on{color:var(--gold)}
.bnav-btn.on::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:24px;height:3px;border-radius:3px;background:var(--gold);box-shadow:0 0 12px var(--gold-glow)}
.bnav-btn-icon{font-size:20px;line-height:1}
.hdr-user-area{display:flex;align-items:center;gap:8px;margin-left:auto;flex-shrink:0}
.hdr-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#080c14;font-family:'Archivo Black','Archivo',system-ui,sans-serif;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-transform:uppercase;cursor:default;box-shadow:0 0 10px var(--gold-glow);letter-spacing:0.5px}
.hdr-logout{background:rgba(255,77,109,0.1);border:1px solid rgba(255,77,109,0.3);border-radius:8px;padding:6px 12px;color:var(--pink);cursor:pointer;font-size:12px;font-family:var(--f-ui);font-weight:500;letter-spacing:0;transition:var(--tr);white-space:nowrap;touch-action:manipulation;display:flex;align-items:center;gap:5px;min-height:34px}
.hdr-logout:hover{background:rgba(255,77,109,0.22);border-color:var(--pink);box-shadow:0 0 12px rgba(255,77,109,0.2)}
.auth-wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 20px}
.auth-card{background:var(--sur);border:1px solid var(--brd);border-radius:16px;padding:32px 28px;width:100%;max-width:400px}
.auth-logo{text-align:center;margin-bottom:24px}
.auth-logo-icon{display:flex;justify-content:center;margin-bottom:4px}
.auth-logo-icon-wrap{width:72px;height:72px;border-radius:50%;background:rgba(245,183,49,0.12);border:1.5px solid rgba(245,183,49,0.3);display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(245,183,49,0.1)}
.auth-logo-title{font-family:var(--f-display);font-weight:900;font-size:28px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-top:12px}
.auth-logo-sub{font-size:12px;color:var(--mut);letter-spacing:1.5px;text-transform:uppercase;margin-top:4px}
.auth-tabs{display:flex;gap:4px;margin-bottom:24px;background:var(--sur2);border-radius:9px;padding:4px}
.auth-tab{flex:1;background:none;border:none;cursor:pointer;font-family:var(--f-ui);font-weight:600;font-size:13px;letter-spacing:0.2px;text-transform:none;color:var(--mut);padding:9px 6px;border-radius:7px;transition:var(--tr)}
.auth-tab.on{background:var(--sur);color:var(--gold);box-shadow:0 1px 6px rgba(0,0,0,0.5);font-weight:700;border-bottom:2px solid var(--gold)}
.auth-label{display:block;font-size:13px;color:var(--mut);text-transform:none;letter-spacing:0;margin-bottom:6px;font-family:var(--f-ui);font-weight:500}
.auth-forgot{background:none;border:none;cursor:pointer;font-size:12px;color:var(--mut);text-decoration:underline;margin-top:4px;margin-bottom:12px;padding:0;transition:color .2s}
.auth-forgot:hover{color:var(--txt)}
`;

function LangSelector({ lang, setLang }) {
  return(
    <div className="lang-sel" role="group" aria-label="Language selector">
      {[{code:'es',label:'ES'},{code:'en',label:'EN'},{code:'pt',label:'PT'}].map(l=>(
        <button key={l.code} className={`lang-btn ${lang===l.code?'active':''}`}
          onClick={()=>setLang(l.code)} aria-pressed={lang===l.code} aria-label={l.label}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

function AwardSelect({ config, players, value, onChange, t }) {
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState('');
  const ref=useRef(null);
  const searchRef=useRef(null);
  useEffect(()=>{
    const handler=(e)=>{if(ref.current&&!ref.current.contains(e.target)){setOpen(false);setQ('');}};
    if(open){document.addEventListener('mousedown',handler);setTimeout(()=>searchRef.current?.focus(),60);}
    return()=>document.removeEventListener('mousedown',handler);
  },[open]);
  const filtered=q.trim()?players.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())||(p.team||'').toLowerCase().includes(q.toLowerCase())):players;
  return(
    <div ref={ref} style={{position:'relative'}}>
      <button type="button" className={`award-trigger ${value?'filled':''} ${open?'open':''}`} onClick={()=>setOpen(o=>!o)}>
        <span className="award-trigger-icon">{config.icon}</span>
        <span className="award-trigger-val">{value||(players.length===0?t.loading_players:t.select_player)}</span>
        <span className={`award-chevron ${open?'up':''}`}>▼</span>
      </button>
      {open&&(
        <div className="award-dropdown">
          <input ref={searchRef} className="award-search" placeholder={t.search_players} value={q} onChange={e=>setQ(e.target.value)}/>
          <div className="award-list">
            {filtered.length===0?<div className="award-empty">{t.no_results_for} "{q}"</div>
              :filtered.map(p=>(
              <button key={p.id} type="button" className={`award-opt ${value===p.name?'active':''}`}
                onClick={()=>{onChange(p.name);setOpen(false);setQ('');}}>
                <span>{p.name}</span>
                <span className="award-opt-team">{p.team}{value===p.name&&<span style={{color:'var(--gold)',marginLeft:6}}>✓</span>}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingScreen() {
  return(
    <div className="page" style={{paddingTop:32}}>
      <div style={{borderRadius:16,border:'1px solid var(--brd)',padding:'36px 28px',marginBottom:20}}>
        <div className="skeleton" style={{height:44,width:'60%',margin:'0 auto 12px'}}/>
        <div className="skeleton" style={{height:14,width:'40%',margin:'0 auto 28px'}}/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[0,1,2].map(i=><div key={i} className="skeleton" style={{height:72,borderRadius:10}}/>)}
        </div>
      </div>
      <div style={{background:'var(--sur)',border:'1px solid var(--brd)',borderRadius:12,padding:20,marginBottom:16}}>
        <div className="skeleton" style={{height:22,width:'50%',marginBottom:16}}/>
        {[0,1,2].map(i=><div key={i} className="skeleton" style={{height:50,marginBottom:8,borderRadius:10}}/>)}
      </div>
    </div>
  );
}

function useCountdown(target) {
  const calc=()=>{const diff=target-Date.now();if(diff<=0)return null;return{d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)};};
  const [time,setTime]=useState(calc);
  useEffect(()=>{const id=setInterval(()=>setTime(calc()),1000);return()=>clearInterval(id);},[]);
  return time;
}

// ── Tiebreaker components ─────────────────────────────────────
// item = { slot, round_col, home_team, away_team, home_goals, away_goals }
// home_goals / away_goals are non-null only when the match is finished
function TbMatchRow({ item, saved, onSave, t }) {
  const [hg,setHg]=useState(saved?.home_goals?.toString()??'');
  const [ag,setAg]=useState(saved?.away_goals?.toString()??'');
  const [saving,setSaving]=useState(false);
  const [flash,setFlash]=useState(false);
  const locked=item.home_goals!=null;
  const roundLabel=item.round_col==='final'?'Final':'Semifinal';
  const changed=hg!==(saved?.home_goals?.toString()??'')||ag!==(saved?.away_goals?.toString()??'');
  const canSave=!locked&&hg!==''&&ag!==''&&(changed||!saved);

  // pts breakdown if match is finished
  const tbPts=locked&&saved?calcTbScore(saved,item):null;

  const save=async()=>{
    if(!canSave||saving)return;
    setSaving(true);
    const err=await onSave({slot:item.slot,home_goals:parseInt(hg),away_goals:parseInt(ag)});
    setSaving(false);
    if(!err){setFlash(true);setTimeout(()=>setFlash(false),2200);}
  };

  return(
    <div style={{padding:'14px 0',borderBottom:'1px solid var(--brd)'}}>
      {/* Round label + pts */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <span style={{fontSize:10,fontWeight:800,color:'var(--blue)',textTransform:'uppercase',letterSpacing:1,background:'rgba(96,170,255,0.12)',padding:'2px 8px',borderRadius:4}}>{roundLabel}</span>
        {tbPts&&tbPts.total>0&&(
          <span style={{fontSize:11,fontWeight:700,color:tbPts.exact?'var(--gold)':'var(--green)',marginLeft:2}}>
            ⚖️ +{tbPts.total} pts{tbPts.exact?' · Exacto ✓':''}
          </span>
        )}
        {tbPts&&tbPts.total===0&&saved&&<span style={{fontSize:11,color:'var(--mut)'}}>⚖️ 0 pts</span>}
        {locked&&<span style={{fontSize:10,color:'var(--mut)',marginLeft:'auto'}}>🔒 {t.tb_locked}</span>}
      </div>
      {/* Match row */}
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        {/* Home */}
        <div style={{flex:1,display:'flex',alignItems:'center',gap:7,justifyContent:'flex-end',minWidth:0}}>
          <span style={{fontSize:13,color:'var(--white)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'right'}}>{item.home_team}</span>
          <FlagChip team={item.home_team} size={28}/>
        </div>
        {/* Inputs */}
        <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
          <input type="number" min="0" max="99" value={hg}
            onChange={e=>{setHg(e.target.value.replace(/\D/g,'').slice(0,2));setFlash(false);}}
            disabled={locked}
            style={{width:46,height:42,textAlign:'center',fontSize:20,fontWeight:700,fontFamily:'var(--f-mono)',background:'var(--sur2)',border:`1px solid ${hg!==''?'var(--blue)':'var(--brd)'}`,borderRadius:8,color:'var(--white)',appearance:'textfield'}}/>
          <span style={{color:'var(--mut)',fontWeight:700,fontSize:18,lineHeight:1}}>–</span>
          <input type="number" min="0" max="99" value={ag}
            onChange={e=>{setAg(e.target.value.replace(/\D/g,'').slice(0,2));setFlash(false);}}
            disabled={locked}
            style={{width:46,height:42,textAlign:'center',fontSize:20,fontWeight:700,fontFamily:'var(--f-mono)',background:'var(--sur2)',border:`1px solid ${ag!==''?'var(--blue)':'var(--brd)'}`,borderRadius:8,color:'var(--white)',appearance:'textfield'}}/>
        </div>
        {/* Away */}
        <div style={{flex:1,display:'flex',alignItems:'center',gap:7,minWidth:0}}>
          <FlagChip team={item.away_team} size={28}/>
          <span style={{fontSize:13,color:'var(--white)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.away_team}</span>
        </div>
      </div>
      {/* Save button */}
      {!locked&&(
        <div style={{marginTop:10,display:'flex',justifyContent:'flex-end'}}>
          <button className="btn-primary" style={{minWidth:160,height:36,fontSize:12}}
            onClick={save} disabled={!canSave||saving}>
            {flash?t.tb_saved:saving?'…':t.tb_save}
          </button>
        </div>
      )}
    </div>
  );
}

function TiebreakerSection({ matches, tbPreds, session, onSaveTbPred, t }) {
  const myPreds=(tbPreds||[]).filter(p=>p.user_id===session?.user?.id);

  // Resolve each slot to actual teams using existing results (same logic as AdminPage bracket)
  const tbItems=TB_SLOTS.map(({slot,round_col,bm})=>{
    const h=resolveSlot(bm.home,matches);
    const a=resolveSlot(bm.away,matches);
    if(!h.ready||!a.ready)return null;
    // Find result row if match has been played
    const resultRow=(matches||[]).find(m=>
      m.round_col===round_col&&m.home_goals!=null&&
      ((m.home_team===h.team&&m.away_team===a.team)||(m.home_team===a.team&&m.away_team===h.team))
    );
    return{
      slot,round_col,
      home_team:h.team,away_team:a.team,
      home_goals:resultRow?resultRow.home_goals:null,
      away_goals:resultRow?resultRow.away_goals:null,
    };
  }).filter(Boolean);

  return(
    <div className="card" style={{border:'1px solid rgba(96,170,255,0.3)',background:'rgba(96,170,255,0.03)'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
        <div className="sect-title" style={{color:'var(--blue)',marginBottom:0}}>{t.tb_section_title}</div>
      </div>
      <div style={{fontSize:12,color:'var(--mut)',marginBottom:tbItems.length?14:0,lineHeight:1.5}}>{t.tb_note}</div>
      {tbItems.length===0?(
        <div style={{textAlign:'center',padding:'20px 0',color:'var(--mut)',fontSize:13}}>{t.tb_pending}</div>
      ):tbItems.map(item=>{
        const saved=myPreds.find(p=>p.slot===item.slot);
        return <TbMatchRow key={item.slot} item={item} saved={saved} onSave={onSaveTbPred} t={t}/>;
      })}
    </div>
  );
}

function HomePage({ participants, goTo, t, myParticipant, participantsSorted, resultsMap }) {
  const open=isRegistrationOpen();
  const countdown=useCountdown(DEADLINE);
  const prizeCards=[
    {rank:1,lbl:t.prize1,col:'var(--gold)', name:t.prize1_name, price:t.prize1_price, url:t.prize1_url},
    {rank:2,lbl:t.prize2,col:'#b0b8cc',    name:t.prize2_name, price:t.prize2_price, url:t.prize2_url},
    {rank:3,lbl:t.prize3,col:'#9a7050',    name:t.prize3_name, price:t.prize3_price, url:t.prize3_url},
  ];

  // Top team by points
  const topTeam=Object.entries(resultsMap||{})
    .map(([team,r])=>({team,pts:calcTotal(r)}))
    .filter(x=>x.pts>0)
    .sort((a,b)=>b.pts-a.pts)[0]||null;

  // My position summary
  const myRank=myParticipant?(participantsSorted||[]).findIndex(p=>p.name===myParticipant.name)+1:0;
  const myTotal=myParticipant?(participantsSorted||[]).find(p=>p.name===myParticipant.name)?.total??0:0;
  const leaderTotal=(participantsSorted||[])[0]?.total??0;
  const rankCol=myRank===1?'var(--gold)':myRank===2?'#b0b8cc':myRank===3?'#9a7050':'var(--blue)';
  const rankBg=myRank===1?'rgba(245,183,49,0.1)':myRank===2?'rgba(176,184,204,0.07)':myRank===3?'rgba(154,112,80,0.07)':'rgba(90,159,255,0.07)';
  const rankBrd=myRank===1?'rgba(245,183,49,0.35)':myRank===2?'rgba(176,184,204,0.3)':myRank===3?'rgba(154,112,80,0.3)':'rgba(90,159,255,0.25)';

  // Rival = person immediately above in ranking
  const rivalAbove=myRank>1?(participantsSorted||[])[myRank-2]:null;
  const rivalGap=rivalAbove?(rivalAbove.total||0)-myTotal:0;

  // 4.2 — Share position as image (Canvas API, no external deps)
  const [sharing,setSharing]=useState(false);
  async function handleShare() {
    if(!myParticipant||myRank<=0||sharing)return;
    setSharing(true);
    try {
      await document.fonts.ready;
      const SIZE=1080;
      const canvas=document.createElement('canvas');
      canvas.width=SIZE; canvas.height=SIZE;
      const ctx=canvas.getContext('2d');

      // Background
      ctx.fillStyle='#0a1628';
      ctx.fillRect(0,0,SIZE,SIZE);

      // Subtle grid dots
      ctx.fillStyle='rgba(255,255,255,0.03)';
      for(let x=60;x<SIZE;x+=60)for(let y=60;y<SIZE;y+=60){ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();}

      // Top accent bar
      const grad=ctx.createLinearGradient(0,0,SIZE,0);
      grad.addColorStop(0,'#F5B731'); grad.addColorStop(1,'#c98e15');
      ctx.fillStyle=grad;
      ctx.fillRect(0,0,SIZE,6);

      // App title
      ctx.fillStyle='#A8BCCE';
      ctx.font='500 32px "Geist",Inter,system-ui,sans-serif';
      ctx.textAlign='center';
      ctx.fillText('TS WORLD CUP POOL 2026',SIZE/2,90);

      // Rank number (big)
      const rankHex=myRank===1?'#F5B731':myRank===2?'#b0b8cc':myRank===3?'#9a7050':'#60AAFF';
      ctx.font=`900 ${myRank>=100?220:260}px "Archivo Black","Arial Black",sans-serif`;
      ctx.fillStyle=rankHex;
      ctx.globalAlpha=0.12;
      ctx.fillText(`#${myRank}`,SIZE/2,560);
      ctx.globalAlpha=1;
      ctx.fillText(`#${myRank}`,SIZE/2,540);

      // Name
      const nameSize=myParticipant.name.length>14?64:myParticipant.name.length>10?76:88;
      ctx.font=`900 ${nameSize}px "Archivo Black","Arial Black",sans-serif`;
      ctx.fillStyle='#f8fafc';
      ctx.fillText(myParticipant.name.toUpperCase(),SIZE/2,640);

      // Points
      ctx.font='700 56px "Geist Mono","Courier New",monospace';
      ctx.fillStyle=rankHex;
      ctx.fillText(`${myTotal} pts`,SIZE/2,718);

      // Gap to leader
      if(myRank>1&&leaderTotal>0){
        ctx.font='400 36px "Geist",Inter,system-ui,sans-serif';
        ctx.fillStyle='#A8BCCE';
        ctx.fillText(`+${leaderTotal-myTotal} pts ${t.for_leader}`,SIZE/2,780);
      }
      if(myRank===1){
        ctx.font='500 36px "Geist",Inter,system-ui,sans-serif';
        ctx.fillStyle='#F5B731';
        ctx.fillText(t.you_lead,SIZE/2,780);
      }

      // Branding footer
      ctx.fillStyle='rgba(168,188,206,0.5)';
      ctx.font='400 28px "Geist",Inter,system-ui,sans-serif';
      ctx.fillText('porramundial.vercel.app',SIZE/2,980);

      // Bottom accent bar
      ctx.fillStyle=grad;
      ctx.fillRect(0,SIZE-6,SIZE,6);

      canvas.toBlob(async(blob)=>{
        if(!blob){setSharing(false);return;}
        const file=new File([blob],'mi-posicion.png',{type:'image/png'});
        try {
          if(navigator.share&&navigator.canShare?.({files:[file]})){
            await navigator.share({files:[file],title:`#${myRank} en la porra · ${myTotal} pts`});
          } else {
            const url=URL.createObjectURL(blob);
            const a=document.createElement('a');
            a.href=url; a.download='mi-posicion.png'; a.click();
            setTimeout(()=>URL.revokeObjectURL(url),5000);
          }
        } catch(e){if(e?.name!=='AbortError')console.warn('share error',e);}
        setSharing(false);
      },'image/png',0.95);
    } catch(e){console.error('canvas share error',e);setSharing(false);}
  }

  // Rank delta vs. last visit (localStorage)
  const rankKey=myParticipant?`prev_rank_${myParticipant.name}`:null;
  const [prevRank]=useState(()=>rankKey?parseInt(localStorage.getItem(rankKey)||'0'):0);
  const rankDelta=(myRank>0&&prevRank>0)?prevRank-myRank:0;
  useEffect(()=>{
    if(!rankKey||myRank<=0)return;
    return()=>{try{localStorage.setItem(rankKey,String(myRank));}catch{}};
  },[rankKey,myRank]);

  return(
    <div className="page">
      {myParticipant&&(
        <div className="card" style={{background:rankBg,border:`1px solid ${rankBrd}`,marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{background:rankBg,border:`1px solid ${rankBrd}`,borderRadius:12,padding:'10px 16px',textAlign:'center',flexShrink:0}}>
              <div style={{fontFamily:"var(--f-mono)",fontVariantNumeric:'tabular-nums',fontWeight:700,fontSize:32,color:rankCol,lineHeight:1}}>#{myRank||'—'}</div>
              <div style={{fontSize:10,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1,marginTop:2}}>Posición</div>
              {rankDelta!==0&&(
                <span className={`rank-badge ${rankDelta>0?'rank-up':'rank-down'}`}>
                  {rankDelta>0?'↑':'↓'}{Math.abs(rankDelta)}
                </span>
              )}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:900,fontSize:20,color:'var(--white)',letterSpacing:1,textTransform:'uppercase',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{myParticipant.name}</div>
              <div style={{fontFamily:"var(--f-mono)",fontVariantNumeric:'tabular-nums',fontWeight:700,fontSize:24,color:rankCol,lineHeight:1.2}}>{myTotal} <span style={{fontSize:13,color:'var(--mut)',fontWeight:400}}>pts</span></div>
              {myRank>1&&leaderTotal>0&&<div style={{fontSize:12,color:'var(--mut)',marginTop:2}}>+{leaderTotal-myTotal} {t.for_leader}</div>}
              {myRank===1&&<div style={{fontSize:12,color:'var(--gold)',marginTop:2}}>{t.you_lead}</div>}
              {rivalAbove&&rivalGap>0&&(
                <div className="rival-row">
                  <span>{t.rival_label}:</span>
                  <span className="rival-name">{rivalAbove.name}</span>
                  <span>{t.rival_leads}</span>
                  <span className="rival-gap">{rivalGap} pts</span>
                </div>
              )}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
              <button className="btn-ghost" style={{minWidth:72}} onClick={()=>goTo('seleccion')}>Ver →</button>
              <button className="btn-ghost" style={{minWidth:72,display:'flex',alignItems:'center',justifyContent:'center',gap:4}} onClick={handleShare} disabled={sharing}>
                {sharing?'…':<><Icon name="share" size={13}/> {t.share_btn||'Compartir'}</>}
              </button>
            </div>
          </div>
          <div className="mini-squad">
            {(myParticipant.teams||[]).map(tm => {
              const st = teamStatus(tm, resultsMap);
              const dotCol = st.state==='champion'?'var(--gold)':st.state==='alive'?'var(--green)':st.state==='out'?'#475569':'transparent';
              return (
                <div key={tm} className="mini-squad-item" style={{opacity:st.state==='out'?0.5:1}} title={`${tm} · ${st.label}`}>
                  <FlagChip team={tm} size={26}/>
                  <span className="mini-dot" style={{background:dotCol}}/>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {!myParticipant&&open&&(
        <div className="onboard-card">
          <div style={{fontFamily:"var(--f-display)",fontWeight:900,fontSize:20,color:'var(--gold)',letterSpacing:1,marginBottom:4}}>{t.onboard_title}</div>
          <div style={{fontSize:13,color:'var(--mut)'}}>{t.onboard_sub}</div>
          <div className="onboard-steps">
            {[t.onboard_1,t.onboard_2,t.onboard_3].map((s,i)=>(
              <div key={i} className="onboard-step">
                <div className="onboard-num">{i+1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={()=>goTo('seleccion')}>{t.onboard_cta}</button>
        </div>
      )}
      <div className="hero">
        <div className="hero-title">TS World Cup Pool 2026</div>
        <div className="hero-sub">USA · Mexico · Canada &nbsp;|&nbsp; Jun 11 – Jul 19 2026</div>
        <div className="hero-grid">
          <div className="hero-stat"><div className="hero-stat-val">{participants.length}</div><div className="hero-stat-lbl">{t.participants}</div></div>
          <div className="hero-stat"><div className="hero-stat-val">7</div><div className="hero-stat-lbl">{t.teams_entry}</div></div>
          <div className="hero-stat">
            <div className="hero-stat-lbl" style={{marginBottom:6}}>Mejor equipo</div>
            <div style={{display:'flex',alignItems:'center',gap:6,overflow:'hidden'}}>
              {topTeam&&<FlagChip team={topTeam.team} size={22}/>}
              <div className="hero-stat-val" style={{color:'var(--gold)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:1.1}}>
                {topTeam?topTeam.team:'—'}
              </div>
            </div>
          </div>
        </div>
        {open&&countdown&&(
          <div style={{marginTop:20,padding:'14px 16px',background:'rgba(245,183,49,0.07)',border:'1px solid rgba(245,183,49,0.2)',borderRadius:10}}>
            <div style={{fontSize:10,color:'var(--mut)',textTransform:'uppercase',letterSpacing:2,marginBottom:8,textAlign:'center'}}>{t.countdown_label}</div>
            <div style={{display:'flex',justifyContent:'center',gap:8}}>
              {[{v:countdown.d,l:t.days},{v:countdown.h,l:t.hrs},{v:countdown.m,l:t.min},{v:countdown.s,l:t.sec}].map(({v,l})=>(
                <div key={l} style={{textAlign:'center',minWidth:48,background:'rgba(0,0,0,0.3)',border:'1px solid rgba(245,183,49,0.2)',borderRadius:8,padding:'8px 4px'}}>
                  <div style={{fontFamily:"var(--f-mono)",fontVariantNumeric:'tabular-nums',fontWeight:700,fontSize:26,color:'var(--gold)',lineHeight:1}}>{String(v).padStart(2,'0')}</div>
                  <div style={{fontSize:9,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1,marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="card">
        <div className="sect-title">{t.how_title}</div>
        <div style={{display:'grid',gap:10}}>
          {[{n:'1',tt:t.step1_t,d:t.step1_d},{n:'2',tt:t.step2_t,d:t.step2_d},{n:'3',tt:t.step3_t,d:t.step3_d},{n:'4',tt:t.step4_t,d:t.step4_d}].map(s=>(
            <div key={s.n} style={{display:'flex',gap:14,alignItems:'flex-start',background:'var(--sur2)',border:'1px solid var(--brd)',borderRadius:10,padding:14}}>
              <div style={{background:'var(--gold)',color:'#080c14',width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:900,fontSize:16,flexShrink:0}}>{s.n}</div>
              <div><div style={{fontWeight:600,color:'var(--white)',marginBottom:2,fontSize:15}}>{s.tt}</div><div style={{fontSize:13,color:'var(--mut)'}}>{s.d}</div></div>
            </div>
          ))}
        </div>
        <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--brd)'}}>
          <button className="btn-primary" onClick={()=>goTo('normas')} style={{width:'100%'}}><span style={{display:'inline-flex',alignItems:'center',gap:6}}><Icon name="rules" size={14}/> Ver normas completas</span></button>
        </div>
      </div>
      {/* Prizes — TBD */}
      <div className="card" style={{background:'linear-gradient(135deg,#0e1e38,#091428)'}}>
        <div className="sect-title" style={{marginBottom:12}}>{t.prize_title}</div>
        <div className="premio-grid">
          {prizeCards.map(p=>(
            <div key={p.lbl} className="premio-card" style={{background:`${p.col}10`,borderColor:`${p.col}40`}}>
              <div className="premio-medal" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                {p.rank===1&&<Icon name="crown" size={16} color={p.col}/>}
                <span style={{fontFamily:"var(--f-mono)",fontVariantNumeric:'tabular-nums',fontWeight:700,fontSize:20,color:p.col,lineHeight:1}}>{p.rank}</span>
              </div>
              <div className="premio-tbd" style={{color:p.col}}>{p.lbl}</div>
              <div className="premio-price" style={{color:p.col}}>{p.price}</div>
              <div className="premio-lbl">{p.name}</div>
              <a className="premio-link" href={p.url} target="_blank" rel="noopener noreferrer">smartbox.com ↗</a>
            </div>
          ))}
        </div>
      </div>
      {/* DESEMPATE card */}
      <div className="card" style={{border:'1px solid rgba(96,170,255,0.35)',background:'linear-gradient(135deg,rgba(96,170,255,0.06),rgba(96,170,255,0.02))'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
          <div style={{background:'rgba(96,170,255,0.15)',border:'1px solid rgba(96,170,255,0.4)',borderRadius:8,padding:'6px 10px',fontSize:18,lineHeight:1}}>⚖️</div>
          <div>
            <div style={{fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:900,fontSize:16,color:'var(--blue)',letterSpacing:1}}>¡{t.tb_title}!</div>
            <div style={{fontSize:11,color:'var(--mut)'}}>{t.tb_subtitle}</div>
          </div>
        </div>
        <div style={{fontSize:13,color:'var(--mut)',lineHeight:1.6,marginBottom:14}}>{t.tb_desc}</div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn-ghost" style={{flex:1,fontSize:12}} onClick={()=>goTo('normas')}>{t.tb_rules_btn} →</button>
          <button className="btn-primary" style={{flex:1,fontSize:12}} onClick={()=>goTo('seleccion')}>{t.tb_preds_btn}</button>
        </div>
      </div>
      {!open&&<div style={{textAlign:'center',padding:'14px 0',fontSize:13,color:'var(--mut)'}}>{t.reg_closed_msg}</div>}
    </div>
  );
}

function RulesPage({ t }) {
  const scoring=[{icon:'goal',lbl:t.sc_goal,pts:1,note:''},{icon:'win',lbl:t.sc_win,pts:3,note:t.sc_win_n},{icon:'draw',lbl:t.sc_draw,pts:1,note:t.sc_draw_n},{icon:'advance',lbl:t.sc_adv,pts:6,note:t.sc_adv_n},{icon:'medal',lbl:t.sc_champ,pts:10,note:t.sc_champ_n},{icon:'boot',lbl:t.sc_top,pts:8,note:t.sc_top_n},{icon:'shield',lbl:t.sc_def,pts:6,note:t.sc_def_n}];
  return(
    <div className="page">
      <div className="card">
        <div className="sect-title">{t.team_selection}</div>
        {Object.entries(GROUPS).map(([key,g])=>(
          <div className="grupo-strip" key={key}>
            <div className="grupo-badge" style={{background:`${g.color}22`,color:g.color,border:`1px solid ${g.color}55`}}>{g.label}</div>
            <div style={{fontSize:13,color:'var(--txt)'}}>{t.pick_team} <strong style={{color:'var(--white)'}}>{g.pick}</strong> {g.pick>1?t.pick_team_p:t.pick_team_s}</div>
            <div className="grupo-pick">{g.teams.length} {t.teams_available}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="sect-title">{t.scoring_title}</div>
        <div className="scoring-grid">
          {scoring.map((s,i)=>(
            <div className="scoring-item" key={i}>
              <span className="scoring-icon"><Icon name={s.icon} size={22} color="var(--gold)"/></span>
              <div><div className="scoring-lbl">{s.lbl}</div>{s.note&&<div className="scoring-note">{s.note}</div>}</div>
              <div className="scoring-pts">+{s.pts}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{background:'linear-gradient(135deg,#0e1e38,#091428)',border:'1px solid rgba(245,183,49,0.2)'}}>
        <div className="sect-title" style={{color:'var(--gold)'}}>{t.award_bonus_title}</div>
        <div style={{fontSize:13,color:'var(--mut)',marginBottom:14}}>{t.award_bonus_desc} <strong style={{color:'var(--gold)'}}>+10 pts</strong>. {t.award_bonus_max} <strong style={{color:'var(--green)'}}>+40 pts</strong>.</div>
        <div className="scoring-grid">
          {AWARD_CONFIG.map(a=>(
            <div className="scoring-item" key={a.key} style={{background:'rgba(245,183,49,0.07)',border:'1px solid rgba(245,183,49,0.2)'}}>
              <span className="scoring-icon"><Icon name={a.icon} size={22} color="var(--gold)"/></span>
              <div><div className="scoring-lbl">{a.label}</div></div>
              <div className="scoring-pts">+10</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{background:'linear-gradient(135deg,#0e1e38,#091428)'}}>
        <div className="sect-title">{t.prize_title}</div>
        <div className="premio-grid">
          {[
            {rank:1,pos:t.prize1,col:'var(--gold)',name:t.prize1_name,price:t.prize1_price,url:t.prize1_url},
            {rank:2,pos:t.prize2,col:'#b0b8cc',   name:t.prize2_name,price:t.prize2_price,url:t.prize2_url},
            {rank:3,pos:t.prize3,col:'#9a7050',   name:t.prize3_name,price:t.prize3_price,url:t.prize3_url},
          ].map(p=>(
            <div className="premio-card" key={p.pos} style={{background:`${p.col}10`,borderColor:`${p.col}40`}}>
              <div className="premio-medal" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                {p.rank===1&&<Icon name="crown" size={18} color={p.col}/>}
                <span style={{fontFamily:"var(--f-mono)",fontVariantNumeric:'tabular-nums',fontWeight:700,fontSize:22,color:p.col,lineHeight:1}}>{p.rank}</span>
              </div>
              <div className="premio-tbd" style={{color:p.col}}>{p.pos}</div>
              <div className="premio-price" style={{color:p.col}}>{p.price}</div>
              <div className="premio-lbl">{p.name}</div>
              <a className="premio-link" href={p.url} target="_blank" rel="noopener noreferrer">smartbox.com ↗</a>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="sect-title">{t.format_title}</div>
        {t.format.map((f,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid var(--brd)'}}>
            <span style={{fontWeight:600,color:'var(--white)',fontSize:14}}>{f.phase}</span>
            <span style={{fontSize:12,color:'var(--mut)'}}>{f.detail}</span>
          </div>
        ))}
      </div>
      {/* Tiebreaker rules */}
      <div className="card" style={{border:'1px solid rgba(96,170,255,0.3)',background:'rgba(96,170,255,0.03)'}}>
        <div className="sect-title" style={{color:'var(--blue)'}}>{t.tb_rules_title}</div>
        <div style={{fontSize:13,color:'var(--mut)',marginBottom:14,lineHeight:1.6}}>{t.tb_rules_desc}</div>
        <div className="scoring-grid">
          {[
            {icon:'goal', lbl:'Gol exacto (local o visitante)', pts:'0.5', note:'Por cada gol acertado individualmente'},
            {icon:'win',  lbl:'Resultado correcto (V/E/D)',     pts:'1',   note:'Independiente de si los goles son exactos'},
            {icon:'star', lbl:'Marcador exacto (bonus)',        pts:'1',   note:'Extra si ambos goles son exactos'},
          ].map((s,i)=>(
            <div className="scoring-item" key={i} style={{background:'rgba(96,170,255,0.06)',border:'1px solid rgba(96,170,255,0.15)'}}>
              <span className="scoring-icon"><Icon name={s.icon} size={22} color="var(--blue)"/></span>
              <div><div className="scoring-lbl">{s.lbl}</div>{s.note&&<div className="scoring-note">{s.note}</div>}</div>
              <div className="scoring-pts" style={{color:'var(--blue)'}}>+{s.pts}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12,padding:'10px 14px',background:'rgba(96,170,255,0.08)',border:'1px solid rgba(96,170,255,0.2)',borderRadius:8,fontSize:12,color:'var(--mut)',lineHeight:1.6}}>
          {t.tb_rules_max}
        </div>
      </div>
    </div>
  );
}

function RegistrationPage({ onSubmit, userId, t }) {
  const [name,setName]=useState('');
  const [sel,setSel]=useState({g1:null,g2:[],g3:[],g4:null});
  const [picks,setPicks]=useState({top_scorer:'',mvp:'',best_young:'',best_goalkeeper:''});
  const [players,setPlayers]=useState({top_scorer:[],mvp:[],best_young:[],best_goalkeeper:[]});
  const [done,setDone]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [error,setError]=useState('');
  const nameCardRef=useRef(null);

  useEffect(()=>{
    supabase.from('players').select('*').order('name').then(({data})=>{
      if(!data)return;
      const g={top_scorer:[],mvp:[],best_young:[],best_goalkeeper:[]};
      data.forEach(p=>{if(g[p.category])g[p.category].push(p);});
      setPlayers(g);
    });
  },[]);

  if(!isRegistrationOpen())return(
    <div className="page"><div className="closed-box">
      <div style={{fontSize:52,marginBottom:16}}>🔒</div>
      <div style={{fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:800,fontSize:24,color:'var(--white)',letterSpacing:2,marginBottom:8}}>{t.reg_closed_title}</div>
      <div style={{fontSize:14,color:'var(--mut)'}}>{t.reg_closed_date} <strong style={{color:'var(--txt)'}}>{t.reg_closed_end}</strong></div>
    </div></div>
  );

  const toggle=(gKey,team)=>{
    const g=GROUPS[gKey];
    setSel(prev=>{
      if(g.pick===1)return{...prev,[gKey]:prev[gKey]===team?null:team};
      const arr=prev[gKey];
      if(arr.includes(team))return{...prev,[gKey]:arr.filter(tt=>tt!==team)};
      if(arr.length>=g.pick)return prev;
      return{...prev,[gKey]:[...arr,team]};
    });
  };

  const isSelected=(gKey,team)=>GROUPS[gKey].pick===1?sel[gKey]===team:sel[gKey].includes(team);
  const countSel=(gKey)=>GROUPS[gKey].pick===1?(sel[gKey]?1:0):sel[gKey].length;
  const allSelected=()=>sel.g1&&sel.g2.length===3&&sel.g3.length===2&&sel.g4;
  const allPicks=()=>AWARD_CONFIG.every(a=>picks[a.key]);
  const allTeams=()=>{const tt=[];if(sel.g1)tt.push(sel.g1);tt.push(...sel.g2,...sel.g3);if(sel.g4)tt.push(sel.g4);return tt;};

  const handleSubmit=async()=>{
    if(!name.trim()||!allSelected()||!allPicks()||submitting)return;
    setSubmitting(true);setError('');
    const result=await onSubmit({name:name.trim(),teams:allTeams(),picks,userId});
    if(result===true){setDone(true);}else{
      setError(result==='duplicate'?t.err_duplicate:t.err_general);
      setSubmitting(false);
      setTimeout(()=>nameCardRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),50);
    }
  };

  if(done)return(
    <div className="page"><div className="success-box">
      <div style={{fontSize:52,marginBottom:14}}>✅</div>
      <div style={{fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:800,fontSize:24,color:'var(--green)',letterSpacing:1}}>{t.reg_ok_title}</div>
      <div style={{fontSize:14,color:'var(--mut)',marginTop:6,marginBottom:16}}>{t.reg_ok_sub}</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center'}}>
        {allTeams().map(tt=><span key={tt} className="sum-chip"><FlagChip team={tt} size={16}/> {tt}</span>)}
      </div>
      {Object.values(picks).some(Boolean)&&(
        <div style={{marginTop:16,padding:14,background:'rgba(245,183,49,0.07)',border:'1px solid rgba(245,183,49,0.2)',borderRadius:10,textAlign:'left'}}>
          <div style={{fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:700,fontSize:13,color:'var(--gold)',letterSpacing:1,marginBottom:10}}>{t.your_award_preds}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {AWARD_CONFIG.filter(a=>picks[a.key]).map(a=>(
              <div key={a.key} style={{fontSize:12,color:'var(--txt)'}}>
                <span style={{color:'var(--mut)',display:'inline-flex',alignItems:'center',gap:4}}><Icon name={a.icon} size={12} color="var(--mut)"/> {a.label}: </span>
                <strong style={{color:'var(--white)'}}>{picks[a.key]}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div></div>
  );

  const step1Done=!!name.trim(),step2Done=allSelected(),step3Done=allPicks();
  return(
    <div className="page">
      <div className="step-indicator">
        <div className={`step-item ${step1Done?'done':'active'}`}>{step1Done?'✓ ':''}{t.step_name}</div>
        <div className={`step-item ${step2Done?'done':step1Done?'active':''}`}>{step2Done?'✓ ':''}{t.step_teams}</div>
        <div className={`step-item ${step3Done?'done':step1Done&&step2Done?'active':''}`}>{step3Done?'✓ ':''}{t.step_awards}</div>
        <div className={`step-item ${step1Done&&step2Done?'active':''}`}>{t.step_confirm}</div>
      </div>
      <div className="card" ref={nameCardRef}>
        <div className="sect-title">{t.your_name}</div>
        {error&&<div className="error-box" role="alert">⚠️ {error}</div>}
        <label htmlFor="participant-name" style={{display:'block',marginBottom:6}}>
          <span style={{fontSize:13,color:'var(--white)',fontWeight:600}}>{t.full_name}</span>
          <span style={{display:'block',fontSize:11,color:'var(--mut)',marginTop:2}}>{t.full_name_hint}</span>
        </label>
        <input id="participant-name" className="inp" placeholder={t.name_placeholder} value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/>
      </div>
      <div className="sel-progress">
        {Object.entries(GROUPS).map(([key,g])=>{
          const c=countSel(key),complete=c===g.pick;
          return(<div className="sel-prog-item" key={key} style={{background:complete?`${g.color}15`:'var(--sur)',borderColor:complete?`${g.color}60`:'var(--brd)'}}>
            <div className="sel-prog-g" style={{color:complete?g.color:'var(--mut)'}}>{g.label}</div>
            <div className="sel-prog-count" style={{color:complete?g.color:'var(--txt)'}}>{c}<span style={{fontSize:13,color:'var(--mut)'}}>/{g.pick}</span></div>
          </div>);
        })}
      </div>
      {Object.entries(GROUPS).map(([key,g])=>(
        <div className="card group-section" key={key}>
          <div className="group-header">
            <span className="grupo-badge" style={{background:`${g.color}20`,color:g.color,border:`1px solid ${g.color}50`}}>{g.label}</span>
            <span className="group-title" style={{color:'var(--white)'}}>{t.group_label} {key.slice(1)}</span>
            <span className="group-limit">{t.pick_team} {g.pick} · ({countSel(key)}/{g.pick})</span>
          </div>
          <div className="teams-grid">
            {g.teams.map(team=>{
              const selected=isSelected(key,team),disabled=!selected&&countSel(key)>=g.pick;
              return(<button key={team} className={`team-btn ${selected?'sel':''} ${disabled?'dis':''}`}
                style={selected?{color:g.color,borderColor:g.color,background:`${g.color}12`}:{}}
                onClick={()=>!disabled&&toggle(key,team)} disabled={disabled} aria-pressed={selected}>
                <FlagChip team={team} size={18}/>
                <span style={{fontSize:12,flex:1,minWidth:0}}>{team}</span>
                {selected&&<span style={{marginLeft:'auto',fontSize:14,flexShrink:0}}>✓</span>}
              </button>);
            })}
          </div>
        </div>
      ))}
      {allTeams().length>0&&(
        <div className="sel-summary">
          <div className="sum-title">{t.teams_summary}</div>
          <div className="sum-teams">{allTeams().map(tt=><span key={tt} className="sum-chip"><FlagChip team={tt} size={16}/> {tt}</span>)}</div>
        </div>
      )}
      <div className="card" style={{marginTop:16,border:'1px solid rgba(245,183,49,0.25)',background:'linear-gradient(135deg,#0e1e38,#091428)'}}>
        <div className="sect-title" style={{color:'var(--gold)'}}>
          {t.award_preds}
          <span style={{fontSize:12,color:'var(--mut)',fontFamily:"'Geist','Inter',system-ui,sans-serif",fontWeight:400,letterSpacing:0,textTransform:'none',marginLeft:4}}>{t.pts_each} · {AWARD_CONFIG.filter(a=>picks[a.key]).length}/4 {t.x_selected}</span>
        </div>
        <div className="award-grid">
          {AWARD_CONFIG.map(a=>(
            <div className="award-item" key={a.key}>
              <label><Icon name={a.icon} size={14} color="var(--mut)"/> {a.label}{picks[a.key]&&<span style={{marginLeft:'auto',color:'var(--gold)',fontSize:12}}>✓</span>}</label>
              {(players[a.key]||[]).length>0
                ?<AwardSelect config={a} players={players[a.key]} value={picks[a.key]} onChange={val=>setPicks(p=>({...p,[a.key]:val}))} t={t}/>
                :<input className="inp" style={{marginBottom:0}} placeholder="Nombre del jugador..." value={picks[a.key]||''} onChange={e=>setPicks(p=>({...p,[a.key]:e.target.value}))}/>
              }
            </div>
          ))}
        </div>
      </div>
      <div style={{marginTop:16}}>
        <button className="btn-primary" onClick={handleSubmit} disabled={!name.trim()||!allSelected()||!allPicks()||submitting}>
          {submitting?t.btn_saving:!name.trim()?t.btn_name:!allSelected()?`${t.btn_teams} (${allTeams().length}/7)`:!allPicks()?`${t.btn_awards} (${AWARD_CONFIG.filter(a=>picks[a.key]).length}/4)`:t.btn_confirm}
        </button>
      </div>
    </div>
  );
}

const COLS=[{k:'j1',lbl:'MD1'},{k:'j2',lbl:'MD2'},{k:'j3',lbl:'MD3'},{k:'r32',lbl:'R32'},{k:'r16',lbl:'R16'},{k:'qf',lbl:'QF'},{k:'sf',lbl:'SF'},{k:'final',lbl:'FIN'}];

function TeamTable({ rows, showIndex=true }) {
  return(
    <div style={{overflowX:'auto'}}>
      <table className="res-table">
        <thead><tr><th style={{textAlign:'left'}}>Team</th>{COLS.map(c=><th key={c.k}>{c.lbl}</th>)}<th>TOTAL</th></tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={r.team}>
              <td><div className="res-team">{showIndex&&<span style={{width:22,textAlign:'center',fontFamily:"var(--f-mono)",fontVariantNumeric:'tabular-nums',fontWeight:700,fontSize:13,color:'var(--mut)'}}>{i+1}</span>}<FlagChip team={r.team} size={18}/><span>{r.team}</span></div></td>
              {COLS.map(c=><td key={c.k} className={r[c.k]?'res-pts':'res-zero'}>{r[c.k]||'—'}</td>)}
              <td className="res-total">{r._total||'—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultsPage({ resultsMap, participants, participantsSorted, onRefresh, t }) {
  const [query,setQuery]=useState('');
  const [showDrop,setShowDrop]=useState(false);
  const [selected,setSelected]=useState(null);
  const wrapRef=useRef(null);
  const allSorted=Object.values(resultsMap).map(r=>({...r,_total:calcTotal(r)})).sort((a,b)=>b._total-a._total);
  const suggestions=query.trim().length>=1
    ?participants.filter(p=>p.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0,8)
    :[];
  useEffect(()=>{
    const h=(e)=>{if(wrapRef.current&&!wrapRef.current.contains(e.target))setShowDrop(false);};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);
  const pick=(p)=>{setSelected(p);setQuery(p.name);setShowDrop(false);};
  const clear=()=>{setQuery('');setSelected(null);setShowDrop(false);};
  const foundParticipant=selected;
  const participantRows=foundParticipant?(foundParticipant.teams||[]).map(tm=>({...(resultsMap[tm]||{team:tm,j1:0,j2:0,j3:0,r32:0,r16:0,qf:0,sf:0,final:0})})).map(r=>({...r,_total:calcTotal(r)})).sort((a,b)=>b._total-a._total):[];
  const participantTotal=participantRows.reduce((s,r)=>s+r._total,0);
  const participantRank=foundParticipant?(participantsSorted||[]).findIndex(p=>p.name===foundParticipant.name)+1:-1;
  const rankColor=participantRank===1?'var(--gold)':participantRank===2?'#b0b8cc':participantRank===3?'#9a7050':'var(--blue)';
  const rankBg=participantRank===1?'rgba(245,183,49,0.07)':participantRank===2?'rgba(176,184,204,0.06)':participantRank===3?'rgba(154,112,80,0.06)':'rgba(96,170,255,0.07)';
  const rankBorder=participantRank===1?'rgba(245,183,49,0.4)':participantRank===2?'rgba(176,184,204,0.30)':participantRank===3?'rgba(154,112,80,0.32)':'rgba(96,170,255,0.25)';
  return(
    <div className="page">
      <div className="card">
        <div className="sect-title" style={{marginBottom:12}}>{t.search_title}</div>
        <div ref={wrapRef} style={{position:'relative'}}>
          <div style={{display:'flex',gap:8}}>
            <input className="inp" style={{marginBottom:0,flex:1}}
              placeholder={t.search_ph} value={query}
              onChange={e=>{setQuery(e.target.value);setSelected(null);setShowDrop(true);}}
              onFocus={()=>query.trim()&&setShowDrop(true)}
              autoComplete="off"/>
            {query&&<button type="button" className="btn-ghost" style={{minHeight:44}} onClick={clear}>✕</button>}
          </div>
          {showDrop&&suggestions.length>0&&(
            <div className="search-drop">
              {suggestions.map(p=>(
                <button key={p.id||p.name} type="button" className="search-drop-item" onClick={()=>pick(p)}>
                  <span style={{fontWeight:600,color:'var(--txt)'}}>{p.name}</span>
                  <span style={{fontSize:11,color:'var(--mut)'}}>{(p.teams||[]).length} eq · #{(participantsSorted||[]).findIndex(s=>s.name===p.name)+1||'—'}</span>
                </button>
              ))}
            </div>
          )}
          {showDrop&&query.trim()&&suggestions.length===0&&(
            <div className="search-drop">
              <div style={{padding:'12px 14px',fontSize:13,color:'var(--mut)'}}>Sin resultados para "{query}"</div>
            </div>
          )}
        </div>
      </div>
      {foundParticipant&&(
        <div className="card" style={{border:`1px solid ${rankBorder}`,background:rankBg}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
            <div>
              <div style={{fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:900,fontSize:22,color:'var(--white)',letterSpacing:2,textTransform:'uppercase'}}>{foundParticipant.name}</div>
              <div style={{fontSize:12,color:'var(--mut)',marginTop:2}}>{(foundParticipant.teams||[]).length} {t.teams_selected}</div>
            </div>
            <div style={{textAlign:'right',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
              {participantRank>0&&(
                <div style={{background:rankBg,border:`1px solid ${rankBorder}`,borderRadius:8,padding:'4px 12px',display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:11,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1}}>{t.rank_label}</span>
                  <span style={{fontFamily:"var(--f-mono)",fontVariantNumeric:'tabular-nums',fontWeight:700,fontSize:22,color:rankColor,lineHeight:1}}>#{participantRank}</span>
                </div>
              )}
              <div>
                <div style={{fontFamily:"var(--f-mono)",fontVariantNumeric:'tabular-nums',fontWeight:700,fontSize:32,color:'var(--white)',lineHeight:1}}>{participantTotal}</div>
                <div style={{fontSize:11,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1}}>{t.total_pts}</div>
              </div>
            </div>
          </div>
          <TeamTable rows={participantRows} showIndex={false}/>
          {AWARD_CONFIG.some(a=>foundParticipant[a.col])&&(
            <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--brd)'}}>
              <div style={{fontSize:11,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1,marginBottom:8,fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:700}}>{t.award_preds_label}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{AWARD_CONFIG.filter(a=>foundParticipant[a.col]).map(a=><span key={a.key} className="sum-chip"><Icon name={a.icon} size={12} color="var(--mut)"/> {foundParticipant[a.col]}</span>)}</div>
            </div>
          )}
        </div>
      )}
      {!foundParticipant&&(
        <div className="card">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div className="sect-title" style={{marginBottom:0}}>{t.points_by_team}</div>
            <button className="btn-ghost" onClick={onRefresh}>{t.refresh}</button>
          </div>
          {allSorted.length===0?(
            <div style={{textAlign:'center',padding:'48px 0'}}>
              <div style={{fontSize:48,marginBottom:12}}>⏳</div>
              <div style={{fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:700,fontSize:16,color:'var(--mut)',letterSpacing:1}}>{t.no_results_title}</div>
              <div style={{fontSize:12,color:'var(--mut)',marginTop:8}}>{t.no_results_date}</div>
            </div>
          ):<TeamTable rows={allSorted}/>}
        </div>
      )}
    </div>
  );
}

function contribByTier(participant, resultsMap, winnersMap) {
  const seg = { g1:0, g2:0, g3:0, g4:0, bonus:0 };
  (participant.teams||[]).forEach(tm => {
    const k = TEAM_TIER[tm]; if (k) seg[k] += calcTotal(resultsMap[tm]||{});
  });
  seg.bonus = AWARD_CONFIG.filter(a => winnersMap[a.key] && norm(participant[a.col])===norm(winnersMap[a.key])).length * AWARD_BONUS;
  return seg;
}

function ContribBar({ participant, resultsMap, winnersMap }) {
  const seg = contribByTier(participant, resultsMap, winnersMap);
  const total = seg.g1+seg.g2+seg.g3+seg.g4+seg.bonus;
  if (total <= 0) return null;
  const parts = [
    { v:seg.g1, c:GROUPS.g1.color }, { v:seg.g2, c:GROUPS.g2.color },
    { v:seg.g3, c:GROUPS.g3.color }, { v:seg.g4, c:GROUPS.g4.color },
    { v:seg.bonus, c:'var(--green)' },
  ].filter(p => p.v > 0);
  return (
    <div className="contrib-bar" title="Contribución por tier (+ bonus)">
      {parts.map((p,i)=><div key={i} style={{flex:p.v, background:p.c}}/>)}
    </div>
  );
}

function JumpToMeFab({ myParticipant, sorted, page, setPage }) {
  const [show, setShow] = useState(false);
  const myIdx = myParticipant ? sorted.findIndex(p=>p.name===myParticipant.name) : -1;
  useEffect(() => {
    if (myIdx < 0) return;
    const check = () => {
      const el = document.getElementById('me-row');
      if (!el) { setShow(true); return; }
      const r = el.getBoundingClientRect();
      setShow(!(r.top > 60 && r.bottom < window.innerHeight - 60));
    };
    check();
    window.addEventListener('scroll', check, { passive:true });
    return () => window.removeEventListener('scroll', check);
  }, [myIdx, page]);
  const [pendingScroll, setPendingScroll] = useState(false);
  useEffect(() => {
    if (!pendingScroll) return;
    const el = document.getElementById('me-row');
    if (el) { el.scrollIntoView({ behavior:'smooth', block:'center' }); setPendingScroll(false); }
  }, [page, pendingScroll]);
  if (myIdx < 0 || !show) return null;
  const handleClick = () => {
    const el = document.getElementById('me-row');
    if (el) { el.scrollIntoView({ behavior:'smooth', block:'center' }); return; }
    const myPage = Math.floor(myIdx / PAGE_SIZE) + 1;
    setPage(myPage);
    setPendingScroll(true);
  };
  return <button className="jump-fab" onClick={handleClick}>↓ Mi posición #{myIdx+1}</button>;
}

function PlayerSheet({ participant, resultsMap, winnersMap, onClose }) {
  if (!participant) return null;
  const maxPts = Math.max(...(participant.teams||[]).map(t=>calcTotal(resultsMap[t]||{})), 1);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-grab"/>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
          <div style={{flex:1,minWidth:0}}>
            <div className="clasif-name" style={{fontSize:18}}>{participant.name}</div>
            <div className="num" style={{fontSize:22,color:'var(--gold)',lineHeight:1,marginTop:4}}>
              {participant.total} <span style={{fontSize:12,color:'var(--mut)',fontWeight:400}}>pts</span>
            </div>
          </div>
        </div>
        {Object.entries(GROUPS).map(([key,g]) => {
          const teams = (participant.teams||[]).filter(t=>TEAM_TIER[t]===key);
          if (!teams.length) return null;
          return (
            <div className="squad-tier-group" key={key}>
              <div className="squad-tier-hdr" style={{color:g.color}}>{g.label}</div>
              {teams.map(t=><SquadCard key={t} team={t} result={resultsMap[t]||{}} resultsMap={resultsMap} maxPts={maxPts}/>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardPage({ participants, winnersMap, resultsMap, myParticipant, onRefresh, t }) {
  const [page,setPage]=useState(1);
  const [detail,setDetail]=useState(null);
  const topRef=useRef(null);
  useEffect(()=>{ window.scrollTo({ top: (topRef.current?.offsetTop ?? 0) - 80, behavior:'smooth' }); },[page]);
  const changePage=(n)=>{ setPage(n); };
  const sorted=[...participants].sort((a,b)=>
    b.total-a.total||b.tb_total-a.tb_total||b.tb_exact-a.tb_exact||(a.name<b.name?-1:1)
  );
  const pot=participants.length*10;
  const top3=sorted.slice(0,3);
  const prizeByRank=[
    {name:t.prize1_name,price:t.prize1_price},
    {name:t.prize2_name,price:t.prize2_price},
    {name:t.prize3_name,price:t.prize3_price},
  ];
  const isFirstPage=page===1;
  const showPodium=isFirstPage&&top3.length>=2;
  const podColors=['var(--gold)','#b0b8cc','#9a7050'];
  const podBg=['rgba(245,183,49,0.08)','rgba(176,184,204,0.06)','rgba(154,112,80,0.06)'];
  const hasWinners=Object.values(winnersMap).some(v=>v);
  const pageStart=(page-1)*PAGE_SIZE;
  const pageRows=sorted.slice(pageStart,pageStart+PAGE_SIZE);
  const totalPages=Math.ceil(sorted.length/PAGE_SIZE);
  const listRows=isFirstPage&&showPodium?pageRows.slice(3):pageRows;

  if(participants.length===0)return(
    <div className="page"><div className="card">
      <div className="empty-state">
        <div className="empty-state-icon">🏆</div>
        <div className="empty-state-title">{t.no_part_title}</div>
        <div className="empty-state-sub">{t.empty_lb_sub||t.no_part_sub}</div>
      </div>
    </div></div>
  );

  const PickChips=({p})=>(
    <div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:5}}>
      {AWARD_CONFIG.filter(a=>p[a.col]).map(a=>{
        const correct=winnersMap[a.key]&&norm(p[a.col])===norm(winnersMap[a.key]);
        return(<span key={a.key} style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,padding:'2px 8px',borderRadius:5,background:correct?'rgba(34,212,142,0.12)':'rgba(255,255,255,0.05)',border:correct?'1px solid rgba(34,212,142,0.35)':'1px solid var(--brd)',color:correct?'var(--green)':'var(--mut)'}}>
          <Icon name={a.icon} size={11} color="currentColor"/> {p[a.col]}{correct&&' ✓'}
        </span>);
      })}
    </div>
  );

  const BonusBadge=({p})=>{
    const b=AWARD_CONFIG.filter(a=>winnersMap[a.key]&&norm(p[a.col])===norm(winnersMap[a.key])).length*AWARD_BONUS;
    return b>0?<span className="bonus-badge">+{b} BONUS</span>:null;
  };

  const TbBadge=({p,idx})=>{
    if(!(p.tb_total>0))return null;
    const prev=idx>0?sorted[idx-1]:null;
    const next=idx<sorted.length-1?sorted[idx+1]:null;
    const tied=(prev&&prev.total===p.total)||(next&&next.total===p.total);
    if(!tied)return null;
    return(
      <span title={`Desempate: ${p.tb_total} pts TB`} style={{display:'inline-flex',alignItems:'center',gap:2,fontSize:10,fontWeight:700,color:'var(--blue)',background:'rgba(96,170,255,0.12)',border:'1px solid rgba(96,170,255,0.25)',borderRadius:4,padding:'1px 6px',letterSpacing:0.3}}>
        ⚖️ {p.tb_total}
      </span>
    );
  };

  return(
    <div className="page" ref={topRef}>
      {hasWinners&&(
        <div className="card" style={{background:'rgba(245,183,49,0.05)',border:'1px solid rgba(245,183,49,0.2)'}}>
          <div className="sect-title" style={{marginBottom:10}}>{t.award_winners}</div>
          <div className="award-grid">
            {AWARD_CONFIG.map(a=>winnersMap[a.key]&&(
              <div key={a.key} className="award-pick award-correct">
                <div className="award-pick-lbl" style={{display:'flex',alignItems:'center',gap:5}}><Icon name={a.icon} size={12} color="currentColor"/> {a.label}</div>
                <div className="award-pick-val">{winnersMap[a.key]}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <JumpToMeFab myParticipant={myParticipant} sorted={sorted} page={page} setPage={setPage}/>
      <PlayerSheet participant={detail} resultsMap={resultsMap} winnersMap={winnersMap} onClose={()=>setDetail(null)}/>
      <div key={page} style={{animation:'fadeIn 0.2s ease'}}>
        {showPodium&&(
          <div className="podium">
            {[top3[1],top3[0],top3[2]].filter(Boolean).map((p,i)=>{
              const ri=i===0?1:i===1?0:2;
              return(
                <div className="podium-card" key={p.name} style={{background:podBg[ri],borderColor:`${podColors[ri]}40`,order:ri===0?2:ri===1?1:3,paddingTop:ri===0?30:ri===1?22:16}}>
                  <div className="podium-medal" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,marginBottom:6}}>
                    {ri===0&&<Icon name="crown" size={20} color={podColors[0]}/>}
                    <span style={{fontFamily:"var(--f-mono)",fontVariantNumeric:'tabular-nums',fontWeight:700,fontSize:26,color:podColors[ri],lineHeight:1}}>{ri+1}</span>
                  </div>
                  <div className="podium-name">{p.name}</div>
                  <div className="podium-pts" style={{color:podColors[ri]}}>{p.total}<span> {t.pts}</span></div>
                  <div className="podium-premio" style={{color:podColors[ri]}}>
                    {prizeByRank[ri].name}
                    <span style={{display:'block',fontSize:10,color:'var(--mut)',marginTop:2}}>{prizeByRank[ri].price}</span>
                  </div>
                  <div className="podium-teams">{(p.teams||[]).map(tm=><span key={tm} className="podium-team-chip"><FlagChip team={tm} size={14}/> {tm}</span>)}</div>
                </div>
              );
            })}
          </div>
        )}
        <div className="lb-legend">
          <span><i style={{background:GROUPS.g1.color}}/>TOP</span>
          <span><i style={{background:GROUPS.g2.color}}/>STRONG</span>
          <span><i style={{background:GROUPS.g3.color}}/>AVERAGE</span>
          <span><i style={{background:GROUPS.g4.color}}/>SURPRISE</span>
          <span><i style={{background:'var(--green)'}}/>Bonus</span>
        </div>
        {listRows.map((p,i)=>{
          const sortedIdx=pageStart+(isFirstPage&&showPodium?3:0)+i;
          const pos=sortedIdx+1;
          const isMe=myParticipant&&p.name===myParticipant.name;
          return(
            <div className={`clasif-row${isMe?' me':''}`} id={isMe?'me-row':undefined} key={p.name} onClick={()=>setDetail(p)}>
              <div className="clasif-pos" style={
                pos===1?{background:'rgba(245,183,49,0.15)',borderColor:'rgba(245,183,49,0.4)',color:'var(--gold)'}:
                pos===2?{background:'rgba(176,184,204,0.10)',borderColor:'rgba(176,184,204,0.35)',color:'#b0b8cc'}:
                pos===3?{background:'rgba(154,112,80,0.12)',borderColor:'rgba(154,112,80,0.35)',color:'#9a7050'}:{}
              }>{pos}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:4}}>
                  <span className="clasif-name">{p.name}</span>
                  {isMe&&<span className="me-pin">TÚ</span>}
                  <BonusBadge p={p}/>
                  <TbBadge p={p} idx={sortedIdx}/>
                </div>
                <ContribBar participant={p} resultsMap={resultsMap} winnersMap={winnersMap}/>
                <PickChips p={p}/>
              </div>
              <div className="clasif-pts">{p.total}<span> {t.pts}</span></div>
            </div>
          );
        })}
      </div>
      {totalPages>1&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:8,marginBottom:4,flexWrap:'wrap'}}>
          <button className="btn-ghost" onClick={()=>changePage(Math.max(1,page-1))} disabled={page===1} style={{minWidth:80}}>← Prev</button>
          <div style={{display:'flex',gap:4}}>
            {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
              <button key={n} onClick={()=>changePage(n)}
                style={{width:36,height:36,borderRadius:8,border:`1px solid ${n===page?'var(--gold)':'var(--brd)'}`,background:n===page?'rgba(245,183,49,0.15)':'var(--sur2)',color:n===page?'var(--gold)':'var(--mut)',fontFamily:"var(--f-mono)",fontVariantNumeric:'tabular-nums',fontWeight:700,fontSize:13,cursor:'pointer',transition:'var(--tr)'}}>
                {n}
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={()=>changePage(Math.min(totalPages,page+1))} disabled={page===totalPages} style={{minWidth:80}}>Next →</button>
        </div>
      )}
      <div style={{textAlign:'center',padding:16,fontSize:12,color:'var(--mut)',marginTop:4}}>
        Pág. <strong style={{color:'var(--txt)'}}>{page}</strong> {t.page_of} <strong style={{color:'var(--txt)'}}>{totalPages}</strong>
        &nbsp;·&nbsp; {sorted.length} {t.part_footer}
        <br/>
        <button className="btn-ghost" onClick={onRefresh} style={{marginTop:12}}>{t.refresh_lb}</button>
      </div>
    </div>
  );
}

function AppFooter() {
  return(
    <div className="app-footer">
      Created by Aitor Alegría &amp; Gorka Barroso
    </div>
  );
}

function MatchRow({ home, away, round, saved, onSave }) {
  const [hg, setHg] = useState(saved?.home_goals?.toString() ?? '');
  const [ag, setAg] = useState(saved?.away_goals?.toString() ?? '');
  const [pw, setPw] = useState(saved?.penalty_winner ?? '');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(!!saved);
  const [err, setErr] = useState('');

  const isKnockout = !['j1','j2','j3'].includes(round);

  useEffect(() => {
    setHg(saved?.home_goals?.toString() ?? '');
    setAg(saved?.away_goals?.toString() ?? '');
    setPw(saved?.penalty_winner ?? '');
    setDone(!!saved);
  }, [saved?.id, saved?.home_goals, saved?.away_goals, saved?.penalty_winner]);

  const isDirty = hg !== (saved?.home_goals?.toString() ?? '')
    || ag !== (saved?.away_goals?.toString() ?? '')
    || pw !== (saved?.penalty_winner ?? '');
  const canSave = hg !== '' && ag !== ''
    && !(isKnockout && hg !== '' && ag !== '' && parseInt(hg) === parseInt(ag) && !pw);

  const resetScore = () => { setDone(false); setErr(''); setPw(''); };
  const save = async () => {
    // Hard guard — never save a knockout draw without a penalty winner
    if (isKnockout && parseInt(hg) === parseInt(ag) && !pw) {
      setErr('Empate en eliminatoria: selecciona el ganador por penaltis ↓');
      return;
    }
    if (!canSave || busy) return;
    setBusy(true); setErr('');
    const result = await onSave({
      home_team:home, away_team:away,
      home_goals:parseInt(hg), away_goals:parseInt(ag),
      round_col:round,
      penalty_winner: (isKnockout && parseInt(hg)===parseInt(ag)) ? (pw||null) : null,
    });
    if (result === true) setDone(true);
    else if (typeof result === 'string') setErr(result);
    setBusy(false);
  };
  const penaltyNeeded = isKnockout && hg !== '' && ag !== '' && parseInt(hg) === parseInt(ag);
  return (
    <div className={`match-card${done && !isDirty && (!penaltyNeeded||pw) ? ' saved' : ''}`} style={{marginBottom:6}}>
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'7px 10px'}}>
        <div className="match-team match-team-home">
          <span className="match-name">{home}</span>
          <FlagChip team={home} size={20}/>
        </div>
        <div className="match-score">
          <input className="score-inp" value={hg} onChange={e=>{setHg(e.target.value.replace(/\D/,''));resetScore();}} maxLength={2} inputMode="numeric" placeholder="–"/>
          <span className="score-sep">–</span>
          <input className="score-inp" value={ag} onChange={e=>{setAg(e.target.value.replace(/\D/,''));resetScore();}} maxLength={2} inputMode="numeric" placeholder="–"/>
        </div>
        <div className="match-team">
          <FlagChip team={away} size={20}/>
          <span className="match-name">{away}</span>
        </div>
        <button className={`match-save-btn${done && !isDirty && (!penaltyNeeded||pw) ? ' saved' : ''}`} onClick={save} disabled={busy} style={{opacity:(penaltyNeeded&&!pw)?0.4:1,cursor:(penaltyNeeded&&!pw)?'not-allowed':'pointer'}}>
          {busy ? '⏳' : (done && !isDirty && (!penaltyNeeded||pw)) ? '✓' : '💾'}
        </button>
      </div>
      {penaltyNeeded && (
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'0 10px 8px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <span style={{fontSize:10,color:'var(--mut)',whiteSpace:'nowrap',flexShrink:0}}>🥅 Penaltis:</span>
          <button type="button" className={`penalty-btn${pw===home?' active':''}`} onClick={()=>{setPw(home);setDone(false);setErr('');}}>
            {home}
          </button>
          <button type="button" className={`penalty-btn${pw===away?' active':''}`} onClick={()=>{setPw(away);setDone(false);setErr('');}}>
            {away}
          </button>
        </div>
      )}
      {err && <div style={{fontSize:11,color:'var(--gold)',padding:'0 10px 6px'}}>{err}</div>}
    </div>
  );
}

// Calculate group standings for tournament group A-L
function calcGroupStandings(gk, allMatches) {
  const teams = TOURNEY_GROUPS[gk]; if (!teams) return [];
  const s = {};
  teams.forEach(t => { s[t]={pts:0,gf:0,ga:0,gd:0,w:0,d:0,l:0,played:0}; });
  (allMatches||[]).filter(m =>
    ['j1','j2','j3'].includes(m.round_col) &&
    teams.includes(m.home_team) && teams.includes(m.away_team) &&
    m.home_goals != null && m.away_goals != null
  ).forEach(m => {
    const hg=m.home_goals, ag=m.away_goals;
    s[m.home_team].gf+=hg; s[m.home_team].ga+=ag; s[m.home_team].played++;
    s[m.away_team].gf+=ag; s[m.away_team].ga+=hg; s[m.away_team].played++;
    if(hg>ag){s[m.home_team].pts+=3;s[m.home_team].w++;s[m.away_team].l++;}
    else if(hg<ag){s[m.away_team].pts+=3;s[m.away_team].w++;s[m.home_team].l++;}
    else{s[m.home_team].pts+=1;s[m.home_team].d++;s[m.away_team].pts+=1;s[m.away_team].d++;}
  });
  teams.forEach(t=>{s[t].gd=s[t].gf-s[t].ga;});
  return teams.map(t=>({team:t,...s[t]})).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
}

// Resolve a bracket slot code to actual team name
function resolveSlot(slot, allMatches) {
  const grp=/^([A-L])([123])$/.exec(slot);
  if(grp){
    const st=calcGroupStandings(grp[1],allMatches), pos=parseInt(grp[2])-1;
    const done=st.length===4&&st.every(x=>x.played===3);
    return done&&st[pos]?{team:st[pos].team,label:slot,ready:true}:{team:null,label:slot,ready:false};
  }
  const t3=/^T([1-8])$/.exec(slot);
  if(t3){
    const rank=parseInt(t3[1])-1;
    const allDone=Object.keys(TOURNEY_GROUPS).every(gk=>{
      const st=calcGroupStandings(gk,allMatches);return st.length===4&&st.every(x=>x.played===3);
    });
    if(allDone){
      const thirds=Object.keys(TOURNEY_GROUPS)
        .map(gk=>calcGroupStandings(gk,allMatches)[2]).filter(Boolean)
        .sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf).slice(0,8);
      if(thirds[rank])return{team:thirds[rank].team,label:`3°${rank+1}`,ready:true};
    }
    return{team:null,label:`3°${rank+1}`,ready:false};
  }
  const prev=/^(r32|r16|qf|sf)_(\d+)w$/.exec(slot);
  if(prev){
    const[,rnd,n]=prev; const bm=(BRACKET[rnd]||[])[parseInt(n)-1];
    if(!bm)return{team:null,label:slot,ready:false};
    const h=resolveSlot(bm.home,allMatches),a=resolveSlot(bm.away,allMatches);
    if(!h.team||!a.team)return{team:null,label:`W(${rnd.toUpperCase()}${n})`,ready:false};
    const sv=(allMatches||[]).find(m=>
      m.round_col===rnd&&m.home_goals!=null&&m.away_goals!=null&&
      ((m.home_team===h.team&&m.away_team===a.team)||(m.home_team===a.team&&m.away_team===h.team))
    );
    if(!sv)return{team:null,label:`W(${rnd.toUpperCase()}${n})`,ready:false};
    const winner = sv.home_goals > sv.away_goals ? sv.home_team
                 : sv.home_goals < sv.away_goals ? sv.away_team
                 : sv.penalty_winner || null;
    if(!winner)return{team:null,label:`W(${rnd.toUpperCase()}${n}) — falta ganador penaltis`,ready:false};
    return{team:winner,label:`W(${rnd.toUpperCase()}${n})`,ready:true};
  }
  return{team:null,label:slot,ready:false};
}

function AutoKnockoutSection({ savedMatches, onSaveMatch }) {
  const [roundTab,setRoundTab]=useState('grupos');
  const tabs=[
    {key:'grupos',label:'Grupos'},
    {key:'r32',label:'D16'},
    {key:'r16',label:'Octavos'},
    {key:'qf',label:'Cuartos'},
    {key:'sf',label:'Semis'},
    {key:'final',label:'Final'},
  ];
  return (
    <div>
      <div className="match-tabs" style={{overflowX:'auto',flexWrap:'nowrap',paddingBottom:2}}>
        {tabs.map(t=>(
          <button key={t.key} className={`match-tab${roundTab===t.key?' on':''}`} onClick={()=>setRoundTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {roundTab==='grupos'?(
        <div>
          {Object.keys(TOURNEY_GROUPS).map(gk=>{
            const st=calcGroupStandings(gk,savedMatches);
            const done=st.length===4&&st.every(s=>s.played===3);
            return(
              <div key={gk} style={{marginBottom:14}}>
                <div className="match-group-hdr" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>Grupo {gk}</span>
                  {done&&<span style={{fontSize:10,color:'var(--green)',fontWeight:700,letterSpacing:0.5}}>✓ COMPLETO</span>}
                </div>
                <div style={{background:'var(--sur2)',borderRadius:8,border:'1px solid var(--brd)',overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead>
                      <tr style={{background:'rgba(255,255,255,0.03)'}}>
                        <th style={{textAlign:'left',padding:'5px 8px',color:'var(--mut)',fontWeight:600,fontSize:10}}>Equipo</th>
                        <th style={{textAlign:'center',width:24,color:'var(--mut)',fontWeight:600,fontSize:10}}>J</th>
                        <th style={{textAlign:'center',width:24,color:'var(--mut)',fontWeight:600,fontSize:10}}>G</th>
                        <th style={{textAlign:'center',width:28,color:'var(--mut)',fontWeight:600,fontSize:10}}>GD</th>
                        <th style={{textAlign:'center',width:28,color:'var(--gold)',fontWeight:700,fontSize:10}}>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {st.map((s,idx)=>{
                        const bL=idx===0?'3px solid var(--green)':idx===1?'3px solid rgba(74,222,128,0.45)':idx===2?'3px solid rgba(245,183,49,0.3)':'3px solid transparent';
                        return(
                          <tr key={s.team} style={{borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                            <td style={{padding:'6px 8px 6px 6px',borderLeft:bL}}>
                              <div style={{display:'flex',alignItems:'center',gap:5}}>
                                <FlagChip team={s.team} size={17}/>
                                <span style={{color:idx<2?'var(--white)':'var(--mut)',fontWeight:idx<2?500:400,maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.team}</span>
                              </div>
                            </td>
                            <td style={{textAlign:'center',padding:'6px 4px',color:'var(--mut)'}}>{s.played}</td>
                            <td style={{textAlign:'center',padding:'6px 4px',color:'var(--mut)'}}>{s.w}</td>
                            <td style={{textAlign:'center',padding:'6px 4px',color:s.gd>0?'var(--green)':s.gd<0?'#e55':'var(--mut)'}}>{s.gd>0?'+':''}{s.gd}</td>
                            <td style={{textAlign:'center',padding:'6px 4px',color:'var(--gold)',fontWeight:700}}>{s.pts}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ):(
        <div>
          {(BRACKET[roundTab]||[]).map(bm=>{
            const h=resolveSlot(bm.home,savedMatches),a=resolveSlot(bm.away,savedMatches);
            if(!h.ready||!a.ready){
              return(
                <div key={bm.n} style={{display:'flex',alignItems:'center',padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',gap:6}}>
                  <div style={{flex:1,display:'flex',alignItems:'center',gap:5,justifyContent:'flex-end'}}>
                    {h.team?<><FlagChip team={h.team} size={18}/><span style={{fontSize:11,color:'var(--txt-mid)'}}>{h.team}</span></>
                    :<span style={{fontSize:11,color:'var(--mut)',fontStyle:'italic'}}>{h.label}</span>}
                  </div>
                  <span style={{fontSize:10,color:'var(--mut)',flexShrink:0,width:22,textAlign:'center'}}>vs</span>
                  <div style={{flex:1,display:'flex',alignItems:'center',gap:5}}>
                    {a.team?<><FlagChip team={a.team} size={18}/><span style={{fontSize:11,color:'var(--txt-mid)'}}>{a.team}</span></>
                    :<span style={{fontSize:11,color:'var(--mut)',fontStyle:'italic'}}>{a.label}</span>}
                  </div>
                  <span style={{fontSize:10,color:'var(--mut)',flexShrink:0,paddingLeft:4}}>pendiente</span>
                </div>
              );
            }
            const sv=(savedMatches||[]).find(m=>
              m.round_col===roundTab&&
              ((m.home_team===h.team&&m.away_team===a.team)||(m.home_team===a.team&&m.away_team===h.team))
            );
            return <MatchRow key={bm.n} home={h.team} away={a.team} round={roundTab} saved={sv} onSave={onSaveMatch}/>;
          })}
        </div>
      )}
    </div>
  );
}

function AdminPage({ onSync, winnersMap, onSaveWinners, savedMatches, onSaveMatch }) {
  const [log,setLog]=useState('Ready. Press Sync to fetch latest results.');
  const [syncing,setSyncing]=useState(false);
  const [winners,setWinners]=useState({top_scorer:winnersMap.top_scorer||'',mvp:winnersMap.mvp||'',young:winnersMap.best_young||'',goalkeeper:winnersMap.best_goalkeeper||''});
  useEffect(()=>{setWinners({top_scorer:winnersMap.top_scorer||'',mvp:winnersMap.mvp||'',young:winnersMap.best_young||'',goalkeeper:winnersMap.best_goalkeeper||''});},[winnersMap.top_scorer,winnersMap.mvp,winnersMap.best_young,winnersMap.best_goalkeeper]);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [saveErr,setSaveErr]=useState('');
  const [matchTab,setMatchTab]=useState('j1');
  const sync=async()=>{setSyncing(true);await onSync(msg=>setLog(prev=>prev+'\n'+msg));setSyncing(false);};
  const saveWinners=async()=>{
    setSaving(true);setSaveErr('');
    const err=await onSaveWinners(winners);
    setSaving(false);
    if(err){setSaveErr(err);}else{setSaved(true);setTimeout(()=>setSaved(false),2500);}
  };

  // Build lookup: "home|away|round" → saved match
  const savedByKey={};
  (savedMatches||[]).forEach(m=>{
    savedByKey[`${m.home_team}|${m.away_team}|${m.round_col}`]=m;
    savedByKey[`${m.away_team}|${m.home_team}|${m.round_col}`]=m;
  });
  const manualCount=(savedMatches||[]).filter(m=>m.source==='manual').length;

  return(
    <div className="page">
      <div className="card" style={{border:'1px solid rgba(245,183,49,0.3)'}}>
        <div className="sect-title">⚙️ Admin Panel</div>
        <div style={{fontSize:13,color:'var(--mut)',marginBottom:12}}>
          Sincroniza resultados desde football-data.org.
          {manualCount>0&&<span style={{color:'var(--gold)',marginLeft:6}}>⚠ {manualCount} partidos manuales — el Sync no los sobreescribirá.</span>}
        </div>
        <button className="btn-primary" onClick={sync} disabled={syncing}>{syncing?'⏳ Syncing…':'🔄 Sync Results from API'}</button>
        {log&&<div className="admin-log">{log}</div>}
        <hr className="admin-divider"/>
        <div style={{fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:800,fontSize:16,color:'var(--white)',letterSpacing:1,marginBottom:14}}>Award Winners</div>
        <div style={{fontSize:13,color:'var(--mut)',marginBottom:14}}>Fill these in when the tournament ends. Each participant who predicted correctly earns +10 pts.</div>
        <div className="award-grid">
          {[{k:'top_scorer',label:'⚽ Top Scorer'},{k:'mvp',label:'🏆 Tournament MVP'},{k:'young',label:'🌟 Best Young Player'},{k:'goalkeeper',label:'🧤 Best Goalkeeper'}].map(a=>(
            <div key={a.k}>
              <label style={{display:'block',fontSize:11,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1,marginBottom:5,fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:700}}>{a.label}</label>
              <input className="inp" style={{marginBottom:0}} placeholder="Player name…" value={winners[a.k]} onChange={e=>setWinners(w=>({...w,[a.k]:e.target.value}))}/>
            </div>
          ))}
        </div>
        <button className="btn-primary" style={{marginTop:14}} onClick={saveWinners} disabled={saving}>{saved?'✅ Guardado!':saving?'Guardando…':'💾 Save Award Winners'}</button>
        {saveErr&&<div style={{marginTop:8,fontSize:12,color:'#e55',background:'rgba(229,85,85,0.1)',border:'1px solid rgba(229,85,85,0.3)',borderRadius:6,padding:'6px 10px'}}>❌ {saveErr}</div>}
        <hr className="admin-divider"/>
        <div style={{fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:800,fontSize:16,color:'var(--white)',letterSpacing:1,marginBottom:6}}>⚽ Resultados de Partidos</div>
        <div style={{fontSize:12,color:'var(--mut)',marginBottom:14}}>Entrada manual. Los partidos guardados aquí tienen prioridad sobre el Sync de la API.</div>
        <div className="match-tabs">
          {['j1','j2','j3','elim'].map(tab=>(
            <button key={tab} className={`match-tab${matchTab===tab?' on':''}`} onClick={()=>setMatchTab(tab)}>
              {tab==='j1'?'Jornada 1':tab==='j2'?'Jornada 2':tab==='j3'?'Jornada 3':'Eliminatorias'}
            </button>
          ))}
        </div>
        {matchTab!=='elim'&&(()=>{
          const fixtures=FIXTURES[matchTab]||[];
          const byGroup={};
          fixtures.forEach(f=>{if(!byGroup[f.group])byGroup[f.group]=[];byGroup[f.group].push(f);});
          return Object.entries(byGroup).sort().map(([g,ms])=>(
            <div key={g}>
              <div className="match-group-hdr">Grupo {g}</div>
              {ms.map(f=>{
                const s=savedByKey[`${f.home}|${f.away}|${matchTab}`];
                return <MatchRow key={`${f.home}|${f.away}`} home={f.home} away={f.away} round={matchTab} saved={s} onSave={onSaveMatch}/>;
              })}
            </div>
          ));
        })()}
        {matchTab==='elim'&&<AutoKnockoutSection savedMatches={savedMatches} onSaveMatch={onSaveMatch}/>}
      </div>
    </div>
  );
}

function SquadCard({ team, result, resultsMap, maxPts }) {
  const tier = tierOf(team);
  const total = calcTotal(result);
  const st = teamStatus(team, resultsMap);
  const tierColor = tier?.color || 'var(--mut)';
  const dead = st.state === 'out';
  const pending = st.state === 'pending';
  const pct = maxPts > 0 ? Math.round((total / maxPts) * 100) : 0;
  const stateChip = {
    alive:    { txt:'VIVO',    col:'var(--green)', bg:'rgba(74,222,128,0.12)' },
    out:      { txt:'FUERA',   col:'var(--mut)',   bg:'rgba(255,255,255,0.04)' },
    champion: { txt:'CAMPEÓN', col:'var(--gold)',  bg:'rgba(245,183,49,0.14)' },
    pending:  { txt:'LISTO',   col:tierColor,      bg:`${tierColor}1f` },
  }[st.state];
  return (
    <div className="squad-card" style={{borderLeft:`3px solid ${tierColor}`,opacity:dead?0.55:1}}>
      <FlagChip team={team} size={36}/>
      <div className="squad-main">
        <div className="squad-top">
          <span className="squad-name">{team}</span>
          {st.state==='alive'&&(TEAM_TIER[team]==='g4'||TEAM_TIER[team]==='g3')&&st.reachedIdx>=5&&
            <Icon name="flame" size={13} color="#ff6b35"/>}
        </div>
        <div className="squad-sub">
          <span className="tier-tag" style={{color:tierColor}}>{tier?.label}</span>
          <span className="squad-dot">·</span>
          <span style={{color:dead?'var(--mut)':'var(--txt-mid)'}}>{pending?'Por empezar':st.label}</span>
        </div>
        {!pending&&<div className="squad-bar"><div style={{width:`${pct}%`,background:tierColor}}/></div>}
      </div>
      <div className="squad-pts">
        <span className="num">{pending?'–':total}</span>
        <span className="squad-pts-sub">pts</span>
      </div>
      <span className="squad-state" style={{color:stateChip.col,background:stateChip.bg}}>
        {stateChip.txt}
      </span>
    </div>
  );
}

function MyResultsPage({ myParticipant, resultsMap, participantsSorted, winnersMap, goTo, t, matches, tbPreds, session, onSaveTbPred }) {
  if(!myParticipant)return(
    <div className="page">
      <div className="card" style={{textAlign:'center',padding:'48px 20px'}}>
        <div style={{marginBottom:14}}><Icon name="rules" size={44} color="var(--mut)"/></div>
        <div style={{fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:700,fontSize:18,color:'var(--mut)',letterSpacing:1}}>AÚN NO ESTÁS INSCRITO</div>
        <div style={{fontSize:13,color:'var(--mut)',marginTop:8,marginBottom:20}}>Regístrate para ver tus resultados aquí.</div>
        <button className="btn-primary" style={{maxWidth:260,margin:'0 auto'}} onClick={()=>goTo('seleccion')}>{t.register_btn}</button>
      </div>
      <TiebreakerSection matches={matches} tbPreds={tbPreds} session={session} onSaveTbPred={onSaveTbPred} t={t}/>
    </div>
  );

  const rows=(myParticipant.teams||[]).map(tm=>({
    ...(resultsMap[tm]||{team:tm,j1:0,j2:0,j3:0,r32:0,r16:0,qf:0,sf:0,final:0}),
  })).map(r=>({...r,_total:calcTotal(r)})).sort((a,b)=>b._total-a._total);

  const teamTotal=rows.reduce((s,r)=>s+r._total,0);
  const hasWinners=Object.values(winnersMap).some(v=>v);
  const bonusPts=AWARD_CONFIG.filter(a=>winnersMap[a.key]&&norm(myParticipant[a.col])===norm(winnersMap[a.key])).length*AWARD_BONUS;
  const grandTotal=teamTotal+bonusPts;
  const rank=(participantsSorted||[]).findIndex(p=>p.name===myParticipant.name)+1;
  const leaderTotal=(participantsSorted||[])[0]?.total??0;
  const totalPlayers=(participantsSorted||[]).length;
  const rankCol=rank===1?'var(--gold)':rank===2?'#b0b8cc':rank===3?'#9a7050':'var(--blue)';
  const rankBg=rank===1?'rgba(245,183,49,0.1)':rank===2?'rgba(176,184,204,0.07)':rank===3?'rgba(154,112,80,0.07)':'rgba(90,159,255,0.07)';
  const rankBrd=rank===1?'rgba(245,183,49,0.35)':rank===2?'rgba(176,184,204,0.3)':rank===3?'rgba(154,112,80,0.3)':'rgba(90,159,255,0.25)';

  return(
    <div className="page">
      {/* Position card */}
      <div className="card" style={{background:rankBg,border:`1px solid ${rankBrd}`}}>
        <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
          <div style={{textAlign:'center',flexShrink:0}}>
            <div style={{fontFamily:"var(--f-mono)",fontVariantNumeric:'tabular-nums',fontWeight:700,fontSize:56,color:rankCol,lineHeight:1}}>#{rank||'—'}</div>
            <div style={{fontSize:11,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1}}>de {totalPlayers}</div>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Archivo Black','Archivo',system-ui,sans-serif",fontWeight:900,fontSize:24,color:'var(--white)',letterSpacing:2,textTransform:'uppercase',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{myParticipant.name}</div>
            <div style={{fontFamily:"var(--f-mono)",fontVariantNumeric:'tabular-nums',fontWeight:700,fontSize:36,color:rankCol,lineHeight:1.1}}>{grandTotal}<span style={{fontSize:14,color:'var(--mut)',fontWeight:400}}> pts</span></div>
            {grandTotal===0?(
              <div style={{fontSize:13,color:'var(--mut)',marginTop:2,display:'flex',alignItems:'center',gap:5}}>
                <Icon name="check" size={13} color="var(--green)"/> Inscripción confirmada · ¡a esperar el pitido!
              </div>
            ):rank>1&&leaderTotal>0?(
              <div style={{fontSize:13,color:'var(--mut)',marginTop:2}}>+{leaderTotal-grandTotal} pts para el 1º</div>
            ):rank===1?(
              <div style={{fontSize:13,color:'var(--gold)',marginTop:2,display:'flex',alignItems:'center',gap:4}}><Icon name="crown" size={13} color="var(--gold)"/> ¡Vas primero!</div>
            ):null}
          </div>
        </div>
        {bonusPts>0&&(
          <div style={{marginTop:12,padding:'8px 12px',background:'rgba(34,212,142,0.1)',border:'1px solid rgba(34,212,142,0.3)',borderRadius:8,fontSize:13,color:'var(--green)',display:'flex',alignItems:'center',gap:6}}>
            <Icon name="medal" size={14} color="var(--green)"/> +{bonusPts} pts de bonus por predicciones correctas
          </div>
        )}
      </div>

      {/* Teams breakdown — living roster */}
      <div className="card">
        <div className="sect-title" style={{marginBottom:12}}>Mi plantilla</div>
        {(()=>{
          const teams=myParticipant.teams||[];
          const live=teams.filter(t=>['alive','champion'].includes(teamStatus(t,resultsMap).state)).length;
          const out=teams.filter(t=>teamStatus(t,resultsMap).state==='out').length;
          const started=tournamentStage(resultsMap)>=0;
          return(
            <div className="squad-summary">
              {started?(
                <>
                  <span><span className="dot" style={{background:'var(--green)'}}/>{live} vivos</span>
                  <span><span className="dot" style={{background:'#475569'}}/>{out} fuera</span>
                </>
              ):(
                <span>{teams.length} equipos · 4 categorías · listos para el debut</span>
              )}
            </div>
          );
        })()}
        {tournamentStage(resultsMap)<0&&(
          <div className="pre-banner">
            <Icon name="trophy" size={15} color="var(--gold)"/>
            El torneo arranca el 11 de junio. Aquí seguirás a tus equipos en vivo: rondas, puntos y quién sigue con vida.
          </div>
        )}
        {Object.entries(GROUPS).map(([key,g])=>{
          const teamsInTier=(myParticipant.teams||[]).filter(t=>TEAM_TIER[t]===key);
          if(!teamsInTier.length)return null;
          const maxPts=Math.max(...(myParticipant.teams||[]).map(t=>calcTotal(resultsMap[t]||{})),1);
          const sorted=[...teamsInTier].sort((a,b)=>calcTotal(resultsMap[b]||{})-calcTotal(resultsMap[a]||{}));
          return(
            <div className="squad-tier-group" key={key}>
              <div className="squad-tier-hdr" style={{color:g.color}}>
                {g.label}
                <span className="pick">{teamsInTier.length} {teamsInTier.length>1?'equipos':'equipo'}</span>
              </div>
              {sorted.map(t=>(
                <SquadCard key={t} team={t} result={resultsMap[t]||{}} resultsMap={resultsMap} maxPts={maxPts}/>
              ))}
            </div>
          );
        })}
        <div style={{display:'flex',justifyContent:'flex-end',paddingTop:10,borderTop:'1px solid var(--brd)',marginTop:4}}>
          <span style={{fontSize:13,color:'var(--mut)',marginRight:8}}>Total equipos:</span>
          <span className="num" style={{fontSize:18,color:'var(--gold)'}}>{teamTotal} pts</span>
        </div>
      </div>

      {/* Award predictions */}
      <div className="card" style={{border:'1px solid rgba(245,183,49,0.25)',background:'linear-gradient(135deg,#0e1e38,#091428)'}}>
        <div className="sect-title" style={{color:'var(--gold)'}}>Tus predicciones</div>
        <div className="award-grid">
          {AWARD_CONFIG.map(a=>{
            const correct=hasWinners&&winnersMap[a.key]&&norm(myParticipant[a.col])===norm(winnersMap[a.key]);
            const pending=!hasWinners||!winnersMap[a.key];
            return(
              <div key={a.key} className={`award-pick ${correct?'award-correct':''}`} style={{border:pending?'1px solid var(--brd)':correct?'1px solid rgba(34,212,142,0.5)':'1px solid rgba(255,107,138,0.4)',background:pending?'var(--sur2)':correct?'rgba(34,212,142,0.08)':'rgba(255,107,138,0.06)'}}>
                <div className="award-pick-lbl" style={{display:'flex',alignItems:'center',gap:5}}><Icon name={a.icon} size={12} color="currentColor"/> {a.label}</div>
                <div className="award-pick-val" style={{color:pending?'var(--white)':correct?'var(--green)':'var(--pink)'}}>
                  {myParticipant[a.col]||<span style={{color:'var(--mut)'}}>—</span>}
                  {correct&&<span style={{fontSize:12,marginLeft:6}}>✓ +10 pts</span>}
                  {!pending&&!correct&&myParticipant[a.col]&&<span style={{fontSize:11,marginLeft:6,color:'var(--mut)'}}>({winnersMap[a.key]})</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tiebreaker predictions */}
      <TiebreakerSection matches={matches} tbPreds={tbPreds} session={session} onSaveTbPred={onSaveTbPred} t={t}/>
    </div>
  );
}

function LoginPage({ lang, setLang }) {
  const [mode,setMode]=useState('login'); // 'login' | 'register' | 'reset'
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [fullName,setFullName]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');

  const handleLogin=async(e)=>{
    e.preventDefault();setLoading(true);setError('');
    const {error:err}=await supabase.auth.signInWithPassword({email,password});
    if(err)setError(err.message);
    setLoading(false);
  };

  const handleRegister=async(e)=>{
    e.preventDefault();setLoading(true);setError('');setSuccess('');
    const {error:err}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName||email}}});
    if(err)setError(err.message);
    else setSuccess('¡Cuenta creada! Revisa tu correo para confirmar tu dirección.');
    setLoading(false);
  };

  const handleReset=async(e)=>{
    e.preventDefault();setLoading(true);setError('');setSuccess('');
    const {error:err}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
    if(err)setError(err.message);
    else setSuccess('Te hemos enviado un correo con el enlace para restablecer tu contraseña.');
    setLoading(false);
  };

  return(
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><div className="auth-logo-icon-wrap"><Icon name="trophy" size={36} color="var(--gold)"/></div></div>
          <div className="auth-logo-title">World Cup Pool 2026</div>
          <div className="auth-logo-sub">USA · Mexico · Canada</div>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab ${mode==='login'?'on':''}`} onClick={()=>{setMode('login');setError('');setSuccess('');}}>Entrar</button>
          <button className={`auth-tab ${mode==='register'?'on':''}`} onClick={()=>{setMode('register');setError('');setSuccess('');}}>Registrarse</button>
          {mode==='reset'&&<button className={`auth-tab on`}>Recuperar</button>}
        </div>
        {error&&<div className="error-box">⚠️ {error}</div>}
        {success&&<div className="success-box" style={{padding:'12px 16px',marginBottom:16,textAlign:'left'}}>✅ {success}</div>}
        {mode==='login'&&(
          <form onSubmit={handleLogin}>
            <label className="auth-label">Email</label>
            <input className="inp" type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>
            <label className="auth-label">Contraseña</label>
            <input className="inp" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/>
            <button type="button" className="auth-forgot" onClick={()=>{setMode('reset');setError('');setSuccess('');}}>¿Olvidaste tu contraseña?</button>
            <button className="btn-primary" type="submit" disabled={loading}>{loading?'⏳ Entrando…':'Entrar'}</button>
          </form>
        )}
        {mode==='register'&&(
          <form onSubmit={handleRegister}>
            <label className="auth-label">Nombre (opcional)</label>
            <input className="inp" type="text" placeholder="Tu nombre" value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name"/>
            <label className="auth-label">Email</label>
            <input className="inp" type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>
            <label className="auth-label">Contraseña</label>
            <input className="inp" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="new-password" minLength={6}/>
            <button className="btn-primary" type="submit" disabled={loading}>{loading?'⏳ Creando cuenta…':'Crear cuenta'}</button>
          </form>
        )}
        {mode==='reset'&&(
          <form onSubmit={handleReset}>
            <label className="auth-label">Email</label>
            <input className="inp" type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>
            <button className="btn-primary" type="submit" disabled={loading}>{loading?'⏳ Enviando…':'Enviar enlace'}</button>
            <button type="button" className="auth-forgot" style={{display:'block',marginTop:12}} onClick={()=>{setMode('login');setError('');setSuccess('');}}>← Volver al inicio de sesión</button>
          </form>
        )}
      </div>
      <div style={{marginTop:12,display:'flex',gap:4,justifyContent:'center'}}>
        <LangSelector lang={lang} setLang={setLang}/>
      </div>
    </div>
  );
}

export default function App() {
  const [tab,setTab]=useState('inicio');
  const [participants,setParticipants]=useState([]);
  const [resultsMap,setResultsMap]=useState({});
  const [winnersMap,setWinnersMap]=useState({});
  const [matches,setMatches]=useState([]);
  const [tbPreds,setTbPreds]=useState([]);
  const [loading,setLoading]=useState(true);
  const [adminMode,setAdminMode]=useState(false);
  const [lang,setLang]=useState(()=>{ try{return localStorage.getItem('lang')||'es';}catch{return 'es';} });
  const [session,setSession]=useState(undefined); // undefined = loading, null = no session
  const [myParticipant,setMyParticipant]=useState(null);
  useEffect(()=>{ try{localStorage.setItem('lang',lang);}catch{} },[lang]);
  const t=LANGS[lang];

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session:s}})=>setSession(s??null));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>setSession(s??null));
    return()=>subscription.unsubscribe();
  },[]);

  // Load/refresh current user's participant record
  useEffect(()=>{
    if(!session?.user?.id){setMyParticipant(null);return;}
    supabase.from('participants').select('*').eq('user_id',session.user.id).maybeSingle()
      .then(({data})=>setMyParticipant(data||null));
  },[session]);

  // Check if logged-in user is an admin (via admins table — server-side gated)
  useEffect(()=>{
    if(!session?.user?.id){setAdminMode(false);return;}
    supabase.from('admins').select('user_id').eq('user_id',session.user.id).maybeSingle()
      .then(({data,error})=>setAdminMode(!error&&!!data));
  },[session]);

  useEffect(()=>{loadData();},[]);

  async function loadData() {
    const [{data:parts},{data:res},{data:winners},{data:mats},{data:tbps}]=await Promise.all([
      supabase.from('participants').select('*').order('created_at'),
      supabase.from('results').select('*'),
      supabase.from('award_winners').select('*'),
      supabase.from('matches').select('*').order('id'),
      supabase.from('tiebreaker_predictions').select('*'),
    ]);
    setParticipants(parts||[]);
    const map={};(res||[]).forEach(r=>{map[r.team]=r;});setResultsMap(map);
    // award_winners: supports both multi-row {category,<winner_col>} and legacy single-row {top_scorer,mvp,...}
    const wRows=winners||[];
    let wm={top_scorer:'',mvp:'',best_young:'',best_goalkeeper:''};
    if(wRows.length&&wRows[0].category!==undefined){
      // Multi-row format: one row per award category
      const SKIP=new Set(['category','id','created_at','updated_at']);
      const getVal=r=>{const k=Object.keys(r).find(c=>!SKIP.has(c));return k?r[k]:'';};
      const bycat={};wRows.forEach(r=>{bycat[r.category]=getVal(r);});
      wm={
        top_scorer:bycat.top_scorer||'',
        mvp:bycat.mvp||'',
        best_young:bycat.young||bycat.best_young||'',
        best_goalkeeper:bycat.goalkeeper||bycat.best_goalkeeper||'',
      };
    }else if(wRows.length){
      // Legacy single-row format
      const row=wRows[0];
      wm={top_scorer:row.top_scorer||'',mvp:row.mvp||'',best_young:row.young||'',best_goalkeeper:row.goalkeeper||''};
    }
    setWinnersMap(wm);
    setMatches(mats||[]);
    setTbPreds(tbps||[]);
    setLoading(false);
  }

  const calcBonus=(p)=>AWARD_CONFIG.filter(a=>winnersMap[a.key]&&norm(p[a.col])===norm(winnersMap[a.key])).length*AWARD_BONUS;
  const calcTeamPts=(teams)=>(teams||[]).reduce((sum,team)=>sum+calcTotal(resultsMap[team]||{}),0);

  // Tiebreaker pts per user_id — resolved via slot → bracket → match result
  const tbScoreByUser={};
  (tbPreds||[]).forEach(pred=>{
    const slotDef=TB_SLOTS.find(s=>s.slot===pred.slot);
    if(!slotDef)return;
    const h=resolveSlot(slotDef.bm.home,matches);
    const a=resolveSlot(slotDef.bm.away,matches);
    if(!h.team||!a.team)return;
    const match=(matches||[]).find(m=>
      m.round_col===slotDef.round_col&&m.home_goals!=null&&
      ((m.home_team===h.team&&m.away_team===a.team)||(m.home_team===a.team&&m.away_team===h.team))
    );
    if(!match)return;
    const sc=calcTbScore(pred,match);
    if(!tbScoreByUser[pred.user_id])tbScoreByUser[pred.user_id]={total:0,exact:0};
    tbScoreByUser[pred.user_id].total+=sc.total;
    tbScoreByUser[pred.user_id].exact+=sc.exact;
  });

  const participantsWithTotals=participants.map(p=>({
    ...p,
    total:calcTeamPts(p.teams)+calcBonus(p),
    tb_total:tbScoreByUser[p.user_id]?.total||0,
    tb_exact:tbScoreByUser[p.user_id]?.exact||0,
  }));
  // Primary: total pts. Tiebreaker: tb_total → tb_exact → alphabetical
  const participantsSorted=participantsWithTotals.slice().sort((a,b)=>
    b.total-a.total||b.tb_total-a.tb_total||b.tb_exact-a.tb_exact||(a.name<b.name?-1:1)
  );

  async function handleRegister({name,teams,picks,userId}) {
    const {data:existing}=await supabase.from('participants').select('id').eq('name',name).maybeSingle();
    if(existing)return 'duplicate';
    const {error}=await supabase.from('participants').insert({
      name, teams, user_id:userId||null,
      top_scorer:picks.top_scorer||null,
      mvp:picks.mvp||null,
      best_young:picks.best_young||null,
      best_goalkeeper:picks.best_goalkeeper||null,
    });
    if(error){if(error.code==='23505')return 'duplicate';console.error('Register error:',error);return 'error';}
    await loadData();
    // Refresh my participant so registration shows as done
    if(userId){
      const {data:mine}=await supabase.from('participants').select('*').eq('user_id',userId).maybeSingle();
      setMyParticipant(mine||null);
    }
    setTimeout(()=>setTab('clasificacion'),1500);return true;
  }

  async function handleSaveTbPred({slot,home_goals,away_goals}) {
    const userId=session?.user?.id;
    if(!userId)return 'No autenticado';
    const {error}=await supabase.from('tiebreaker_predictions')
      .upsert({user_id:userId,slot,home_goals,away_goals},{onConflict:'user_id,slot'});
    if(error){console.error('TB pred error:',error);return error.message;}
    const {data:tbps}=await supabase.from('tiebreaker_predictions').select('*');
    setTbPreds(tbps||[]);
    return null;
  }

  async function recalcAndSaveResults() {
    const r=await fetch('/api/recalc',{method:'POST'});
    const b=await r.json().catch(()=>({}));
    if(!r.ok){console.error('recalc error:',b);return b?.error||'unknown error';}
    return null;
  }

  async function handleSaveMatch({home_team,away_team,home_goals,away_goals,round_col,penalty_winner}) {
    // Delete any existing entry for this pair+round (index is on least/greatest so either order)
    const {data:existing}=await supabase.from('matches').select('id,home_team,away_team')
      .eq('round_col',round_col)
      .or(`and(home_team.eq.${home_team},away_team.eq.${away_team}),and(home_team.eq.${away_team},away_team.eq.${home_team})`);
    if(existing?.length){
      const ids=existing.map(r=>r.id);
      await supabase.from('matches').delete().in('id',ids);
    }
    const row={home_team,away_team,home_goals,away_goals,round_col,source:'manual'};
    if(penalty_winner)row.penalty_winner=penalty_winner;
    const {error}=await supabase.from('matches').insert(row);
    if(error){console.error('handleSaveMatch insert error:',error);return 'Error al guardar: '+error.message;}
    const recalcErr=await recalcAndSaveResults();
    if(recalcErr)return 'Guardado pero recálculo falló: '+recalcErr;
    await loadData();
    return true;
  }

  async function handleSync(log) {
    log('Fetching matches from football-data.org…');
    try {
      const res=await fetch('/api/sync');
      const body=await res.json();
      if(!res.ok)throw new Error(body?.error||body?.message||`API ${res.status}`);
      const {matches:apiMatches}=body;
      const finished=apiMatches.filter(m=>m.status==='FINISHED');
      log(`${finished.length} finished matches found.`);

      // Load existing manual matches so we can skip them
      const {data:manualMats}=await supabase.from('matches').select('home_team,away_team,round_col,source');
      const manualKeys=new Set((manualMats||[]).filter(m=>m.source==='manual').map(m=>{
        const a=m.home_team<m.away_team?m.home_team:m.away_team;
        const b=m.home_team<m.away_team?m.away_team:m.home_team;
        return `${a}|${b}|${m.round_col}`;
      }));

      const toUpsert=[];
      for(const m of finished){
        const home=normTeam(m.homeTeam.name),away=normTeam(m.awayTeam.name);
        const hg=m.score.fullTime.home??0,ag=m.score.fullTime.away??0;
        let col;
        if(m.stage==='GROUP_STAGE'){col=m.matchday===1?'j1':m.matchday===2?'j2':'j3';}
        else{col=STAGE_COL[m.stage];}
        if(!col)continue;
        const a=home<away?home:away,b=home<away?away:home;
        if(manualKeys.has(`${a}|${b}|${col}`)){log(`Skipping manual: ${home} vs ${away} (${col})`);continue;}
        toUpsert.push({home_team:home,away_team:away,home_goals:hg,away_goals:ag,round_col:col,source:'api'});
      }

      if(toUpsert.length){
        log(`Storing ${toUpsert.length} API matches…`);
        const {error:me}=await supabase.from('matches').upsert(toUpsert,{onConflict:'home_team,away_team,round_col',ignoreDuplicates:false});
        if(me)log(`⚠️ Match store warning: ${me.message}`);
      }

      await recalcAndSaveResults();
      await loadData();
      log(`✅ Done! ${toUpsert.length} API matches stored.`);
    }catch(e){log(`❌ Error: ${e.message}`);}
  }

  async function handleSaveWinners(w) {
    const r = await fetch('/api/save-winners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ top_scorer:w.top_scorer||null, mvp:w.mvp||null, young:w.young||null, goalkeeper:w.goalkeeper||null }),
    });
    const b = await r.json().catch(()=>({}));
    if (!r.ok) { console.error('[save-winners]', b); return b?.error || 'Error al guardar'; }
    await loadData();
    return null;
  }

  if(session===undefined||loading)return(<><style>{CSS}</style><LoadingScreen/></>);
  if(!session)return(<><style>{CSS}</style><LoginPage lang={lang} setLang={setLang}/></>);

  const navItems=[
    {id:'inicio',       icon:'home',     l:t.nav_home},
    {id:'normas',       icon:'rules',    l:t.nav_rules},
    {id:'seleccion',    icon:'goal',     l:t.nav_teams},
    {id:'resultados',   icon:'search',   l:t.nav_results},
    {id:'clasificacion',icon:'trophy',   l:t.nav_leaderboard},
    ...(adminMode?[{id:'admin',icon:'settings',l:'Admin'}]:[]),
  ];

  return(
    <>
      <style>{CSS}</style>
      <div className="hdr">
        <div className="hdr-top">
          <LangSelector lang={lang} setLang={setLang}/>
          <span className="hdr-icon"><Icon name="trophy" size={26} color="var(--gold)"/></span>
          <div><div className="hdr-name">World Cup Pool 2026</div><div className="hdr-sub">USA · Mexico · Canada</div></div>
          <div className="hdr-bote">
            <div className="hdr-bote-lbl">{t.participants}</div>
            <div className="hdr-bote-val">{participantsWithTotals.length}</div>
          </div>
          <div className="hdr-user-area">
            {session?.user?.email&&(
              <div className="hdr-avatar" title={session.user.email}>
                {session.user.email.split('@')[0].replace(/[^a-zA-Z]/g,'').slice(0,2).toUpperCase()||'?'}
              </div>
            )}
            <button className="hdr-logout" onClick={()=>supabase.auth.signOut()} title="Cerrar sesión">
              <Icon name="power" size={14}/><span className="hdr-logout-txt"> Salir</span>
            </button>
          </div>
        </div>
      </div>
      {tab==='inicio'        &&<HomePage        participants={participantsWithTotals} goTo={setTab} t={t} myParticipant={myParticipant} participantsSorted={participantsSorted} resultsMap={resultsMap}/>}
      {tab==='normas'        &&<RulesPage        t={t}/>}
      {tab==='seleccion'     && myParticipant    &&<MyResultsPage    myParticipant={myParticipant} resultsMap={resultsMap} participantsSorted={participantsSorted} winnersMap={winnersMap} goTo={setTab} t={t} matches={matches} tbPreds={tbPreds} session={session} onSaveTbPred={handleSaveTbPred}/>}
      {tab==='seleccion'     &&!myParticipant    &&<><RegistrationPage onSubmit={handleRegister} userId={session?.user?.id} t={t}/><div className="page" style={{paddingTop:0}}><TiebreakerSection matches={matches} tbPreds={tbPreds} session={session} onSaveTbPred={handleSaveTbPred} t={t}/></div></>}
      {tab==='resultados'    &&<ResultsPage      resultsMap={resultsMap} participants={participants} participantsSorted={participantsSorted} onRefresh={loadData} t={t}/>}
      {tab==='clasificacion' &&<LeaderboardPage participants={participantsWithTotals} winnersMap={winnersMap} resultsMap={resultsMap} myParticipant={myParticipant} onRefresh={loadData} t={t}/>}
      {tab==='admin'         &&<AdminPage        onSync={handleSync} winnersMap={winnersMap} onSaveWinners={handleSaveWinners} savedMatches={matches} onSaveMatch={handleSaveMatch}/>}
      <AppFooter/>
      <nav className="bnav">
        {navItems.map(nt=>(
          <button key={nt.id} className={`bnav-btn ${tab===nt.id?'on':''}`}
            onClick={()=>{setTab(nt.id);if(nt.id==='resultados'||nt.id==='clasificacion')loadData();}}>
            <Icon name={nt.icon} size={20} stroke={tab===nt.id?2.2:1.8} color={tab===nt.id?'var(--gold)':'currentColor'}/>
            {nt.l}
          </button>
        ))}
      </nav>
    </>
  );
}
