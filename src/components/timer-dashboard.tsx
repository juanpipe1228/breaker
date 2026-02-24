"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SettingsSheet } from "@/components/settings-sheet"
import { STORAGE_KEYS, WORK_INTERVAL_MS } from "@/lib/constants"
import { readJson, writeJson } from "@/lib/storage"
import type { BreakState, Settings, TimerState } from "@/lib/types"
import { getMovementSnack } from "@/lib/mock-ai"
import { getScienceReward } from "@/lib/science-rewards"
import { primeAudio, playNotificationMelody } from "@/lib/audio"

const DEFAULT_SETTINGS: Settings = {
  mode: "office",
  tone: "zen",
  notificationsEnabled: false,
  soundEnabled: true,
  workIntervalMinutes: 50,
}

const DEFAULT_TIMER: TimerState = {
  nextBreakAt: null,
}

const DEFAULT_BREAK: BreakState = {
  active: false,
  breakStartAt: null,
  snack: null,
  completedAt: null,
  reward: null,
}

function formatClock(ms: number): string {
  const clamped = Math.max(0, ms)
  const totalSec = Math.floor(clamped / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  const mm = String(m).padStart(2, "0")
  const ss = String(s).padStart(2, "0")
  return `${mm}:${ss}`
}

async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined") return "denied"
  if (!("Notification" in window)) return "denied"
  if (Notification.permission === "granted") return "granted"
  return await Notification.requestPermission()
}

type BreakerNotificationOptions = NotificationOptions & {
  renotify?: boolean
  requireInteraction?: boolean
  tag?: string
}

function notify(title: string, body: string) {
  if (typeof window === "undefined") return
  if (!("Notification" in window)) return
  if (Notification.permission !== "granted") return

  try {
    const options: BreakerNotificationOptions = {
      body,
      tag: "breaker-break",
      renotify: true,
      requireInteraction: true,
    }

    const n = new Notification(title, options)

    n.onclick = () => {
      try {
        window.focus()
        window.location.href = "/break"
      } catch {
        return
      }
    }
  } catch {
    return
  }
}

