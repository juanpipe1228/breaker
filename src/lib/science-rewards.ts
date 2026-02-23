import type { EnvironmentMode } from "@/lib/mock-ai"

const REWARDS_OFFICE = [
  "Acabas de reactivar tu metabolismo de la glucosa. Buen trabajo.",
  "Unos minutos de movimiento mejoran tu sensibilidad a la insulina.",
  "Tu cuerpo ama estos micro-cortes: menos rigidez, más energía.",
]

const REWARDS_HOME = [
  "Esa ráfaga tipo VILPA es una señal potente para tu metabolismo.",
  "Tu corazón y tus mitocondrias acaban de recibir un estímulo útil.",
  "Moverte así rompe el sedentarismo y mejora la respuesta a la glucosa.",
]

export function getScienceReward(params: { mode: EnvironmentMode; seed?: number }): string {
  const seed = params.seed ?? Math.floor(Date.now() / 1000)
  const list = params.mode === "office" ? REWARDS_OFFICE : REWARDS_HOME
  const idx = Math.abs(seed) % list.length
  return list[idx]!
}
