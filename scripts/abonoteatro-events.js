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
const url = 'https://www.abonoteatro.com/catalogo/cines.php';
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

/********************
 * API
 ********************/
const response = await get(url);
const page = parse(response.data);
const listItem = page
  .querySelectorAll(SELECTORS.LIST);

const resultEvents = listItem.map(item => ({
  image: item.querySelector(SELECTORS.ITEM.IMAGE).getAttribute('src'),
  price: item.querySelector(SELECTORS.ITEM.PRICE).textContent,
  subtitle: item.querySelector(SELECTORS.ITEM.SUBTITLE).structuredText.trim(),
  title: item.querySelector(SELECTORS.ITEM.TITLE).structuredText.trim(),
  venue: {
    title: item.querySelector(`${SELECTORS.ITEM.VENUE}`).structuredText.trim(),
    link: item.querySelector(`${SELECTORS.ITEM.VENUE} a`).getAttribute('href'),
  }
}));

/********************
 * UI
 ********************/
await arg({
  placeholder: 'Select event'
}, async() => {
  
  return resultEvents.map(event => {
    const { image, title, venue } = event;
    return {
      name: title,
      description: venue.title,
      preview: () => md(`![](${image})`),
    }
  });
});
// console.log(JSON.stringify(resultEvents, null, 2))
