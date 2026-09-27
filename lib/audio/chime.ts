import type {
  ChimeName,
  ChimePreset,
  ChimeStrike,
  ChimeVoice,
  ChimeVoiceSpec
} from "@/lib/audio/type"

/* Instruments */
const VOICES: Record<ChimeVoice, ChimeVoiceSpec> = {
  // A tuned bar. Bright and percussive, with a clear pitch and quickly fading overtones.
  mallet: {
    type: "triangle",
    attack: 0.01,
    bend: 1.012, // a struck bar is briefly sharp before it settles
    partials: [
      { ratio: 1, gain: 1, decay: 1 },
      { ratio: 3.9, gain: 0.38, decay: 0.3 },
      { ratio: 9.2, gain: 0.12, decay: 0.12 }
    ]
  },

  // A bell. Resonant and glassy, with a sustained fundamental and softly fading shimmer.
  bell: {
    type: "sine",
    attack: 0.01,
    bend: 1,
    partials: [
      { ratio: 1, gain: 1, decay: 1 },
      { ratio: 2, gain: 0.45, decay: 0.55 },
      { ratio: 3, gain: 0.2, decay: 0.35 },
      { ratio: 4.2, gain: 0.08, decay: 0.18 }
    ]
  }
}

/* Mix */
const MASTER_GAIN = 0.3 // Controls the overall volume.
const TONE_HZ = 5200 // Controls the brightness of high frequencies.
const BEND_SEC = 0.06 // Controls how quickly the pitch settles.
const LOOKAHEAD_SEC = 0.02 // Controls how early playback is scheduled.
const CHORUS_CENTS = 7 // Controls the thickness of the sound.
const SILENCE = 0.0001 // Controls the lowest volume during the fade-out. Can't be 0.

/* Notes Used */
const C3 = 130.81
const C4 = 261.63
const E4 = 329.63
const G4 = 392.0
const C5 = 523.25
const D5 = 587.33
const E5 = 659.26
const G5 = 783.99
const C6 = 1046.5
const E6 = 1318.51

/* Presets */
export const CHIME_PRESETS: Record<ChimeName, ChimePreset> = {
  // An ascending triad that builds into a bright, sustained chord.
  focusEnd: [
    { freq: C5, at: 0, ring: 0.4 },
    { freq: E5, at: 0.09, ring: 0.4 },
    { freq: G5, at: 0.18, ring: 0.45 },
    { freq: C6, at: 0.27, ring: 0.5 },
    { freq: C5, at: 0.5, ring: 2.5, gain: 0.5, voice: "bell" },
    { freq: G5, at: 0.5, ring: 2.5, gain: 0.3, voice: "bell" }
  ],

  // A descending triad that settles gently into a low sustained chord.
  breakEnd: [
    { freq: E5, at: 0, ring: 0.35 },
    { freq: C5, at: 0.11, ring: 0.35 },
    { freq: G4, at: 0.22, ring: 0.4 },
    { freq: E4, at: 0.33, ring: 0.45, gain: 0.9 },
    { freq: C4, at: 0.5, ring: 2.5, gain: 0.5, voice: "bell" },
    { freq: G4, at: 0.5, ring: 2.5, gain: 0.3, voice: "bell" }
  ],

  // A longer call-and-response phrase that resolves into a deep, sustained chord.
  cycleEnd: [
    { freq: C6, at: 0, ring: 0.3 },
    { freq: G5, at: 0.1, ring: 0.28 },
    { freq: C6, at: 0.2, ring: 0.3 },
    { freq: E6, at: 0.42, ring: 0.4, gain: 0.7 },

    { freq: G5, at: 0.75, ring: 0.3, gain: 0.85 },
    { freq: E5, at: 0.85, ring: 0.3, gain: 0.85 },
    { freq: C5, at: 0.95, ring: 0.4, gain: 0.9 },

    { freq: G4, at: 1.3, ring: 0.5, gain: 0.8 },
    { freq: D5, at: 1.3, ring: 0.5, gain: 0.5 },

    { freq: C3, at: 1.7, ring: 5.3, gain: 0.55, voice: "bell" },
    { freq: C4, at: 1.7, ring: 5.3, gain: 0.5, voice: "bell" },
    { freq: G4, at: 1.7, ring: 5.3, gain: 0.26, voice: "bell" },
    { freq: C5, at: 1.7, ring: 5.3, gain: 0.34, voice: "bell" },
    { freq: E5, at: 1.7, ring: 5.3, gain: 0.2, voice: "bell" }
  ]
}

