// Fonte única de cores, curvas e molas do vídeo de abertura (marca Bruno Personal / NutriFit).
import { Easing } from "remotion";

export const theme = {
  colors: {
    bg: "#0B0C10",
    bgAlt: "#121621",
    primary: "#2F6BFF", // azul da marca: cor de destaque
    accent: "#33C97A",  // verde das folhas
    text: "#F4F4F5",
    textDim: "#989BAC",
    glow: "rgba(47, 107, 255, 0.35)",
  },
  fonts: { display: "Oswald", body: "Inter" },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
} as const;
