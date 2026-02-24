import type { EnvironmentMode } from "@/lib/mock-ai"

const REWARDS_OFFICE = [
  "Acabas de reactivar tu metabolismo de la glucosa. Buen trabajo.",
  "Unos minutos de movimiento mejoran tu sensibilidad a la insulina.",
  "Tu cuerpo ama estos micro-cortes: menos rigidez, más energía.",
  "Tu cerebro agradece la pausa: mejora la concentración y la memoria.",
  "Moverte reduce el estrés y mejora tu estado de ánimo en la oficina.",
  "Cada pausa activa ayuda a prevenir molestias musculares y fatiga visual.",
  "¡Bien hecho! Así reduces el riesgo de enfermedades cardiovasculares.",
]

const REWARDS_HOME = [
  "Esa ráfaga tipo VILPA es una señal potente para tu metabolismo.",
  "Tu corazón y tus mitocondrias acaban de recibir un estímulo útil.",
  "Moverte así rompe el sedentarismo y mejora la respuesta a la glucosa.",
  "¡Gran trabajo! El movimiento en casa también mejora tu energía mental.",
  "Cada pausa activa en casa ayuda a mantener tu motivación y bienestar.",
  "Tus articulaciones y músculos se mantienen saludables con cada break.",
  "Recuerda: moverte en casa también protege tu salud a largo plazo.",
]

export function getScienceReward(params: { mode: EnvironmentMode; seed?: number }): string {
  const seed = params.seed ?? Math.floor(Date.now() / 1000)
  const list = params.mode === "office" ? REWARDS_OFFICE : REWARDS_HOME
  const idx = Math.abs(seed) % list.length
  return list[idx]!
}
