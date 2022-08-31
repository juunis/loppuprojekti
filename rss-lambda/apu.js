"use strict";
/* Some helper functions for the main program
 */

const Parser = require("rss-parser");
const parser = new Parser();

/* Function to create a time stamp string  for e.g. filenames from a Date
 *  Parameter: Date
 *  Output: string (format example: 22-08-02t13.53)
 */
function luoAikaleima(aikaleima) {
  return `${aikaleima.getFullYear()}-${
    aikaleima.getMonth() < 9
      ? "0" + String(aikaleima.getMonth() + 1)
      : aikaleima.getMonth() + 1
  }-${aikaleima.getDate()}t${
    aikaleima.getHours() < 10
      ? "0" + String(aikaleima.getHours())
      : aikaleima.getHours()
  }.${
    aikaleima.getMinutes() < 10
      ? "0" + String(aikaleima.getMinutes())
      : aikaleima.getMinutes()
  }`;
}

/* Function to fetch news items from feeds given as an input of a certain time window
 * Input: Json-file of feed items, Date of the oldest item to be taken into account.
 * Json file format: {"feeds": [
 *  {
 *     "URL": <URL>,
 *     "country": <country of the source>
 *   }
 * Output: an array of news items
 */
async function haeFeedit(feedURLs, aikaleima) {
  let uutiset = [];

  // Process all the feeds in the object
  for (let element of feedURLs.feeds) {
    // Get data from the URL

    const getnews = new Promise(async (resolve, reject) => {
      const data = await fetchLatest(element.URL);
      resolve(data);
    });
    await getnews
      .then((data) => {
        data.items.forEach((item) => {
          if (aikaleima < new Date(item.isoDate)) {
            // Discard all news items that are older than the aikaleima parameter
            uutiset.push({
              // Save the following data
              title: item.title,
              contentSnippet: item.contentSnippet ?? item.description ?? "", // Handling of key name variability between sources
              isoDate: item.isoDate ?? new Date(item.pubDate).toISOString(), // Handling of key name variability between sources
              link: item.link,
              source: element.title, // Name of the source
              country: element.country, // Source country from feed-list object
            });
          }
        });
      })
      .catch((error) => {
        console.log(element.title, error);
      });
  }

  // Old syncronous code ------>
  // const data = await fetchLatest(element.URL);
  // // Process all the news items
  // data.items.forEach((item) => {
  //   if (aikaleima < new Date(item.isoDate)) {
  //     // Discard all news items that are older than the aikaleima parameter
  //     uutiset.push({
  //       // Save the following data
  //       title: item.title,
  //       contentSnippet: item.contentSnippet ?? item.description ?? "", // Handling of key name variability between sources
  //       isoDate: item.isoDate ?? new Date(item.pubDate).toISOString(), // Handling of key name variability between sources
  //       link: item.link,
  //       source: element.title, // Name of the source
  //       country: element.country, // Source country from feed-list object
  //     });
  //   }
  // });

  // Sort from newest to oldest
  // uutiset.sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate));

  return uutiset;
}

// Function that fetches data from a given URL
async function fetchLatest(feedURL) {
  const feed = await parser.parseURL(feedURL);
  return { title: feed.title, items: feed.items };
}

module.exports = { luoAikaleima, haeFeedit };
