/**
 * Calculates vertical jump height based on flight time.
 * Formula: h = (g * t^2) / 8
 * where g = 9.80665 m/s^2
 *       t = flight time in seconds
 * 
 * @param flightTimeSeconds Time in air in seconds
 * @returns Height in centimeters
 */
export const calculateJumpHeight = (flightTimeSeconds: number): number => {
  const G = 9.80665;
  const heightMeters = (G * Math.pow(flightTimeSeconds, 2)) / 8;
  return heightMeters * 100; // Convert to cm
};

export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};