import React from "react";
import { Composition } from "remotion";
import { Abertura, DURACAO_S } from "./Abertura";

export const Root: React.FC = () => (
  <Composition id="Abertura" component={Abertura} fps={30} width={1080} height={1920}
    durationInFrames={Math.round(DURACAO_S * 30)} />
);
