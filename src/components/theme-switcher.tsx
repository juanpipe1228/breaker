import { useTheme, ThemeMode } from "@/lib/use-theme"

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
      <select
        className="w-full border rounded px-2 py-1 bg-background text-foreground"
        value={theme}
        onChange={e => setTheme(e.target.value as ThemeMode)}
      >
        <option value="light">Claro</option>
        <option value="dark">Oscuro</option>
        <option value="system">Sistema</option>
      </select>
      <div className="text-xs text-muted-foreground">
        Elige claro, oscuro o que siga la preferencia del sistema.
      </div>
    </div>
  )
}
