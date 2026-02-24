export async function primeAudio(): Promise<void> {
    if (typeof window === "undefined") return

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
        gain.gain.value = 0
        osc.frequency.value = 440
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.01)
    } catch {
        return
    }

    try {
        window.localStorage.setItem("breaker:audioUnlocked", "true")
    } catch {
        return
    }
}

export async function playNotificationMelody(): Promise<void> {
    if (typeof window === "undefined") return

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
        const t = ctx.currentTime
        // D-Major Arpeggio (D5, F#5, A5, D6)
        const notes = [587.33, 739.99, 880.00, 1174.66]

        const playNote = (freq: number, startTime: number) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = "triangle"
            osc.frequency.value = freq

            gain.gain.setValueAtTime(0, startTime)
            gain.gain.linearRampToValueAtTime(0.12, startTime + 0.01)
            gain.gain.exponentialRampToValueAtTime(0.001, Math.max(startTime + 0.011, startTime + 0.4))

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start(startTime)
            osc.stop(startTime + 0.4)

            osc.onended = () => {
                osc.disconnect()
                gain.disconnect()
            }
        }

        notes.forEach((freq, i) => {
            // 0.15s between each note
            playNote(freq, t + i * 0.15)
        })
    } catch {
        return
    }
}
