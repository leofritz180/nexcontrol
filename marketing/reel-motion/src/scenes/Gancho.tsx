/* GANCHO (cenas 0 e 1): a operação na planilha e no print de WhatsApp.
   O "jeito antigo" é claro e sem vida (papel), contra o preto do produto.
   No fim, a planilha RACHA em ladrilhos que voam e revelam o palco preto
   por baixo — é a virada para o Nex Control. Frames absolutos (a Sequence
   começa em 0). */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONTE, MONO } from "../brand";
import { Ico, clamp, ease, easeInOut, lin, mola, prng, pulso } from "../components/base";
import type { Linha } from "../script";

const COLS = ["DATA", "REDE", "DEP.", "SAQUE", "LUCRO"];
const LINHAS = Array.from({ length: 22 }, (_, i) => {
  const r = prng(90 + i);
  const dep = Math.round(200 + r() * 800), saq = Math.round(dep + (r() - 0.45) * 300);
  const erro = i === 6 || i === 13 || i === 19;
  return [`${String(1 + (i % 28)).padStart(2, "0")}/09`, ["W1", "VOY", "OKOK", "DY", "WE"][i % 5], String(dep), String(saq), erro ? "#REF!" : String(saq - dep)];
});

const Planilha: React.FC<{ quebra: number }> = ({ quebra }) => {
  /* a planilha é desenhada como uma grade de LADRILHOS (6x10) para poder
     rachar; cada ladrilho mostra o seu recorte da mesma planilha */
  const PW = 1240, PH = 1500, NX = 6, NY = 10;
  const tw = PW / NX, th = PH / NY;
  const conteudo = (
    <div style={{ width: PW, height: PH, background: C.papel, fontFamily: FONTE, color: "#2a2c2d", position: "relative" }}>
      <div style={{ height: 86, display: "flex", alignItems: "center", gap: 18, padding: "0 28px", borderBottom: `2px solid ${C.papelLinha}`, background: C.papel2 }}>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, color: "#6b6e70", fontStyle: "italic" }}>fx</span>
        <span style={{ fontFamily: MONO, fontSize: 30 }}>=SOMA(E2:E48)-F12+'baú (ver zap)'</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "70px repeat(5, 1fr)" }}>
        {["", ...COLS].map((c, i) => <div key={"h" + i} style={{ height: 62, borderRight: `1px solid ${C.papelLinha}`, borderBottom: `2px solid ${C.papelLinha}`, background: C.papel2, fontWeight: 700, fontSize: 24, letterSpacing: 2, display: "flex", alignItems: "center", padding: "0 14px", color: "#55585a" }}>{c}</div>)}
        {LINHAS.map((l, i) => (
          <React.Fragment key={i}>
            <div style={{ height: 60, borderRight: `1px solid ${C.papelLinha}`, borderBottom: `1px solid ${C.papelLinha}`, background: C.papel2, fontSize: 20, color: "#8a8d8f", display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 2}</div>
            {l.map((v, j) => <div key={j} style={{ height: 60, borderRight: `1px solid ${C.papelLinha}`, borderBottom: `1px solid ${C.papelLinha}`, fontFamily: MONO, fontSize: 26, display: "flex", alignItems: "center", padding: "0 14px", color: v === "#REF!" ? C.perda : Number(v) < 0 ? C.perda : "#2a2c2d", fontWeight: v === "#REF!" ? 800 : 500, background: v === "#REF!" ? "rgba(255,90,82,0.12)" : undefined }}>{v}</div>)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
  const r = prng(5);
  return (
    <div style={{ position: "absolute", left: (1080 - PW) / 2, top: 700, width: PW, height: PH }}>
      {Array.from({ length: NX * NY }, (_, idx) => {
        const cx = idx % NX, cy = Math.floor(idx / NX);
        const a = r(), b = r(), c = r(), d = r();
        const q = clamp((quebra - d * 0.25) / 0.75);
        const e = easeInOut(q);
        const dx = ((cx - NX / 2 + 0.5) * 140 + (a - 0.5) * 300) * e;
        const dy = ((cy - NY / 2 + 0.5) * 120 + (b - 0.5) * 300 - 200 * c) * e;
        return (
          <div key={idx} style={{ position: "absolute", left: cx * tw, top: cy * th, width: tw + 0.6, height: th + 0.6, overflow: "hidden", transform: `translate3d(${dx}px, ${dy}px, ${e * 600 * c}px) rotate(${(a - 0.5) * 140 * e}deg)`, opacity: 1 - clamp((q - 0.55) / 0.45), boxShadow: q > 0 ? "0 10px 30px rgba(0,0,0,0.4)" : undefined }}>
            <div style={{ position: "absolute", left: -cx * tw, top: -cy * th }}>{conteudo}</div>
          </div>
        );
      })}
    </div>
  );
};

/* print de conversa: bolhas neutras (sem o verde do app), com a hora */
const Print: React.FC<{ i: number; em: number; bolhaEm: number }> = ({ i, em, bolhaEm }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < em) return null;
  const k = mola(frame, fps, em, { damping: 12, stiffness: 170 });
  const pos = [{ x: 30, y: 860, r: -9 }, { x: 540, y: 800, r: 7 }, { x: 270, y: 1120, r: -3 }][i];
  const msgs = [["mano quanto deu a W1?", "pera q vou ver o print", "acho q 380"], ["baú caiu?", "caiu 200 eu acho", "anota ai"], ["manda o saque de ontem", "qual conta?", "a do Lucas"]][i];
  return (
    <div style={{ position: "absolute", left: pos.x, top: pos.y, width: 500, borderRadius: 36, background: "#e9eae6", border: "8px solid #1a1c1d", padding: "54px 18px 22px", transform: `translateY(${(1 - k) * 500}px) rotate(${pos.r * k + (1 - k) * 30}deg) scale(${0.8 + 0.2 * k})`, boxShadow: "0 40px 80px rgba(0,0,0,0.55)", fontFamily: FONTE }}>
      <div style={{ position: "absolute", top: 16, left: 20, right: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 13, background: "#bfc1bd" }} />
        <span style={{ fontSize: 17, fontWeight: 700, color: "#333" }}>Operação</span>
      </div>
      {msgs.map((m, j) => {
        const on = frame >= bolhaEm + j * 3;
        const kk = on ? mola(frame, fps, bolhaEm + j * 3, { damping: 12, stiffness: 240 }) : 0;
        const meu = j % 2 === 1;
        return (
          <div key={j} style={{ display: "flex", justifyContent: meu ? "flex-end" : "flex-start", marginTop: 10 }}>
            <div style={{ maxWidth: 360, padding: "12px 16px", borderRadius: 16, background: meu ? "#cfd1cc" : "#fff", fontSize: 27, fontWeight: 500, color: "#222", transform: `scale(${kk})`, transformOrigin: meu ? "right" : "left" }}>{m}<span style={{ fontSize: 13, color: "#888", marginLeft: 8 }}>23:4{j}</span></div>
          </div>
        );
      })}
    </div>
  );
};

export const Gancho: React.FC<{ L: Linha }> = ({ L }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tPlan = L.abs(0, "planilha"), tPrint = L.abs(0, "print"), tZap = L.abs(0, "WhatsApp");
  const s1 = L.cenas[1].from, tLucro = L.abs(1, "lucro"), tChute = L.abs(1, "chute");
  const fim = L.cenas[2].from;
  const quebra = lin(frame, fim, fim + 16);
  const kPlan = mola(frame, fps, 0, { damping: 16, stiffness: 110 });
  const soco = pulso(frame, tPlan - 1, tPlan + 8);
  /* flash de câmera no "print" */
  const flash = 0.55 * pulso(frame, tPrint, tPrint + 5);
  /* cena 1: tudo escurece, a câmera treme e a célula do lucro vem ao centro */
  const esc = ease(lin(frame, s1, s1 + 10)) * (1 - quebra);
  const tremor = frame >= tChute ? Math.sin(frame * 3.1) * 10 * lin(frame, tChute, tChute + 16, 1, 0) : 0;
  const kCel = mola(frame, fps, tLucro - 3, { damping: 12, stiffness: 150 });
  const girando = frame >= tLucro && frame < tChute;
  const rr = prng(frame);
  const digitos = girando ? `R$ ${Math.floor(rr() * 9)}.${Math.floor(100 + rr() * 899)}` : frame >= tChute ? "R$ ???" : "R$ 0.000";
  /* antes da planilha (0..tPlan) o fundo já tem a grade chegando de longe */
  const zoomPlan = 1.18 - 0.18 * kPlan + 0.05 * soco;
  return (
    <AbsoluteFill style={{ background: quebra > 0 ? "transparent" : C.bg, overflow: "hidden", transform: `translateX(${tremor}px)` }}>
      <AbsoluteFill style={{ opacity: 1 - lin(frame, fim - 2, fim + 6) * 0 }}>
        <div style={{ position: "absolute", inset: 0, transform: `perspective(2000px) rotateX(${10 - 5 * kPlan}deg) rotateZ(${-3 + 1.5 * kPlan}deg) scale(${zoomPlan})`, transformOrigin: "50% 60%" }}>
          <Planilha quebra={quebra} />
        </div>
        <div style={{ opacity: 1 - ease(lin(frame, s1, s1 + 8)) }}>
          {[0, 1, 2].map((i) => <Print key={i} i={i} em={tPrint + i * 3} bolhaEm={tZap + i * 2} />)}
        </div>
        {/* selo do app de mensagens: contador subindo */}
        {frame >= tZap && frame < s1 + 8 ? (
          <div style={{ position: "absolute", right: 70, top: 690, width: 120, height: 120, borderRadius: 36, background: C.graf3, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${mola(frame, fps, tZap, { damping: 9, stiffness: 220 })})`, boxShadow: "0 20px 50px rgba(0,0,0,0.5)", opacity: 1 - ease(lin(frame, s1, s1 + 8)) }}>
            <Ico n="chat" s={62} c={C.tinta} />
            <div style={{ position: "absolute", top: -14, right: -14, minWidth: 58, height: 58, borderRadius: 29, background: C.laranja, color: C.bg, fontFamily: MONO, fontWeight: 800, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 10px" }}>{Math.min(99, 12 + Math.floor((frame - tZap) * 2.2))}</div>
          </div>
        ) : null}
        <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
        <AbsoluteFill style={{ background: `rgba(8,9,9,${0.78 * esc})` }} />
        {/* a célula do lucro do dia */}
        {frame >= tLucro - 3 ? (
          <div style={{ position: "absolute", left: 90, right: 90, top: 820, transform: `scale(${0.6 + 0.4 * kCel}) rotate(${(1 - kCel) * -6}deg)`, opacity: clamp(kCel * 1.5) * (1 - quebra) }}>
            <div style={{ background: C.papel, borderRadius: 18, border: `4px solid ${frame >= tChute ? C.perda : "#2a2c2d"}`, padding: "30px 40px", boxShadow: "0 50px 100px rgba(0,0,0,0.6)" }}>
              <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: "#55585a" }}>LUCRO DO DIA</div>
              <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 120, color: frame >= tChute ? C.perda : "#2a2c2d", letterSpacing: -4, marginTop: 6, filter: girando ? "blur(1.5px)" : undefined, transform: frame >= tChute ? `rotate(${Math.sin((frame - tChute) * 0.9) * 4 * lin(frame, tChute, tChute + 20, 1, 0)}deg)` : undefined }}>{digitos}</div>
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
