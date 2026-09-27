/* A INTERFACE DO NEX CONTROL recriada em componentes (não é print): o painel
   do administrador (bento escuro do tema padrão desde 25/09) e o app do
   operador. Todos os valores são ILUSTRATIVOS e redondos, e os nomes são
   genéricos: nada aqui é resultado de cliente. */
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONTE, MONO } from "../brand";
import { Contador, Ico, clamp, ease, easeInOut, expo, lin, mola, Faiscas, pulso } from "./base";
import { MarcaPlana } from "./Logo";

/* ------------------------------------------------------------ APARELHOS */
export const FW = 430, FH = 880;
export const Celular: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; tremor?: number }> = ({ children, style, tremor = 0 }) => {
  const frame = useCurrentFrame();
  const dx = tremor ? Math.sin(frame * 2.7) * 7 * tremor : 0;
  return (
    <div style={{ width: FW, height: FH, transform: `translateX(${dx}px) rotate(${dx * 0.12}deg)`, ...style }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 66, background: "linear-gradient(145deg,#2a2d30,#0b0c0d)", padding: 12, boxSizing: "border-box", boxShadow: `0 60px 120px rgba(0,0,0,0.7), 0 0 0 2px #4a4e51 inset, 0 0 0 1px ${C.lime}30, 0 0 120px ${C.lime}1c` }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 55, background: "#0b0c0d", overflow: "hidden", position: "relative", fontFamily: FONTE, color: C.tinta }}>
          <div style={{ position: "absolute", left: "50%", top: 13, transform: "translateX(-50%)", width: 116, height: 34, borderRadius: 18, background: "#000", zIndex: 20 }} />
          <div style={{ position: "absolute", top: 18, left: 34, right: 34, display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 600, zIndex: 19 }}>
            <span>14:32</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <svg width="20" height="12" viewBox="0 0 20 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#fff" /><rect x="5" y="5" width="3" height="7" rx="1" fill="#fff" /><rect x="10" y="2" width="3" height="10" rx="1" fill="#fff" /><rect x="15" y="0" width="3" height="12" rx="1" fill="#fff" /></svg>
              <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="#fff" opacity="0.5" /><rect x="2" y="2" width="16" height="8" rx="2" fill="#fff" /></svg>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export const NW = 1500, NH = 940;
export const Notebook: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ width: NW + 60, ...style }}>
    <div style={{ width: NW + 60, height: NH + 60, borderRadius: 34, background: "linear-gradient(160deg,#26292b,#0c0d0e)", padding: 30, boxSizing: "border-box", boxShadow: `0 80px 160px rgba(0,0,0,0.7), 0 0 0 2px #303335 inset` }}>
      <div style={{ width: NW, height: NH, borderRadius: 12, overflow: "hidden", position: "relative", background: C.bg, fontFamily: FONTE, color: C.tinta }}>{children}</div>
    </div>
    <div style={{ width: NW + 260, marginLeft: -100, height: 38, borderRadius: "0 0 40px 40px", background: "linear-gradient(180deg,#2c2f31,#141516)", boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}>
      <div style={{ width: 260, height: 12, margin: "0 auto", borderRadius: "0 0 12px 12px", background: "#0c0d0e" }} />
    </div>
  </div>
);

