/*
 * Everything about the day lives here, so a change never means touching the site's code.
 * Times are Lagos time (+01:00).
 */
window.SISIMI = {
  celebrant: 'Mrs. Oyinlola Olowu',
  aka: 'Sisi mi',

  // The client confirmed Sunday. Sunday is 27 December 2026 (the 28th is a Monday).
  dateLabel: 'Sunday, December 27, 2026',
  day: 'Sunday',
  date: 'December 27, 2026',

  events: [
    {
      key: 'thanksgiving',
      title: 'Thanksgiving Service',
      start: '2026-12-27T10:00:00+01:00',
      end: '2026-12-27T12:00:00+01:00', // for calendars only: the invitation gives start times
      time: '10:00 AM',
      venue: 'Chapel of Christ the Light',
      address: 'CIPM Avenue, Alausa, Lagos, Nigeria',
      map: 'https://www.google.com/maps/search/?api=1&query=Chapel+of+Christ+the+Light+CIPM+Avenue+Alausa+Ikeja+Lagos',
    },
    {
      key: 'reception',
      title: 'Reception',
      start: '2026-12-27T14:00:00+01:00',
      end: '2026-12-27T18:00:00+01:00',
      time: '2:00 PM',
      venue: 'The Civic Centre',
      address: 'Ozumba Mbadiwe Avenue, opposite 1004 Estate, Victoria Island, Lagos',
      map: 'https://www.google.com/maps/search/?api=1&query=The+Civic+Centre+Ozumba+Mbadiwe+Avenue+Victoria+Island+Lagos',
    },
  ],

  // RSVPs close at the end of the day itself
  rsvpClosesAt: '2026-12-27T23:59:59+01:00',

  /*
   * The client's Google Form (see google/SETUP.md). Leave `action` empty and the site runs in
   * preview mode: everything works, nothing is sent.
   * action: https://docs.google.com/forms/d/e/<FORM_ID>/formResponse
   */
  form: {
    action: '',
    entries: {
      response: '', // Will you be joining us?
      firstName: '',
      lastName: '',
      whatsapp: '',
      email: '',
      attending: '', // Which part of the day?
      wish: '',
      video: '', // link to their video in Drive
      passCode: '',
    },
  },

  // The exact option wording in the Google Form: the answers must match it letter for letter
  answers: {
    accept: 'Joyfully accept',
    decline: 'Regretfully decline',
    both: 'Thanksgiving service and reception',
    thanksgiving: 'Thanksgiving service only',
    reception: 'Reception only',
  },

  // The Apps Script web app that puts video messages in the client's Drive (see google/SETUP.md)
  videoUploadUrl: '',
  maxVideoMB: 200,
  maxVideoSeconds: 180,

  /*
   * The music. Empty: the site plays its own ballroom waltz (strings, piano, harp), made in the browser.
   * To use a song instead, put the file in assets/ and name it here, e.g. 'assets/song.mp3'.
   * Only use a song the client has the rights to put on a public website.
   */
  music: '',
}
