import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";
// A mesma animação usada na tela de abertura do app (camadas recortadas da logo original)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const NF = require("../../abertura.js");

const T = NF.T;
const SEGURA = 1.3;                            // logo original parada no fim
export const DURACAO_S = NF.DUR + SEGURA;

/* ---------- camadas de fundo e acabamento ---------- */
const BgMesh: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const forca = interpolate(t, [0, NF.DUR], [0.45, 1], { easing: theme.ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const d1 = Math.sin(frame / 55) * 60, d2 = Math.cos(frame / 70) * 50;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <div style={{ position: "absolute", width: 1500, height: 1500, borderRadius: "50%", top: -300, left: -560 + d1, filter: "blur(60px)", opacity: forca,
        background: `radial-gradient(circle, ${theme.colors.primary}3A, transparent 62%)` }} />
      <div style={{ position: "absolute", width: 1100, height: 1100, borderRadius: "50%", bottom: -320, right: -420 - d2, filter: "blur(80px)", opacity: forca,
        background: `radial-gradient(circle, ${theme.colors.accent}22, transparent 65%)` }} />
    </AbsoluteFill>
  );
};
const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.2), transparent 24%, transparent 76%, rgba(0,0,0,0.3))" }} />
  </AbsoluteFill>
);
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: noise, backgroundSize: "220px",
    backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`, opacity: 0.06, mixBlendMode: "overlay" }} />;
};
const Vignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)" }} />
);

/* ---------- logo animada ---------- */
const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const box = useRef<HTMLDivElement>(null);
  const anim = useRef<{ pintar: (t: number) => void } | null>(null);
  const [espera] = useState(() => delayRender("camadas da logo"));
  const t = Math.min(frame / fps, NF.DUR);
  useEffect(() => {
    const a = NF.montar(box.current, { base: staticFile("camadas") + "/", ext: "png", id: "v" });
    a.pronto.then(() => { anim.current = a; a.pintar(t); requestAnimationFrame(() => requestAnimationFrame(() => continueRender(espera))); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useLayoutEffect(() => { if (anim.current) anim.current.pintar(t); }, [t]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div ref={box} style={{ width: 1000, height: 1000 * 1262 / 1600, marginTop: -60 }} />
    </AbsoluteFill>
  );
};

/* ---------- som: efeitos 2–3 quadros antes de cada batida ---------- */
const Sfx: React.FC = () => {
  const { fps } = useVideoConfig();
  const at = (s: number) => Math.max(0, Math.round(s * fps) - 2);
  return (
    <>
      <Audio src={staticFile("sfx/pad.wav")} volume={0.2} />
      <Sequence from={0}><Audio src={staticFile("sfx/whoosh.wav")} volume={0.5} /></Sequence>
      {T.sobe.map(([, fim]: number[], i: number) => (
        <Sequence key={"s" + i} from={at(fim - 0.05)}><Audio src={staticFile("sfx/thump.wav")} volume={0.55 + i * 0.15} /></Sequence>
      ))}
      {T.desce.map(([, fim]: number[], i: number) => (
        <Sequence key={"d" + i} from={at(fim - 0.03)}><Audio src={staticFile("sfx/pop.wav")} volume={0.35} /></Sequence>
      ))}
      <Sequence from={at(T.original[0])}><Audio src={staticFile("sfx/impact.wav")} volume={0.7} /></Sequence>
      <Sequence from={at(T.original[0] + 0.05)}><Audio src={staticFile("sfx/shimmer.wav")} volume={0.45} /></Sequence>
    </>
  );
};

export const Abertura: React.FC = () => (
  <AbsoluteFill>
    <BgMesh />
    <Logo />
    <Grade />
    <Grain />
    <Vignette />
    <Sfx />
  </AbsoluteFill>
);
