const PIN_KEY = "kasir_pin"
const SESSION_KEY = "kasir_session"
const DEFAULT_PIN = "1234"

export function getStoredPin(): string {
  if (typeof window === "undefined") return DEFAULT_PIN
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN
}

export function setPin(newPin: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PIN_KEY, newPin)
}

export function verifyPin(inputPin: string): boolean {
  const storedPin = getStoredPin()
  return inputPin === storedPin
}

export function createSession(): void {
  if (typeof window === "undefined") return
  localStorage.setItem(SESSION_KEY, "authenticated")
}

export function hasActiveSession(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(SESSION_KEY) === "authenticated"
}

export function clearSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEY)
}