/* ------------------------------------------------------------ PEÇAS */
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ position: "relative", overflow: "hidden", background: C.graf2, border: `1px solid ${C.linha2}`, borderRadius: 28, padding: 28, boxSizing: "border-box", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)", ...style }}>{children}</div>
);
const Rot: React.FC<{ t: string; style?: React.CSSProperties }> = ({ t, style }) => (
  <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: C.cinza, ...style }}>{t}</div>
);
const Blob: React.FC<{ c1: string; c2: string }> = ({ c1, c2 }) => (
  <svg viewBox="0 0 200 140" preserveAspectRatio="none" style={{ position: "absolute", top: 0, right: 0, width: "56%", height: "100%" }}>
    <path d="M40,0 C90,18 70,58 110,78 C150,98 180,80 200,64 L200,0 Z" fill={c2} opacity="0.9" />
    <path d="M78,0 C118,22 100,54 142,72 C172,85 190,78 200,70 L200,0 Z" fill={c1} opacity="0.5" />
  </svg>
);
const Chip: React.FC<{ bg: string; children: React.ReactNode; s?: number }> = ({ bg, children, s = 56 }) => (
  <div style={{ width: s, height: s, borderRadius: s * 0.3, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
);
export const Avatar: React.FC<{ ini: string; s?: number; cor?: string; fg?: string }> = ({ ini, s = 44, cor = C.graf3, fg = C.tinta }) => (
  <div style={{ width: s, height: s, borderRadius: "50%", background: cor, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontWeight: 700, fontSize: s * 0.38, flexShrink: 0, border: `1px solid ${C.linha2}` }}>{ini}</div>
);
const Rail: React.FC<{ ativo: number }> = ({ ativo }) => (
  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 96, background: C.fundo2, borderRadius: "0 30px 30px 0", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 26, gap: 14 }}>
    <MarcaPlana tam={46} uid="rail" />
    <div style={{ height: 12 }} />
    {["painel", "usuarios", "grafico", "caixa", "trofeu", "chat"].map((n, i) => (
      <div key={n} style={{ width: 60, height: 60, borderRadius: 18, border: `1px solid ${C.linha}`, display: "flex", alignItems: "center", justifyContent: "center", background: i === ativo ? C.tinta : "transparent" }}>
        <Ico n={n} s={26} c={i === ativo ? C.bg : "rgba(255,255,255,0.6)"} />
      </div>
    ))}
  </div>
);

/* ============================================================ NOTEBOOK: PAINEL
   T: instantes (frames locais do palco) dos eventos que o painel mostra. */
