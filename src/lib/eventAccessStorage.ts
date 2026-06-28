const STORAGE_KEY = 'photodropper_event_access'

type StoredAccess = Record<string, { code: string; verifiedAt: number }>

function readStorage(): StoredAccess {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as StoredAccess
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStorage(data: StoredAccess): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function grantEventAccess(eventId: string, code: string): void {
  const next = readStorage()
  next[eventId] = {
    code: code.trim().toUpperCase(),
    verifiedAt: Date.now(),
  }
  writeStorage(next)
}

export function revokeEventAccess(eventId: string): void {
  const next = readStorage()
  delete next[eventId]
  writeStorage(next)
}

export function hasEventAccess(eventId: string): boolean {
  return Boolean(readStorage()[eventId]?.code)
}

export function getEventAccessCode(eventId: string): string | null {
  return readStorage()[eventId]?.code ?? null
}
