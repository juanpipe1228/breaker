import { useCallback, useEffect, useState } from "react"

export type ThemeMode = "light" | "dark" | "system"

const THEME_KEY = "theme-mode"

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function useTheme(): [ThemeMode, (mode: ThemeMode) => void] {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system"
    return (localStorage.getItem(THEME_KEY) as ThemeMode) || "system"
  })

  const applyTheme = useCallback((mode: ThemeMode) => {
    const root = window.document.documentElement
    let applied: "light" | "dark"
    if (mode === "system") {
      applied = getSystemTheme()
    } else {
      applied = mode
    }
    root.classList.toggle("dark", applied === "dark")
  }, [])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    applyTheme(theme)
    if (theme === "system") {
      const listener = () => applyTheme("system")
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", listener)
      return () => window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", listener)
    }
  }, [theme, applyTheme])

  const setAndApplyTheme = useCallback((mode: ThemeMode) => {
    setTheme(mode)
  }, [])

  return [theme, setAndApplyTheme]
}