export type TempoPainel = { chega: number; perda: number; fim: number };
export const TelaPainel: React.FC<{ T: TempoPainel }> = ({ T }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chegou = frame >= T.chega, perdeu = frame >= T.perda;
  const flashLucro = pulso(frame, T.chega, T.chega + 22);
  const flashPerda = pulso(frame, T.perda, T.perda + 22);
  /* gráfico: pontos do dia (ilustrativos), dois novos entram ao vivo */
  const base = [30, 42, 38, 55, 52, 64, 60];
  const k1 = ease(lin(frame, T.chega, T.chega + 14)), k2 = ease(lin(frame, T.perda, T.perda + 14));
  const pts = [...base, 60 + 22 * k1, 82 - 36 * k2];
  const vis = 7 + (chegou ? k1 : 0) + (perdeu ? k2 : 0);
  const X = (i: number) => 20 + i * (620 / 8), Y = (v: number) => 250 - v * 2.6;
  let d = "";
  const n = Math.floor(vis), fr = vis - n;
  for (let i = 0; i < Math.min(n + 1, pts.length); i++) {
    let x = X(i), y = Y(pts[i]);
    if (i === n && fr > 0 && i > 0) { x = X(i - 1) + (X(i) - X(i - 1)) * fr; y = Y(pts[i - 1]) + (Y(pts[i]) - Y(pts[i - 1])) * fr; }
    else if (i === n && fr === 0 && i > 0) break;
    d += (i === 0 ? "M" : " L") + x.toFixed(1) + " " + y.toFixed(1);
  }
  const linhas = [
    { t: "Lucas · W1", v: 70, em: T.chega },
    { t: "Bia · VOY", v: -35, em: T.perda },
  ];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Rail ativo={0} />
      <div style={{ position: "absolute", left: 132, right: 40, top: 34 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: -1.6 }}>Olá, Rafa</div>
            <div style={{ fontSize: 22, color: C.cinza, marginTop: 4 }}>3 metas em andamento · 3 operadores</div>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 4, padding: 6, borderRadius: 30, border: `1px solid ${C.linha}`, fontSize: 19, fontWeight: 700 }}>
              {["Mês", "Hoje", "7d", "30d"].map((p, i) => <span key={p} style={{ padding: "9px 18px", borderRadius: 30, background: i === 1 ? C.tinta : "transparent", color: i === 1 ? C.bg : C.cinza }}>{p}</span>)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 28px", borderRadius: 32, background: C.lime, color: C.bg, fontSize: 21, fontWeight: 800 }}><Ico n="mais" s={22} c={C.bg} w={2.6} />Nova meta</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 20, marginTop: 30 }}>
          <Card style={{ height: 250, boxShadow: flashLucro > 0 ? `0 0 0 ${3 * flashLucro}px ${C.lime}, 0 0 ${60 * flashLucro}px ${C.lime}55` : undefined }}>
            <Blob c1={C.limeEsc} c2={C.lime} />
            <Chip bg="rgba(200,242,29,0.12)"><Ico n="moeda" s={28} c={C.lime} /></Chip>
            <div style={{ marginTop: 30 }}>
              {perdeu ? <Contador de={1990} ate={1955} inicio={T.perda + 2} dur={22} tamanho={70} /> : chegou ? <Contador de={1920} ate={1990} inicio={T.chega + 2} dur={24} tamanho={70} /> : <Contador de={1920} ate={1920} inicio={0} dur={1} tamanho={70} />}
            </div>
            <div style={{ fontSize: 21, color: C.cinza, marginTop: 4 }}>lucro · mês</div>
          </Card>
          <Card style={{ height: 250 }}>
            <Blob c1={C.laranja2} c2={C.laranja} />
            <Chip bg={C.laranja}><Ico n="alvo" s={28} c={C.bg} /></Chip>
            <div style={{ marginTop: 30, fontFamily: MONO, fontSize: 56, fontWeight: 700, letterSpacing: -1.5 }}>{chegou ? "1.210" : "1.200"}</div>
            <div style={{ fontSize: 21, color: C.cinza, marginTop: 4 }}>depositantes</div>
          </Card>
          <Card style={{ height: 250 }}>
            <Chip bg={C.graf3}><Ico n="relogio" s={28} c={C.t2} /></Chip>
            <div style={{ marginTop: 30 }}>
              {perdeu ? <Contador de={70} ate={35} inicio={T.perda + 2} dur={20} tamanho={56} cor={C.lime} /> : chegou ? <Contador de={0} ate={70} inicio={T.chega + 2} dur={20} tamanho={56} cor={C.lime} /> : <Contador de={0} ate={0} inicio={0} dur={1} tamanho={56} cor={C.lime} />}
            </div>
            <div style={{ fontSize: 21, color: C.cinza, marginTop: 4 }}>hoje, desde as 5h</div>
          </Card>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 20, marginTop: 20 }}>
          <Card style={{ height: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6 }}>Resultado de hoje</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 800, letterSpacing: 2, color: C.lime }}><span style={{ width: 10, height: 10, borderRadius: 5, background: C.lime, opacity: 0.5 + 0.5 * Math.sin(frame / 4) }} />AO VIVO</div>
            </div>
            <svg width="660" height="290" viewBox="0 0 660 290" style={{ marginTop: 20 }}>
              {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2="660" y1={40 + i * 70} y2={40 + i * 70} stroke="rgba(255,255,255,0.06)" />)}
              <path d={d} fill="none" stroke={C.lime} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              {perdeu ? <circle cx={X(8)} cy={Y(pts[8])} r={9 + 6 * flashPerda} fill={C.perda} /> : chegou ? <circle cx={X(7)} cy={Y(pts[7])} r={9 + 6 * flashLucro} fill={C.lime} /> : null}
            </svg>
          </Card>
          <Card style={{ height: 420 }}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6 }}>Remessas agora</div>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              {linhas.map((l, i) => {
                if (frame < l.em) return null;
                const k = mola(frame, fps, l.em, { damping: 13 });
                const pos = l.v >= 0;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderRadius: 20, background: pos ? "rgba(255,255,255,0.04)" : "rgba(255,90,82,0.10)", border: `1px solid ${pos ? C.linha : "rgba(255,90,82,0.35)"}`, transform: `translateX(${(1 - k) * 80}px)`, opacity: k }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}><Avatar ini={l.t[0]} s={46} /><div style={{ fontSize: 22, fontWeight: 600 }}>{l.t}</div></div>
                    <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, color: pos ? C.lime : C.perda }}>{pos ? "+" : "−"}R$ {Math.abs(l.v)}</div>
                  </div>
                );
              })}
              {[0, 1].map((i) => <div key={"v" + i} style={{ height: 66, borderRadius: 20, border: `1px dashed ${C.linha}`, opacity: 0.6 }} />)}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ============================================================ NOTEBOOK: FECHAMENTO
   lucro_final = resultado das remessas + salário + baú − custos (fórmula real). */
