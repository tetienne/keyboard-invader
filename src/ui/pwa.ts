// Installable app: registers the offline service worker and keeps the browser's
// install prompt so the settings can offer an "Install" button.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}

let deferred: BeforeInstallPromptEvent | null = null

export function setupPwa(): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    })
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    // The settings button replaces the browser's own mini-infobar.
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
  })
}

/** True when the browser lets us open its install dialog (Chromium-based browsers). */
export const canInstall = (): boolean => deferred !== null

export async function promptInstall(): Promise<void> {
  const e = deferred
  // A prompt event can only be used once.
  deferred = null
  await e?.prompt()
}
