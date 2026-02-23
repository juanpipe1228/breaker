"use client"

import { Bell, SlidersHorizontal } from "lucide-react"
import { useMemo, useState } from "react"

import type { Settings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SettingsSheet(props: {
  value: Settings
  onChange: (next: Settings) => void
  onRequestNotificationPermission: () => Promise<void>
  onTestAlert: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  const workIntervalLabel = useMemo(() => {
    const m = props.value.workIntervalMinutes
    return `Cada ${m} min`
  }, [props.value.workIntervalMinutes])

  const modeLabel = useMemo(() => {
    if (props.value.mode === "office") return "Modo Oficina"
    return "Modo Home Office"
  }, [props.value.mode])

  const toneLabel = useMemo(() => {
    if (props.value.tone === "sergeant") return "Sargento"
    if (props.value.tone === "zen") return "Zen"
    return "Colega"
  }, [props.value.tone])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Ajustes
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[360px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle>Ajustes</SheetTitle>
          <SheetDescription>
            Personaliza entorno y tono. Minimalismo, cero fricción.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-2 grid gap-6 px-4 pb-6">
          <div className="grid gap-2">
            <div className="text-sm font-medium">Pausas</div>
            <Select
              value={String(props.value.workIntervalMinutes)}
              onValueChange={(v) =>
                props.onChange({
                  ...props.value,
                  workIntervalMinutes: Number(v),
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={workIntervalLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Cada 1 min</SelectItem>
                <SelectItem value="20">Cada 20 min</SelectItem>
                <SelectItem value="30">Cada 30 min</SelectItem>
                <SelectItem value="40">Cada 40 min</SelectItem>
                <SelectItem value="50">Cada 50 min</SelectItem>
                <SelectItem value="60">Cada 60 min</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Ajusta cada cuánto quieres que aparezca el snack.
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Entorno</div>
            <Select
              value={props.value.mode}
              onValueChange={(v) =>
                props.onChange({ ...props.value, mode: v as Settings["mode"] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={modeLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="office">Modo Oficina</SelectItem>
                <SelectItem value="home">Modo Home Office</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Tono</div>
            <Select
              value={props.value.tone}
              onValueChange={(v) =>
                props.onChange({ ...props.value, tone: v as Settings["tone"] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={toneLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sergeant">Sargento</SelectItem>
                <SelectItem value="zen">Zen</SelectItem>
                <SelectItem value="colleague">Colega</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Notificaciones</div>
            <Button
              variant={props.value.notificationsEnabled ? "default" : "secondary"}
              className="justify-start gap-2"
              onClick={async () => {
                if (props.value.notificationsEnabled) {
                  props.onChange({
                    ...props.value,
                    notificationsEnabled: false,
                  })
                  return
                }

                await props.onRequestNotificationPermission()
              }}
            >
              <Bell className="h-4 w-4" />
              {props.value.notificationsEnabled
                ? "Activadas"
                : "Activar (recomendado)"}
            </Button>
            <div className="text-xs text-muted-foreground">
              Sirven para avisarte aunque estés en otra pestaña.
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Sonido</div>
            <Button
              variant={props.value.soundEnabled ? "default" : "secondary"}
              className="justify-start gap-2"
              onClick={() => {
                props.onChange({ ...props.value, soundEnabled: !props.value.soundEnabled })
              }}
            >
              {props.value.soundEnabled ? "Activado (invasivo)" : "Activar (invasivo)"}
            </Button>
            <div className="text-xs text-muted-foreground">
              Suena cada 5s si la pestaña no está activa. Requiere que hayas pulsado “Empezar” al menos una vez.
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Prueba</div>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={async () => {
                await props.onTestAlert()
              }}
            >
              Probar alerta
            </Button>
            <div className="text-xs text-muted-foreground">
              Lanza una notificación y un beep para verificar permisos en tu navegador.
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
