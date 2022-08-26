const { luoAikaleimaJSONnimi, haeFeedit } = require("./apu.js");
const { S3hae, s3Tallenna } = require("./S3.js");

const handler = async function () {
  // HUOM! Tämä muotoon 'exports.handler = async function () {' Lambdaan laitettaessa

  const feedURLs = await S3hae("feeds/testfeeds.json"); //Tähän sitten varsinainen feed-lista tilalle

  // Haetaan uutiset, parametrina lähteet ja aikaikkuna tästä hetkestä taaksepäin
  const uutiset = await haeFeedit(
    feedURLs,
    new Date().setHours(new Date().getHours() - 12)
  );

  // S3:een tallennettavan tiedostonnimen muotoilu
  const tiedostonNimi = luoAikaleimaJSONnimi(new Date());

  // Uutisten tallentaminen S3:een
  await s3Tallenna(uutiset, tiedostonNimi);

  return 0;
};

handler(); // HUOM! Poista tämä Lambdaan laitettaessa!
