export interface JumpData {
  takeOffTime: number | null;
  landingTime: number | null;
  flightTime: number | null;
  heightCm: number | null;
}

export enum PlaybackSpeed {
  X0_1 = 0.1,
  X0_25 = 0.25,
  X0_5 = 0.5,
  X1_0 = 1.0,
  X1_5 = 1.5,
  X2_0 = 2.0,
}

export interface UserProfile {
  id: string;
  name: string;
  createdAt: number;
}

export interface JumpRecord {
  id: string;
  userId: string;
  date: number; // timestamp
  heightCm: number;
  flightTime: number;
  note?: string;
}

export interface ReferenceLineData {
  id: string;
  topPercent: number;
  color: string;
}

export interface VideoMarker {
  id: string;
  time: number;
  label: string;
}
