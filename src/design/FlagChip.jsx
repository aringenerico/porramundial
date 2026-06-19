import { useState } from 'react';
import { country } from './flags';

// Bandera real (PNG vía flagcdn.com) recortada en círculo. Si la imagen
// falla al cargar (red, código mal mapeado, etc.) cae a un texto con el
// código del país en vez de mostrar un icono roto.
export function FlagChip({ team, size = 28, style = {} }) {
  const c = country(team);
  const [errored, setErrored] = useState(false);
  const showImg = c.iso && !errored;

  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden', verticalAlign: 'middle',
      background: '#1a2d52',
      border: '1.5px solid rgba(255,255,255,0.15)',
      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.4)',
      ...style,
    }}>
      {showImg ? (
        <img
          src={`https://flagcdn.com/w80/${c.iso}.png`}
          srcSet={`https://flagcdn.com/w160/${c.iso}.png 2x`}
          alt={team}
          loading="lazy"
          onError={() => setErrored(true)}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
        />
      ) : (
        <span style={{
          fontSize: size * 0.32, color: '#94A3B8', fontWeight: 700,
          fontFamily: "'Geist','Inter',system-ui,sans-serif", letterSpacing: '0.02em',
        }}>{c.code}</span>
      )}
    </span>
  );
}

export function TeamTag({ team, size = 22, showName = false, style = {} }) {
  const c = country(team);
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:7,minWidth:0,...style}}>
      <FlagChip team={team} size={size}/>
      <span style={{fontFamily:"'Geist','Inter',system-ui,sans-serif",fontSize:size*0.46,
        fontWeight:700,letterSpacing:'0.04em',color:'var(--mut)'}}>{c.code}</span>
      {showName && <span style={{fontSize:size*0.5,fontWeight:600,color:'var(--txt)',
        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{team}</span>}
    </span>
  );
}