export type TempoFecha = { abre: number; salario: number; bau: number; custos: number; final: number; carimbo: number };
export const ModalFechamento: React.FC<{ T: TempoFecha }> = ({ T }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.abre) return null;
  const k = mola(frame, fps, T.abre, { damping: 15, stiffness: 150 });
  const linhas = [
    { l: "Resultado das remessas", v: 231, em: T.abre + 6, ic: "grafico" },
    { l: "Salário", v: 400, em: T.salario, ic: "moeda" },
    { l: "Baú", v: 200, em: T.bau, ic: "caixa" },
    { l: "Custos", v: -120, em: T.custos, ic: "tabela" },
  ];
  const kC = mola(frame, fps, T.carimbo, { damping: 9, stiffness: 240 });
  return (
    <div style={{ position: "absolute", inset: 0, background: `rgba(5,6,6,${0.72 * k})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 860, background: C.graf2, border: `1px solid ${C.linha2}`, borderRadius: 36, padding: "40px 46px", boxSizing: "border-box", transform: `translateY(${(1 - k) * 90}px) scale(${0.94 + 0.06 * k})`, opacity: k, boxShadow: "0 50px 120px rgba(0,0,0,0.6)", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Chip bg={C.lime} s={62}><Ico n="bandeira" s={30} c={C.bg} w={2.4} /></Chip>
          <div>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.2 }}>Fechar meta</div>
            <div style={{ fontSize: 21, color: C.cinza, marginTop: 2 }}>W1 · 50 depositantes · Lucas</div>
          </div>
        </div>
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 12 }}>
          {linhas.map((l, i) => {
            const on = frame >= l.em;
            const kk = on ? mola(frame, fps, l.em, { damping: 11, stiffness: 210 }) : 0;
            const pos = l.v >= 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderRadius: 20, background: on ? "rgba(255,255,255,0.045)" : "transparent", border: `1px ${on ? "solid" : "dashed"} ${C.linha}`, height: 76, boxSizing: "border-box" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: on ? 1 : 0.35 }}>
                  <Ico n={l.ic} s={28} c={on ? (pos ? C.lime : C.perda) : C.t4} />
                  <span style={{ fontSize: 26, fontWeight: 600 }}>{l.l}</span>
                </div>
                {on ? <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 700, color: pos ? C.tinta : C.perda, display: "inline-block", transform: `translateY(${(1 - kk) * -40}px) scale(${0.6 + 0.4 * kk})`, opacity: clamp(kk * 1.5) }}>{pos ? "+" : "−"}R$ {Math.abs(l.v)}</span> : <span style={{ width: 120, height: 14, borderRadius: 7, background: C.linha }} />}
              </div>
            );
          })}
        </div>
        <div style={{ height: 2, background: C.linha2, margin: "26px 0 22px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 30, fontWeight: 700 }}>Lucro final</span>
          <span style={{ position: "relative" }}>
            {frame >= T.final ? <Contador de={0} ate={711} inicio={T.final} dur={24} tamanho={66} cor={C.lime} peso={800} /> : <span style={{ fontFamily: MONO, fontSize: 66, fontWeight: 800, color: C.t4 }}>R$ —</span>}
          </span>
        </div>
        {frame >= T.carimbo ? (
          <div style={{ position: "absolute", right: 40, top: 34, border: `4px solid ${C.lime}`, color: C.lime, fontWeight: 900, fontSize: 30, letterSpacing: 5, padding: "8px 18px", borderRadius: 12, transform: `rotate(${-8 + 2 * kC}deg) scale(${2.2 - 1.2 * kC})`, opacity: clamp(kC * 2) }}>FECHADA</div>
        ) : null}
        <Faiscas x={640} y={560} inicio={T.final + 20} n={11} raio={170} seed={7} />
      </div>
    </div>
  );
};

/* ============================================================ NOTEBOOK: OPERADORES */
export type TempoOps = { entra: number; acesso: number; ranking: number };
export const TelaOperadores: React.FC<{ T: TempoOps }> = ({ T }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ops = [
    { n: "Lucas", e: "lucas@operacao", ini: "L", v: 1870, metas: 12 },
    { n: "Téo", e: "teo@operacao", ini: "T", v: 960, metas: 7 },
    { n: "Bia", e: "bia@operacao", ini: "B", v: 2140, metas: 14 },
  ];
  const ordem = [...ops].sort((a, b) => b.v - a.v).map((o) => o.n);
  const kR = easeInOut(lin(frame, T.ranking, T.ranking + 18));
  const H = 168;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Rail ativo={1} />
      <div style={{ position: "absolute", left: 132, right: 40, top: 34 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: -1.6 }}>Operadores</div>
            <div style={{ fontSize: 22, color: C.cinza, marginTop: 4 }}>{kR > 0.5 ? "Ranking da equipe · por lucro final" : "3 na equipe · cada um com o próprio login"}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 28px", borderRadius: 32, background: C.lime, color: C.bg, fontSize: 21, fontWeight: 800 }}><Ico n="usuarios" s={22} c={C.bg} />Convidar</div>
        </div>
        <div style={{ position: "relative", marginTop: 40, height: H * 3 + 40 }}>
          {ops.map((o, i) => {
            const k = mola(frame, fps, T.entra + i * 4, { damping: 14 });
            const rank = ordem.indexOf(o.n);
            const y = (i + (rank - i) * kR) * (H + 14);
            const primeiro = rank === 0 && kR > 0.6;
            const kA = mola(frame, fps, T.acesso + i * 4, { damping: 11, stiffness: 220 });
            return (
              <div key={o.n} style={{ position: "absolute", left: 0, right: 0, top: y, height: H, display: "flex", alignItems: "center", gap: 26, padding: "0 34px", borderRadius: 30, background: C.graf, border: `${primeiro ? 2 : 1}px solid ${primeiro ? C.lime : C.linha}`, boxShadow: primeiro ? `0 0 60px ${C.lime}22` : undefined, transform: `translateX(${(1 - k) * 120}px)`, opacity: k, boxSizing: "border-box" }}>
                <div style={{ width: 70, fontFamily: MONO, fontSize: 38, fontWeight: 800, color: primeiro ? C.lime : C.t4, opacity: kR }}>{rank + 1}º</div>
                <Avatar ini={o.ini} s={84} cor={primeiro ? C.lime : C.graf3} fg={primeiro ? C.bg : C.tinta} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.8 }}>{o.n}</div>
                  <div style={{ fontSize: 21, color: C.cinza, fontFamily: MONO, marginTop: 4 }}>{o.e}</div>
                </div>
                {frame >= T.acesso ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderRadius: 30, border: `1px solid ${C.linha2}`, fontSize: 19, fontWeight: 700, color: C.t2, transform: `scale(${kA})` }}><Ico n="cadeado" s={20} c={C.lime} />acesso próprio</div>
                ) : null}
                <div style={{ width: 230, textAlign: "right" }}>
                  <div style={{ fontFamily: MONO, fontSize: 38, fontWeight: 800, color: C.lime }}>R$ {o.v.toLocaleString("pt-BR")}</div>
                  <div style={{ fontSize: 19, color: C.cinza }}>{o.metas} metas fechadas</div>
                </div>
                {primeiro ? <div style={{ position: "absolute", right: -18, top: -22, width: 58, height: 58, borderRadius: 18, background: C.lime, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${mola(frame, fps, T.ranking + 12, { damping: 9, stiffness: 240 })})` }}><Ico n="trofeu" s={30} c={C.bg} w={2.4} /></div> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================================================ CELULAR: METAS */
export type TempoMeta = { meta: number; dono: number };
export const AppMetas: React.FC<{ T: TempoMeta }> = ({ T }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kM = mola(frame, fps, T.meta, { damping: 13 });
  const kD = mola(frame, fps, T.dono, { damping: 9, stiffness: 230 });
  return (
    <div style={{ position: "absolute", inset: 0, padding: "74px 26px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>Minhas metas</div>
        <MarcaPlana tam={34} uid="app1" />
      </div>
      <div style={{ fontSize: 16, color: C.cinza, marginTop: 4 }}>atribuídas a você pelo admin</div>
      {frame >= T.meta ? (
        <div style={{ marginTop: 26, background: C.graf2, border: `1px solid ${frame >= T.dono ? C.lime : C.linha}`, borderRadius: 28, padding: 22, transform: `translateY(${(1 - kM) * 120}px) scale(${0.9 + 0.1 * kM})`, opacity: kM, boxShadow: frame >= T.dono ? `0 0 50px ${C.lime}22` : undefined, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 15, color: C.bg, background: C.tinta, borderRadius: 8, padding: "5px 10px" }}>W1</span>
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2, color: C.laranja }}>ATIVA</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.8, marginTop: 14 }}>50 depositantes</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 16, color: C.cinza, marginTop: 14 }}><span>20 / 50 contas</span><span>40%</span></div>
          <div style={{ height: 10, borderRadius: 5, background: C.graf3, marginTop: 8, overflow: "hidden" }}><div style={{ width: `${40 * ease(lin(frame, T.meta + 6, T.meta + 26))}%`, height: "100%", background: C.lime, borderRadius: 5 }} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, paddingTop: 18, borderTop: `1px solid ${C.linha}` }}>
            <div style={{ transform: `scale(${frame >= T.dono ? kD : 0})` }}><Avatar ini="L" s={50} cor={C.lime} fg={C.bg} /></div>
            <div style={{ opacity: frame >= T.dono ? 1 : 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: C.cinza }}>OPERADOR</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Lucas</div>
            </div>
          </div>
        </div>
      ) : null}
      {[0, 1].map((i) => true ? (
        <div key={i} style={{ marginTop: 16, height: 120, borderRadius: 26, background: C.graf, border: `1px solid ${C.linha}`, opacity: 0.55, padding: 20, boxSizing: "border-box" }}>
          <div style={{ width: 70, height: 22, borderRadius: 6, background: C.graf3 }} />
          <div style={{ width: 200, height: 20, borderRadius: 6, background: C.graf3, marginTop: 14 }} />
        </div>
      ) : null)}
    </div>
  );
};

