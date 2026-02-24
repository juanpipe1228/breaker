"use client"

import { useTheme } from "@/lib/use-theme"
import React from "react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useTheme() // Solo para activar el efecto de tema
  return <>{children}</>
}
