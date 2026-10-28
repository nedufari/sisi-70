/*
 * Everything about the day lives here, so a change never means touching the site's code.
 * Times are Lagos time (+01:00).
 */
window.SISIMI = {
  celebrant: 'Mrs. Oyinlola Olowu',
  aka: 'Sisi mi',

  // Confirmed by the client: Monday, 28 December 2026 (the printed invitation's "Sunday" is a typo).
  dateLabel: 'Monday, December 28, 2026',
  day: 'Monday',
  date: 'December 28, 2026',

  events: [
    {
      key: 'thanksgiving',
      title: 'Thanksgiving Service',
      start: '2026-12-28T10:00:00+01:00',
      end: '2026-12-28T12:00:00+01:00', // for calendars only: the invitation gives start times
      time: '10:00 AM',
      venue: 'Chapel of Christ the Light',
      address: 'CIPM Avenue, Alausa, Lagos, Nigeria',
      map: 'https://www.google.com/maps/search/?api=1&query=Chapel+of+Christ+the+Light+CIPM+Avenue+Alausa+Ikeja+Lagos',
    },
    {
      key: 'reception',
      title: 'Reception',
      start: '2026-12-28T14:00:00+01:00',
      end: '2026-12-28T18:00:00+01:00',
      time: '2:00 PM',
      venue: 'The Civic Centre',
      address: 'Ozumba Mbadiwe Avenue, opposite 1004 Estate, Victoria Island, Lagos',
      map: 'https://www.google.com/maps/search/?api=1&query=The+Civic+Centre+Ozumba+Mbadiwe+Avenue+Victoria+Island+Lagos',
    },
  ],

  // RSVPs close at the end of the day itself
  rsvpClosesAt: '2026-12-28T23:59:59+01:00',

  /*
   * The client's Google Form, in raccesshub@gmail.com's Drive ("Sisi mi @ 70 · RSVP"); answers land in the
   * "Sisi mi @ 70 · RSVPs" sheet. Empty `action`: preview mode, nothing is sent.
   */
  form: {
    action: 'https://docs.google.com/forms/d/e/1FAIpQLSfE3XbwSMVBRReGkFD1Ub84N_3WtYWFcbotxIgyhcMBh7HQ9A/formResponse',
    entries: {
      response: '1984387863', // Will you be joining us?
      firstName: '1524379452',
      lastName: '1376305296',
      whatsapp: '1768138120',
      email: '1220929286',
      attending: '585985167', // Which part of the day?
      wish: '1853384624',
      video: '135011433', // link to their video in Drive
      passCode: '1787258925',
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

  // The Apps Script web app ("Untitled project" in raccesshub@gmail.com) that puts video messages in the
  // "Sisi mi @ 70 · Video messages" Drive folder (see google/SETUP.md)
  videoUploadUrl: 'https://script.google.com/macros/s/AKfycbxw7ZN4j87at0ZxjDeSwWcuxjgHnp4l8FGIBxIhxwkAPphPJRCSfFyE6zANN8o1K2J1Gg/exec',
  maxVideoMB: 200,
  maxVideoSeconds: 180,

  /*
   * The music. Empty: the site plays its own ballroom waltz (strings, piano, harp), made in the browser.
   * To use a song instead, put the file in assets/ and name it here, e.g. 'assets/song.mp3'.
   * Only use a song the client has the rights to put on a public website.
   */
  music: '',
}
