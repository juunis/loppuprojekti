"use strict";
const Parser = require("rss-parser");
const parser = new Parser();

function luoAikaleimaJSONnimi(aikaleima) {
  return `uutiset/${aikaleima.getFullYear()}-${
    aikaleima.getMonth < 9
      ? "0" + String(aikaleima.getMonth() + 1)
      : aikaleima.getMonth() + 1
  }-${aikaleima.getDate()}t${
    aikaleima.getHours < 10
      ? "0" + String(aikaleima.getHours())
      : aikaleima.getHours()
  }.${
    aikaleima.getMinutes < 10
      ? "0" + String(aikaleima.getMinutes())
      : aikaleima.getMinutes()
  }.json`;
}

async function haeFeedit(feedURLs, aikaleima) {
  let uutiset = [];

  // Käy kaikki feed-tiedoston lähteet läpi
  for (let element of feedURLs.feeds) {
    // Noudetaan data URL:ista
    const data = await fetchLatest(element.URL);
    // Käydään läpi ko. lähteen uutiset
    data.items.forEach((item) => {
      if (aikaleima < new Date(item.isoDate)) {
        // Hylkää kaikki aikaleima-parametria vanhemmat uutiset
        uutiset.push({
          // Tallennettavat tiedot
          title: item.title,
          contentSnippet: item.contentSnippet ?? item.description, // Huomioidaan lähteiden avaimien vaihtelu
          isoDate: item.isoDate ?? new Date(item.pubDate).toISOString(), // Huomioidaan lähteiden avaimien vaihtelu
          link: item.link,
          source: data.title, // Lähteen nimi
          country: element.country, //Feed-tiedostosta lähdemaa -määritelmä
        });
      }
    });
  }
  // Järjestä uusimmasta vanhimpaan
  uutiset.sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate));
  return uutiset;
}

async function fetchLatest(feedURL) {
  const feed = await parser.parseURL(feedURL);
  return { title: feed.title, items: feed.items };
}

module.exports = { luoAikaleimaJSONnimi, haeFeedit };
