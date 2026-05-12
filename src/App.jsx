import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kvdtuogpkpklnqmbcjvo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZHR1b2dwa3BrbG5xbWJjanZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODY2MTQsImV4cCI6MjA5Mjk2MjYxNH0.wad92BnQtbkhH-J8Y1Zlas8_Kxk5wfULd1F9UXJzwNw";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEADLINE    = new Date('2026-06-07T23:59:59');
const AWARD_BONUS = 10;
const PAGE_SIZE   = 20;
const isRegistrationOpen = () => new Date() < DEADLINE;

const GROUPS = {
  g1: { name:"Group 1", label:"TOP",      pick:1, color:"#F5B731", badge:"⭐",
    teams:["Argentina","France","Brazil","England","Spain","Germany","Portugal"] },
  g2: { name:"Group 2", label:"STRONG",   pick:3, color:"#60AAFF", badge:"🔵",
    teams:["Netherlands","Belgium","Croatia","Uruguay","Colombia","Morocco","Mexico",
           "United States","Japan","Switzerland","Austria","Ecuador","South Korea","Iran",
           "Australia","Paraguay","Tunisia","Algeria","Egypt","Norway","Sweden"] },
  g3: { name:"Group 3", label:"AVERAGE",  pick:2, color:"#40D490", badge:"🟢",
    teams:["Canada","Qatar","Saudi Arabia","Ivory Coast","Ghana","South Africa",
           "Scotland","Czech Republic","Turkey","Bosnia and Herzegovina","Uzbekistan","Jordan",
           "Cape Verde","Panama"] },
  g4: { name:"Group 4", label:"SURPRISE", pick:1, color:"#FF6B8A", badge:"🔮",
    teams:["New Zealand","Curacao","Haiti","Iraq","DR Congo"] }
};

const FLAGS = {
  "Argentina":"🇦🇷","France":"🇫🇷","Brazil":"🇧🇷","England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Spain":"🇪🇸","Germany":"🇩🇪","Portugal":"🇵🇹",
  "Netherlands":"🇳🇱","Belgium":"🇧🇪","Croatia":"🇭🇷","Uruguay":"🇺🇾","Colombia":"🇨🇴","Morocco":"🇲🇦","Mexico":"🇲🇽",
  "United States":"🇺🇸","Japan":"🇯🇵","Switzerland":"🇨🇭","Austria":"🇦🇹","Ecuador":"🇪🇨","South Korea":"🇰🇷","Iran":"🇮🇷",
  "Australia":"🇦🇺","Paraguay":"🇵🇾","Tunisia":"🇹🇳","Algeria":"🇩🇿","Egypt":"🇪🇬","Norway":"🇳🇴","Sweden":"🇸🇪",
  "Canada":"🇨🇦","Qatar":"🇶🇦","Saudi Arabia":"🇸🇦","Ivory Coast":"🇨🇮","Ghana":"🇬🇭","South Africa":"🇿🇦",
  "Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Czech Republic":"🇨🇿","Turkey":"🇹🇷","Bosnia and Herzegovina":"🇧🇦","Uzbekistan":"🇺🇿","Jordan":"🇯🇴",
  "Cape Verde":"🇨🇻","Panama":"🇵🇦","New Zealand":"🇳🇿","Curacao":"🇨🇼","Haiti":"🇭🇹","Iraq":"🇮🇶","DR Congo":"🇨🇩"
};

const AWARD_CONFIG = [
  { key:"top_scorer",      col:"pick_top_scorer", label:"Top Scorer",             icon:"⚽" },
  { key:"mvp",             col:"pick_mvp",        label:"Tournament MVP",          icon:"🏆" },
  { key:"best_young",      col:"pick_young",      label:"Best Young Player (U21)", icon:"🌟" },
  { key:"best_goalkeeper", col:"pick_goalkeeper", label:"Best Goalkeeper",         icon:"🧤" },
];

const calcTotal = r =>
  (r?.j1||0)+(r?.j2||0)+(r?.j3||0)+(r?.r32||0)+(r?.r16||0)+(r?.qf||0)+(r?.sf||0)+(r?.final||0);

