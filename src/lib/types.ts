import type { EnvironmentMode, Tone, MovementSnack } from "@/lib/mock-ai"

export type Settings = {
  mode: EnvironmentMode
  tone: Tone
  notificationsEnabled: boolean
  soundEnabled: boolean
  workIntervalMinutes: number
}

export type TimerState = {
  nextBreakAt: number | null
}

export type BreakState = {
  active: boolean
  breakStartAt: number | null
  snack: MovementSnack | null
  completedAt: number | null
  reward: string | null
}
