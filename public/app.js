/* Sisi mi @ 70. No framework: petals on one canvas, the envelope, reveals, countdown and the RSVP. */
(() => {
  const C = window.SISIMI
  const $ = (s, el = document) => el.querySelector(s)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const STORE = 'sisimi70-rsvp'
  const EASE = 'cubic-bezier(.16, 1, .3, 1)'
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE) || 'null') } catch { return null } }
  const save = (v) => { try { localStorage.setItem(STORE, JSON.stringify(v)) } catch { /* private mode: the pass still shows now */ } }

  /* ── Petals: one canvas, a few drifting always, bursts on the big moments ── */
  const Petals = (() => {
    const cv = $('#petals'), ctx = cv.getContext('2d')
    const ROSE = ['#E8AFB8', '#D98A9A', '#F2CFC9', '#C7687E', '#F6E1D8', '#EBC0B5']
    const GOLD = ['#D8B36A', '#F2D99C', '#B98B45']
    let W = 0, H = 0, parts = [], ambient = 0, raf = 0, last = 0
    const rnd = (a, b) => a + Math.random() * (b - a)
    const pick = (a) => a[(Math.random() * a.length) | 0]
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2)
      W = innerWidth; H = innerHeight
      cv.width = W * dpr; cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    function make(x, y, o = {}) {
      const gold = o.gold ?? Math.random() < 0.22
      return { x, y, vx: o.vx ?? rnd(-.4, .4), vy: o.vy ?? rnd(.5, 1.3), g: o.g ?? 0, drag: o.drag ?? 1, s: gold ? rnd(3, 6) : rnd(6, 12),
        rot: rnd(0, 6.28), vr: rnd(-.04, .04), flip: rnd(0, 6.28), vf: rnd(.02, .07), t: rnd(0, 6.28), sway: o.sway ?? rnd(.3, .9),
        c: gold ? pick(GOLD) : pick(ROSE), gold, a: 1, fade: o.fade ?? 0, ambient: !!o.ambient }
    }
    function draw(p) {
      ctx.save()
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.abs(Math.cos(p.flip)) * .75 + .25)
      ctx.globalAlpha = p.a; ctx.fillStyle = p.c
      if (p.gold) ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2)
      else {
        const s = p.s
        ctx.beginPath(); ctx.moveTo(0, -s)
        ctx.bezierCurveTo(s * .95, -s * .55, s * .7, s * .7, 0, s)
        ctx.bezierCurveTo(-s * .7, s * .7, -s * .95, -s * .55, 0, -s); ctx.fill()
        ctx.globalAlpha = p.a * .35; ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.ellipse(-s * .2, -s * .25, s * .18, s * .45, -.4, 0, 6.28); ctx.fill()
      }
      ctx.restore()
    }
    function loop(t) {
      const dt = Math.min(48, t - last || 16) / 16
      last = t
      ctx.clearRect(0, 0, W, H)
      let live = 0
      for (const p of parts) {
        p.vy += p.g * dt; p.vx *= p.drag ** dt; p.vy = p.g ? Math.min(p.vy * p.drag ** dt, 6) : p.vy
        p.t += .03 * dt
        p.x += (p.vx + Math.sin(p.t) * p.sway) * dt; p.y += p.vy * dt
        p.rot += p.vr * dt; p.flip += p.vf * dt
        if (p.fade) p.a = Math.max(0, p.a - p.fade * dt)
        if (p.ambient && p.y > H + 20) Object.assign(p, make(rnd(0, W), -20, { ambient: true }))
        p.dead = !p.ambient && (p.y > H + 30 || p.a <= 0)
        if (!p.dead) { draw(p); live++ }
      }
      parts = parts.filter((p) => !p.dead)
      raf = live ? requestAnimationFrame(loop) : 0
    }
    const run = () => { if (!raf && !document.hidden && parts.length) { last = performance.now(); raf = requestAnimationFrame(loop) } }
    document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0 } else run() })
    addEventListener('resize', size, { passive: true })
    size()
    return {
      /** A burst from a point: petals and gold flecks thrown up and out, then falling. */
      burst(x, y, n = 60) {
        if (reduce) return
        for (let i = 0; i < n; i++) {
          const a = rnd(-Math.PI * .95, -Math.PI * .05), v = rnd(5, 13)
          parts.push(make(x, y, { drag: .985, fade: rnd(.002, .005), g: .16, sway: rnd(.2, .6), vx: Math.cos(a) * v, vy: Math.sin(a) * v }))
        }
        run()
      },
      /** Petals falling from the top for a moment. */
      shower(n = 40) {
        if (reduce) return
        for (let i = 0; i < n; i++) parts.push(make(rnd(0, W), rnd(-H * .6, -10), { vy: rnd(1.6, 3), fade: .0015 }))
        run()
      },
      /** A few petals drifting the whole time. */
      ambient(on) {
        if (reduce) return
        const want = on ? (W < 640 ? 9 : 16) : 0
        parts = parts.filter((p) => !p.ambient)
        for (let i = 0; i < want; i++) parts.push(make(rnd(0, W), rnd(-H, H), { ambient: true }))
        ambient = want
        run()
      },
      /** One petal, slowly. */
      single() {
        if (reduce) return
        parts.push(make(W / 2, -20, { gold: false, vy: .9, sway: 1.2, fade: 0 }))
        run()
      },
    }
  })()

  /* ── Words that arrive one by one ── */
  document.querySelectorAll('[data-words]').forEach((el) => {
    el.setAttribute('aria-label', el.textContent.trim())
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w, i) => `<span aria-hidden="true" class="w" style="--i:${i}">${esc(w)}</span>`).join(' ')
  })

  /* ── Reveal on scroll ── */
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target) }
  }, { rootMargin: '0px 0px -12% 0px', threshold: .15 })
  document.querySelectorAll('.reveal, main section:not(.hero) [data-words]').forEach((el) => seen.observe(el))

  /* ── The envelope ── */
  const gate = $('#gate'), seal = $('#seal'), flap = $('#envFlap'), card = $('#envCard')
  function showSite() {
    document.body.classList.remove('locked')
    document.body.classList.add('shown')
    const kicker = $('.hero .kicker'), tag = $('.hero .tagline')
    kicker.style.setProperty('--d', '200ms'); tag.style.setProperty('--d', '2900ms')
    requestAnimationFrame(() => { kicker.classList.add('in'); tag.classList.add('in') })
    setTimeout(() => Petals.ambient(true), 1800)
  }
  async function openGate() {
    if (gate.classList.contains('opening')) return
    gate.classList.add('opening')
    window.Sound?.begin() // the tap is what lets the browser play sound
    if (reduce) {
      await gate.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished
      gate.remove(); showSite(); return
    }
    const r = seal.getBoundingClientRect()
    navigator.vibrate?.(18)
    Petals.burst(r.left + r.width / 2, r.top + r.height / 2, innerWidth < 640 ? 55 : 80)
    const [l, rr] = seal.querySelectorAll('.seal-half')
    const half = (el, dir) => el.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dir * 70}%, 60%) rotate(${dir * 32}deg)`, opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'forwards' })
    half(l, -1); half(rr, 1)
    await flap.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(90deg)' }], { delay: 160, duration: 360, easing: 'ease-in', fill: 'forwards' }).finished
    flap.style.zIndex = 1
    await flap.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(180deg)' }], { duration: 380, easing: 'ease-out', fill: 'forwards' }).finished
    await card.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-74%)' }], { duration: 950, easing: EASE, fill: 'forwards' }).finished
    // the envelope falls away, the card comes forward and becomes the page
    for (const el of gate.querySelectorAll('.env-back, .env-front, .env-flap, .seal')) el.animate([{ translate: '0 0', opacity: 1 }, { translate: '0 55vh', opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' })
    card.animate([{ transform: 'translateY(-74%) scale(1)' }, { transform: 'translateY(-60%) scale(1.5)', opacity: 0, filter: 'blur(6px)' }], { delay: 250, duration: 900, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'forwards' })
    await wait(520)
    showSite()
    Petals.shower(innerWidth < 640 ? 24 : 40)
    await gate.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'ease', fill: 'forwards' }).finished
    gate.remove()
  }
  seal.addEventListener('click', openGate)
  $('#gateHint').addEventListener('click', openGate)

  /* ── The day: words from the settings, maps, calendar ── */
  $('#weekday').textContent = C.day
  $('#dateText').textContent = C.date
  $('.foot p:last-child').textContent = `${C.dateLabel} · Lagos`
  for (const a of document.querySelectorAll('[data-map]')) a.href = C.events.find((e) => e.key === a.dataset.map).map
  const utc = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const first = C.events[0], lastEv = C.events[C.events.length - 1]
  $('#gcal').href = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
    action: 'TEMPLATE', dates: `${utc(first.start)}/${utc(lastEv.end)}`,
    details: C.events.map((e) => `${e.title}: ${e.time}, ${e.venue}, ${e.address}`).join('\n'),
    location: `${first.venue}, ${first.address}`, text: `Sisi mi @ 70 · ${C.celebrant}'s 70th Birthday`,
  })
  function downloadIcs() {
    const stamp = utc(new Date().toISOString())
    const fold = (s) => s.replace(/[,;\\]/g, (c) => '\\' + c)
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sisi mi 70//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      ...C.events.flatMap((e) => ['BEGIN:VEVENT', `UID:${e.key}-sisimi70`, `DTSTAMP:${stamp}`, `DTSTART:${utc(e.start)}`, `DTEND:${utc(e.end)}`,
        `SUMMARY:${fold(`Sisi mi @ 70 · ${e.title}`)}`, `LOCATION:${fold(`${e.venue}, ${e.address}`)}`, `DESCRIPTION:${fold(`${C.celebrant}'s 70th Birthday`)}`,
        'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Sisi mi @ 70 is tomorrow', 'END:VALARM', 'END:VEVENT']),
      'END:VCALENDAR'].join('\r\n')
    const a = Object.assign(document.createElement('a'), { download: 'sisimi-70.ics', href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })) })
    document.body.append(a); a.click(); a.remove()
  }
  $('#addCal').addEventListener('click', downloadIcs)
  $('#snd').addEventListener('click', () => window.Sound?.toggle())

  /* ── Countdown ── */
  const start = new Date(first.start).getTime(), closes = new Date(C.rsvpClosesAt).getTime()
  const cells = Object.fromEntries([...document.querySelectorAll('[data-u]')].map((b) => [b.dataset.u, b]))
  function tick() {
    const now = Date.now(), left = start - now
    if (left <= 0) {
      $('#clock').hidden = true
      const note = $('#countNote')
      note.hidden = false
      note.textContent = now < closes ? 'Today is the day. See you there!' : 'Thank you for celebrating Sisi mi with us.'
      return
    }
    const v = { d: Math.floor(left / 864e5), h: Math.floor(left / 36e5) % 24, m: Math.floor(left / 6e4) % 60, s: Math.floor(left / 1e3) % 60 }
    for (const k in v) {
      const text = String(v[k]).padStart(2, '0')
      if (cells[k].textContent !== text) {
        cells[k].textContent = text
        if (!reduce) { cells[k].classList.remove('tick'); void cells[k].offsetWidth; cells[k].classList.add('tick') }
      }
    }
    setTimeout(tick, 1000 - (now % 1000))
  }
  tick()

  /* ── RSVP ── */
  const stage = $('#stage'), stepsEl = $('#steps'), bar = $('#progressBar')
  const closed = Date.now() > closes
  const COUNTRIES = [['+234', 'NG'], ['+44', 'UK'], ['+1', 'US/CA'], ['+233', 'GH'], ['+27', 'ZA'], ['+254', 'KE'], ['+971', 'AE'], ['+353', 'IE'], ['+49', 'DE'], ['+33', 'FR'], ['+31', 'NL'], ['+61', 'AU'], ['+966', 'SA'], ['+974', 'QA'], ['+225', 'CI'], ['+221', 'SN']]
  const blank = () => ({ response: '', firstName: '', lastName: '', cc: '+234', phone: '', email: '', attending: 'both', wish: '', video: null, code: '' })
  let S = blank(), flow = [], at = 0, opener = null

  const sealIcon = (accept) => `<svg viewBox="0 0 120 120" aria-hidden="true"><use href="#wax"/>${accept ? '' : '<path d="M44 44l32 32M76 44 44 76" stroke="#F1D79A" stroke-width="4" stroke-linecap="round"/>'}</svg>`
  const icons = {
    cam: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="13" height="12" rx="3"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
  }

  const STEPS = {
    choice: {
      html: () => `<h3 id="stageTitle">Will you be joining us?</h3><p class="sub">${esc(C.dateLabel)}</p>
        <div class="choices"><button class="choice" data-pick="accept" type="button">${sealIcon(true)}<b>Joyfully<br>accept</b></button>
        <button class="choice decline" data-pick="decline" type="button">${sealIcon(false)}<b>Regretfully<br>decline</b></button></div>`,
      bind(el) {
        el.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', (ev) => {
          S.response = b.dataset.pick
          flow = S.response === 'accept' ? ['choice', 'name', 'contact', 'attending', 'wish', 'video', 'send', 'done'] : ['choice', 'name', 'wish', 'video', 'send', 'regrets']
          if (S.response === 'accept') { const r = b.getBoundingClientRect(); Petals.burst(r.left + r.width / 2, r.top + r.height / 3, 45); window.Sound?.joy() }
          next()
        }))
      },
    },
    name: {
      html: () => `<h3 id="stageTitle">${S.response === 'accept' ? "Let's get you on the list" : "We're sorry you can't make it"}</h3>
        <p class="sub">${S.response === 'accept' ? 'Your name, as it should appear on your pass.' : 'Tell us who you are, and leave Sisi mi a wish.'}</p>
        <div class="fields two"><div class="field"><label for="fn">First name</label><input autocomplete="given-name" class="input" id="fn" maxlength="60" value="${esc(S.firstName)}"></div>
        <div class="field"><label for="ln">Last name</label><input autocomplete="family-name" class="input" id="ln" maxlength="60" value="${esc(S.lastName)}"></div></div>`,
      done(el) {
        S.firstName = el.querySelector('#fn').value.trim(); S.lastName = el.querySelector('#ln').value.trim()
        if (!S.firstName || !S.lastName) return 'Please add your first and last name.'
      },
    },
    contact: {
      html: () => `<h3 id="stageTitle">How can we reach you?</h3><p class="sub">In case anything about the day changes.</p>
        <div class="fields"><div class="field"><label for="ph">WhatsApp number</label><div class="phone">
        <select aria-label="Country code" class="input" id="cc">${COUNTRIES.map(([c, n]) => `<option ${c === S.cc ? 'selected' : ''} value="${c}">${n} ${c}</option>`).join('')}</select>
        <input autocomplete="tel-national" class="input" id="ph" inputmode="tel" maxlength="20" placeholder="803 123 4567" value="${esc(S.phone)}"></div></div>
        <div class="field"><label for="em">Email <i>(optional)</i></label><input autocomplete="email" class="input" id="em" inputmode="email" maxlength="120" type="email" value="${esc(S.email)}"></div></div>`,
      done(el) {
        S.cc = el.querySelector('#cc').value
        S.phone = el.querySelector('#ph').value.trim(); S.email = el.querySelector('#em').value.trim()
        const digits = S.phone.replace(/\D/g, '')
        if (digits.length < 7 || digits.length > 15) return 'Please add a WhatsApp number we can reach.'
        if (S.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(S.email)) return "That email doesn't look right."
      },
    },
    attending: {
      html: () => `<h3 id="stageTitle">Which part of the day?</h3><p class="sub">Your pass admits one.</p>
        <div class="opts" role="radiogroup">${[['both', 'Both', 'Thanksgiving at 10:00 AM, reception at 2:00 PM'], ['thanksgiving', 'Thanksgiving service', '10:00 AM · Chapel of Christ the Light'], ['reception', 'Reception', '2:00 PM · The Civic Centre']]
          .map(([v, t, s]) => `<button aria-checked="${S.attending === v}" class="opt" data-v="${v}" role="radio" type="button"><span><b>${t}</b><span>${s}</span></span></button>`).join('')}</div>`,
      bind(el) {
        el.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
          S.attending = b.dataset.v
          el.querySelectorAll('.opt').forEach((o) => o.setAttribute('aria-checked', String(o === b)))
        }))
      },
    },
    wish: {
      html: () => `<h3 id="stageTitle">A wish for Sisi mi</h3><p class="sub">A few words she'll treasure. Optional.</p>
        <div class="fields"><div class="field">
        <textarea aria-label="Your birthday wish" class="input" id="wi" maxlength="300" placeholder="Happy 70th, Sisi mi…">${esc(S.wish)}</textarea><p class="counter" id="wc">${S.wish.length}/300</p></div></div>`,
      bind(el) { const t = el.querySelector('#wi'); t.addEventListener('input', () => { el.querySelector('#wc').textContent = `${t.value.length}/300` }) },
      done(el) { S.wish = el.querySelector('#wi').value.trim() },
    },
    video: {
      next: () => (S.response === 'accept' ? 'Send my RSVP' : 'Send my wishes'),
      html: () => `<h3 id="stageTitle">Say it on video</h3><p class="sub">Record a short birthday message for Sisi mi, or choose one from your phone. Optional, up to ${Math.round(C.maxVideoSeconds / 60)} minutes.</p><div id="vid"></div>`,
      // the music goes quiet here, so it isn't in anyone's recording
      bind(el) { window.Sound?.duck(true); Video.mount(el.querySelector('#vid')) },
      leave() { Video.stop(); window.Sound?.duck(false) },
    },
    send: {
      bare: true,
      html: () => `<h3 id="stageTitle">${S.video ? 'Sending your love…' : 'Sending…'}</h3><p class="sub" id="sendSub">${S.video ? 'Uploading your video. Keep this page open.' : 'One moment.'}</p>
        <svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="bg" cx="60" cy="60" r="52"/><circle class="fg" cx="60" cy="60" id="ringFg" r="52"/><text id="ringPct" text-anchor="middle" x="60" y="69">0%</text></svg>
        <p class="err" id="sendErr" role="alert"></p><div class="nav" hidden id="sendRetry"><button class="btn btn-gold" id="retry" type="button">Try again</button><button class="btn btn-ghost" hidden id="noVideo" type="button">Send without the video</button></div>`,
      bind(el) { send(el) },
    },
    done: {
      bare: true,
      html: () => `<h3 id="stageTitle">You're on the list!</h3><p class="sub">We can't wait to celebrate with you, ${esc(S.firstName)}.</p>
        ${ticketHtml()}
        <div class="done-actions"><button class="btn btn-gold" id="savePass" type="button">Save my pass</button>
        <button class="btn btn-soft" id="calPass" type="button">Add the day to my calendar</button>
        <button class="btn btn-ghost" id="finish" type="button">Back to the invitation</button></div>`,
      bind(el) {
        drawQr(el.querySelector('.t-qr'))
        el.querySelector('#savePass').addEventListener('click', savePass)
        el.querySelector('#calPass').addEventListener('click', downloadIcs)
        el.querySelector('#finish').addEventListener('click', close)
        setTimeout(() => window.Sound?.chime(), 350)
        if (!reduce) setTimeout(() => { const r = el.querySelector('.ticket').getBoundingClientRect(); Petals.burst(r.left + r.width / 2, r.top + 30, 90) }, 450)
      },
    },
    regrets: {
      bare: true,
      html: () => `<h3 id="stageTitle">We'll miss you</h3><p class="sub">${S.wish || S.video ? `Thank you for your wishes, ${esc(S.firstName)}. Sisi mi will feel your love.` : `Thank you for letting us know, ${esc(S.firstName)}.`}</p>
        <div class="done-actions"><button class="btn btn-soft" id="finish" type="button">Back to the invitation</button></div>`,
      bind(el) { el.querySelector('#finish').addEventListener('click', close); Petals.single() },
    },
  }

  function render(dir = 1) {
    const id = flow[at] ?? 'choice', step = STEPS[id]
    const el = document.createElement('div')
    el.className = 'step'
    el.innerHTML = step.html() + (step.bare || id === 'choice' ? '' : `<p class="err" role="alert"></p><div class="nav"><button class="btn btn-gold" data-next type="button">${step.next?.() ?? 'Continue'}</button>${at > 0 ? '<button class="btn btn-ghost" data-back type="button">Back</button>' : ''}</div>`)
    el.querySelector('[data-next]')?.addEventListener('click', () => {
      const problem = step.done?.(el)
      if (problem) { const e = el.querySelector('.err'); e.textContent = problem; e.animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 280 }); return }
      next()
    })
    el.querySelector('[data-back]')?.addEventListener('click', () => { step.done?.(el); back() })
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); el.querySelector('[data-next]')?.click() } })
    const old = stepsEl.firstElementChild
    const swap = () => {
      stepsEl.replaceChildren(el)
      step.bind?.(el)
      if (!reduce) el.animate([{ opacity: 0, transform: `translateX(${dir * 36}px)` }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE })
      const focus = el.querySelector('input, textarea, .choice, .opt[aria-checked="true"]') || el.querySelector('h3')
      if (focus?.matches('h3')) focus.tabIndex = -1
      focus?.focus({ preventScroll: true })
      $('#stageCard').scrollTop = 0
    }
    // no leaving mid-upload
    $('#stageClose').hidden = id === 'send'
    const total = Math.max(flow.length - 1, 1)
    bar.style.width = `${Math.round((at / total) * 100)}%`
    if (old && !reduce) old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${dir * -36}px)` }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished.then(swap)
    else swap()
  }
  function next() { STEPS[flow[at]]?.leave?.(); at++; render(1) }
  function back() { STEPS[flow[at]]?.leave?.(); at = Math.max(0, at - 1); render(-1) }

  function open(fromStart = true) {
    opener = document.activeElement
    if (fromStart) { at = 0; flow = ['choice'] }
    stage.hidden = false
    document.body.style.overflow = 'hidden'
    Petals.ambient(false) // nothing drifting over the form or the camera; the bursts still come
    if (!reduce) {
      stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 })
      $('#stageCard').animate([{ opacity: 0, transform: 'translateY(40px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: EASE })
    }
    render(1)
  }
  async function close() {
    STEPS[flow[at]]?.leave?.()
    if (!reduce) await stage.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' }).finished
    stage.hidden = true
    stage.getAnimations().forEach((a) => a.cancel())
    document.body.style.overflow = ''
    Petals.ambient(true)
    paintRsvp()
    opener?.focus?.({ preventScroll: true })
  }
  $('#stageClose').addEventListener('click', close)
  stage.addEventListener('click', (e) => { if (e.target === stage && !['send'].includes(flow[at])) close() })
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !stage.hidden && flow[at] !== 'send') close() })

  /* the RSVP section: respond, or your pass if you already have */
  function paintRsvp() {
    const box = $('#rsvpActions'), lead = $('#rsvpLead'), mine = load()
    if (closed) { lead.textContent = 'RSVPs have closed. Thank you for celebrating Sisi mi with us.'; box.replaceChildren(); return }
    if (mine?.response === 'accept') {
      lead.textContent = `You're on the list, ${mine.firstName}. Your pass admits one.`
      box.innerHTML = '<button class="btn btn-gold" id="viewPass" type="button">View my pass</button><button class="btn btn-ghost" id="redo" type="button">Change my response</button>'
    } else if (mine?.response === 'decline') {
      lead.textContent = `Thank you for letting us know, ${mine.firstName}. We'll miss you.`
      box.innerHTML = '<button class="btn btn-soft" id="redo" type="button">Changed your mind?</button>'
    } else {
      box.innerHTML = '<button class="btn btn-gold" id="openRsvp" type="button">Respond to the invitation</button>'
    }
    $('#openRsvp')?.addEventListener('click', () => open(true))
    $('#redo')?.addEventListener('click', () => { S = { ...blank(), firstName: mine.firstName, lastName: mine.lastName, cc: mine.cc || '+234', phone: mine.phone || '', email: mine.email || '', code: mine.code }; open(true) })
    $('#viewPass')?.addEventListener('click', () => { S = { ...blank(), ...mine, video: null }; flow = ['done']; at = 0; open(false) })
  }
  paintRsvp()

  /* ── Sending: the video to Drive first, then the answers to the Google Form ── */
  const ANS = C.answers
  function passCode() {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = crypto.getRandomValues(new Uint8Array(6))
    return 'SM-' + [...b].map((x) => A[x % A.length]).join('')
  }
  async function uploadVideo(file, onProgress) {
    if (!C.videoUploadUrl) { for (let p = 0; p <= 1; p += .08) { onProgress(p); await wait(120) } return { id: 'preview' } }
    const mimeType = file.type || 'video/mp4'
    const res = await fetch(C.videoUploadUrl, { body: JSON.stringify({ action: 'start', code: S.code, mimeType, name: `${S.firstName} ${S.lastName}`, size: file.size }), method: 'POST' })
    const j = await res.json()
    if (!j.ok) throw new Error(j.error || 'The upload could not start')
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest()
      x.open('PUT', j.uploadUrl)
      x.setRequestHeader('Content-Type', mimeType)
      x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
      x.onload = () => (x.status >= 200 && x.status < 300 ? resolve(JSON.parse(x.responseText || '{}')) : reject(new Error(`Upload stopped (${x.status})`)))
      x.onerror = () => reject(new Error('The connection dropped'))
      x.send(file)
    })
  }
  async function submitForm(fields) {
    const e = C.form.entries, body = new URLSearchParams()
    for (const [k, v] of Object.entries(fields)) if (e[k] && v) body.append(`entry.${e[k]}`, v)
    if (!C.form.action) { console.info('[preview] would send to the Google Form:', Object.fromEntries(Object.entries(fields).filter(([, v]) => v))); await wait(700); return }
    // Google doesn't let a page read the answer (no-cors), so a network error is the only failure we can see
    await fetch(C.form.action, { body, method: 'POST', mode: 'no-cors' })
  }
  async function send(el, skipVideo = false) {
    const fg = el.querySelector('#ringFg'), pct = el.querySelector('#ringPct'), err = el.querySelector('#sendErr'), retry = el.querySelector('#sendRetry')
    const show = (p) => { fg.style.strokeDashoffset = String(327 * (1 - p)); pct.textContent = `${Math.round(p * 100)}%` }
    err.textContent = ''; retry.hidden = true
    S.code ||= passCode()
    let videoLink = ''
    try {
      if (S.video && !skipVideo) {
        const f = await uploadVideo(S.video, (p) => show(p * .9))
        videoLink = f.id === 'preview' ? '(preview: video not uploaded)' : `https://drive.google.com/file/d/${f.id}/view`
      }
    } catch (e) {
      err.textContent = `Your video didn't send: ${e.message}. Try again, or send without it.`
      retry.hidden = false; el.querySelector('#noVideo').hidden = false
      el.querySelector('#retry').onclick = () => send(el)
      el.querySelector('#noVideo').onclick = () => send(el, true)
      return
    }
    try {
      show(.94)
      await submitForm({
        attending: S.response === 'accept' ? ANS[S.attending] : '',
        email: S.email, firstName: S.firstName, lastName: S.lastName,
        passCode: S.response === 'accept' ? S.code : '', response: ANS[S.response],
        video: videoLink, whatsapp: S.phone ? `${S.cc} ${S.phone}` : '', wish: S.wish,
      })
      show(1)
    } catch {
      err.textContent = "We couldn't send your RSVP. Check your connection and try again."
      retry.hidden = false; el.querySelector('#noVideo').hidden = true
      el.querySelector('#retry').onclick = () => send(el, skipVideo)
      return
    }
    save({ attending: S.attending, at: new Date().toISOString(), cc: S.cc, code: S.code, email: S.email, firstName: S.firstName, lastName: S.lastName, phone: S.phone, response: S.response })
    await wait(reduce ? 0 : 350)
    next()
  }

  /* ── The pass ── */
  const PART = { both: 'Thanksgiving & reception', reception: 'Reception · 2:00 PM', thanksgiving: 'Thanksgiving · 10:00 AM' }
  const ticketHtml = () => `<div class="ticket ${reduce ? '' : 'ticket-in'}"><p class="t-k">Sisi mi @ 70</p><p class="t-name">${esc(S.firstName)} ${esc(S.lastName)}</p>
    <p class="t-when">${esc(C.dateLabel)}<br>${esc(PART[S.attending] || PART.both)}</p><div class="t-qr" role="img" aria-label="Pass code ${esc(S.code)}"></div><p class="t-code">${esc(S.code)}</p>
    <div class="t-band"><small>Invitation</small>Admits One</div></div>`
  let qrLib
  const qrReady = () => (qrLib ||= new Promise((res, rej) => { const s = Object.assign(document.createElement('script'), { onerror: rej, onload: () => res(window.qrcode), src: 'vendor/qrcode.js' }); document.head.append(s) }))
  async function qrFor(text) { const q = (await qrReady())(0, 'M'); q.addData(text); q.make(); return q }
  async function drawQr(box) {
    const q = await qrFor(`SISIMI70 ${S.code} ${S.firstName} ${S.lastName}`)
    const n = q.getModuleCount(), cv = document.createElement('canvas'), x = cv.getContext('2d')
    cv.width = cv.height = n
    x.fillStyle = '#fff'; x.fillRect(0, 0, n, n); x.fillStyle = '#3D463B'
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) x.fillRect(c, r, 1, 1)
    box.replaceChildren(cv)
  }
  async function savePass() {
    await document.fonts.ready
    const q = await qrFor(`SISIMI70 ${S.code} ${S.firstName} ${S.lastName}`)
    const W = 1080, H = 1500, cv = document.createElement('canvas'), x = cv.getContext('2d')
    cv.width = W; cv.height = H
    const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#FBF1EC'); bg.addColorStop(1, '#EBC9C0')
    x.fillStyle = bg; x.fillRect(0, 0, W, H)
    const gold = x.createLinearGradient(0, 0, W, 0); gold.addColorStop(0, '#9C7434'); gold.addColorStop(.5, '#E8C981'); gold.addColorStop(1, '#9C7434')
    x.strokeStyle = gold; x.lineWidth = 4; x.strokeRect(50, 50, W - 100, H - 100); x.lineWidth = 1.5; x.strokeRect(70, 70, W - 140, H - 140)
    x.textAlign = 'center'
    x.fillStyle = '#3D463B'; x.font = '600 34px "Cormorant Garamond"'; x.letterSpacing = '10px'; x.fillText('SISI MI AT SEVENTY', W / 2, 190)
    x.letterSpacing = '0px'; x.fillStyle = gold; x.font = '400 150px "Pinyon Script"'; x.fillText('Birthday', W / 2, 360)
    x.fillStyle = '#A8546A'; x.font = '700 72px "Cormorant Garamond"'; x.fillText(`${S.firstName} ${S.lastName}`.slice(0, 26), W / 2, 500)
    x.fillStyle = '#6E7369'; x.font = '500 42px "Cormorant Garamond"'; x.fillText(C.dateLabel, W / 2, 575); x.fillText(PART[S.attending] || PART.both, W / 2, 630)
    const n = q.getModuleCount(), cell = Math.floor(440 / n), size = cell * n, qx = Math.round((W - size) / 2), qy = 700
    x.fillStyle = '#fff'; x.fillRect(qx - 30, qy - 30, size + 60, size + 60)
    x.fillStyle = '#3D463B'
    x.beginPath()
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) x.rect(qx + c * cell, qy + r * cell, cell, cell)
    x.fill()
    x.font = '600 46px ui-monospace, monospace'; x.letterSpacing = '8px'; x.fillText(S.code, W / 2, qy + size + 100)
    x.letterSpacing = '0px'; x.fillStyle = '#5E6E58'; x.fillRect(70, H - 250, W - 140, 180)
    x.fillStyle = '#E7DCC4'; x.font = '700 26px "Cormorant Garamond"'; x.letterSpacing = '8px'; x.fillText('INVITATION', W / 2, H - 185)
    x.fillStyle = '#F2D99C'; x.font = '600 64px "Cormorant Garamond"'; x.letterSpacing = '6px'; x.fillText('ADMITS ONE', W / 2, H - 112)
    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'))
    const file = new File([blob], `sisimi70-pass-${S.code}.png`, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: 'My pass · Sisi mi @ 70' }); return } catch (e) { if (e.name === 'AbortError') return } }
    const a = Object.assign(document.createElement('a'), { download: file.name, href: URL.createObjectURL(blob) })
    document.body.append(a); a.click(); a.remove()
  }

  /* ── Video message: record in the page, or choose a file ── */
  const Video = (() => {
    let box, stream, rec, chunks = [], timer, startedAt = 0
    const maxMB = C.maxVideoMB, maxS = C.maxVideoSeconds
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
    const type = () => ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || ''
    function stop() {
      clearInterval(timer)
      if (rec && rec.state !== 'inactive') { rec.onstop = null; rec.stop() }
      stream?.getTracks().forEach((t) => t.stop()); stream = null
    }
    function choose(capture) {
      const inp = Object.assign(document.createElement('input'), { accept: 'video/*', type: 'file' })
      if (capture) inp.setAttribute('capture', 'user')
      inp.onchange = () => { const f = inp.files?.[0]; if (f) check(f) }
      inp.click()
    }
    function check(f) {
      if (f.size > maxMB * 1048576) return idle(`That video is over ${maxMB} MB. Please choose a shorter one.`)
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); if (isFinite(v.duration) && v.duration > maxS + 5) idle(`Please keep it under ${Math.round(maxS / 60)} minutes.`); else { S.video = f; preview() } }
      v.onerror = () => { S.video = f; preview() } // some phones can't read the length here; the upload still works
      v.src = URL.createObjectURL(f)
    }
    const navWaits = (on) => { const nav = box.closest('.step')?.querySelector(':scope > .nav'); if (nav) nav.hidden = on }
    function idle(note = '') {
      stop()
      navWaits(false)
      box.innerHTML = `<div class="vid-choices"><button class="btn btn-soft" id="vRec" type="button">${icons.cam}Record a message</button><button class="btn btn-soft" id="vPick" type="button">${icons.up}Choose a video</button></div>
        <p class="vid-note">${esc(note) || 'It goes straight to the family.'}</p>`
      box.querySelector('#vRec').onclick = record
      box.querySelector('#vPick').onclick = () => choose(false)
    }
    async function record() {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return choose(true)
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: 'user', height: { ideal: 960 }, width: { ideal: 720 } } }) } catch { return idle('We couldn’t reach your camera. You can choose a video instead.') }
      navWaits(true)
      box.innerHTML = `<div class="screen mirror"><video autoplay class="live" muted playsinline></video><span class="rec-time" id="vT">${fmt(0)} / ${fmt(maxS)}</span>
        <div class="rec"><button aria-label="Start recording" class="rec-btn" id="vGo" type="button"><i></i></button></div></div><div class="nav"><button class="btn btn-ghost" id="vCancel" type="button">Cancel</button></div>`
      box.querySelector('video').srcObject = stream
      box.querySelector('#vCancel').onclick = () => idle()
      const go = box.querySelector('#vGo'), t = box.querySelector('#vT')
      go.onclick = () => {
        if (rec?.state === 'recording') { rec.stop(); return }
        chunks = []
        rec = new MediaRecorder(stream, type() ? { mimeType: type(), videoBitsPerSecond: 2_000_000 } : undefined)
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
        rec.onstop = () => {
          clearInterval(timer)
          const mime = (rec.mimeType || 'video/webm').split(';')[0]
          const ext = mime.includes('mp4') ? 'mp4' : 'webm'
          S.video = new File(chunks, `message.${ext}`, { type: mime })
          stream?.getTracks().forEach((tr) => tr.stop()); stream = null
          preview()
        }
        rec.start(1000); startedAt = Date.now()
        go.classList.add('on'); go.setAttribute('aria-label', 'Stop recording'); t.classList.add('on')
        timer = setInterval(() => { const s = (Date.now() - startedAt) / 1000; t.textContent = `${fmt(s)} / ${fmt(maxS)}`; if (s >= maxS) rec.stop() }, 250)
      }
    }
    function preview() {
      navWaits(false)
      const url = URL.createObjectURL(S.video)
      box.innerHTML = `<div class="screen"><video controls playsinline src="${url}"></video></div>
        <p class="vid-note">${(S.video.size / 1048576).toFixed(1)} MB · it sends with your RSVP.</p><div class="nav"><button class="btn btn-ghost" id="vRemove" type="button">Remove this video</button></div>`
      box.querySelector('#vRemove').onclick = () => { S.video = null; idle() }
    }
    return { mount(el) { box = el; S.video ? preview() : idle() }, stop }
  })()
})()