export const getChimeDuration = (name: ChimeName) =>
  CHIME_PRESETS[name].reduce((longest, strike) => Math.max(longest, strike.at + strike.ring), 0)

/* Audio Playback */

type Audio = { ctx: AudioContext; output: GainNode }

type Harmonic = {
  type: OscillatorType // Basic waveform used to create the sound.
  pitch: number // Main frequency of the partial, in Hz.
  detune: number // Small pitch offset used to add thickness.
  peak: number // Highest volume of the partial.
  at: number // Time when the partial starts playing.
  attack: number // Time for the volume to rise to its peak.
  bend: number // Starting pitch multiplier before the pitch settles.
  fade: number // Time for the sound to fade out.
}

let audio: Audio | undefined
const playing = new Set<OscillatorNode>()

const getAudio = () => {
  if (typeof window === "undefined") return undefined

  if (!audio) {
    const ctx = new AudioContext()

    const tone = ctx.createBiquadFilter()
    tone.type = "lowpass"
    tone.frequency.value = TONE_HZ
    tone.Q.value = 0.7

    const output = ctx.createGain()
    output.gain.value = MASTER_GAIN
    output.connect(tone).connect(ctx.destination)

    audio = { ctx, output }
  }

  return audio
}

/* Resume audio after the user has interacted with the page. */
export const unlockAudio = async () => {
  const ready = getAudio()

  if (ready?.ctx.state === "suspended") {
    await ready.ctx.resume()
  }
}

const playPartial = ({ ctx, output }: Audio, partial: Harmonic) => {
  const { type, pitch, detune, peak, at, attack, bend, fade } = partial

  const oscillator = ctx.createOscillator()
  const envelope = ctx.createGain()

  oscillator.type = type
  oscillator.detune.value = detune
  oscillator.frequency.setValueAtTime(pitch * bend, at)
  oscillator.frequency.exponentialRampToValueAtTime(pitch, at + BEND_SEC)

  // A fast attack and a long exponential fall is what makes a tone sound struck.
  envelope.gain.setValueAtTime(SILENCE, at)
  envelope.gain.exponentialRampToValueAtTime(peak, at + attack)
  envelope.gain.exponentialRampToValueAtTime(SILENCE, at + fade)

  oscillator.connect(envelope).connect(output)
  oscillator.start(at)
  oscillator.stop(at + fade)

  playing.add(oscillator)
  oscillator.onended = () => playing.delete(oscillator)
}

const strikeNote = (ready: Audio, strike: ChimeStrike, startAt: number) => {
  const { freq, at, ring, gain = 1, voice = "mallet" } = strike
  const { type, attack, bend, partials } = VOICES[voice]

  const total = partials.reduce((sum, partial) => sum + partial.gain, 0)

  partials.forEach((partial, index) => {
    // Only the fundamental is doubled, so the beating thickens the note
    // without smearing its pitch.
    const detunes = index === 0 ? [0, CHORUS_CENTS] : [0]

    detunes.forEach((detune) => {
      playPartial(ready, {
        type,
        pitch: freq * partial.ratio,
        detune,
        peak: (gain * partial.gain) / (total * detunes.length),
        at: startAt + at,
        attack,
        bend,
        fade: ring * partial.decay
      })
    })
  })
}

export const playChime = async (name: ChimeName) => {
  const ready = getAudio()

  if (!ready) return

  await unlockAudio()

  // Nothing is audible while the tab is muted or the context is stopped.
  if (ready.ctx.state !== "running") return

  const startAt = ready.ctx.currentTime + LOOKAHEAD_SEC

  CHIME_PRESETS[name].forEach((strike) => strikeNote(ready, strike, startAt))
}
