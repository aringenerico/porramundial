// Cada país solo necesita su código ISO 3166-1 alpha-2 (minúsculas) para
// pedirle la bandera real a flagcdn.com, y su código corto FIFA-style para
// mostrar como texto (en TeamTag, o como fallback si la imagen no carga).
//
// Inglaterra y Escocia no tienen código ISO propio (van bajo GB), pero
// flagcdn.com soporta los códigos de nación del Reino Unido directamente.
export const COUNTRIES = {
  // ── TOP ──
  Argentina:  { code:'ARG', iso:'ar' },
  France:     { code:'FRA', iso:'fr' },
  Brazil:     { code:'BRA', iso:'br' },
  England:    { code:'ENG', iso:'gb-eng' },
  Spain:      { code:'ESP', iso:'es' },
  Germany:    { code:'GER', iso:'de' },
  Portugal:   { code:'POR', iso:'pt' },

  // ── STRONG ──
  Netherlands:  { code:'NED', iso:'nl' },
  Belgium:      { code:'BEL', iso:'be' },
  Croatia:      { code:'CRO', iso:'hr' },
  Uruguay:      { code:'URU', iso:'uy' },
  Colombia:     { code:'COL', iso:'co' },
  Morocco:      { code:'MAR', iso:'ma' },
  Mexico:       { code:'MEX', iso:'mx' },
  'United States': { code:'USA', iso:'us' },
  Japan:        { code:'JPN', iso:'jp' },
  Switzerland:  { code:'SUI', iso:'ch' },
  Austria:      { code:'AUT', iso:'at' },
  Ecuador:      { code:'ECU', iso:'ec' },
  'South Korea':{ code:'KOR', iso:'kr' },
  Iran:         { code:'IRN', iso:'ir' },
  Australia:    { code:'AUS', iso:'au' },
  Paraguay:     { code:'PAR', iso:'py' },
  Tunisia:      { code:'TUN', iso:'tn' },
  Algeria:      { code:'ALG', iso:'dz' },
  Egypt:        { code:'EGY', iso:'eg' },
  Norway:       { code:'NOR', iso:'no' },
  Sweden:       { code:'SWE', iso:'se' },

  // ── AVERAGE ──
  Canada:       { code:'CAN', iso:'ca' },
  Qatar:        { code:'QAT', iso:'qa' },
  'Saudi Arabia':   { code:'KSA', iso:'sa' },
  'Ivory Coast':    { code:'CIV', iso:'ci' },
  Ghana:        { code:'GHA', iso:'gh' },
  'South Africa':   { code:'RSA', iso:'za' },
  Scotland:     { code:'SCO', iso:'gb-sct' },
  'Czech Republic': { code:'CZE', iso:'cz' },
  Turkey:       { code:'TUR', iso:'tr' },
  'Bosnia and Herzegovina': { code:'BIH', iso:'ba' },
  Uzbekistan:   { code:'UZB', iso:'uz' },
  Jordan:       { code:'JOR', iso:'jo' },
  'Cape Verde': { code:'CPV', iso:'cv' },
  Panama:       { code:'PAN', iso:'pa' },

  // ── SURPRISE ──
  'New Zealand':{ code:'NZL', iso:'nz' },
  Curacao:      { code:'CUW', iso:'cw' },
  Haiti:        { code:'HAI', iso:'ht' },
  Iraq:         { code:'IRQ', iso:'iq' },
  'DR Congo':   { code:'COD', iso:'cd' },

  // Rival real de Francia / Noruega / Irak en el Grupo I (no es elegible
  // en la porra, pero aparece en resultados y cruces).
  Senegal:      { code:'SEN', iso:'sn' },
};

// Si algún día aparece un equipo sin mapear, devolvemos un objeto sin `iso`
// — FlagChip lo detecta y muestra el código de texto en vez de romperse.
export const country = name =>
  COUNTRIES[name] || { code:(name||'?').slice(0,3).toUpperCase(), iso:null };
