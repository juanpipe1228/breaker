import { useTheme, ThemeMode } from "@/lib/use-theme"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Sistema",
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useTheme()
  return (
    <div className="grid gap-2">
      <div className="text-sm font-medium">Tema</div>
      <Select
        value={theme}
        onValueChange={(v) => setTheme(v as ThemeMode)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={THEME_LABELS[theme] || "Seleccionar..."} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Claro</SelectItem>
          <SelectItem value="dark">Oscuro</SelectItem>
          <SelectItem value="system">Sistema</SelectItem>
        </SelectContent>
      </Select>
      <div className="text-xs text-muted-foreground">
        Elige claro, oscuro o que siga la preferencia del sistema.
      </div>
    </div>
  )
}
