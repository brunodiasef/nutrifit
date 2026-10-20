import React from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";
// A mesma animação usada na tela de abertura do app
// eslint-disable-next-line @typescript-eslint/no-var-requires
const NF = require("../../abertura.js");

// Fontes da marca embutidas no projeto (Oswald 600 nos títulos, Inter 700 nos textos pequenos)
const fontes = delayRender("fontes");
Promise.all([
  new FontFace("Oswald", `url(${staticFile("fonts/oswald-latin-600-normal.woff2")}) format("woff2")`, { weight: "600" }),
  new FontFace("Inter", `url(${staticFile("fonts/inter-latin-700-normal.woff2")}) format("woff2")`, { weight: "700" }),
].map(f => f.load().then(l => document.fonts.add(l)))).then(() => continueRender(fontes));

const T = NF.T;
const SEGURA = 0.9;                       // logo forte "respirando" antes de sair
const SAIDA = 0.4;                        // saída mais rápida que a entrada
export const DURACAO_S = T.sai + SEGURA + SAIDA;

/* ---------- camadas ---------- */
const BgMesh: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const forca = interpolate(frame / fps, [T.reps[0], T.forte], [0.35, 1], { easing: theme.ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const d1 = Math.sin(frame / 55) * 60, d2 = Math.cos(frame / 70) * 50;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <div style={{ position: "absolute", width: 1500, height: 1500, borderRadius: "50%", top: -260, left: -560 + d1, filter: "blur(60px)", opacity: forca,
        background: `radial-gradient(circle, ${theme.colors.primary}40, transparent 62%)` }} />
      <div style={{ position: "absolute", width: 1100, height: 1100, borderRadius: "50%", bottom: -300, right: -420 - d2, filter: "blur(80px)", opacity: forca,
        background: `radial-gradient(circle, ${theme.colors.accent}26, transparent 65%)` }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 46%, ${theme.colors.bgAlt}, transparent 60%)` }} />
    </AbsoluteFill>
  );
};

const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: theme.colors.primary, mixBlendMode: "soft-light", opacity: 0.2 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.18), transparent 26%, transparent 74%, rgba(0,0,0,0.28))" }} />
  </AbsoluteFill>
);

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: noise, backgroundSize: "220px",
    backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`, opacity: 0.07, mixBlendMode: "overlay" }} />;
};

const Vignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.45) 100%)" }} />
);

/* ---------- logo animada ---------- */
const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // até a saída do app, segue a linha do tempo; depois segura respirando e sai
  const tLogo = Math.min(t, T.sai - 0.001);
  const segura = Math.max(0, t - T.sai);
  const respira = 1 + Math.sin(segura * 3.2) * 0.012;
  const saida = interpolate(t, [DURACAO_S - SAIDA, DURACAO_S - 1 / fps], [0, 1], { easing: theme.ease.in, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const svg = NF.frame(tLogo + Math.min(segura, 0.6), { titulo: "Bem-vindo ao NutriFit!", subtitulo: "DIETA & NUTRIÇÃO", saida: false, id: "v" });
  const brilho = interpolate(t, [T.forte - 0.1, T.forte + 0.3, T.forte + 1.2], [0, 1, 0.55], { easing: theme.ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: 1000, height: 1100, marginTop: -40,
        opacity: 1 - saida,
        transform: `translateY(${-60 * saida}px) scale(${respira * (1 + 0.08 * saida)})`,
        filter: `drop-shadow(0 0 ${60 * brilho}px ${theme.colors.glow})`,
      }} dangerouslySetInnerHTML={{ __html: svg }} />
    </AbsoluteFill>
  );
};

/* ---------- assinatura ---------- */
const Assinatura: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps, a = T.texto + 0.45;
  const p = interpolate(t, [a, a + 0.5], [0, 1], { easing: theme.ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const saida = interpolate(t, [DURACAO_S - SAIDA, DURACAO_S - 1 / fps], [0, 1], { easing: theme.ease.in, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 360 }}>
      <div style={{ fontFamily: theme.fonts.body, fontWeight: 700, fontSize: 30, letterSpacing: 8, color: theme.colors.textDim,
        opacity: p * (1 - saida), transform: `translateY(${(1 - p) * 24 - saida * 20}px) scale(${0.96 + 0.04 * p})` }}>
        BRUNO PERSONAL TRAINER
      </div>
    </AbsoluteFill>
  );
};

/* ---------- som: efeitos 2–3 quadros antes de cada batida ---------- */
const Sfx: React.FC = () => {
  const { fps } = useVideoConfig();
  const at = (s: number) => Math.max(0, Math.round(s * fps) - 2);
  return (
    <>
      <Audio src={staticFile("sfx/pad.wav")} volume={0.22} />
      <Sequence from={0}><Audio src={staticFile("sfx/whoosh.wav")} volume={0.55} /></Sequence>
      {T.reps.map((r: number, i: number) => (
        <Sequence key={i} from={at(r + T.rep * 0.45)}><Audio src={staticFile("sfx/thump.wav")} volume={0.55 + i * 0.15} /></Sequence>
      ))}
      <Sequence from={at(T.forte)}><Audio src={staticFile("sfx/impact.wav")} volume={0.85} /></Sequence>
      <Sequence from={at(T.brilho[0])}><Audio src={staticFile("sfx/shimmer.wav")} volume={0.5} /></Sequence>
      <Sequence from={at(T.texto)}><Audio src={staticFile("sfx/pop.wav")} volume={0.45} /></Sequence>
      <Sequence from={at(DURACAO_S - SAIDA)}><Audio src={staticFile("sfx/swoosh-out.wav")} volume={0.4} /></Sequence>
    </>
  );
};

export const Abertura: React.FC = () => (
  <AbsoluteFill>
    <BgMesh />
    <Logo />
    <Assinatura />
    <Grade />
    <Grain />
    <Vignette />
    <Sfx />
  </AbsoluteFill>
);
