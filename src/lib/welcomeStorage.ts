const STORAGE_KEY = 'photodropper_welcome_dismissed_at'
const MONTH_MS = 30 * 24 * 60 * 60 * 1000

export function shouldShowWelcome(): boolean {
  if (typeof window === 'undefined') return false
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return true
  const dismissedAt = parseInt(raw, 10)
  if (Number.isNaN(dismissedAt)) return true
  return Date.now() - dismissedAt > MONTH_MS
}

export function dismissWelcome(): void {
  localStorage.setItem(STORAGE_KEY, String(Date.now()))
}