/* ============================================================ CELULAR: NOVA REMESSA */
export type TempoRemessa = { abre: number; digita: number; salva: number };
export const AppRemessa: React.FC<{ T: TempoRemessa }> = ({ T }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kA = mola(frame, fps, T.abre, { damping: 15 });
  const passo = Math.max(0.6, (T.salva - 3 - T.digita) / 20);
  const dep = T.digita + 2 * passo, saq = T.digita + 11 * passo;
  const campo = (rot: string, valor: string, ini: number) => {
    const n = clamp(Math.floor((frame - ini) / passo), 0, valor.length);
    const ativo = frame >= ini && n < valor.length;
    return (
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: C.cinza }}>{rot}</div>
        <div style={{ marginTop: 8, height: 62, borderRadius: 18, border: `1.5px solid ${ativo ? C.lime : C.linha2}`, background: C.fundo2, display: "flex", alignItems: "center", padding: "0 18px", fontFamily: MONO, fontSize: 24, fontWeight: 600, boxShadow: ativo ? `0 0 0 4px ${C.lime}22` : undefined }}>
          {valor.slice(0, n)}{ativo && Math.floor(frame / 6) % 2 === 0 ? <span style={{ width: 2, height: 28, background: C.lime, marginLeft: 2 }} /> : null}
        </div>
      </div>
    );
  };
  /* a digitação se ajusta à voz: os 20 caracteres (10 · R$ 350,00 · R$ 420,00)
     terminam 3 frames antes do toque em "Salvar" (tools/sfx.mjs usa a mesma conta) */
  const pronto = frame >= saq + 9 * passo;
  const press = lin(frame, T.salva, T.salva + 3, 1, 0.93) * lin(frame, T.salva + 3, T.salva + 9, 1, 1 / 0.93);
  const salvo = frame >= T.salva + 6;
  const kS = mola(frame, fps, T.salva + 6, { damping: 11, stiffness: 220 });
  return (
    <div style={{ position: "absolute", inset: 0, padding: "74px 26px 0", transform: `translateY(${(1 - kA) * 900}px)`, background: C.bg }}>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>Nova remessa</div>
      <div style={{ fontSize: 16, color: C.cinza, marginTop: 4 }}>W1 · 50 depositantes · Lucas</div>
      {campo("CONTAS", "10", T.digita)}
      {campo("DEPÓSITO", "R$ 350,00", dep)}
      {campo("SAQUE", "R$ 420,00", saq)}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderRadius: 18, background: pronto ? "rgba(200,242,29,0.10)" : C.graf, border: `1px solid ${pronto ? C.lime + "66" : C.linha}` }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: C.t2 }}>Resultado</span>
        <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: pronto ? C.lime : C.t4 }}>{pronto ? "+R$ 70,00" : "R$ —"}</span>
      </div>
      <div style={{ marginTop: 18, height: 70, borderRadius: 35, background: salvo ? C.graf3 : C.lime, color: salvo ? C.lime : C.bg, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 22, fontWeight: 800, transform: `scale(${press})` }}>
        {salvo ? <><span style={{ transform: `scale(${kS})`, display: "inline-flex" }}><Ico n="check" s={26} c={C.lime} w={3} /></span>Remessa salva</> : "Salvar remessa"}
      </div>
    </div>
  );
};

