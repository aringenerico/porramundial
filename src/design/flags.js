export const COUNTRIES = {
  // ── TOP ──
  Argentina:  { code:'ARG', colors:['#74ACDF','#ffffff','#74ACDF'], stripes:'horiz' },
  France:     { code:'FRA', colors:['#002395','#ffffff','#ED2939'], stripes:'vert' },
  Brazil:     { code:'BRA', colors:['#009C3B','#FEDF00','#002776'], stripes:'diamond' },
  England:    { code:'ENG', colors:['#ffffff','#CE1124','#ffffff'], stripes:'cross' },
  Spain:      { code:'ESP', colors:['#AA151B','#F1BF00','#AA151B'], stripes:'horiz' },
  Germany:    { code:'GER', colors:['#000000','#DD0000','#FFCE00'], stripes:'horiz' },
  Portugal:   { code:'POR', colors:['#006600','#FF0000','#FF0000'], stripes:'vert' },

  // ── STRONG ──
  Netherlands:  { code:'NED', colors:['#AE1C28','#ffffff','#21468B'], stripes:'horiz' },
  Belgium:      { code:'BEL', colors:['#000000','#FAE042','#ED2939'], stripes:'vert' },
  Croatia:      { code:'CRO', colors:['#FF0000','#ffffff','#171796'], stripes:'horiz' },
  Uruguay:      { code:'URU', colors:['#7B9DD9','#ffffff','#7B9DD9'], stripes:'horiz' },
  Colombia:     { code:'COL', colors:['#FCD116','#003893','#CE1126'], stripes:'horiz' },
  Morocco:      { code:'MAR', colors:['#C1272D','#C1272D','#006233'], stripes:'dot' },
  Mexico:       { code:'MEX', colors:['#006847','#ffffff','#CE1126'], stripes:'vert' },
  'United States': { code:'USA', colors:['#B22234','#ffffff','#3C3B6E'], stripes:'us' },
  Japan:        { code:'JPN', colors:['#ffffff','#BC002D','#ffffff'], stripes:'dot' },
  Switzerland:  { code:'SUI', colors:['#D52B1E','#ffffff','#D52B1E'], stripes:'cross' },
  Austria:      { code:'AUT', colors:['#ED2939','#ffffff','#ED2939'], stripes:'horiz' },
  Ecuador:      { code:'ECU', colors:['#FFD100','#0072CE','#EF3340'], stripes:'horiz' },
  'South Korea':{ code:'KOR', colors:['#ffffff','#CD2E3A','#ffffff'], stripes:'dot' },
  Iran:         { code:'IRN', colors:['#239F40','#ffffff','#DA0000'], stripes:'horiz' },
  Australia:    { code:'AUS', colors:['#00247D','#ffffff','#00247D'], stripes:'solid' },
  Paraguay:     { code:'PAR', colors:['#D52B1E','#ffffff','#0038A8'], stripes:'horiz' },
  Tunisia:      { code:'TUN', colors:['#E70013','#ffffff','#E70013'], stripes:'dot' },
  Algeria:      { code:'ALG', colors:['#006233','#ffffff','#ffffff'], stripes:'vert' },
  Egypt:        { code:'EGY', colors:['#CE1126','#ffffff','#000000'], stripes:'horiz' },
  Norway:       { code:'NOR', colors:['#BA0C2F','#ffffff','#BA0C2F'], stripes:'cross' },
  Sweden:       { code:'SWE', colors:['#006AA7','#FECC00','#006AA7'], stripes:'cross' },

  // ── AVERAGE ──
  Canada:       { code:'CAN', colors:['#FF0000','#ffffff','#FF0000'], stripes:'vert' },
  Qatar:        { code:'QAT', colors:['#8A1538','#ffffff','#8A1538'], stripes:'solid' },
  'Saudi Arabia':   { code:'KSA', colors:['#006C35','#ffffff','#006C35'], stripes:'solid' },
  'Ivory Coast':    { code:'CIV', colors:['#F77F00','#ffffff','#009E60'], stripes:'vert' },
  Ghana:        { code:'GHA', colors:['#CE1126','#FCD116','#006B3F'], stripes:'horiz' },
  'South Africa':   { code:'RSA', colors:['#007A4D','#ffffff','#007A4D'], stripes:'solid' },
  Scotland:     { code:'SCO', colors:['#005EB8','#ffffff','#005EB8'], stripes:'cross' },
  'Czech Republic': { code:'CZE', colors:['#ffffff','#ffffff','#D7141A'], stripes:'horiz' },
  Turkey:       { code:'TUR', colors:['#E30A17','#ffffff','#E30A17'], stripes:'dot' },
  'Bosnia and Herzegovina': { code:'BIH', colors:['#002395','#FECB00','#002395'], stripes:'solid' },
  Uzbekistan:   { code:'UZB', colors:['#0099B5','#ffffff','#1EB53A'], stripes:'horiz' },
  Jordan:       { code:'JOR', colors:['#000000','#ffffff','#007A3D'], stripes:'horiz' },
  'Cape Verde': { code:'CPV', colors:['#003893','#ffffff','#003893'], stripes:'solid' },
  Panama:       { code:'PAN', colors:['#D21034','#ffffff','#005293'], stripes:'solid' },

  // ── SURPRISE ──
  'New Zealand':{ code:'NZL', colors:['#00247D','#CC142B','#00247D'], stripes:'solid' },
  Curacao:      { code:'CUW', colors:['#002B7F','#F9E814','#002B7F'], stripes:'solid' },
  Haiti:        { code:'HAI', colors:['#00209F','#00209F','#D21034'], stripes:'horiz' },
  Iraq:         { code:'IRQ', colors:['#CE1126','#ffffff','#000000'], stripes:'horiz' },
  'DR Congo':   { code:'COD', colors:['#007FFF','#F7D618','#CE1021'], stripes:'solid' },
};

export const country = name =>
  COUNTRIES[name] || { code:(name||'?').slice(0,3).toUpperCase(), colors:['#555','#777','#555'], stripes:'solid' };
