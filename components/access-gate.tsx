"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

const STORAGE_KEY = "farmo_dev_access"
const STORAGE_VALUE = "granted"
const ACCESS_CODE = "farmo2026"

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [granted, setGranted] = useState<boolean | null>(null)
  const [input, setInput] = useState("")
  const [error, setError] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    setGranted(stored === STORAGE_VALUE)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === ACCESS_CODE) {
      localStorage.setItem(STORAGE_KEY, STORAGE_VALUE)
      setGranted(true)
    } else {
      setError(true)
      setInput("")
    }
  }

  // Render nothing until localStorage is checked (prevents hydration flash)
  if (granted === null) return null

  if (!granted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="mb-3 inline-flex items-center justify-center">
              <Image
                src="/farmo-logo.png"
                alt="Farmo"
                width={190}
                height={56}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This site is currently under development.
              <br />
              Enter the access code to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setError(false)
              }}
              placeholder="Enter access code"
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {error && (
              <p className="text-sm text-destructive text-center">
                Incorrect code. Please try again.
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