const ADMIN_PIN = 'Arin2026!';
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

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const LANGS = {
  es: {
    pot:'Bote', nav_home:'Inicio', nav_rules:'Normas', nav_teams:'Mis Equipos',
    nav_results:'Resultados', nav_leaderboard:'Clasificación',
    countdown_label:'Inscripción cierra en',
    days:'Días', hrs:'Hrs', min:'Min', sec:'Seg',
    participants:'Participantes', total_pot:'Bote total', teams_entry:'Equipos / inscripción',
    how_title:'🎯 ¿Cómo funciona?',
    step1_t:'Elige 7 equipos',         step1_d:'1 TOP + 3 STRONG + 2 AVERAGE + 1 SURPRISE',
    step2_t:'Predicciones de premios', step2_d:'Pichichi, MVP, Mejor Joven y Portero (+10 pts cada uno)',
    step3_t:'Acumula puntos',          step3_d:'Tus equipos ganan puntos por goles, victorias y rondas avanzadas',
    step4_t:'Gana el bote',            step4_d:'Más puntos al final se lleva el 75% del premio',
    prize1:'1er Premio', prize2:'2º Premio', prize3:'3er Premio',
    entry_fee:'€10 por participante',
    register_btn:'⚡ Inscribirme y elegir mis equipos',
    reg_closed_msg:'🔒 Inscripción cerrada el 7 de junio de 2026',
    team_selection:'📋 Selección de Equipos', group_label:'Grupo',
    pick_team:'Elige', pick_team_s:'equipo', pick_team_p:'equipos',
    teams_available:'equipos disponibles',
    scoring_title:'⚡ Sistema de Puntuación',
    sc_goal:'Gol marcado', sc_win:'Partido ganado', sc_win_n:'No cuenta prórroga',
    sc_draw:'Partido empatado', sc_draw_n:'No cuenta prórroga',
    sc_adv:'Avanzar una ronda', sc_adv_n:'Por ronda avanzada',
    sc_champ:'Ganar el torneo', sc_champ_n:'Bonus final',
    sc_top:'Máximo goleador del torneo', sc_top_n:'Si está en tu selección',
    sc_def:'Menos goles encajados', sc_def_n:'Solo semifinalistas',
    award_bonus_title:'🎖️ Bonus Predicciones de Premios',
    award_bonus_desc:'Predice los 4 premios del torneo al inscribirte. Cada predicción correcta añade',
    award_bonus_max:'Máximo',
    prize_title:'💰 Distribución de Premios',
    winner:'Ganador', second:'2º Puesto', third:'3er Puesto',
    tie_note:'🎟️ Inscripción: €10 · En caso de empate, el premio se reparte',
    format_title:'📅 Formato del Torneo',
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
    your_name:'👤 Tu Nombre', full_name:'Nombre completo', full_name_hint:'Nombre + Apellido',
    name_placeholder:'ej. Pedro Sánchez',
    err_duplicate:'Ese nombre ya está inscrito. Prueba con otro nombre completo.',
    err_general:'Error al inscribirse. Comprueba tu conexión e inténtalo de nuevo.',
    teams_summary:'🗂️ Tus equipos seleccionados',
    award_preds:'🎯 Predicciones de Premios', pts_each:'+10 pts cada uno', x_selected:'seleccionados',
    btn_name:'Introduce tu nombre para continuar', btn_teams:'Elige todos tus equipos',
    btn_awards:'Elige las 4 predicciones de premios', btn_confirm:'✅ Confirmar inscripción', btn_saving:'⏳ Guardando…',
    reg_ok_title:'¡Inscripción completada!', reg_ok_sub:'Tus equipos y predicciones se han guardado. ¡Buena suerte!',
    your_award_preds:'🎖️ TUS PREDICCIONES DE PREMIOS',
    select_player:'Selecciona jugador', loading_players:'Cargando jugadores…',
    search_players:'Buscar jugadores…', no_results_for:'Sin resultados para',
    search_title:'🔍 Buscar Participante', search_ph:'Nombre del participante…', search_btn:'BUSCAR',
    not_found_pre:'No se encontró ningún participante con el nombre', not_found_post:'Comprueba la ortografía e inténtalo de nuevo.',
    teams_selected:'equipos seleccionados', total_pts:'Pts totales', rank_label:'Pos',
    award_preds_label:'Predicciones de Premios', points_by_team:'📊 Puntos por Equipo',
    refresh:'↻ Actualizar', no_results_title:'LOS RESULTADOS ESTARÁN DISPONIBLES AL INICIO DEL TORNEO',
    no_results_date:'11 de junio de 2026',
    award_winners:'🏅 Ganadores de Premios', no_part_title:'SIN PARTICIPANTES AÚN', no_part_sub:'Sé el primero en inscribirte',
    pts:'pts', pot_footer:'Bote total', part_footer:'participantes', entry_short:'€10/inscripción',
    refresh_lb:'↻ Actualizar clasificación', page_of:'de',
  },
  en: {
    pot:'Pot', nav_home:'Home', nav_rules:'Rules', nav_teams:'My Teams',
    nav_results:'Results', nav_leaderboard:'Leaderboard',
    countdown_label:'Registration closes in',
    days:'Days', hrs:'Hrs', min:'Min', sec:'Sec',
    participants:'Participants', total_pot:'Total pot', teams_entry:'Teams / entry',
    how_title:'🎯 How does it work?',
    step1_t:'Pick 7 teams',             step1_d:'1 TOP + 3 STRONG + 2 AVERAGE + 1 SURPRISE',
    step2_t:'Make award predictions',   step2_d:'Top Scorer, MVP, Best Young Player & Goalkeeper (+10 pts each)',
    step3_t:'Accumulate points',        step3_d:'Your teams earn points for goals, wins and advancing rounds',
    step4_t:'Win the pot',              step4_d:'Most points at the end takes 75% of the prize',
    prize1:'1st Prize', prize2:'2nd Prize', prize3:'3rd Prize',
    entry_fee:'€10 per participant',
    register_btn:'⚡ Register and pick my teams',
    reg_closed_msg:'🔒 Registration closed on June 7, 2026',
    team_selection:'📋 Team Selection', group_label:'Group',
    pick_team:'Pick', pick_team_s:'team', pick_team_p:'teams',
    teams_available:'teams available',
    scoring_title:'⚡ Scoring System',
    sc_goal:'Goal scored', sc_win:'Match won', sc_win_n:'Does not count extra time',
    sc_draw:'Match drawn', sc_draw_n:'Does not count extra time',
    sc_adv:'Advancing a round', sc_adv_n:'Per round advanced',
    sc_champ:'Winning the tournament', sc_champ_n:'Final bonus',
    sc_top:'Tournament top scorer', sc_top_n:'If in your selection',
    sc_def:'Fewest goals conceded', sc_def_n:'Semi-finalists only',
    award_bonus_title:'🎖️ Award Predictions Bonus',
    award_bonus_desc:'Predict the 4 tournament awards when registering. Each correct prediction adds',
    award_bonus_max:'Maximum',
    prize_title:'💰 Prize Distribution',
    winner:'Winner', second:'2nd Place', third:'3rd Place',
    tie_note:'🎟️ Entry fee: €10 · In case of a tie, the prize is shared equally',
    format_title:'📅 Tournament Format',
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
    your_name:'👤 Your Name', full_name:'Full name', full_name_hint:'First name + Last name',
    name_placeholder:'e.g. Pedro Sánchez',
    err_duplicate:'That name is already registered. Please try another full name.',
    err_general:'Registration failed. Please check your connection and try again.',
    teams_summary:'🗂️ Your selected teams',
    award_preds:'🎯 Award Predictions', pts_each:'+10 pts each', x_selected:'selected',
    btn_name:'Enter your name to continue', btn_teams:'Pick all your teams',
    btn_awards:'Pick all 4 award predictions', btn_confirm:'✅ Confirm registration', btn_saving:'⏳ Saving…',
    reg_ok_title:'Registration complete!', reg_ok_sub:'Your teams and predictions have been saved. Good luck!',
    your_award_preds:'🎖️ YOUR AWARD PREDICTIONS',
    select_player:'Select player', loading_players:'Loading players…',
    search_players:'Search players…', no_results_for:'No results for',
    search_title:'🔍 Search by Participant', search_ph:'Enter participant name…', search_btn:'SEARCH',
    not_found_pre:'No participant found with the name', not_found_post:'Check the spelling and try again.',
    teams_selected:'teams selected', total_pts:'Total pts', rank_label:'Rank',
    award_preds_label:'Award Predictions', points_by_team:'📊 Points by Team',
    refresh:'↻ Refresh', no_results_title:'RESULTS WILL BE AVAILABLE ONCE THE TOURNAMENT BEGINS',
    no_results_date:'June 11, 2026',
    award_winners:'🏅 Award Winners', no_part_title:'NO PARTICIPANTS YET', no_part_sub:'Be the first to register',
    pts:'pts', pot_footer:'Total pot', part_footer:'participants', entry_short:'€10/entry',
    refresh_lb:'↻ Refresh leaderboard', page_of:'of',
  },
  pt: {
    pot:'Prêmio', nav_home:'Início', nav_rules:'Regras', nav_teams:'Meus Times',
    nav_results:'Resultados', nav_leaderboard:'Classificação',
    countdown_label:'Inscrições encerram em',
    days:'Dias', hrs:'Hrs', min:'Min', sec:'Seg',
    participants:'Participantes', total_pot:'Prêmio total', teams_entry:'Times / inscrição',
    how_title:'🎯 Como funciona?',
    step1_t:'Escolha 7 times',          step1_d:'1 TOP + 3 STRONG + 2 AVERAGE + 1 SURPRISE',
    step2_t:'Faça previsões de prêmios',step2_d:'Artilheiro, MVP, Melhor Jovem e Goleiro (+10 pts cada)',
    step3_t:'Acumule pontos',           step3_d:'Seus times ganham pontos por gols, vitórias e fases avançadas',
    step4_t:'Ganhe o prêmio',           step4_d:'Quem tiver mais pontos no final leva 75% do prêmio',
    prize1:'1º Prêmio', prize2:'2º Prêmio', prize3:'3º Prêmio',
    entry_fee:'€10 por participante',
    register_btn:'⚡ Inscrever-me e escolher meus times',
    reg_closed_msg:'🔒 Inscrições encerradas em 7 de junho de 2026',
    team_selection:'📋 Seleção de Times', group_label:'Grupo',
    pick_team:'Escolha', pick_team_s:'time', pick_team_p:'times',
    teams_available:'times disponíveis',
    scoring_title:'⚡ Sistema de Pontuação',
    sc_goal:'Gol marcado', sc_win:'Partida vencida', sc_win_n:'Não conta prorrogação',
    sc_draw:'Partida empatada', sc_draw_n:'Não conta prorrogação',
    sc_adv:'Avançar uma fase', sc_adv_n:'Por fase avançada',
    sc_champ:'Ganhar o torneio', sc_champ_n:'Bônus final',
    sc_top:'Artilheiro do torneio', sc_top_n:'Se estiver na sua seleção',
    sc_def:'Menos gols sofridos', sc_def_n:'Apenas semifinalistas',
    award_bonus_title:'🎖️ Bônus de Previsões de Prêmios',
    award_bonus_desc:'Preveja os 4 prêmios do torneio ao se inscrever. Cada previsão correta adiciona',
    award_bonus_max:'Máximo',
    prize_title:'💰 Distribuição de Prêmios',
    winner:'Vencedor', second:'2º Lugar', third:'3º Lugar',
    tie_note:'🎟️ Inscrição: €10 · Em caso de empate, o prêmio é dividido igualmente',
    format_title:'📅 Formato do Torneio',
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
    your_name:'👤 Seu Nome', full_name:'Nome completo', full_name_hint:'Nome + Sobrenome',
    name_placeholder:'ex. Pedro Sánchez',
    err_duplicate:'Esse nome já está cadastrado. Por favor, tente outro nome completo.',
    err_general:'Falha ao se inscrever. Verifique sua conexão e tente novamente.',
    teams_summary:'🗂️ Seus times selecionados',
    award_preds:'🎯 Previsões de Prêmios', pts_each:'+10 pts cada', x_selected:'selecionados',
    btn_name:'Digite seu nome para continuar', btn_teams:'Escolha todos os seus times',
    btn_awards:'Escolha as 4 previsões de prêmios', btn_confirm:'✅ Confirmar inscrição', btn_saving:'⏳ Salvando…',
    reg_ok_title:'Inscrição concluída!', reg_ok_sub:'Seus times e previsões foram salvos. Boa sorte!',
    your_award_preds:'🎖️ SUAS PREVISÕES DE PRÊMIOS',
    select_player:'Selecione jogador', loading_players:'Carregando jogadores…',
    search_players:'Buscar jogadores…', no_results_for:'Sem resultados para',
    search_title:'🔍 Buscar Participante', search_ph:'Digite o nome do participante…', search_btn:'BUSCAR',
    not_found_pre:'Nenhum participante encontrado com o nome', not_found_post:'Verifique a ortografia e tente novamente.',
    teams_selected:'times selecionados', total_pts:'Pts totais', rank_label:'Pos',
    award_preds_label:'Previsões de Prêmios', points_by_team:'📊 Pontos por Time',
    refresh:'↻ Atualizar', no_results_title:'OS RESULTADOS ESTARÃO DISPONÍVEIS QUANDO O TORNEIO COMEÇAR',
    no_results_date:'11 de junho de 2026',
    award_winners:'🏅 Vencedores de Prêmios', no_part_title:'SEM PARTICIPANTES AINDA', no_part_sub:'Seja o primeiro a se inscrever',
    pts:'pts', pot_footer:'Prêmio total', part_footer:'participantes', entry_short:'€10/inscrição',
    refresh_lb:'↻ Atualizar classificação', page_of:'de',
  },
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#06090f;--sur:#0c1220;--sur2:#111827;--sur3:#161f30;--brd:#1a2438;--brd2:#243050;--gold:#F5B731;--gold2:#c7921b;--green:#22d48e;--blue:#5a9fff;--pink:#ff6b8a;--txt:#c8d0e0;--mut:#4e5e78;--white:#eef2ff;--r:12px;--tr:all .18s ease}
html{scroll-behavior:smooth}
html,body{font-family:'Barlow',sans-serif;background:var(--bg);color:var(--txt);min-height:100vh}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.skeleton{background:linear-gradient(90deg,var(--sur) 25%,var(--sur2) 50%,var(--sur) 75%);background-size:200% 100%;animation:shimmer 1.6s ease-in-out infinite;border-radius:8px}
@media(prefers-reduced-motion:reduce){.skeleton{animation:none;background:var(--sur2)}*,*::before,*::after{transition-duration:.01ms !important;animation-duration:.01ms !important}}
.hdr{background:linear-gradient(180deg,#0a1628 0%,#080e1c 100%);border-bottom:1px solid var(--brd);padding:0 20px;position:sticky;top:0;z-index:50}
.hdr-top{display:flex;align-items:center;gap:10px;padding:16px 0 12px}
.hdr-icon{font-size:30px}
.hdr-name{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:26px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);line-height:1}
.hdr-sub{font-size:11px;color:var(--mut);letter-spacing:2px;text-transform:uppercase;margin-top:2px}
.hdr-bote{margin-left:auto;background:rgba(245,183,49,0.1);border:1px solid rgba(245,183,49,0.25);border-radius:8px;padding:6px 14px;text-align:right;transition:background .2s}
.hdr-bote:hover{background:rgba(245,183,49,0.16)}
.hdr-bote-lbl{font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:1px}
.hdr-bote-val{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:20px;color:var(--gold)}
.lang-sel{display:flex;gap:3px;align-items:center;flex-shrink:0}
.lang-btn{background:none;border:1px solid transparent;border-radius:6px;padding:4px 7px;cursor:pointer;font-size:11px;color:var(--mut);font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:0.5px;transition:var(--tr);display:flex;align-items:center;gap:3px;min-height:30px;touch-action:manipulation;white-space:nowrap}
.lang-btn:hover{color:var(--txt);border-color:var(--brd)}
.lang-btn.active{color:var(--gold);border-color:rgba(245,183,49,0.45);background:rgba(245,183,49,0.08)}
.lang-btn:focus-visible{outline:2px solid var(--gold);outline-offset:2px;border-radius:5px}
.app-footer{text-align:center;padding:32px 20px 24px;font-size:11px;color:var(--mut);letter-spacing:1px;border-top:1px solid var(--brd);margin-top:8px}
.nav{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.nav-btn{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;background:none;border:none;cursor:pointer;color:var(--mut);padding:10px 16px;border-bottom:2px solid transparent;white-space:nowrap;transition:color .2s;min-height:44px;touch-action:manipulation}
.nav-btn:hover{color:var(--txt)}
.nav-btn.on{color:var(--gold);border-bottom-color:var(--gold)}
.nav-btn:focus-visible{outline:2px solid var(--gold);outline-offset:-2px;border-radius:4px}
.page{padding:24px 20px;max-width:860px;margin:0 auto}
.card{background:var(--sur);border:1px solid var(--brd);border-radius:var(--r);padding:20px;margin-bottom:16px;transition:border-color .2s}
.sect-title{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:20px;letter-spacing:2px;text-transform:uppercase;color:var(--white);margin-bottom:14px;display:flex;align-items:center;gap:8px}
.hero{background:linear-gradient(135deg,#0e1e38,#091428);border:1px solid var(--brd);border-radius:16px;padding:36px 28px;text-align:center;margin-bottom:20px;position:relative;overflow:hidden}
.hero::before{content:'⚽';font-size:200px;position:absolute;top:-40px;right:-40px;opacity:0.04;pointer-events:none}
.hero-title{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:48px;letter-spacing:4px;text-transform:uppercase;color:var(--gold);text-shadow:0 0 40px rgba(245,183,49,0.3);line-height:1}
.hero-sub{font-size:14px;color:var(--mut);letter-spacing:2px;text-transform:uppercase;margin-top:6px}
.hero-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:28px}
.hero-stat{background:rgba(255,255,255,0.04);border:1px solid var(--brd);border-radius:10px;padding:14px 10px;transition:var(--tr)}
.hero-stat:hover{border-color:var(--brd2);background:rgba(255,255,255,0.07)}
.hero-stat-val{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:28px;color:var(--white)}
.hero-stat-lbl{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:1px}
.scoring-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
.scoring-item{background:var(--sur2);border:1px solid var(--brd);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:12px;transition:var(--tr)}
.scoring-item:hover{border-color:var(--brd2)}
.scoring-icon{font-size:22px;width:30px;text-align:center}
.scoring-pts{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:22px;color:var(--gold);margin-left:auto;white-space:nowrap}
.scoring-lbl{font-size:13px;color:var(--txt);font-weight:600}
.scoring-note{font-size:11px;color:var(--mut)}
.grupo-strip{display:flex;align-items:center;gap:10px;background:var(--sur2);border:1px solid var(--brd);border-radius:10px;padding:12px 14px;margin-bottom:8px;transition:var(--tr)}
.grupo-strip:hover{border-color:var(--brd2)}
.grupo-badge{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:11px;letter-spacing:1px;padding:3px 10px;border-radius:5px;text-transform:uppercase;min-width:80px;text-align:center}
.grupo-pick{font-size:12px;color:var(--mut);margin-left:auto}
.premio-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.premio-card{border-radius:10px;padding:14px;text-align:center;border:1px solid;transition:transform .18s,box-shadow .18s}
.premio-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.4)}
.premio-medal{font-size:28px;margin-bottom:6px}
.premio-pct{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:26px}
.premio-lbl{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:1px}
.sel-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px}
.sel-prog-item{border-radius:10px;padding:10px 12px;border:1px solid;text-align:center;transition:var(--tr)}
.sel-prog-g{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:12px;letter-spacing:1px;text-transform:uppercase}
.sel-prog-count{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:28px;line-height:1.1}
.step-indicator{display:flex;margin-bottom:20px;border-radius:10px;overflow:hidden;border:1px solid var(--brd)}
.step-item{flex:1;padding:9px 6px;text-align:center;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--mut);background:var(--sur2);border-right:1px solid var(--brd);transition:var(--tr)}
.step-item:last-child{border-right:none}
.step-item.done{background:rgba(34,212,142,0.08);color:var(--green)}
.step-item.active{background:rgba(245,183,49,0.1);color:var(--gold)}
.group-section{margin-bottom:20px}
.group-header{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}
.group-title{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:16px;letter-spacing:1px;text-transform:uppercase}
.group-limit{font-size:12px;color:var(--mut)}
.teams-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.team-btn{display:flex;align-items:center;gap:8px;background:var(--sur2);border:1px solid var(--brd);border-radius:8px;padding:10px;cursor:pointer;transition:var(--tr);text-align:left;font-family:'Barlow',sans-serif;font-size:13px;color:var(--txt);min-height:44px;touch-action:manipulation}
.team-btn:hover:not(.dis){border-color:rgba(255,255,255,0.2);color:var(--white);background:var(--sur3)}
.team-btn:active:not(.dis){transform:scale(0.97)}
.team-btn:focus-visible{outline:2px solid var(--gold);outline-offset:1px}
.team-btn.sel{border-color:currentColor;color:var(--white);background:rgba(0,0,0,0.3)}
.team-btn.dis{opacity:0.3;cursor:not-allowed}
.team-flag{font-size:16px;flex-shrink:0}
.sel-summary{background:rgba(245,183,49,0.06);border:1px solid rgba(245,183,49,0.2);border-radius:var(--r);padding:16px 18px;margin-top:4px}
.sum-title{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:var(--gold);margin-bottom:10px}
.sum-teams{display:flex;flex-wrap:wrap;gap:6px}
.sum-chip{display:inline-flex;align-items:center;gap:5px;background:var(--sur2);border:1px solid var(--brd);border-radius:6px;padding:4px 10px;font-size:12px}
.inp{width:100%;background:var(--sur2);border:1px solid var(--brd);border-radius:8px;padding:11px 14px;color:var(--white);font-family:'Barlow',sans-serif;font-size:16px;outline:none;transition:border-color .2s;margin-bottom:10px;min-height:44px}
.inp:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(245,183,49,0.12)}
.inp::placeholder{color:var(--mut);font-size:14px}
.award-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:4px}
.award-item{position:relative}
.award-item label{display:flex;align-items:center;gap:6px;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--mut);margin-bottom:6px}
.award-trigger{width:100%;display:flex;align-items:center;gap:8px;background:var(--sur2);border:1px solid var(--brd);border-radius:8px;padding:10px 12px;cursor:pointer;transition:var(--tr);font-family:'Barlow',sans-serif;font-size:13px;color:var(--mut);min-height:44px;text-align:left;touch-action:manipulation}
.award-trigger:hover{border-color:var(--brd2);color:var(--txt)}
.award-trigger:focus-visible{outline:2px solid var(--gold);outline-offset:1px}
.award-trigger.filled{border-color:rgba(245,183,49,0.45);color:var(--white)}
.award-trigger.open{border-color:var(--gold)}
.award-trigger-icon{font-size:18px;flex-shrink:0}
.award-trigger-val{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.award-chevron{font-size:10px;color:var(--mut);transition:transform .2s;flex-shrink:0}
.award-chevron.up{transform:rotate(180deg)}
.award-dropdown{position:absolute;top:calc(100% + 6px);left:0;min-width:100%;width:max-content;max-width:320px;background:var(--sur);border:1px solid var(--gold);border-radius:10px;z-index:200;box-shadow:0 16px 40px rgba(0,0,0,0.7);overflow:hidden}
.award-search{width:100%;background:var(--sur2);border:none;border-bottom:1px solid var(--brd);padding:10px 14px;color:var(--white);font-family:'Barlow',sans-serif;font-size:13px;outline:none}
.award-search::placeholder{color:var(--mut)}
.award-list{max-height:210px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--brd) transparent}
.award-list::-webkit-scrollbar{width:4px}
.award-list::-webkit-scrollbar-thumb{background:var(--brd);border-radius:2px}
.award-opt{display:flex;align-items:center;justify-content:space-between;width:100%;padding:9px 14px;background:none;border:none;border-bottom:1px solid rgba(26,36,56,0.5);color:var(--txt);font-family:'Barlow',sans-serif;font-size:13px;cursor:pointer;transition:background .1s;text-align:left;min-height:40px;gap:8px}
.award-opt:last-child{border-bottom:none}
.award-opt:hover{background:var(--sur2);color:var(--white)}
.award-opt.active{color:var(--gold);background:rgba(245,183,49,0.07)}
.award-opt-team{font-size:11px;color:var(--mut);white-space:nowrap;flex-shrink:0}
.award-empty{padding:16px;text-align:center;color:var(--mut);font-size:13px}
.award-pick{background:var(--sur2);border:1px solid var(--brd);border-radius:10px;padding:12px 14px}
.award-pick-lbl{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-family:'Barlow Condensed',sans-serif;font-weight:700}
.award-pick-val{font-size:13px;color:var(--white);font-weight:600}
.award-correct{border-color:rgba(34,212,142,0.5);background:rgba(34,212,142,0.08)}
.award-correct .award-pick-val{color:var(--green)}
.btn-primary{width:100%;padding:14px;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:15px;letter-spacing:2px;text-transform:uppercase;background:var(--gold);color:#080c14;border:none;border-radius:9px;cursor:pointer;transition:opacity .2s,transform .15s;min-height:48px;touch-action:manipulation}
.btn-primary:hover:not(:disabled){opacity:0.9}
.btn-primary:active:not(:disabled){transform:scale(0.98)}
.btn-primary:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
.btn-primary:disabled{opacity:0.35;cursor:not-allowed}
.btn-ghost{background:var(--sur2);border:1px solid var(--brd);border-radius:7px;padding:7px 14px;color:var(--mut);cursor:pointer;font-size:12px;font-family:'Barlow Condensed',sans-serif;letter-spacing:1px;transition:var(--tr);min-height:36px;white-space:nowrap;touch-action:manipulation}
.btn-ghost:hover{border-color:var(--brd2);color:var(--txt)}
.btn-ghost:active{transform:scale(0.97)}
.btn-ghost:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.success-box{background:rgba(34,212,142,0.08);border:1px solid rgba(34,212,142,0.3);border-radius:var(--r);padding:24px 20px;text-align:center}
.error-box{background:rgba(255,107,138,0.08);border:1px solid rgba(255,107,138,0.3);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#ff6b8a}
.closed-box{background:rgba(78,94,120,0.15);border:1px solid rgba(78,94,120,0.4);border-radius:var(--r);padding:48px 20px;text-align:center}
.res-table{width:100%;border-collapse:collapse;font-size:13px}
.res-table th{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mut);padding:6px 10px;text-align:center;border-bottom:1px solid var(--brd)}
.res-table th:first-child{text-align:left}
.res-table td{padding:10px;text-align:center;border-bottom:1px solid rgba(30,41,64,0.5)}
.res-table td:first-child{text-align:left}
.res-table tr:last-child td{border-bottom:none}
.res-table tr:hover td{background:rgba(255,255,255,0.02)}
.res-team{display:flex;align-items:center;gap:8px;font-weight:600;color:var(--white)}
.res-pts{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px}
.res-zero{color:var(--mut)}
.res-total{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:16px;color:var(--gold)}
.podium{display:grid;grid-template-columns:1fr 1.1fr 1fr;gap:12px;margin-bottom:20px;align-items:end}
.podium-card{border-radius:12px;border:1px solid;padding:16px 12px;text-align:center}
.podium-medal{font-size:32px;margin-bottom:8px}
.podium-name{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:18px;color:var(--white);text-transform:uppercase;letter-spacing:1px;line-height:1.2}
.podium-pts{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:28px;margin:4px 0}
.podium-pts span{font-size:13px;color:var(--mut)}
.podium-premio{font-size:13px;margin-top:4px;font-weight:600}
.podium-teams{display:flex;flex-wrap:wrap;gap:3px;justify-content:center;margin-top:8px}
.podium-team-chip{font-size:10px;background:rgba(255,255,255,0.06);border-radius:4px;padding:2px 6px}
.clasif-row{display:flex;align-items:center;gap:14px;background:var(--sur);border:1px solid var(--brd);border-radius:10px;padding:12px 16px;margin-bottom:8px;transition:var(--tr);border-left:3px solid transparent}
.clasif-row:hover{border-color:var(--brd2);background:var(--sur3)}
.clasif-pos{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:14px;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:var(--sur2);border:1px solid var(--brd);color:var(--mut);flex-shrink:0}
.clasif-name{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:17px;color:var(--white);text-transform:uppercase;letter-spacing:1px}
.clasif-teams-mini{display:flex;flex-wrap:wrap;gap:3px;margin-top:3px}
.clasif-team-chip{font-size:11px;color:var(--mut)}
.clasif-pts{margin-left:auto;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:26px;color:var(--gold);text-align:right;flex-shrink:0}
.clasif-pts span{font-size:12px;color:var(--mut)}
.bonus-badge{display:inline-block;background:rgba(34,212,142,0.15);border:1px solid rgba(34,212,142,0.35);color:var(--green);font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:11px;padding:2px 8px;border-radius:5px;margin-left:6px;letter-spacing:1px}
@media(max-width:480px){.page{padding:16px 14px}.card{padding:16px}.hero{padding:28px 16px}.hero-title{font-size:34px;letter-spacing:2px}.teams-grid{grid-template-columns:repeat(2,1fr)}.scoring-grid{grid-template-columns:1fr}.award-grid{grid-template-columns:1fr}.award-dropdown{max-width:calc(100vw - 48px)}.sel-progress{gap:5px}.sel-prog-count{font-size:22px}.sel-prog-g{font-size:10px}.hdr-name{font-size:20px;letter-spacing:2px}.podium{gap:8px}.podium-name{font-size:14px}.podium-pts{font-size:24px}.podium-card{padding:14px 8px}.lang-btn{font-size:10px;padding:3px 5px}}
@media(max-width:360px){.teams-grid{grid-template-columns:repeat(2,1fr)}.hero-title{font-size:28px}}
.admin-log{margin-top:10px;padding:10px 14px;background:var(--sur2);border:1px solid var(--brd);border-radius:8px;font-size:12px;color:var(--txt);font-family:monospace;line-height:1.6;white-space:pre-wrap}
.admin-divider{border:none;border-top:1px solid var(--brd);margin:20px 0}
.pin-input{background:var(--sur2);border:1px solid var(--brd);border-radius:6px;padding:7px 12px;color:var(--white);font-size:14px;outline:none;width:140px;transition:border-color .2s}
.pin-input:focus{border-color:var(--gold)}
.pin-input.err{border-color:var(--pink)}
`;

// ─── LANG SELECTOR ────────────────────────────────────────────────────────────
function LangSelector({ lang, setLang }) {
  return(
    <div className="lang-sel" role="group" aria-label="Language selector">
      {[{code:'es',flag:'🇪🇸',label:'ES'},{code:'en',flag:'🇬🇧',label:'EN'},{code:'pt',flag:'🇧🇷',label:'PT'}].map(l=>(
        <button key={l.code} className={`lang-btn ${lang===l.code?'active':''}`}
          onClick={()=>setLang(l.code)} aria-pressed={lang===l.code} aria-label={l.label}>
          {l.flag} {l.label}
        </button>
      ))}
    </div>
  );
}

// ─── AWARD DROPDOWN ───────────────────────────────────────────────────────────
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

// ─── SKELETON ─────────────────────────────────────────────────────────────────
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

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function useCountdown(target) {
  const calc=()=>{const diff=target-Date.now();if(diff<=0)return null;return{d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)};};
  const [time,setTime]=useState(calc);
  useEffect(()=>{const id=setInterval(()=>setTime(calc()),1000);return()=>clearInterval(id);},[]);
  return time;
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomePage({ participants, goTo, t }) {
  const pot=participants.length*10;
  const open=isRegistrationOpen();
  const countdown=useCountdown(DEADLINE);
  return(
    <div className="page">
      <div className="hero">
        <div className="hero-title">🏆 TS World Cup Pool 2026</div>
        <div className="hero-sub">USA · Mexico · Canada &nbsp;|&nbsp; Jun 11 – Jul 19 2026</div>
        <div className="hero-grid">
          <div className="hero-stat"><div className="hero-stat-val">{participants.length}</div><div className="hero-stat-lbl">{t.participants}</div></div>
          <div className="hero-stat"><div className="hero-stat-val" style={{color:'var(--gold)'}}>€{pot}</div><div className="hero-stat-lbl">{t.total_pot}</div></div>
          <div className="hero-stat"><div className="hero-stat-val">7</div><div className="hero-stat-lbl">{t.teams_entry}</div></div>
        </div>
        {open&&countdown&&(
          <div style={{marginTop:20,padding:'14px 16px',background:'rgba(245,183,49,0.07)',border:'1px solid rgba(245,183,49,0.2)',borderRadius:10}}>
            <div style={{fontSize:10,color:'var(--mut)',textTransform:'uppercase',letterSpacing:2,marginBottom:8,textAlign:'center'}}>{t.countdown_label}</div>
            <div style={{display:'flex',justifyContent:'center',gap:8}}>
              {[{v:countdown.d,l:t.days},{v:countdown.h,l:t.hrs},{v:countdown.m,l:t.min},{v:countdown.s,l:t.sec}].map(({v,l})=>(
                <div key={l} style={{textAlign:'center',minWidth:48,background:'rgba(0,0,0,0.3)',border:'1px solid rgba(245,183,49,0.2)',borderRadius:8,padding:'8px 4px'}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26,color:'var(--gold)',lineHeight:1}}>{String(v).padStart(2,'0')}</div>
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
              <div style={{background:'var(--gold)',color:'#080c14',width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,flexShrink:0}}>{s.n}</div>
              <div><div style={{fontWeight:600,color:'var(--white)',marginBottom:2,fontSize:15}}>{s.tt}</div><div style={{fontSize:13,color:'var(--mut)'}}>{s.d}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{background:'linear-gradient(135deg,#0e1e38,#091428)'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,textAlign:'center'}}>
          {[{lbl:t.prize1,pct:'75%',col:'var(--gold)',medal:'🥇',amt:Math.round(pot*0.75)},{lbl:t.prize2,pct:'20%',col:'#c0c8d8',medal:'🥈',amt:Math.round(pot*0.20)},{lbl:t.prize3,pct:'5%',col:'#a07040',medal:'🥉',amt:Math.round(pot*0.05)}].map(p=>(
            <div key={p.lbl} className="premio-card" style={{background:`${p.col}10`,borderColor:`${p.col}40`}}>
              <div style={{fontSize:24,marginBottom:6}}>{p.medal}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26,color:p.col}}>{p.pct}</div>
              <div style={{fontSize:11,color:'var(--mut)',marginBottom:4}}>{p.lbl}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16,color:p.col}}>~€{p.amt}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center',marginTop:14,fontSize:12,color:'var(--mut)'}}>{t.entry_fee}</div>
      </div>
      {open?<button className="btn-primary" onClick={()=>goTo('seleccion')}>{t.register_btn}</button>
        :<div style={{textAlign:'center',padding:'14px 0',fontSize:13,color:'var(--mut)'}}>{t.reg_closed_msg}</div>}
    </div>
  );
}

// ─── RULES ────────────────────────────────────────────────────────────────────
function RulesPage({ t }) {
  const scoring=[{icon:'⚽',lbl:t.sc_goal,pts:1,note:''},{icon:'🏆',lbl:t.sc_win,pts:3,note:t.sc_win_n},{icon:'🤝',lbl:t.sc_draw,pts:1,note:t.sc_draw_n},{icon:'➡️',lbl:t.sc_adv,pts:6,note:t.sc_adv_n},{icon:'🥇',lbl:t.sc_champ,pts:10,note:t.sc_champ_n},{icon:'👟',lbl:t.sc_top,pts:8,note:t.sc_top_n},{icon:'🛡️',lbl:t.sc_def,pts:6,note:t.sc_def_n}];
  return(
    <div className="page">
      <div className="card">
        <div className="sect-title">{t.team_selection}</div>
        {Object.entries(GROUPS).map(([key,g])=>(
          <div className="grupo-strip" key={key}>
            <div className="grupo-badge" style={{background:`${g.color}22`,color:g.color,border:`1px solid ${g.color}55`}}>{g.badge} {g.label}</div>
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
              <span className="scoring-icon">{s.icon}</span>
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
              <span className="scoring-icon">{a.icon}</span>
              <div><div className="scoring-lbl">{a.label}</div></div>
              <div className="scoring-pts">+10</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="sect-title">{t.prize_title}</div>
        <div className="premio-grid">
          {[{medal:'🥇',pos:t.winner,pct:75,col:'var(--gold)'},{medal:'🥈',pos:t.second,pct:20,col:'#b0b8cc'},{medal:'🥉',pos:t.third,pct:5,col:'#9a7050'}].map(p=>(
            <div className="premio-card" key={p.pos} style={{background:`${p.col}10`,borderColor:`${p.col}40`}}>
              <div className="premio-medal">{p.medal}</div>
              <div className="premio-pct" style={{color:p.col}}>{p.pct}%</div>
              <div className="premio-lbl">{p.pos}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12,padding:'12px 14px',background:'rgba(245,183,49,0.06)',border:'1px solid rgba(245,183,49,0.15)',borderRadius:8,fontSize:13,color:'var(--mut)'}}>{t.tie_note}</div>
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
    </div>
  );
}

// ─── REGISTRATION ─────────────────────────────────────────────────────────────
function RegistrationPage({ onSubmit, t }) {
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
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:24,color:'var(--white)',letterSpacing:2,marginBottom:8}}>{t.reg_closed_title}</div>
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
    const result=await onSubmit({name:name.trim(),teams:allTeams(),picks});
    if(result===true){setDone(true);}else{
      setError(result==='duplicate'?t.err_duplicate:t.err_general);
      setSubmitting(false);
      setTimeout(()=>nameCardRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),50);
    }
  };

  if(done)return(
    <div className="page"><div className="success-box">
      <div style={{fontSize:52,marginBottom:14}}>✅</div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:24,color:'var(--green)',letterSpacing:1}}>{t.reg_ok_title}</div>
      <div style={{fontSize:14,color:'var(--mut)',marginTop:6,marginBottom:16}}>{t.reg_ok_sub}</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center'}}>
        {allTeams().map(tt=><span key={tt} className="sum-chip">{FLAGS[tt]||'🏳️'} {tt}</span>)}
      </div>
      {Object.values(picks).some(Boolean)&&(
        <div style={{marginTop:16,padding:14,background:'rgba(245,183,49,0.07)',border:'1px solid rgba(245,183,49,0.2)',borderRadius:10,textAlign:'left'}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,color:'var(--gold)',letterSpacing:1,marginBottom:10}}>{t.your_award_preds}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {AWARD_CONFIG.filter(a=>picks[a.key]).map(a=>(
              <div key={a.key} style={{fontSize:12,color:'var(--txt)'}}>
                <span style={{color:'var(--mut)'}}>{a.icon} {a.label}: </span>
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
            <span className="grupo-badge" style={{background:`${g.color}20`,color:g.color,border:`1px solid ${g.color}50`}}>{g.badge} {g.label}</span>
            <span className="group-title" style={{color:'var(--white)'}}>{t.group_label} {key.slice(1)}</span>
            <span className="group-limit">{t.pick_team} {g.pick} · ({countSel(key)}/{g.pick})</span>
          </div>
          <div className="teams-grid">
            {g.teams.map(team=>{
              const selected=isSelected(key,team),disabled=!selected&&countSel(key)>=g.pick;
              return(<button key={team} className={`team-btn ${selected?'sel':''} ${disabled?'dis':''}`}
                style={selected?{color:g.color,borderColor:g.color,background:`${g.color}12`}:{}}
                onClick={()=>!disabled&&toggle(key,team)} disabled={disabled} aria-pressed={selected}>
                <span className="team-flag">{FLAGS[team]||'🏳️'}</span>
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
          <div className="sum-teams">{allTeams().map(tt=><span key={tt} className="sum-chip">{FLAGS[tt]||'🏳️'} {tt}</span>)}</div>
        </div>
      )}
      <div className="card" style={{marginTop:16,border:'1px solid rgba(245,183,49,0.25)',background:'linear-gradient(135deg,#0e1e38,#091428)'}}>
        <div className="sect-title" style={{color:'var(--gold)'}}>
          {t.award_preds}
          <span style={{fontSize:12,color:'var(--mut)',fontFamily:"'Barlow',sans-serif",fontWeight:400,letterSpacing:0,textTransform:'none',marginLeft:4}}>{t.pts_each} · {AWARD_CONFIG.filter(a=>picks[a.key]).length}/4 {t.x_selected}</span>
        </div>
        <div className="award-grid">
          {AWARD_CONFIG.map(a=>(
            <div className="award-item" key={a.key}>
              <label><span style={{fontSize:16}}>{a.icon}</span>{a.label}{picks[a.key]&&<span style={{marginLeft:'auto',color:'var(--gold)',fontSize:12}}>✓</span>}</label>
              <AwardSelect config={a} players={players[a.key]} value={picks[a.key]} onChange={val=>setPicks(p=>({...p,[a.key]:val}))} t={t}/>
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

// ─── RESULTS ──────────────────────────────────────────────────────────────────
const COLS=[{k:'j1',lbl:'MD1'},{k:'j2',lbl:'MD2'},{k:'j3',lbl:'MD3'},{k:'r32',lbl:'R32'},{k:'r16',lbl:'R16'},{k:'qf',lbl:'QF'},{k:'sf',lbl:'SF'},{k:'final',lbl:'FIN'}];

function TeamTable({ rows, showIndex=true }) {
  return(
    <div style={{overflowX:'auto'}}>
      <table className="res-table">
        <thead><tr><th style={{textAlign:'left'}}>Team</th>{COLS.map(c=><th key={c.k}>{c.lbl}</th>)}<th>TOTAL</th></tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={r.team}>
              <td><div className="res-team">{showIndex&&<span style={{width:22,textAlign:'center',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,color:'var(--mut)'}}>{i+1}</span>}<span>{FLAGS[r.team]||'🏳️'}</span><span>{r.team}</span></div></td>
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
  const [searched,setSearched]=useState(false);
  const allSorted=Object.values(resultsMap).map(r=>({...r,_total:calcTotal(r)})).sort((a,b)=>b._total-a._total);
  const foundParticipant=searched&&query.trim()?participants.find(p=>p.name.toLowerCase()===query.trim().toLowerCase()):null;
  const notFound=searched&&query.trim()&&!foundParticipant;
  const participantRows=foundParticipant?(foundParticipant.teams||[]).map(tm=>({...(resultsMap[tm]||{team:tm,j1:0,j2:0,j3:0,r32:0,r16:0,qf:0,sf:0,final:0})})).map(r=>({...r,_total:calcTotal(r)})).sort((a,b)=>b._total-a._total):[];
  const participantTotal=participantRows.reduce((s,r)=>s+r._total,0);
  const participantRank=foundParticipant?(participantsSorted||[]).findIndex(p=>p.name===foundParticipant.name)+1:-1;
  const handleSearch=(e)=>{e.preventDefault();setSearched(true);};
  const handleClear=()=>{setQuery('');setSearched(false);};

  const rankColor=participantRank===1?'var(--gold)':participantRank===2?'#b0b8cc':participantRank===3?'#9a7050':'var(--blue)';
  const rankBg=participantRank===1?'rgba(245,183,49,0.04)':participantRank===2?'rgba(176,184,204,0.04)':participantRank===3?'rgba(154,112,80,0.04)':'rgba(90,159,255,0.04)';
  const rankBorder=participantRank===1?'rgba(245,183,49,0.4)':participantRank===2?'rgba(176,184,204,0.30)':participantRank===3?'rgba(154,112,80,0.32)':'rgba(90,159,255,0.25)';

  return(
    <div className="page">
      <div className="card">
        <div className="sect-title" style={{marginBottom:12}}>{t.search_title}</div>
        <form onSubmit={handleSearch} style={{display:'flex',gap:8}}>
          <input className="inp" style={{marginBottom:0,flex:1}} placeholder={t.search_ph} value={query} onChange={e=>{setQuery(e.target.value);setSearched(false);}} autoComplete="off"/>
          <button type="submit" style={{background:'var(--gold)',border:'none',borderRadius:8,padding:'0 18px',color:'#080c14',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:13,letterSpacing:1,cursor:'pointer',whiteSpace:'nowrap',minHeight:44}}>{t.search_btn}</button>
          {searched&&<button type="button" className="btn-ghost" onClick={handleClear}>✕</button>}
        </form>
        {notFound&&<div className="error-box" style={{marginTop:10,marginBottom:0}}>⚠️ {t.not_found_pre} "<strong>{query}</strong>". {t.not_found_post}</div>}
      </div>
      {foundParticipant&&(
        <div className="card" style={{border:`1px solid ${rankBorder}`,background:rankBg}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:'var(--white)',letterSpacing:2,textTransform:'uppercase'}}>{foundParticipant.name}</div>
              <div style={{fontSize:12,color:'var(--mut)',marginTop:2}}>{(foundParticipant.teams||[]).length} {t.teams_selected}</div>
            </div>
            <div style={{textAlign:'right',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
              {participantRank>0&&(
                <div style={{background:rankBg,border:`1px solid ${rankBorder}`,borderRadius:8,padding:'4px 12px',display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:11,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1}}>{t.rank_label}</span>
                  <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:rankColor,lineHeight:1}}>#{participantRank}</span>
                </div>
              )}
              <div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:32,color:'var(--white)',lineHeight:1}}>{participantTotal}</div>
                <div style={{fontSize:11,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1}}>{t.total_pts}</div>
              </div>
            </div>
          </div>
          <TeamTable rows={participantRows} showIndex={false}/>
          {AWARD_CONFIG.some(a=>foundParticipant[a.col])&&(
            <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--brd)'}}>
              <div style={{fontSize:11,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1,marginBottom:8,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{t.award_preds_label}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{AWARD_CONFIG.filter(a=>foundParticipant[a.col]).map(a=><span key={a.key} className="sum-chip">{a.icon} {foundParticipant[a.col]}</span>)}</div>
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
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16,color:'var(--mut)',letterSpacing:1}}>{t.no_results_title}</div>
              <div style={{fontSize:12,color:'var(--mut)',marginTop:8}}>{t.no_results_date}</div>
            </div>
          ):<TeamTable rows={allSorted}/>}
        </div>
      )}
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardPage({ participants, winnersMap, onRefresh, t }) {
  const [page,setPage]=useState(1);
  const topRef=useRef(null);

  useEffect(()=>{ topRef.current?.scrollIntoView({behavior:'instant'}); },[page]);
  const changePage=(n)=>{ setPage(n); };

  const sorted     =[...participants].sort((a,b)=>b.total-a.total);
  const pot        =participants.length*10;
  const top3       =sorted.slice(0,3);
  const isFirstPage=page===1;
  const showPodium =isFirstPage&&top3.length>=2;
  const prizes     =[Math.round(pot*0.75),Math.round(pot*0.20),Math.round(pot*0.05)];
  const medals     =['🥇','🥈','🥉'];
  const podColors  =['var(--gold)','#b0b8cc','#9a7050'];
  const podBg      =['rgba(245,183,49,0.08)','rgba(176,184,204,0.06)','rgba(154,112,80,0.06)'];
  const hasWinners =Object.values(winnersMap).some(v=>v);

  const pageStart  =(page-1)*PAGE_SIZE;
  const pageRows   =sorted.slice(pageStart,pageStart+PAGE_SIZE);
  const totalPages =Math.ceil(sorted.length/PAGE_SIZE);
  const listRows   =isFirstPage&&showPodium?pageRows.slice(3):pageRows;

  if(participants.length===0)return(
    <div className="page"><div className="card" style={{textAlign:'center',padding:'56px 20px'}}>
      <div style={{fontSize:52,marginBottom:14}}>👥</div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:18,color:'var(--mut)',letterSpacing:1}}>{t.no_part_title}</div>
      <div style={{fontSize:13,color:'var(--mut)',marginTop:8}}>{t.no_part_sub}</div>
    </div></div>
  );

  const PickChips=({p})=>(
    <div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:5}}>
      {AWARD_CONFIG.filter(a=>p[a.col]).map(a=>{
        const correct=winnersMap[a.key]&&p[a.col]===winnersMap[a.key];
        return(<span key={a.key} style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,padding:'2px 8px',borderRadius:5,background:correct?'rgba(34,212,142,0.12)':'rgba(255,255,255,0.05)',border:correct?'1px solid rgba(34,212,142,0.35)':'1px solid var(--brd)',color:correct?'var(--green)':'var(--mut)'}}>
          {a.icon} {p[a.col]}{correct&&' ✓'}
        </span>);
      })}
    </div>
  );

  const BonusBadge=({p})=>{
    const b=AWARD_CONFIG.filter(a=>winnersMap[a.key]&&p[a.col]===winnersMap[a.key]).length*AWARD_BONUS;
    return b>0?<span className="bonus-badge">+{b} BONUS</span>:null;
  };

  return(
    <div className="page" ref={topRef}>
      {hasWinners&&(
        <div className="card" style={{background:'rgba(245,183,49,0.05)',border:'1px solid rgba(245,183,49,0.2)'}}>
          <div className="sect-title" style={{marginBottom:10}}>{t.award_winners}</div>
          <div className="award-grid">
            {AWARD_CONFIG.map(a=>winnersMap[a.key]&&(
              <div key={a.key} className="award-pick award-correct">
                <div className="award-pick-lbl">{a.icon} {a.label}</div>
                <div className="award-pick-val">{winnersMap[a.key]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div key={page} style={{animation:'fadeIn 0.2s ease'}}>
        {showPodium&&(
          <div className="podium">
            {[top3[1],top3[0],top3[2]].filter(Boolean).map((p,i)=>{
              const ri=i===0?1:i===1?0:2;
              return(
                <div className="podium-card" key={p.name} style={{
                  background:podBg[ri],borderColor:`${podColors[ri]}40`,
                  order:ri===0?2:ri===1?1:3,
                  paddingTop:ri===0?30:ri===1?22:16,
                }}>
                  <div className="podium-medal">{medals[ri]}</div>
                  <div className="podium-name">{p.name}</div>
                  <div className="podium-pts" style={{color:podColors[ri]}}>{p.total}<span> {t.pts}</span></div>
                  <div className="podium-premio" style={{color:podColors[ri]}}>€{prizes[ri]}</div>
                  <div className="podium-teams">{(p.teams||[]).map(tm=><span key={tm} className="podium-team-chip">{FLAGS[tm]||'🏳️'} {tm}</span>)}</div>
                </div>
              );
            })}
          </div>
        )}

        {listRows.map((p,i)=>{
          const pos=pageStart+(isFirstPage&&showPodium?3:0)+i+1;
          return(
            <div className="clasif-row" key={p.name}>
              <div className="clasif-pos" style={
                pos===1?{background:'rgba(245,183,49,0.15)',borderColor:'rgba(245,183,49,0.4)',color:'var(--gold)'}:
                pos===2?{background:'rgba(176,184,204,0.10)',borderColor:'rgba(176,184,204,0.35)',color:'#b0b8cc'}:
                pos===3?{background:'rgba(154,112,80,0.12)',borderColor:'rgba(154,112,80,0.35)',color:'#9a7050'}:{}
              }>{pos}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:4}}>
                  <span className="clasif-name">{p.name}</span>
                  <BonusBadge p={p}/>
                </div>
                <div className="clasif-teams-mini">{(p.teams||[]).map(tm=><span key={tm} className="clasif-team-chip">{FLAGS[tm]||'🏳️'} {tm} · </span>)}</div>
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
                style={{width:36,height:36,borderRadius:8,border:`1px solid ${n===page?'var(--gold)':'var(--brd)'}`,background:n===page?'rgba(245,183,49,0.15)':'var(--sur2)',color:n===page?'var(--gold)':'var(--mut)',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,cursor:'pointer',transition:'var(--tr)'}}>
                {n}
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={()=>changePage(Math.min(totalPages,page+1))} disabled={page===totalPages} style={{minWidth:80}}>Next →</button>
        </div>
      )}

      <div style={{textAlign:'center',padding:16,fontSize:12,color:'var(--mut)',marginTop:4}}>
        Pág. <strong style={{color:'var(--txt)'}}>{page}</strong> {t.page_of} <strong style={{color:'var(--txt)'}}>{totalPages}</strong>
        &nbsp;·&nbsp; {sorted.length} {t.part_footer} &nbsp;·&nbsp; {t.pot_footer}: <strong style={{color:'var(--gold)'}}>€{pot}</strong>
        <br/>
        <button className="btn-ghost" onClick={onRefresh} style={{marginTop:12}}>{t.refresh_lb}</button>
      </div>
    </div>
  );
}

// ─── FOOTER PIN ───────────────────────────────────────────────────────────────
function FooterPin({ onUnlock }) {
  const [show,setShow]=useState(false);
  const [pin,setPin]=useState('');
  const [err,setErr]=useState(false);
  const tryPin=()=>{if(pin===ADMIN_PIN){onUnlock();setShow(false);setPin('');}else{setErr(true);setPin('');setTimeout(()=>setErr(false),1200);}};
  return(
    <div className="app-footer">
      Created by Aitor Alegría &amp; Gorka Barroso
      <span style={{cursor:'pointer',marginLeft:10,opacity:0.25,userSelect:'none'}} onClick={()=>{setShow(s=>!s);setPin('');setErr(false);}}>🔐</span>
      {show&&(
        <div style={{marginTop:10,display:'flex',gap:8,justifyContent:'center'}}>
          <input className={`pin-input ${err?'err':''}`} type="password" placeholder="Admin PIN" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&tryPin()} autoFocus/>
          <button className="btn-ghost" onClick={tryPin}>Enter</button>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminPage({ onSync, winnersMap, onSaveWinners }) {
  const [log,setLog]=useState('Ready. Press Sync to fetch latest results.');
  const [syncing,setSyncing]=useState(false);
  const [winners,setWinners]=useState({top_scorer:winnersMap.top_scorer||'',mvp:winnersMap.mvp||'',young:winnersMap.best_young||'',goalkeeper:winnersMap.best_goalkeeper||''});
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const sync=async()=>{setSyncing(true);await onSync(msg=>setLog(prev=>prev+'\n'+msg));setSyncing(false);};
  const saveWinners=async()=>{setSaving(true);await onSaveWinners(winners);setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  return(
    <div className="page">
      <div className="card" style={{border:'1px solid rgba(245,183,49,0.3)'}}>
        <div className="sect-title">⚙️ Admin Panel</div>
        <div style={{fontSize:13,color:'var(--mut)',marginBottom:12}}>Fetches all finished World Cup 2026 matches from football-data.org and recalculates every team's points automatically.</div>
        <button className="btn-primary" onClick={sync} disabled={syncing}>{syncing?'⏳ Syncing…':'🔄 Sync Results from API'}</button>
        {log&&<div className="admin-log">{log}</div>}
        <hr className="admin-divider"/>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:16,color:'var(--white)',letterSpacing:1,marginBottom:14}}>🏅 Award Winners</div>
        <div style={{fontSize:13,color:'var(--mut)',marginBottom:14}}>Fill these in when the tournament ends. Each participant who predicted correctly earns +10 pts.</div>
        <div className="award-grid">
          {[{k:'top_scorer',label:'⚽ Top Scorer'},{k:'mvp',label:'🏆 Tournament MVP'},{k:'young',label:'🌟 Best Young Player'},{k:'goalkeeper',label:'🧤 Best Goalkeeper'}].map(a=>(
            <div key={a.k}>
              <label style={{display:'block',fontSize:11,color:'var(--mut)',textTransform:'uppercase',letterSpacing:1,marginBottom:5,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{a.label}</label>
              <input className="inp" style={{marginBottom:0}} placeholder="Player name…" value={winners[a.k]} onChange={e=>setWinners(w=>({...w,[a.k]:e.target.value}))}/>
            </div>
          ))}
        </div>
        <button className="btn-primary" style={{marginTop:14}} onClick={saveWinners} disabled={saving}>{saved?'✅ Saved!':saving?'⏳ Saving…':'💾 Save Award Winners'}</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState('inicio');
  const [participants,setParticipants]=useState([]);
  const [resultsMap,setResultsMap]=useState({});
  const [winnersMap,setWinnersMap]=useState({});
  const [loading,setLoading]=useState(true);
  const [adminMode,setAdminMode]=useState(false);
  const [lang,setLang]=useState(()=>{ try{return localStorage.getItem('lang')||'es';}catch{return 'es';} });

  useEffect(()=>{ try{localStorage.setItem('lang',lang);}catch{} },[lang]);

  const t=LANGS[lang];

  useEffect(()=>{loadData();},[]);

  async function loadData() {
    const [{data:parts},{data:res},{data:winners}]=await Promise.all([
      supabase.from('participants').select('*').order('created_at'),
      supabase.from('results').select('*'),
      supabase.from('award_winners').select('*'),
    ]);
    setParticipants(parts||[]);
    const map={};(res||[]).forEach(r=>{map[r.team]=r;});setResultsMap(map);
    const row=winners?.[0]||{};
    setWinnersMap({top_scorer:row.top_scorer||'',mvp:row.mvp||'',best_young:row.young||'',best_goalkeeper:row.goalkeeper||''});
    setLoading(false);
  }

  const calcBonus=(p)=>AWARD_CONFIG.filter(a=>winnersMap[a.key]&&p[a.col]===winnersMap[a.key]).length*AWARD_BONUS;
  const calcTeamPts=(teams)=>(teams||[]).reduce((sum,team)=>sum+calcTotal(resultsMap[team]||{}),0);
  const participantsWithTotals=participants.map(p=>({...p,total:calcTeamPts(p.teams)+calcBonus(p)}));
  const participantsSorted=participantsWithTotals.slice().sort((a,b)=>b.total-a.total);

  async function handleRegister({name,teams,picks}) {
    const {data:existing}=await supabase.from('participants').select('id').eq('name',name).maybeSingle();
    if(existing)return 'duplicate';
    const {data:inserted,error}=await supabase.from('participants').insert({name,teams}).select('id').single();
    if(error){if(error.code==='23505')return 'duplicate';return 'error';}
    if(inserted?.id){
      await supabase.from('participants').update({
        pick_top_scorer:picks.top_scorer||null,pick_mvp:picks.mvp||null,
        pick_young:picks.best_young||null,pick_goalkeeper:picks.best_goalkeeper||null,
      }).eq('id',inserted.id);
    }
    await loadData();setTimeout(()=>setTab('clasificacion'),1500);return true;
  }

  async function handleSync(log) {
    log('Fetching matches from football-data.org…');
    try {
      const res=await fetch('/api/sync');
      const body=await res.json();
      if(!res.ok)throw new Error(body?.error||body?.message||`API ${res.status}`);
      const {matches}=body;
      const finished=matches.filter(m=>m.status==='FINISHED');
      log(`${finished.length} finished matches found. Calculating points…`);
      const blank=()=>({j1:0,j2:0,j3:0,r32:0,r16:0,qf:0,sf:0,final:0});
      const pts={};
      for(const m of finished){
        const home=normTeam(m.homeTeam.name),away=normTeam(m.awayTeam.name);
        const hg=m.score.fullTime.home??0,ag=m.score.fullTime.away??0;
        let col;
        if(m.stage==='GROUP_STAGE'){col=m.matchday===1?'j1':m.matchday===2?'j2':'j3';}
        else{col=STAGE_COL[m.stage];}
        if(!col)continue;
        if(!pts[home])pts[home]=blank();if(!pts[away])pts[away]=blank();
        pts[home][col]+=hg;pts[away][col]+=ag;
        if(hg>ag)pts[home][col]+=3;else if(hg<ag)pts[away][col]+=3;else{pts[home][col]+=1;pts[away][col]+=1;}
        if(col!=='j1'&&col!=='j2'&&col!=='j3'){pts[home][col]+=6;pts[away][col]+=6;}
        if(col==='final'){const winner=hg>=ag?home:away;pts[winner][col]+=10;}
      }
      const rows=Object.entries(pts).map(([team,p])=>({team,...p}));
      log(`Saving ${rows.length} teams to Supabase…`);
      const {error}=await supabase.from('results').upsert(rows,{onConflict:'team'});
      if(error)throw new Error(error.message);
      await loadData();log(`✅ Done! ${rows.length} teams synced from ${finished.length} matches.`);
    }catch(e){log(`❌ Error: ${e.message}`);}
  }

  async function handleSaveWinners(w) {
    await supabase.from('award_winners').update({top_scorer:w.top_scorer||null,mvp:w.mvp||null,young:w.young||null,goalkeeper:w.goalkeeper||null}).eq('id',1);
    await loadData();
  }

  const pot=participantsWithTotals.length*10;

  if(loading)return(<><style>{CSS}</style><LoadingScreen/></>);

  return(
    <>
      <style>{CSS}</style>
      <div className="hdr">
        <div className="hdr-top">
          <LangSelector lang={lang} setLang={setLang}/>
          <span className="hdr-icon">⚽</span>
          <div><div className="hdr-name">World Cup Pool 2026</div><div className="hdr-sub">USA · Mexico · Canada</div></div>
          <div className="hdr-bote"><div className="hdr-bote-lbl">{t.pot}</div><div className="hdr-bote-val">€{pot}</div></div>
        </div>
        <nav className="nav">
          {[{id:'inicio',l:t.nav_home},{id:'normas',l:t.nav_rules},{id:'seleccion',l:t.nav_teams},{id:'resultados',l:t.nav_results},{id:'clasificacion',l:t.nav_leaderboard},...(adminMode?[{id:'admin',l:'⚙️ Admin'}]:[])].map(nt=>(
            <button key={nt.id} className={`nav-btn ${tab===nt.id?'on':''}`}
              onClick={()=>{setTab(nt.id);if(nt.id==='resultados'||nt.id==='clasificacion')loadData();}}>
              {nt.l}
            </button>
          ))}
        </nav>
      </div>
      {tab==='inicio'        &&<HomePage        participants={participantsWithTotals} goTo={setTab} t={t}/>}
      {tab==='normas'        &&<RulesPage        t={t}/>}
      {tab==='seleccion'     &&<RegistrationPage onSubmit={handleRegister} t={t}/>}
      {tab==='resultados'    &&<ResultsPage      resultsMap={resultsMap} participants={participants} participantsSorted={participantsSorted} onRefresh={loadData} t={t}/>}
      {tab==='clasificacion' &&<LeaderboardPage  participants={participantsWithTotals} winnersMap={winnersMap} onRefresh={loadData} t={t}/>}
      {tab==='admin'         &&<AdminPage        onSync={handleSync} winnersMap={winnersMap} onSaveWinners={handleSaveWinners}/>}
      <FooterPin onUnlock={()=>{setAdminMode(true);setTab('admin');}}/>
    </>
  );
}
