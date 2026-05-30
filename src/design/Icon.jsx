export function Icon({ name, size = 18, color = 'currentColor', stroke = 1.8 }) {
  const p = { width:size, height:size, viewBox:'0 0 24 24', fill:'none',
              stroke:color, strokeWidth:stroke, strokeLinecap:'round', strokeLinejoin:'round' };
  const P = {
    goal:    <><circle cx="12" cy="12" r="9"/><path d="M12 3v4M12 21v-4M3 12h4M21 12h-4"/><path d="M9 9l3 3 3-3M9 15l3-3 3 3"/></>,
    win:     <path d="m4 12 5 5L20 6"/>,
    draw:    <path d="M5 12h14"/>,
    advance: <><path d="M5 12h11"/><path d="m12 6 6 6-6 6"/></>,
    trophy:  <><path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M8 6H5a3 3 0 0 0 3 5"/><path d="M16 6h3a3 3 0 0 1-3 5"/><path d="M10 14h4v4h-4z"/><path d="M7 21h10"/></>,
    boot:    <><path d="M4 7h7v6l8 1a1 1 0 0 1 1 1v3H4z"/><path d="M4 14h7"/></>,
    shield:  <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>,
    star:    <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6L12 16.8 6.5 19.6l1-6L3.2 9.4l6-.9z"/>,
    glove:   <><path d="M7 11V6a2 2 0 0 1 4 0v4M11 10V5a2 2 0 0 1 4 0v6M15 11V7a2 2 0 0 1 3 0v7a6 6 0 0 1-6 6H10a5 5 0 0 1-5-5v-2a2 2 0 0 1 2-2z"/></>,
    mvp:     <><path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M10 14h4v4h-4z"/><path d="M7 21h10"/></>,
    crown:   <path d="M3 18 1 7l6 4 5-7 5 7 6-4-2 11H3z"/>,
    users:   <><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.5a3 3 0 0 1 0 5.5M21 20c0-2.5-1.5-4.7-3.5-5.5"/></>,
    flame:   <path d="M12 22c4 0 7-3 7-7 0-3-2-4-3-7-1 2-3 3-3 5-1-1-2-2-2-4-3 2-6 4-6 8 0 4 3 5 7 5z"/>,
    medal:   <><circle cx="12" cy="14" r="6"/><path d="M9 8 6 2h4l2 4M15 8l3-6h-4l-2 4"/></>,
    lock:    <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
    arrowR:  <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    check:   <path d="m4 12 5 5L20 6"/>,
    search:  <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></>,
    home:    <><path d="M3 11 12 3l9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></>,
    rules:   <><path d="M5 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 0-2 2z"/><path d="M9 8h6M9 12h4"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.5 7.5 0 0 0 0-2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2.5-1.4L14 3h-4l-.5 2.7a7 7 0 0 0-2.5 1.4l-2.4-1-2 3.4 2 1.5a7.5 7.5 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2.5 1.4L10 21h4l.5-2.6a7 7 0 0 0 2.5-1.4l2.4 1 2-3.4z"/></>,
    power:   <><path d="M12 4v8"/><path d="M7.5 7a7 7 0 1 0 9 0"/></>,
    share:   <><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></>,
  };
  return <svg {...p}>{P[name] || null}</svg>;
}
