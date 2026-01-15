export function calculateWPM(
  charsTyped: number,
  startTime: number,
  currentTime: number,
): number {
  const timeElapsed = (currentTime - startTime) / 1000 / 60;
  if (timeElapsed <= 0) return 0;

  const wordsTyped = charsTyped / 5;
  return Math.round(wordsTyped / timeElapsed);
}