/* ============================================================ CELULAR: TELA BLOQUEADA
   Textos iguais aos do produto (lib/notificacoes.js, voz séria). */
export type TempoBloq = { liga: number; n1: number; n2: number; alerta: number };
export const AppBloqueio: React.FC<{ T: TempoBloq }> = ({ T }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kL = lin(frame, T.liga, T.liga + 10);
  const notif = (titulo: string, corpo: string, em: number, i: number) => {
    if (frame < em) return null;
    const k = mola(frame, fps, em, { damping: 12, stiffness: 190 });
    return (
      <div key={i} style={{ marginTop: 12, borderRadius: 26, background: "rgba(40,43,45,0.92)", border: `1px solid ${C.linha2}`, padding: "16px 18px", transform: `translateY(${(1 - k) * -120}px) scale(${0.9 + 0.1 * k})`, opacity: clamp(k * 1.4), boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.linha2}` }}><MarcaPlana tam={24} uid={"nt" + i} /></div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1.5, color: C.t2, flex: 1 }}>NEX CONTROL</span>
          <span style={{ fontSize: 14, color: C.cinza }}>agora</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: 5, background: C.laranja }} />
          <span style={{ fontSize: 20, fontWeight: 700 }}>{titulo}</span>
        </div>
        <div style={{ fontSize: 17, color: C.t2, marginTop: 4, lineHeight: 1.35 }}>{corpo}</div>
      </div>
    );
  };
  const kA = mola(frame, fps, T.alerta, { damping: 10, stiffness: 200 });
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 70% at 50% 0%, #1c1f20 0%, ${C.bg} 60%)`, opacity: kL }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 100, textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: C.t2 }}>sábado, 26 de setembro</div>
        <div style={{ fontSize: 108, fontWeight: 300, letterSpacing: -4, lineHeight: 1.05 }}>14:32</div>
      </div>
      <div style={{ position: "absolute", left: 18, right: 18, top: 290 }}>
        {notif("Meta sem movimentação", "Sem remessa há 2h. Retome quando possível.", T.n1, 1)}
        {notif("Sequência negativa", "3 remessas seguidas no prejuízo · R$ 84 acumulado. Avalie trocar de estratégia.", T.n2, 2)}
      </div>
      {frame >= T.alerta ? (
        <div style={{ position: "absolute", left: "50%", bottom: 90, transform: `translateX(-50%) scale(${kA})`, width: 108, height: 108, borderRadius: 34, background: C.laranja, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 ${50 + 30 * Math.sin(frame / 3)}px ${C.laranja}88` }}>
          <Ico n="sino" s={54} c={C.bg} w={2.4} style={{ transform: `rotate(${Math.sin(frame * 1.3) * 14 * Math.max(0, 1 - (frame - T.alerta) / 30)}deg)` }} />
        </div>
      ) : null}
    </div>
  );
};

export { expo };
