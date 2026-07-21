export type CardTransitionDirection = 'open' | 'close';
export type CardTransitionPhase = 'idle' | 'opening-await-detail' | 'opening-running' | 'closing-running';

export const DETAIL_CARD_BORDER_RADIUS_PX = 32;

export interface CardTransitionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CardTransitionViewport {
  width: number;
  height: number;
  pixelRatio: number;
}

export interface CardTransitionRequest {
  id: number;
  direction: CardTransitionDirection;
  previewElement: HTMLElement;
  detailElement: HTMLElement;
  previewRect: CardTransitionRect;
  detailRect: CardTransitionRect;
  previewNaturalWidth: number;
  sourceOpacity: number;
  sourceBoxShadow: string;
  slideMode: 0 | 1 | 2;
  textureUrl: string;
  viewport: CardTransitionViewport;
}

export interface CardTransitionHandoffOutcome {
  id: number;
  direction: CardTransitionDirection;
  status: 'reached' | 'cancelled';
}

export interface CardTransitionOutcome {
  id: number;
  direction: CardTransitionDirection;
  status: 'finished' | 'cancelled';
}

export interface CardTransitionRun {
  id: number;
  handoff: Promise<CardTransitionHandoffOutcome>;
  finished: Promise<CardTransitionOutcome>;
  cancel: () => void;
}

export interface CardTransitionOverlayApi {
  start: (request: CardTransitionRequest) => Promise<CardTransitionRun>;
  cancel: () => void;
}

interface LinearEasingStop {
  input: number;
  output: number;
}

const CLOSE_EASING_STOPS: readonly LinearEasingStop[] = [
  { input: 0, output: 0 },
  { input: 0.009284, output: 0.0071 },
  { input: 0.019894, output: 0.0286 },
  { input: 0.04244, output: 0.1103 },
  { input: 0.137931, output: 0.6276 },
  { input: 0.189655, output: 0.8453 },
  { input: 0.217507, output: 0.9266 },
  { input: 0.246684, output: 0.9867 },
  { input: 0.277188, output: 1.0261 },
  { input: 0.29443, output: 1.0398 },
  { input: 0.311671, output: 1.0485 },
  { input: 0.323607, output: 1.0521 },
  { input: 0.33687, output: 1.0541 },
  { input: 0.352785, output: 1.0543 },
  { input: 0.3687, output: 1.0527 },
  { input: 0.403183, output: 1.0449 },
  { input: 0.490716, output: 1.0187 },
  { input: 0.533156, output: 1.0091 },
  { input: 0.562334, output: 1.0043 },
  { input: 0.591512, output: 1.0009 },
  { input: 0.623342, output: 0.9986 },
  { input: 0.657825, output: 0.9974 },
  { input: 0.713528, output: 0.9971 },
  { input: 0.877984, output: 0.9995 },
  { input: 1, output: 1.0001 },
];

const clampUnit = (value: number) => Math.min(1, Math.max(0, value));

const sampleCubic = (time: number, control1: number, control2: number) => {
  const inverse = 1 - time;
  return 3 * inverse * inverse * time * control1
    + 3 * inverse * time * time * control2
    + time * time * time;
};

const sampleCubicDerivative = (time: number, control1: number, control2: number) => {
  const inverse = 1 - time;
  return 3 * inverse * inverse * control1
    + 6 * inverse * time * (control2 - control1)
    + 3 * time * time * (1 - control2);
};

export const evaluateCubicBezier = (
  progress: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) => {
  const target = clampUnit(progress);
  let time = target;

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const error = sampleCubic(time, x1, x2) - target;
    const derivative = sampleCubicDerivative(time, x1, x2);
    if (Math.abs(error) < 1e-7 || Math.abs(derivative) < 1e-7) break;
    time = clampUnit(time - error / derivative);
  }

  let lower = 0;
  let upper = 1;
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const current = sampleCubic(time, x1, x2);
    if (Math.abs(current - target) < 1e-7) break;
    if (current < target) lower = time;
    else upper = time;
    time = (lower + upper) / 2;
  }

  return sampleCubic(time, y1, y2);
};

export const evaluateOpenCardEasing = (progress: number) => (
  evaluateCubicBezier(progress, 0.77, 0, 0.175, 1)
);

export const evaluateIndexRestoreEasing = (progress: number) => (
  evaluateCubicBezier(progress, 0.25, 0.1, 0.25, 1)
);

export const evaluateCloseCardEasing = (progress: number) => {
  const target = clampUnit(progress);

  for (let index = 1; index < CLOSE_EASING_STOPS.length; index += 1) {
    const previous = CLOSE_EASING_STOPS[index - 1];
    const next = CLOSE_EASING_STOPS[index];
    if (!previous || !next || target > next.input) continue;

    const span = next.input - previous.input;
    const localProgress = span <= 0 ? 0 : (target - previous.input) / span;
    return previous.output + (next.output - previous.output) * localProgress;
  }

  return CLOSE_EASING_STOPS.at(-1)?.output ?? 1;
};

export const getCardTransitionDuration = (direction: CardTransitionDirection) => (
  direction === 'open' ? 800 : 1200
);

export const getCardTransitionEasing = (direction: CardTransitionDirection) => (
  direction === 'open' ? evaluateOpenCardEasing : evaluateCloseCardEasing
);

export const toCardTransitionRect = (rect: DOMRectReadOnly): CardTransitionRect => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height,
});
