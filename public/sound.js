/*
 * The music: an original ballroom waltz played live by the browser (no audio file, no one else's song).
 * Warm strings, a piano waltz, harp sweeps and a celesta over a slow 3/4 in E-flat, in a concert-hall
 * reverb. Plus a few sounds for the big moments. If SISIMI.music names an audio file the client has the
 * rights to, that plays instead.
 */
window.Sound = (() => {
  const C = window.SISIMI || {}
  const KEY = 'sisimi70-sound'
  const EIGHTH = 60 / 84 / 2 // 3/4 at 84 beats a minute: six eighths a bar
  let ctx, master, music, fx, verb, playing = false, ducked = false, timer = 0, next = 0, tick = 0, song
  const muted = () => { try { return localStorage.getItem(KEY) === 'off' } catch { return false } }
  const remember = (on) => { try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* fine */ } }
  const hz = (m) => 440 * 2 ** ((m - 69) / 12)

  function setup() {
    if (ctx) return true
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false
    ctx = new AC()
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -16; comp.ratio.value = 2.5
    master = ctx.createGain(); master.gain.value = 0
    master.connect(comp).connect(ctx.destination)
    music = ctx.createGain(); music.gain.value = 1; music.connect(master)
    fx = ctx.createGain(); fx.gain.value = 1; fx.connect(master)
    // a concert hall: noise that dies away slowly, a little darker as it fades
    const len = ctx.sampleRate * 2.8, ir = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch); let lp = 0
      for (let i = 0; i < len; i++) { lp += ((Math.random() * 2 - 1) - lp) * (0.6 - 0.5 * i / len); d[i] = lp * (1 - i / len) ** 2.4 }
    }
    verb = ctx.createConvolver(); verb.buffer = ir
    const wet = ctx.createGain(); wet.gain.value = .55
    verb.connect(wet).connect(master)
    document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume() })
    return true
  }

  /* ── instruments ── */
  function voice(type, f, t, { a = .005, d = 1, peak = .1, out = music, wet = .3, detune = 0, lp = 0 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = type; o.frequency.value = f; o.detune.value = detune
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d)
    let node = o
    if (lp) { const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = lp; o.connect(f2); node = f2 }
    node.connect(g); g.connect(out)
    if (wet) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w).connect(verb) }
    o.start(t); o.stop(t + a + d + .1)
  }
  /** A soft grand piano: a few partials, the higher ones fading first. */
  function piano(t, m, v = 1, len = 1.6) {
    const f = hz(m)
    voice('sine', f, t, { d: len, peak: .085 * v, wet: .35 })
    voice('sine', f * 2, t, { d: len * .55, peak: .03 * v, wet: .25 })
    voice('sine', f * 3, t, { d: len * .3, peak: .012 * v, wet: .2 })
    voice('triangle', f, t, { a: .002, d: .08, peak: .02 * v, wet: 0, lp: 3000 })
  }
  /** A string section: detuned bows that swell in and fade out, with a slow vibrato. */
  function strings(t, notes, len, v = 1) {
    for (const m of notes) {
      for (const cents of [-7, 6]) {
        const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), depth = ctx.createGain()
        o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = cents
        lfo.frequency.value = 4.6; depth.gain.value = 5; lfo.connect(depth).connect(o.detune)
        lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = .4
        const peak = .018 * v
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + .9); g.gain.setValueAtTime(peak, t + len - .5); g.gain.linearRampToValueAtTime(0.0001, t + len + .9)
        o.connect(lp).connect(g); g.connect(music)
        const w = ctx.createGain(); w.gain.value = .6; g.connect(w).connect(verb)
        o.start(t); lfo.start(t); o.stop(t + len + 1); lfo.stop(t + len + 1)
      }
    }
  }
  const harp = (t, m, v = 1) => { voice('triangle', hz(m), t, { a: .002, d: 1.8, peak: .06 * v, wet: .5, lp: 2600 }); voice('sine', hz(m) * 2, t, { a: .002, d: .9, peak: .015 * v, wet: .4 }) }
  const celesta = (t, m, v = 1) => { voice('sine', hz(m), t, { a: .002, d: 1.4, peak: .05 * v, wet: .6 }); voice('sine', hz(m) * 4, t, { a: .001, d: .35, peak: .012 * v, wet: .5 }) }
  const bass = (t, m, len = 1.9) => { voice('sine', hz(m), t, { a: .02, d: len, peak: .16, wet: .15 }); voice('triangle', hz(m), t, { a: .02, d: len * .6, peak: .05, wet: .1, lp: 500 }) }

  /* ── the waltz ── */
  // E-flat: Ebmaj7, Cm7, Abmaj7, Bb7, Gm7, Cm7, Fm7, Bb7. Each: bass root, chord for the piano and strings
  const BARS = [
    [39, [63, 67, 70, 74]], [36, [60, 63, 67, 70]], [44, [60, 63, 67, 68]], [46, [58, 62, 65, 68]],
    [43, [58, 62, 65, 67]], [36, [60, 63, 67, 70]], [41, [56, 60, 63, 65]], [46, [58, 62, 65, 68]],
  ]
  // the melody, eight bars: eighth within the bar, note, length in eighths
  const TUNE = [
    [[0, 79, 3], [3, 77, 1], [4, 75, 2]],
    [[0, 79, 4], [4, 82, 2]],
    [[0, 84, 3], [3, 82, 1], [4, 80, 2]],
    [[0, 79, 4], [4, 77, 2]],
    [[0, 82, 3], [3, 79, 1], [4, 77, 2]],
    [[0, 75, 2], [2, 79, 2], [4, 84, 2]],
    [[0, 82, 3], [3, 80, 1], [4, 79, 2]],
    [[0, 77, 6]],
  ]
  function play(n, t) {
    const bar = Math.floor(n / 6), e = n % 6, [root, chord] = BARS[bar % 8], phrase = Math.floor(bar / 8)
    // strings hold every chord, all the way through
    if (e === 0) strings(t, chord.slice(0, 3), EIGHTH * 6, bar < 2 ? .7 : 1)
    // opening: a harp sweep up the chord, then again at every new phrase
    if (bar % 8 === 0) harp(t, chord[e % 4] + (e >= 4 ? 12 : 0), .9)
    if (bar >= 2) {
      // the waltz: bass on one, the chord on two and three
      if (e === 0) bass(t, root)
      if (e === 2 || e === 4) chord.slice(1).forEach((m) => piano(t, m, .55, .7))
    }
    // the melody from the fifth bar, on piano, doubled by celesta every other time round
    if (bar >= 4) for (const [at, m, len] of TUNE[bar % 8]) if (at === e) { piano(t, m, 1, EIGHTH * len + .6); if (phrase % 2 === 1) celesta(t, m + 12, .7) }
    // a sparkle to close each phrase
    if (bar % 8 === 7 && e === 5) [79, 82, 84, 87].forEach((m, i) => celesta(t + i * .07, m + 12, .6))
  }
  function schedule() {
    while (next < ctx.currentTime + .15) { play(tick, next); tick++; next += EIGHTH }
  }

  function fadeTo(v, s = .8) {
    if (!ctx) return
    const g = master.gain, t = ctx.currentTime
    g.cancelScheduledValues(t); g.setValueAtTime(Math.max(g.value, .0001), t); g.exponentialRampToValueAtTime(Math.max(v, .0001), t + s)
  }
  const LEVEL = .85
  const level = () => (ducked ? .0001 : LEVEL)

  function startMusic() {
    if (C.music) {
      song ||= Object.assign(new Audio(C.music), { loop: true, preload: 'auto', volume: .6 })
      song.play().catch(() => {})
    } else if (!timer) {
      tick = 0; next = ctx.currentTime + .05
      timer = setInterval(schedule, 25)
    }
    playing = true
    fadeTo(level(), 2)
    paint()
  }
  function stopMusic() {
    playing = false
    fadeTo(0, .6)
    if (song) song.pause()
    setTimeout(() => { if (!playing) { clearInterval(timer); timer = 0 } }, 700)
    paint()
  }

  /* ── the button ── */
  let btn
  function paint() {
    btn ||= document.getElementById('snd')
    if (!btn) return
    btn.hidden = false
    btn.setAttribute('aria-pressed', String(playing))
    btn.setAttribute('aria-label', playing ? 'Turn the music off' : 'Turn the music on')
    btn.classList.toggle('on', playing)
  }
  function toggle() {
    if (!setup()) return
    ctx.resume()
    if (playing) { stopMusic(); remember(false) } else { startMusic(); remember(true) }
  }

  return {
    /** From the seal tap (the tap is what lets a browser play sound). */
    begin() {
      if (!setup()) return
      ctx.resume()
      fadeTo(LEVEL, .05)
      this.seal()
      if (muted()) { setTimeout(paint, 1200); return }
      setTimeout(() => startMusic(), 1700)
    },
    toggle,
    /** Quiet while a guest records or watches their video, so it isn't in the recording. */
    duck(on) {
      ducked = on
      if (song) song.volume = on ? 0 : .6
      if (playing) fadeTo(level(), .5)
    },
    /** The seal breaks: a harp sweeps up over a soft chord. */
    seal() {
      if (!ctx) return
      const t = ctx.currentTime + .01
      bass(t, 39, 2.4)
      strings(t, [63, 67, 70], 1.6, .8)
      ;[63, 67, 70, 74, 75, 79, 82, 86].forEach((m, i) => harp(t + .05 + i * .06, m, 1.1))
    },
    /** Accepting: the strings swell and the harp rises. */
    joy() {
      if (!ctx || muted()) return
      const t = ctx.currentTime + .01
      strings(t, [67, 70, 74, 79], 1.8, 1.3)
      ;[70, 74, 75, 79, 82, 86, 87, 91].forEach((m, i) => harp(t + i * .05, m, 1))
    },
    /** The pass appears. */
    chime() {
      if (!ctx || muted()) return
      const t = ctx.currentTime + .01
      ;[75, 79, 82, 87, 91].forEach((m, i) => celesta(t + i * .1, m, 1))
    },
  }
})()
