// Web Audio API 8-Bit Arcade Sound Synthesizer (Zero external dependencies)

let audioCtx: AudioContext | null = null

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new AudioContextClass()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

let muted = false

export const isSoundMuted = (): boolean => muted

export const setSoundMuted = (mute: boolean): void => {
  muted = mute
}

export const toggleSoundMuted = (): boolean => {
  muted = !muted
  return muted
}

// 8-Bit Coin / Press Start Sound
export const playCoinSound = (): void => {
  if (muted) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(659.25, now) // E5
    osc.frequency.setValueAtTime(987.77, now + 0.08) // B5

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.35)
  } catch (e) {
    // Graceful fallback if Web Audio is restricted
  }
}

// 8-Bit Button Click / Keypress Blip
export const playBlipSound = (): void => {
  if (muted) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04)

    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.05)
  } catch (e) {
    // Graceful fallback
  }
}

// 8-Bit Victory Fanfare on Login Success
export const playSuccessSound = (): void => {
  if (muted) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      const startTime = now + idx * 0.08
      const duration = idx === notes.length - 1 ? 0.3 : 0.08

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.2, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + duration)
    })
  } catch (e) {
    // Graceful fallback
  }
}

// 8-Bit Access Denied Error Buzzer
export const playErrorSound = (): void => {
  if (muted) return
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(160, now)
    osc.frequency.setValueAtTime(110, now + 0.1)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.25)
  } catch (e) {
    // Graceful fallback
  }
}
