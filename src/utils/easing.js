/**
 * Easing functions for animations
 */

export function easeOutQuad(t) {
  return t * (2 - t);
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutElastic(t) {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 :
    Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
