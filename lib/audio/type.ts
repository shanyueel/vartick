export type ChimeVoice = "mallet" | "bell"

/*
  An instrument. The partial ratios are what the ear recognizes: whole numbers
  ring as one note, the rest read as metal.
 */
export type ChimeVoiceSpec = {
  type: OscillatorType
  attack: number // seconds to reach full volume
  bend: number // pitch multiplier at the moment of the strike
  partials: { ratio: number; gain: number; decay: number }[]
}

/*
  One struck note. `at` and `ring` are seconds relative to the start of the
  chime, so a preset reads as a little score.
 */
export type ChimeStrike = {
  freq: number // fundamental, in Hz
  at: number // when the note is struck
  ring: number // how long it takes to fade to silence
  gain?: number // relative loudness, 1 by default
  voice?: ChimeVoice // "mallet" by default
}

export type ChimePreset = ChimeStrike[]

export type ChimeName = "focusEnd" | "breakEnd" | "cycleEnd"
