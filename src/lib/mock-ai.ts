export type EnvironmentMode = "office" | "home"
export type Tone = "sergeant" | "zen" | "colleague"

export type MovementSnack = {
  id: string
  title: string
  instruction: string
  durationSec: number
}

type SnackTemplate = {
  id: string
  office: { title: string; instruction: string; durationSec: number }
  home: { title: string; instruction: string; durationSec: number }
}

const SNACKS: SnackTemplate[] = [
  {
    id: "calf-raises",
    office: {
      title: "Elevación de talones",
      instruction: "Ponte de pie y sube los talones 15 veces. Mantén el abdomen firme.",
      durationSec: 150,
    },
    home: {
      title: "Ráfaga de escaleras",
      instruction: "Sube y baja escaleras a ritmo vivo durante 60 segundos.",
      durationSec: 60,
    },
  },
  {
    id: "wall-sit",
    office: {
      title: "Sentadilla isométrica",
      instruction: "Apoya la espalda en la pared y baja hasta 90°. Mantén 45 segundos.",
      durationSec: 180,
    },
    home: {
      title: "Sentadillas rápidas",
      instruction: "Haz 20 sentadillas a ritmo constante. Respira y mantén el control.",
      durationSec: 75,
    },
  },
  {
    id: "neck-reset",
    office: {
      title: "Reset cervical",
      instruction: "Inhala. Lleva la barbilla hacia atrás (doble mentón) 10 veces, suave y lento.",
      durationSec: 120,
    },
    home: {
      title: "Jumping jacks",
      instruction: "Haz jumping jacks durante 60 segundos. Intensidad: 7/10.",
      durationSec: 60,
    },
  },
]

function pickSnack(seed: number): SnackTemplate {
  const idx = Math.abs(seed) % SNACKS.length
  return SNACKS[idx]!
}

function toneWrap(tone: Tone, base: string): string {
  if (tone === "sergeant") return `Ahora: ${base} Sin excusas.`
  if (tone === "zen") return `Respira. ${base} Con calma.`
  return `Pausa rápida: ${base} Vamos.`
}

export function getMovementSnack(params: {
  mode: EnvironmentMode
  tone: Tone
  seed?: number
}): MovementSnack {
  const seed = params.seed ?? Math.floor(Date.now() / 1000)
  const t = pickSnack(seed)
  const variant = params.mode === "office" ? t.office : t.home

  return {
    id: `${t.id}:${params.mode}:${seed}`,
    title: variant.title,
    instruction: toneWrap(params.tone, variant.instruction),
    durationSec: variant.durationSec,
  }
}
