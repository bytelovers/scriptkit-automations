// Name: Eventos Abonoteatro
// Description: Listado de eventos que ofrece Abonoteatro

import "@johnlindquist/kit"
const { parse } = await npm('node-html-parser');

/**
 * Teatros: https://www.abonoteatro.com/catalogo/teatros.php
 * Cines: https://www.abonoteatro.com/catalogo/cines.php
 * Ficha detalle: https://www.abonoteatro.com/catalogo/detalle_evento.php
 */

/********************
 * Constants
 ********************/
const BASE_URL = 'https://www.abonoteatro.com';
const EVENT_LIST_PATHS = {
  THEATERS: '/catalogo/teatros.php',
  CINEMAS: '/catalogo/cines.php',
  DETAIL: '/catalogo/detalle_evento.php',
}

const SELECTORS = {
  LIST: '.row',
  ITEM: {
    BUY_LINK: '.buyBtn',
    IMAGE: '.type-tribe_events .tribe-events-event-image img',
    PRICE: '.tribe-events-event-cost span',
    SUBTITLE: '.noo-tribe-events-header .subtitulo',
    TITLE: '.noo-tribe-events-header .entry-title',
    VENUE: '.tribe-events-event-meta'
  },
};

const EVENT_DETAIL_OBJECT = {
  LIST: '.bsesiones',
  ITEM: {
    DATE: '.bfechasesion',
    DATE_DAY: '.bfechasesion .psesb',
    DATE_MONTH: '.bfechasesion p.psess:first-child',
    DATE_WEEKDAY: '.bfechasesion p.psess:last-child',
    INFO: '.binfosesion',
    NAME: '.entry-title',
  },
  SINGLE_SESSION: {
    HOUR: '.horasesion',
    BUY_LINK: '.entry-summary .btncompra',
  },
  MULTIPLE_SESSION: {
    HOUR: '.btnhora',
    BUY_LINKS: '.btnhora',
  }
}

const CATEGORY_LIST = [
  {
    name: 'Teatros',
    description: 'desc',
    value: {
      id: 'teatro',
      path: EVENT_LIST_PATHS.THEATERS,
    },
  },
  {
    name: 'Cines y Eventos',
    description: 'desc',
    value: {
      id: 'cine',
      path: EVENT_LIST_PATHS.CINEMAS,
    },
  }
];

/********************
 * Helpers
 ********************/

const getRawMetadata = base64Str => JSON.parse(
    Buffer
    .from(base64Str, 'base64')
    .toString('utf-8')
  );

/********************
 * API
 ********************/
const getEventData = async(urlEvent) => {
  const response = await get(urlEvent);
  const page = parse(response.data);
  const listItem = page
    .querySelectorAll(SELECTORS.LIST);

  const data = listItem.map(item => ({
    _metadata: item.nextSibling.nextSibling.getAttribute('value'),
    image: item.querySelector(SELECTORS.ITEM.IMAGE).getAttribute('src'),
    metadata: getRawMetadata(item.nextSibling.nextSibling.getAttribute('value')),
    price: item.querySelector(SELECTORS.ITEM.PRICE).textContent,
    subtitle: item.querySelector(SELECTORS.ITEM.SUBTITLE).structuredText.trim(),
    title: item.querySelector(SELECTORS.ITEM.TITLE).structuredText.trim(),
    venue: {
      title: item.querySelector(`${SELECTORS.ITEM.VENUE}`).structuredText.trim(),
      link: item.querySelector(`${SELECTORS.ITEM.VENUE} a`).getAttribute('href'),
    }
  }));
  return data;
}

const getEventDetail = async(event) => {
  const response = await post(
    `${ BASE_URL }${ EVENT_LIST_PATHS.DETAIL }`, {
      action: 'show',
      content: event
    }, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const page = parse(`<div>${response.data}</div>`);
  const listItem = page
    .querySelectorAll(EVENT_DETAIL_OBJECT.LIST);

  const parseSessionDate = event => [
    event.querySelector(EVENT_DETAIL_OBJECT.ITEM.DATE_WEEKDAY).textContent,
    event.querySelector(EVENT_DETAIL_OBJECT.ITEM.DATE_DAY).textContent,
    event.querySelector(EVENT_DETAIL_OBJECT.ITEM.DATE_MONTH).textContent
  ].join(' ');
  
  
  const eventDetailData = listItem.map(event => {
    const sessions = [];
    const hasSingleSession = Boolean(event.querySelector('h3.horasesion'));
    
    if (hasSingleSession) {
      sessions.push({
        date: parseSessionDate(event),
        hour: event.querySelector('h3.horasesion').textContent,
        buy_link: event.querySelector(EVENT_DETAIL_OBJECT.SINGLE_SESSION.BUY_LINK).getAttribute('href'),
      })
    } else {
      event.querySelectorAll(
        `${ EVENT_DETAIL_OBJECT.ITEM.INFO } ${ EVENT_DETAIL_OBJECT.MULTIPLE_SESSION.HOUR }`
      ).forEach(session => {
        sessions.push({
          date: parseSessionDate(event),
          hour: session.textContent.trim(),
          buy_link: session.getAttribute('href')
        })
      })
    }


    return {
      title: event.querySelector(EVENT_DETAIL_OBJECT.ITEM.NAME).textContent.trim(),
      sessions,
    }
  });

  return eventDetailData;
}

/********************
 * UI
 ********************/
const categoryPrompt = async() => await arg({ placeholder: 'Select type', }, CATEGORY_LIST);
const eventListPrompt = async(eventData) => await arg({
  placeholder: 'Select event',
  hint: `Total events: ${ eventData.length }`
}, async() => {
  // console.log(JSON.stringify(eventData, null, 2));
  return eventData.map(event => {
    const { image, title, subtitle, venue } = event;
    return {
      name: title,
      description: event.metadata.sub,//venue.title,
      img: image,
      preview: () => md(`
# ${ title }
![](${ image })
## ${ subtitle }
`),
      value: event
    }
  });
});
const eventDetailPrompt = async(eventDetail) => await arg({
  placeholder: 'Select session'
}, async() => {

  const events = eventDetail.events.reduce((acc, event) => {
    const sessions = event.sessions.map(session => ({
      title: event.title,
      ...session
    }));
    return acc.concat(sessions);
  }, []);

  return events.map(session => ({
    name: session.title.split(' - ').pop().trim(),
    description: `(${ session.date } ${ session.hour })`
  }));
})

/********************
 * APP
 ********************/
const categorySelected = await categoryPrompt();
const resultData = await getEventData(`${ BASE_URL }${ categorySelected.path }`);
const eventSelected = await eventListPrompt(resultData);

const eventDetail = await getEventDetail(eventSelected._metadata);
await eventDetailPrompt({ events: eventDetail });



// console.log(JSON.stringify({ events: eventDetail }, null, 2));
