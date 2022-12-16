// Name: abonoteatro-events

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
  ITEM_DETAILS: '[id^=event_content_json_id_]'
}

const CATEGORY_LIST = [
  {
    name: 'Teatros',
    description: 'desc',
    value: {
      id: 'teatro',
      path: '/catalogo/teatros.php'
    },
  },
  {
    name: 'Cines y Eventos',
    description: 'desc',
    value: {
      id: 'cine',
      path: '/catalogo/cines.php'
    },
  }
];

/********************
 * API
 ********************/
const getEventData = async(urlEvent) => {
  const response = await get(urlEvent);
  const page = parse(response.data);
  const listItem = page
    .querySelectorAll(SELECTORS.LIST);

  const data = listItem.map(item => ({
    image: item.querySelector(SELECTORS.ITEM.IMAGE).getAttribute('src'),
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

/********************
 * UI
 ********************/
const categoryPrompt = async() => await arg({ placeholder: 'Select type', }, CATEGORY_LIST);
const eventListPromt = async(eventData) => await arg({ placeholder: 'Select event' }, async() => {
  return eventData.map(event => {
    const { image, title, subtitle, venue } = event;
    return {
      name: title,
      description: venue.title,
      preview: () => md(`
# ${ title }
![](${ image })
## ${ subtitle }
`),
    }
  });
});

/********************
 * APP
 ********************/
const categorySelected = await categoryPrompt();
const resultData = await getEventData(`${ BASE_URL }${ categorySelected.path }`);
const eventSelected = await eventListPromt(resultData);
