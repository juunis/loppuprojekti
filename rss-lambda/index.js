const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "us-east-1", apiVersion: "2012-10-17" });
const s3Bucket = "skouppi-bucket";
const Parser = require("rss-parser");
const parser = new Parser();
let uutiset = [];

const handler = async function () {
  // HUOM! Tämä muotoon 'exports.handler = async function () {' Lambdaan laitettaessa

  const feedURLs = await S3hae("feeds/testfeeds.json"); //Tähän sitten varsinainen feed-lista tilalle

  // Määritellään, kuinka tuoreet uutiset otetaan mukaan
  let aikaleima = new Date();
  aikaleima.setHours(aikaleima.getHours() - 12);

  // Haetaan uutiset
  await haeFeedit(feedURLs, aikaleima);

  // S3:een tallennettavan tiedostonnimen muotoilu
  const nykAikaleima = new Date();
  const tiedostonNimi = `uutiset/${nykAikaleima.getFullYear()}-${
    nykAikaleima.getMonth < 9
      ? "0" + String(nykAikaleima.getMonth() + 1)
      : nykAikaleima.getMonth() + 1
  }-${nykAikaleima.getDate()}t${
    nykAikaleima.getHours < 10
      ? "0" + String(nykAikaleima.getHours())
      : nykAikaleima.getHours()
  }.${
    nykAikaleima.getMinutes < 10
      ? "0" + String(nykAikaleima.getMinutes())
      : nykAikaleima.getMinutes()
  }.json`;

  // Uutisten tallentaminen S3:een
  await s3Tallenna(uutiset, tiedostonNimi);

  return 0;
};

async function haeFeedit(feedURLs, aikaleima) {
  // Käy kaikki feed-tiedoston lähteet läpi
  for (let element of feedURLs.feeds) {
    // Noudetaan data URL:ista
    const data = await fetchLatest(element.URL);
    // Käydään läpi ko. lähteen uutiset
    data.items.forEach((item) => {
      if (aikaleima < new Date(item.isoDate)) {
        // Hylkää kaikki aikaleima-määritelmää vanhemmat uutiset
        uutiset.push({
          // Tallennettavat tiedot
          title: item.title,
          contentSnippet: item.contentSnippet ?? item.description,
          isoDate: item.isoDate ?? new Date(item.pubDate).toISOString(),
          link: item.link,
          source: data.title,
          country: element.country, //Feed-tiedostosta lähdemaa -määritelmä
        });
      }
    });
  }
  // Järjestä uusimmasta vanhimpaan
  uutiset.sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate));
}

async function fetchLatest(feedURL) {
  const feed = await parser.parseURL(feedURL);
  return { title: feed.title, items: feed.items };
}

async function s3Tallenna(data, tiedostonNimi) {
  try {
    const params = {
      Bucket: s3Bucket,
      Key: tiedostonNimi,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    };
    await s3.putObject(params).promise();

    console.log(
      `File uploaded successfully at https:/` + s3Bucket + `.s3.amazonaws.com/`
    );
  } catch (error) {
    console.log("Error: ei onnistunu lataus buckettiin \n", error);
  }
}

async function S3hae(tiedostonNimi) {
  try {
    const params = {
      Bucket: s3Bucket,
      Key: tiedostonNimi,
    };
    const file = await s3.getObject(params).promise();
    return JSON.parse(file.Body);
  } catch (error) {
    console.log("Error: \n", error);
  }
}

handler(); // HUOM! Tämä poist Lambdaan laitettaessa!
