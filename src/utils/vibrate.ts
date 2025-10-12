// src/utils/vibrate.ts
export const vibrate = (pattern: number | number[] = 100) => {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
};
