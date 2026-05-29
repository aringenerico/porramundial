import { country } from './flags';

function bg(c) {
  const [a, b, d] = c.colors;
  switch (c.stripes) {
    case 'vert':    return `linear-gradient(90deg, ${a} 0 33%, ${b} 33% 67%, ${d} 67% 100%)`;
    case 'horiz':   return `linear-gradient(180deg, ${a} 0 33%, ${b} 33% 67%, ${d} 67% 100%)`;
    case 'dot':     return `radial-gradient(circle, ${d} 0 32%, ${a} 32% 100%)`;
    case 'diamond': return `radial-gradient(ellipse at center, ${d} 0 26%, ${b} 26% 60%, ${a} 60% 100%)`;
    case 'us':      return `repeating-linear-gradient(180deg, ${a} 0 14.2%, ${b} 14.2% 28.5%)`;
    case 'cross':   return a;
    default:        return a;
  }
}

export function FlagChip({ team, size = 28, style = {} }) {
  const c = country(team);
  const [, b] = c.colors;
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      background: bg(c),
      border: '1.5px solid rgba(255,255,255,0.15)',
      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.4)',
      display: 'inline-block', flexShrink: 0, position: 'relative',
      overflow: 'hidden', verticalAlign: 'middle', ...style,
    }}>
      {c.stripes === 'cross' && (
        <>
          <span style={{position:'absolute',top:'42%',left:0,right:0,height:'16%',background:b}}/>
          <span style={{position:'absolute',top:0,bottom:0,left:'42%',width:'16%',background:b}}/>
        </>
      )}
      {c.stripes === 'us' && (
        <span style={{position:'absolute',top:0,left:0,width:'45%',height:'53%',
          background:c.colors[2],display:'flex',alignItems:'center',justifyContent:'center',
          color:'#fff',fontSize:size*0.3,lineHeight:1}}>★</span>
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
