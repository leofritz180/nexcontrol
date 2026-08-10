/* CSS da Dashboard V2 — escopado no prefixo .v2-*, injetado via <style> na page.
   Nao vaza pro resto do app (nenhuma regra global sem prefixo). */
const CSS = `
.v2-root { min-height: 100vh; background: #000; color: var(--t1); font-family: var(--font-sans); }
.v2-root *, .v2-root *::before, .v2-root *::after { box-sizing: border-box; }
.v2-root button { font-family: inherit; }

/* ════════ SIDEBAR ════════ */
.v2-side {
  position: fixed; left: 0; top: 0; bottom: 0; width: 236px; z-index: 50;
  background: #000; border-right: 1px solid var(--b1);
  display: flex; flex-direction: column; padding: 14px 12px 12px;
  transition: transform .26s cubic-bezier(.4,0,.2,1);
}
.v2-ws {
  display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 9px;
  background: transparent; border: 1px solid var(--b1); border-radius: 9px;
  cursor: pointer; transition: background .16s, border-color .16s;
}
.v2-ws:hover { background: rgba(255,255,255,.03); border-color: var(--b2); }
.v2-ws-name { display: block; font-size: 12.5px; font-weight: 600; color: var(--t1); letter-spacing: -.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v2-ws-plan { display: block; font-size: 10.5px; color: var(--t4); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.v2-search {
  display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 10px;
  padding: 7px 9px; border-radius: 8px; cursor: pointer;
  background: rgba(255,255,255,.02); border: 1px solid var(--b1);
  color: var(--t3); font-size: 12.5px; transition: border-color .16s, color .16s;
}
.v2-search:hover { border-color: var(--b2); color: var(--t2); }
.v2-search span { flex: 1; text-align: left; }
.v2-search kbd, .v2-palette-input kbd {
  font-family: var(--mono); font-size: 9.5px; color: var(--t4);
  border: 1px solid var(--b1); border-radius: 4px; padding: 1px 4px; background: rgba(255,255,255,.02);
}

.v2-nav { flex: 1; overflow-y: auto; margin-top: 18px; display: flex; flex-direction: column; gap: 18px; }
.v2-nav::-webkit-scrollbar { width: 0; }
.v2-nav-label {
  margin: 0 0 6px; padding: 0 9px; font-size: 9.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .12em; color: var(--t4);
}
.v2-nav-item {
  display: flex; align-items: center; gap: 10px; width: 100%; height: 31px;
  padding: 0 9px; border: none; border-radius: 7px; background: transparent;
  color: var(--t2); font-size: 13px; cursor: pointer; text-align: left;
  transition: background .14s, color .14s;
}
.v2-nav-item:hover { background: rgba(255,255,255,.04); color: var(--t1); }
.v2-nav-item.is-active { background: rgba(255,255,255,.06); color: var(--t1); font-weight: 550; }
.v2-nav-item span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v2-nav-badge {
  font-style: normal; font-family: var(--mono); font-size: 9.5px; color: var(--t3);
  background: rgba(255,255,255,.05); border-radius: 5px; padding: 1.5px 5px;
}

.v2-side-foot { border-top: 1px solid var(--b1); padding-top: 8px; margin-top: 8px; display: flex; flex-direction: column; gap: 1px; }
.v2-user { display: flex; align-items: center; gap: 9px; padding: 9px 9px 2px; margin-top: 6px; border-top: 1px solid var(--b1); }
.v2-avatar {
  width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.05); border: 1px solid var(--b1);
  font-size: 10px; font-weight: 700; color: var(--t2); letter-spacing: .02em;
}

/* ════════ MAIN / TOPBAR ════════ */
.v2-main { margin-left: 236px; min-height: 100vh; min-width: 0; overflow-x: clip; }
.v2-top {
  position: sticky; top: 0; z-index: 40; height: 56px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  flex-wrap: nowrap; padding: 0 24px; background: #000; border-bottom: 1px solid var(--b1);
}
.v2-top-l { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; }
.v2-top-r { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 0 0 auto; }
.v2-crumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--t3); min-width: 0; overflow: hidden; }
.v2-crumb strong, .v2-crumb span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v2-crumb strong { color: var(--t1); font-weight: 550; }
.v2-crumb-sep { color: var(--t4); }
.v2-live {
  display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--t2);
  border: 1px solid var(--b1); border-radius: 99px; padding: 4px 10px 4px 8px;
}
.v2-live i { width: 5px; height: 5px; border-radius: 50%; background: var(--profit); display: block; }
.v2-icon-btn {
  width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid transparent; border-radius: 7px; background: transparent;
  color: var(--t3); cursor: pointer; transition: background .14s, color .14s;
}
.v2-icon-btn:hover { background: rgba(255,255,255,.05); color: var(--t1); }
.v2-btn-ghost {
  height: 30px; padding: 0 11px; border-radius: 7px; font-size: 12.5px; cursor: pointer;
  background: transparent; border: 1px solid var(--b1); color: var(--t2); transition: border-color .16s, color .16s;
}
.v2-btn-ghost:hover { border-color: var(--b2); color: var(--t1); }
.v2-btn-primary {
  display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px;
  border-radius: 7px; border: none; background: var(--brand); color: #fff;
  font-size: 12.5px; font-weight: 600; cursor: pointer; transition: background .16s;
}
.v2-btn-primary:hover { background: #d32f2f; }

.v2-content { max-width: 1240px; margin: 0 auto; padding: 26px 24px 72px; }

/* ════════ PRIMITIVOS ════════ */
.v2-panel {
  background: #000; border: 1px solid var(--b1); border-radius: 12px;
  box-shadow: inset 1px 0 0 rgba(255,255,255,.04), inset -1px 0 0 rgba(255,255,255,.04);
  transition: border-color .18s;
}
.v2-panel-h {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px 18px; border-bottom: 1px solid var(--b1);
}
.v2-panel-t { margin: 0; font-size: 13.5px; font-weight: 600; color: var(--t1); letter-spacing: -.01em; }
.v2-panel-s { margin: 2px 0 0; font-size: 11.5px; color: var(--t4); }
.v2-link {
  display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--t3);
  background: none; border: none; cursor: pointer; padding: 0; transition: color .14s;
}
.v2-link:hover { color: var(--t1); }
.v2-eyebrow { margin: 0; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .14em; color: var(--t4); }
.v2-mono { font-family: var(--mono); letter-spacing: -.02em; }

.v2-seg { display: inline-flex; padding: 2px; gap: 2px; border: 1px solid var(--b1); border-radius: 8px; background: rgba(255,255,255,.015); }
.v2-seg button {
  border: none; background: transparent; color: var(--t3); font-size: 12px;
  padding: 5px 11px; border-radius: 6px; cursor: pointer; transition: background .14s, color .14s;
}
.v2-seg button:hover { color: var(--t1); }
.v2-seg button.is-on { background: rgba(255,255,255,.08); color: var(--t1); font-weight: 550; }

.v2-pill {
  display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500;
  border-radius: 6px; padding: 3px 8px; border: 1px solid var(--b1); color: var(--t2);
  background: rgba(255,255,255,.02); white-space: nowrap;
}
.v2-pill i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; display: block; }
.v2-pill.is-profit { color: var(--profit); border-color: var(--profit-border); background: var(--profit-dim); }
.v2-pill.is-loss { color: var(--loss); border-color: var(--loss-border); background: var(--loss-dim); }
.v2-tag { font-family: var(--mono); font-size: 10.5px; color: var(--t3); border: 1px solid var(--b1); border-radius: 5px; padding: 2px 6px; }

/* ════════ HERO ════════ */
.v2-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 20px 22px 4px; flex-wrap: wrap; }
.v2-hero-top > div:first-child { flex: 1 1 240px; min-width: 0; }
.v2-hero-value { margin: 8px 0 0; font-size: 46px; font-weight: 700; line-height: 1; color: var(--t1); font-family: var(--mono); letter-spacing: -.045em; }
.v2-hero-sub { margin: 10px 0 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 12px; color: var(--t3); }
.v2-hero-chart { padding: 6px 18px 14px; }

.v2-title { margin: 0; font-family: var(--font-display); font-size: 30px; font-weight: 400; letter-spacing: -.02em; color: var(--t1); }
.v2-subtitle { margin: 5px 0 0; font-size: 13.5px; color: var(--t3); }

/* ════════ FAIXA DE KPIs (celulas divididas, sem gap) ════════ */
.v2-kpis { display: grid; grid-template-columns: repeat(5, 1fr); }
.v2-kpi { padding: 16px 18px; border-left: 1px solid var(--b1); transition: background .16s; }
.v2-kpi:first-child { border-left: none; }
.v2-kpi:hover { background: rgba(255,255,255,.015); }
.v2-kpi-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.v2-kpi-v { margin: 10px 0 0; font-size: 22px; font-weight: 700; font-family: var(--mono); letter-spacing: -.03em; color: var(--t1); }
.v2-kpi-h { margin: 5px 0 0; font-size: 11px; color: var(--t4); }

/* ════════ LISTAS ════════ */
.v2-row {
  display: flex; align-items: center; gap: 12px; padding: 13px 18px;
  border-top: 1px solid var(--b1); transition: background .14s; cursor: pointer;
}
.v2-row:hover { background: rgba(255,255,255,.02); }
.v2-row-t { margin: 0; font-size: 13px; font-weight: 550; color: var(--t1); letter-spacing: -.01em; }
.v2-row-s { margin: 3px 0 0; font-size: 11.5px; color: var(--t4); }
.v2-rank {
  width: 22px; height: 22px; flex-shrink: 0; border-radius: 6px; display: flex;
  align-items: center; justify-content: center; font-family: var(--mono);
  font-size: 10.5px; font-weight: 700; color: var(--t3); border: 1px solid var(--b1);
}
.v2-rank.is-first { color: var(--t1); background: rgba(255,255,255,.06); border-color: var(--b2); }

/* ════════ TABELA ════════ */
.v2-table-wrap { overflow-x: auto; }
.v2-table { width: 100%; border-collapse: collapse; min-width: 780px; }
.v2-table th {
  text-align: left; font-size: 9.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .12em; color: var(--t4); padding: 10px 18px; border-bottom: 1px solid var(--b1); white-space: nowrap;
}
.v2-table td { padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,.05); font-size: 12.5px; color: var(--t2); white-space: nowrap; }
.v2-table tbody tr:last-child td { border-bottom: none; }
.v2-table tbody tr { transition: background .14s; }
.v2-table tbody tr:hover { background: rgba(255,255,255,.02); }
.v2-table .num { font-family: var(--mono); letter-spacing: -.02em; text-align: right; }
.v2-table .strong { color: var(--t1); font-weight: 550; }

/* ════════ GRIDS ════════ */
.v2-grid-2 { display: grid; grid-template-columns: 1.35fr 1fr; gap: 14px; align-items: start; }
.v2-grid-2e { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
.v2-stack { display: flex; flex-direction: column; gap: 14px; }

/* ════════ FOOTER ════════ */
.v2-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  border-top: 1px solid var(--b1); margin-top: 30px; padding-top: 18px;
  font-size: 11.5px; color: var(--t4);
}
.v2-foot nav { display: flex; gap: 16px; flex-wrap: wrap; }
.v2-foot nav button { background: none; border: none; color: var(--t4); font-size: 11.5px; cursor: pointer; padding: 0; transition: color .14s; }
.v2-foot nav button:hover { color: var(--t2); }

/* ════════ OVERLAYS ════════ */
.v2-scrim { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.72); }
.v2-scrim-top { display: flex; align-items: flex-start; justify-content: center; padding: 12vh 16px 0; z-index: 80; }
.v2-palette {
  width: 100%; max-width: 520px; background: #050505; border: 1px solid var(--b2);
  border-radius: 12px; overflow: hidden; box-shadow: 0 24px 70px rgba(0,0,0,.8);
}
.v2-palette-input { display: flex; align-items: center; gap: 10px; padding: 13px 14px; border-bottom: 1px solid var(--b1); }
.v2-palette-input input {
  flex: 1; background: transparent; border: none; outline: none; color: var(--t1);
  font-size: 13.5px; font-family: inherit;
}
.v2-palette-input input::placeholder { color: var(--t4); }
.v2-palette-list { max-height: 320px; overflow-y: auto; padding: 6px; }
.v2-palette-item {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px;
  border: none; border-radius: 7px; background: transparent; color: var(--t2);
  font-size: 13px; cursor: pointer; text-align: left; transition: background .12s, color .12s;
}
.v2-palette-item:hover { background: rgba(255,255,255,.05); color: var(--t1); }
.v2-palette-item span { flex: 1; }
.v2-palette-item em { font-style: normal; font-size: 10.5px; color: var(--t4); }
.v2-palette-empty { margin: 0; padding: 22px; text-align: center; font-size: 12.5px; color: var(--t4); }

.v2-only-mobile { display: none; }

/* ════════ RESPONSIVO ════════ */
@media (max-width: 1180px) {
  .v2-kpis { grid-template-columns: repeat(3, 1fr); }
  .v2-kpi:nth-child(4) { border-left: none; }
  .v2-kpi:nth-child(n+4) { border-top: 1px solid var(--b1); }
}
@media (max-width: 980px) {
  .v2-side { transform: translateX(-100%); }
  .v2-side.is-open { transform: translateX(0); box-shadow: 12px 0 48px rgba(0,0,0,.7); }
  .v2-main { margin-left: 0; }
  .v2-only-mobile { display: inline-flex; }
  .v2-only-desk { display: none; }
  .v2-grid-2, .v2-grid-2e { grid-template-columns: 1fr; }
}
@media (max-width: 680px) {
  .v2-content { padding: 20px 14px 60px; }
  .v2-top { padding: 0 14px; gap: 8px; }
  .v2-crumb > span:first-child, .v2-crumb-sep { display: none; }
  .v2-live { display: none; }
  .v2-hero-top { gap: 14px; }
  .v2-hero-sub { font-size: 11.5px; gap: 8px; }
  .v2-panel-h { padding: 13px 14px; }
  .v2-row { padding: 12px 14px; }
  .v2-kpi { padding: 14px; }
  .v2-kpis { grid-template-columns: repeat(2, 1fr); }
  .v2-kpi:nth-child(odd) { border-left: none; }
  .v2-kpi:nth-child(n+3) { border-top: 1px solid var(--b1); }
  .v2-hero-value { font-size: 34px; }
  .v2-title { font-size: 24px; }
}
`
export default CSS