export function TimerDashboard() {
  const router = useRouter()
  const [settings, setSettings] = useState<Settings>(() => {
    const raw = readJson<Partial<Settings>>(STORAGE_KEYS.settings, {})
    return { ...DEFAULT_SETTINGS, ...raw }
  })
  const [timer, setTimer] = useState<TimerState>(() =>
    readJson<TimerState>(STORAGE_KEYS.timer, DEFAULT_TIMER)
  )
  const [now, setNow] = useState<number>(() => Date.now())
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported")
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return true
    try {
      return window.localStorage.getItem("breaker:audioUnlocked") === "true"
    } catch {
      return true
    }
  })

  const tickRef = useRef<number | null>(null)

  useEffect(() => {
    if (tickRef.current) window.clearInterval(tickRef.current)
    tickRef.current = window.setInterval(() => setNow(Date.now()), 1000)

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  useEffect(() => {
    writeJson(STORAGE_KEYS.settings, settings)
  }, [settings])

  useEffect(() => {
    writeJson(STORAGE_KEYS.timer, timer)
  }, [timer])

  const workIntervalMs = useMemo(() => {
    const minutes = Number(settings.workIntervalMinutes)
    if (!Number.isFinite(minutes) || minutes <= 0) return WORK_INTERVAL_MS
    return minutes * 60 * 1000
  }, [settings.workIntervalMinutes])

  const remainingMs = useMemo(() => {
    if (!timer.nextBreakAt) return workIntervalMs
    return timer.nextBreakAt - now
  }, [now, timer.nextBreakAt, workIntervalMs])

  const rewardSlot = useMemo(() => {
    return Math.floor(now / (5 * 60 * 1000))
  }, [now])

  const rotatingReward = useMemo(() => {
    return getScienceReward({ mode: settings.mode, seed: rewardSlot })
  }, [rewardSlot, settings.mode])

  const notificationsSupported = useMemo(() => {
    if (typeof window === "undefined") return false
    return "Notification" in window
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    if (!notificationsSupported) {
      setNotificationPermission("unsupported")
      return
    }

    try {
      setNotificationPermission(Notification.permission)
    } catch {
      setNotificationPermission("denied")
    }
  }, [notificationsSupported])

  async function unlockAudio() {
    await primeAudio()
    try {
      setAudioUnlocked(window.localStorage.getItem("breaker:audioUnlocked") === "true")
    } catch {
      setAudioUnlocked(true)
    }
  }

  useEffect(() => {
    const target = timer.nextBreakAt
    if (!target) return
    if (remainingMs > 0) return

    const snack = getMovementSnack({ mode: settings.mode, tone: settings.tone })
    const breakState: BreakState = {
      active: true,
      breakStartAt: Date.now(),
      snack,
      completedAt: null,
      reward: null,
    }
    writeJson(STORAGE_KEYS.break, breakState)

    if (settings.notificationsEnabled) {
      notify("Movement Snack", snack.instruction)
    }

    router.push("/break")
  }, [remainingMs, router, settings.mode, settings.notificationsEnabled, settings.tone, timer.nextBreakAt])

  const isRunning = timer.nextBreakAt !== null

  const headline = useMemo(() => {
    if (!isRunning) return "Listo cuando tú lo estés"
    return "Enfoque. Respiración. Ritmo."
  }, [isRunning])

  async function onEnableNotifications() {
    const perm = await requestNotificationPermission()
    setSettings((prev) => ({
      ...prev,
      notificationsEnabled: perm === "granted",
    }))

    if (notificationsSupported) {
      setNotificationPermission(perm)
    }
  }

  async function onTestAlert() {
    const perm = await requestNotificationPermission()
    setSettings((prev) => ({
      ...prev,
      notificationsEnabled: perm === "granted",
    }))

    await primeAudio()
    await playNotificationMelody()
    notify("Breaker", "Prueba de alerta: haz click para volver")
  }

  function start() {
    void unlockAudio()
    const nextBreakAt = Date.now() + workIntervalMs
    setTimer({ nextBreakAt })
  }

  function reset() {
    setTimer({ nextBreakAt: null })
    writeJson(STORAGE_KEYS.break, DEFAULT_BREAK)
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-28 -left-28 h-[420px] w-[420px] rounded-full bg-emerald-500/12 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-[520px] w-[520px] rounded-full bg-sky-500/12 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.06)_1px,transparent_0)] bg-[size:22px_22px] opacity-25" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-14 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Breaker</div>
            <h1 className="text-2xl font-semibold tracking-tight">{headline}</h1>
            <div className="text-sm text-muted-foreground">
              Cada {settings.workIntervalMinutes} minutos te doy una píldora breve de movimiento.
            </div>
          </div>
          <SettingsSheet
            value={settings}
            onChange={setSettings}
            onRequestNotificationPermission={onEnableNotifications}
            onTestAlert={onTestAlert}
          />
        </div>

        {!settings.notificationsEnabled || notificationPermission !== "granted" ? (
          <div className="mt-8 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 backdrop-blur">
            <div className="text-sm font-medium text-red-100">Notificaciones: acción requerida</div>
            <div className="mt-1 text-sm text-red-100/80">
              {!notificationsSupported || notificationPermission === "unsupported"
                ? "Tu navegador no soporta notificaciones. Las pausas solo se verán dentro de esta pestaña (y con sonido si lo activas)."
                : notificationPermission === "denied"
                  ? "El permiso está BLOQUEADO. Debes habilitar notificaciones en los ajustes del navegador para recibir alertas cuando toque la pausa."
                  : "Aún no diste permiso. Actívalas para que te avise aunque estés en otra pestaña."}
            </div>

            {notificationsSupported && notificationPermission !== "denied" ? (
              <div className="mt-3">
                <Button className="h-10 rounded-full px-5" onClick={onEnableNotifications}>
                  Activar notificaciones
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {!settings.soundEnabled ? (
          <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 backdrop-blur">
            <div className="text-sm font-medium text-amber-950 dark:text-amber-100">
              Sonido desactivado
            </div>
            <div className="mt-1 text-sm text-amber-950/80 dark:text-amber-100/80">
              Si estás en otra pestaña, el sonido es tu respaldo cuando no ves el timer.
            </div>
            <div className="mt-3">
              <Button
                className="h-10 rounded-full px-5"
                onClick={() => setSettings((prev) => ({ ...prev, soundEnabled: true }))}
              >
                Activar sonido
              </Button>
            </div>
          </div>
        ) : !audioUnlocked ? (
          <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 backdrop-blur">
            <div className="text-sm font-medium text-amber-950 dark:text-amber-100">
              Sonido bloqueado por el navegador
            </div>
            <div className="mt-1 text-sm text-amber-950/80 dark:text-amber-100/80">
              Por seguridad, el navegador solo permite audio después de una interacción.
            </div>
            <div className="mt-3">
              <Button className="h-10 rounded-full px-5" onClick={unlockAudio}>
                Desbloquear sonido
              </Button>
            </div>
          </div>
        ) : null}

        <Card className="mt-10 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Temporizador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-6 py-10">
              <div className="text-6xl font-semibold tabular-nums tracking-tight">
                {isRunning
                  ? formatClock(remainingMs)
                  : formatClock(settings.workIntervalMinutes * 60 * 1000)}
              </div>

              <div
                key={rewardSlot}
                className="max-w-xl text-center text-sm text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-1 duration-500"
              >
                {rotatingReward}
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  className="h-12 rounded-full px-6"
                  onClick={start}
                  disabled={isRunning}
                >
                  Empezar
                </Button>
                <Button
                  variant="secondary"
                  className="h-12 rounded-full px-6"
                  onClick={reset}
                >
                  Reiniciar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-10 text-xs text-muted-foreground">
          Nota: la web no puede forzar pantalla completa ni cambiarte de pestaña sin tu
          interacción, por eso usamos notificaciones.
        </div>
      </div>
    </div>
  )
}
