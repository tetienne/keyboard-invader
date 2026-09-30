import type { Lang } from '../content/words'

/** Reads letters aloud for pre-readers, using the browser's speech synthesis. */
export class Voice {
  enabled = true
  private lastSpoke = 0

  private get synth(): SpeechSynthesis | null {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null
  }

  say(text: string, lang: Lang, minGapMs = 0): void {
    const synth = this.synth
    if (!this.enabled || !synth) return
    const now = performance.now()
    if (now - this.lastSpoke < minGapMs) return
    this.lastSpoke = now
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang === 'fr' ? 'fr-FR' : 'en-US'
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang))
    if (voice) u.voice = voice
    u.rate = 0.95
    u.pitch = 1.25
    u.volume = 0.9
    synth.cancel()
    synth.speak(u)
  }

  stop(): void {
    this.synth?.cancel()
  }
}
