// One shared clock for the welcome animation. Pure function of time `t` (ms),
// so every scene stays in sync. Two halves per loop: male runner, then female runner.
export const HALF = 7100;   // one delivery
const T1 = 3400;            // constant-speed walk
const TDEC = 1200;          // slow down at the house
const V = 92;               // ground speed px/s
export const DHALF = (V * T1) / 1000 + (V * TDEC) / 2000; // scroll distance per delivery
const FRAMES_HALF = 102;    // 4 strides + 6 frames, so we always stop on the standing frame (6)

const ease = (x: number) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

export function timeline(t: number) {
  const half = Math.floor(t / HALF);
  const tl = t - half * HALF;
  let dl;
  if (tl <= T1) dl = (V * tl) / 1000;
  else if (tl <= T1 + TDEC) { const u = (tl - T1) / TDEC; dl = (V * T1) / 1000 + ((V * TDEC) / 1000) * (u - (u * u) / 2); }
  else dl = DHALF;
  const walking = tl <= T1 + TDEC;
  const frame = walking ? Math.floor((dl / DHALF) * FRAMES_HALF) % 24 : 6;
  const enter = ease(tl / 500);
  const fg = 1 - ease((tl - 6400) / 600);
  return {
    who: half % 2,
    D: half * DHALF + dl,
    frame,
    charOp: enter * fg,
    charDX: (1 - enter) * -50,
    bobY: walking ? -Math.abs(Math.sin((frame / 24) * 2 * Math.PI)) * 2.5 : 0,
    deliver: ease((tl - 4700) / 800),
    glow: ease((tl - 5300) / 300),
    pill: tl >= 5350 ? Math.min(1, (tl - 5350) / 350) : 0,
    fg,
    houseDX: DHALF - dl,
  };
}
