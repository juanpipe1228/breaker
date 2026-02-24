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
  {
    id: "shoulder-rolls",
    office: {
      title: "Rotaciones de hombros",
      instruction: "Haz 15 rotaciones de hombros hacia atrás y 15 hacia adelante, sentado o de pie.",
      durationSec: 90,
    },
    home: {
      title: "Flexiones de brazos",
      instruction: "Haz 10 flexiones de brazos (pueden ser apoyando rodillas si es necesario).",
      durationSec: 60,
    },
  },
  {
    id: "wrist-mobility",
    office: {
      title: "Movilidad de muñecas",
      instruction: "Gira ambas muñecas en círculos 20 veces en cada dirección. Relaja los dedos.",
      durationSec: 60,
    },
    home: {
      title: "Estiramiento de espalda",
      instruction: "De pie, inclina el torso hacia adelante y deja caer los brazos. Mantén 30 segundos.",
      durationSec: 45,
    },
  },
  {
    id: "march-in-place",
    office: {
      title: "Marcha en el sitio",
      instruction: "Marcha en el lugar durante 60 segundos, levantando bien las rodillas.",
      durationSec: 60,
    },
    home: {
      title: "Bailar tu canción favorita",
      instruction: "Pon una canción y baila libremente durante 1 minuto.",
      durationSec: 60,
    },
  },
  {
    id: "eye-relax",
    office: {
      title: "Relajación ocular",
      instruction: "Mira a lo lejos (más de 6 metros) durante 30 segundos, luego cierra los ojos y respira.",
      durationSec: 45,
    },
    home: {
      title: "Estiramiento de cuello",
      instruction: "Inclina la cabeza suavemente hacia cada lado, manteniendo 10 segundos por lado.",
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
