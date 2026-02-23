"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BREAK_COOLDOWN_MS, STORAGE_KEYS, WORK_INTERVAL_MS } from "@/lib/constants"
import { getScienceReward } from "@/lib/science-rewards"
import { readJson, writeJson } from "@/lib/storage"
import type { BreakState, Settings, TimerState } from "@/lib/types"

const DEFAULT_SETTINGS: Settings = {
  mode: "office",
  tone: "zen",
  notificationsEnabled: false,
  soundEnabled: true,
  workIntervalMinutes: 50,
}

const DEFAULT_BREAK: BreakState = {
  active: false,
  breakStartAt: null,
  snack: null,
  completedAt: null,
  reward: null,
}

type BreakerNotificationOptions = NotificationOptions & {
  renotify?: boolean
  requireInteraction?: boolean
  tag?: string
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

export default function BreakPage() {
  const router = useRouter()
  const [settings] = useState<Settings>(() => {
    const raw = readJson<Partial<Settings>>(STORAGE_KEYS.settings, {})
    return { ...DEFAULT_SETTINGS, ...raw }
  })
  const [breakState, setBreakState] = useState<BreakState>(() =>
    readJson<BreakState>(STORAGE_KEYS.break, DEFAULT_BREAK)
  )
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState<number>(BREAK_COOLDOWN_MS)
  const [isFinishing, setIsFinishing] = useState(false)
  const [showRewardOverlay, setShowRewardOverlay] = useState(false)
  const [rewardOverlayLeaving, setRewardOverlayLeaving] = useState(false)

  const tickRef = useRef<number | null>(null)
  const finishTimeoutRef = useRef<number | null>(null)
  const overlayLeaveTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (finishTimeoutRef.current) window.clearTimeout(finishTimeoutRef.current)
      if (overlayLeaveTimeoutRef.current) window.clearTimeout(overlayLeaveTimeoutRef.current)
      finishTimeoutRef.current = null
      overlayLeaveTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    const startedAt = breakState.breakStartAt
    if (!startedAt) return

    const update = () => {
      const delta = Date.now() - startedAt
      setCooldownRemainingMs(Math.max(0, BREAK_COOLDOWN_MS - delta))
    }

    update()
    if (tickRef.current) window.clearInterval(tickRef.current)

    tickRef.current = window.setInterval(update, 250)

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [breakState.breakStartAt])

  const snack = breakState.snack

  const title = useMemo(() => {
    if (!snack) return "Movement Snack"
    return snack.title
  }, [snack])

  async function complete() {
    if (!breakState.breakStartAt) return
    if (isFinishing) return

    setIsFinishing(true)

    const reward = getScienceReward({ mode: settings.mode })
    const next: BreakState = {
      ...breakState,
      active: false,
      completedAt: Date.now(),
      reward,
    }

    setBreakState(next)
    writeJson(STORAGE_KEYS.break, next)

    setShowRewardOverlay(true)
    setRewardOverlayLeaving(false)

    const minutes = Number(settings.workIntervalMinutes)
    const workIntervalMs =
      Number.isFinite(minutes) && minutes > 0 ? minutes * 60 * 1000 : WORK_INTERVAL_MS

    const nextTimer: TimerState = {
      nextBreakAt: Date.now() + workIntervalMs,
    }

    writeJson(STORAGE_KEYS.timer, nextTimer)

    if (overlayLeaveTimeoutRef.current) window.clearTimeout(overlayLeaveTimeoutRef.current)
    if (finishTimeoutRef.current) window.clearTimeout(finishTimeoutRef.current)

    overlayLeaveTimeoutRef.current = window.setTimeout(() => {
      setRewardOverlayLeaving(true)
    }, 4300)

    finishTimeoutRef.current = window.setTimeout(() => {
      router.push("/")
    }, 5000)
  }

  useEffect(() => {
    if (!breakState.active && !breakState.reward) {
      router.replace("/")
    }
  }, [breakState.active, breakState.reward, router])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!breakState.active) return

    let intervalId: number | null = null
    let focused = true
    try {
      focused = !document.hidden
    } catch {
      focused = true
    }

    const shouldNag = () => document.hidden || !focused

    const beep = async () => {
      if (!settings.soundEnabled) return

      let unlocked = false
      try {
        unlocked = window.localStorage.getItem("breaker:audioUnlocked") === "true"
      } catch {
        unlocked = false
      }

      if (!unlocked) return

      const w = window as unknown as { __breakerAudioCtx?: AudioContext }
      const webkit = window as unknown as { webkitAudioContext?: typeof AudioContext }
      const Ctx = window.AudioContext || webkit.webkitAudioContext
      if (!Ctx) return

      if (!w.__breakerAudioCtx) {
        w.__breakerAudioCtx = new Ctx()
      }

      const ctx = w.__breakerAudioCtx
      if (ctx.state === "suspended") {
        try {
          await ctx.resume()
        } catch {
          return
        }
      }

      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = 700
        gain.gain.value = 0.12
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.25)
      } catch {
        return
      }
    }

    const sendNotification = () => {
      if (!settings.notificationsEnabled) return
      if (!("Notification" in window)) return
      if (Notification.permission !== "granted") return

      try {
        const options: BreakerNotificationOptions = {
          body: "Vuelve a Breaker para tu pausa.",
          tag: "breaker-break",
          renotify: true,
          requireInteraction: true,
        }

        const n = new Notification("Movement Snack", options)

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

    const tick = () => {
      if (!shouldNag()) return
      void beep()
      sendNotification()
    }

    const ensureInterval = () => {
      if (!shouldNag()) {
        if (intervalId) window.clearInterval(intervalId)
        intervalId = null
        return
      }

      if (intervalId) return
      tick()
      intervalId = window.setInterval(tick, 800)
    }

    const onVisibility = () => {
      focused = !document.hidden
      ensureInterval()
    }
    const onFocus = () => {
      focused = true
      ensureInterval()
    }
    const onBlur = () => {
      focused = false
      ensureInterval()
    }

    ensureInterval()
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", onFocus)
    window.addEventListener("blur", onBlur)

    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("blur", onBlur)
      if (intervalId) window.clearInterval(intervalId)
      intervalId = null
    }
  }, [breakState.active, settings.notificationsEnabled, settings.soundEnabled])

  if (!snack) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
        <div className="text-sm text-zinc-200">Cargando…</div>
      </div>
    )
  }

  const canComplete = cooldownRemainingMs <= 0 && !isFinishing

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-50 transition-colors duration-500">
      {showRewardOverlay && breakState.reward ? (
        <div
          className={
            "fixed inset-0 z-50 flex items-center justify-center px-6 py-16 " +
            "bg-zinc-950/90 backdrop-blur-sm " +
            (rewardOverlayLeaving
              ? "animate-out fade-out-0 zoom-out-95 duration-700"
              : "animate-in fade-in-0 zoom-in-95 duration-700")
          }
        >
          <div className="mx-auto w-full max-w-2xl text-center">
            <div className="text-sm text-zinc-300/80">Recompensa</div>
            <div className="mt-4 text-2xl font-semibold leading-snug text-zinc-50">
              {breakState.reward}
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-28 -left-28 h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:22px_22px] opacity-40" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-14 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <div className="mb-8 space-y-2">
          <div className="text-sm text-zinc-300/80">Píldora de salud</div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">{title}</h1>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-200">
              Haz esto ahora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 py-6">
              <div className="text-2xl leading-snug text-zinc-50">{snack.instruction}</div>
              <div className="text-sm text-zinc-300/80">
                Duración estimada: {Math.max(1, Math.round(snack.durationSec / 60))} min
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="h-12 rounded-full px-6"
                  onClick={complete}
                  disabled={!canComplete}
                >
                  {canComplete
                    ? "Completado"
                    : `Disponible en ${formatClock(cooldownRemainingMs)}`}
                </Button>
              </div>

              {breakState.reward ? (
                <div className="pt-2 text-sm text-zinc-200">{breakState.reward}</div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="mt-10 text-xs text-zinc-300/70">
          Si estabas en otra pestaña, habilita notificaciones en Ajustes para que te avise.
        </div>
      </div>
    </div>
  )
}
