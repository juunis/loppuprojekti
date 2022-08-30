"use strict";
// exports.region = "eu-central-1";
const { luoAikaleima, haeFeedit } = require("./apu.js");
const { s3hae, s3Tallenna, classify } = require("./aws.js");

const s3Bucket = "skouppi-bucket";
const s3Classdata = "skouppi-classdata";
const classifyModelArn =
  "arn:aws:comprehend:us-east-1:235920682125:document-classifier/energy-crisis-model/version/0-7";
const uutislahteet = "feeds/testfeeds.json";

// exports.handler = async function () {
const handler = async function () {
  // ATTENTION! Comment out the appropriate line above whether your are testing locally with node or running on AWS Lambda

  let feedURLs = await s3hae(s3Bucket, uutislahteet); // News source RSS-feeds || test feeds
  feedURLs = JSON.parse(feedURLs);

  // Haetaan uutiset, parametrina lähteet ja aikaikkuna tästä hetkestä taaksepäin
  // Fetch the news, sources and a time window (from this moment backwards) as parameters.
  const uutiset = await haeFeedit(
    feedURLs,
    new Date().setHours(new Date().getHours() - 12)
  );

  // S3:een tallennettavan tiedostonnimen muotoilu (uutiset/<aikaleima>.json)
  // Filename for the file going into the S3 Bucket (uutiset/<aikaleima>.json)
  const uutistiedostonNimi = `uutiset/${luoAikaleima(new Date())}.json`;

  // Save the news items into a s3 bucket as json.
  await s3Tallenna(uutiset, s3Bucket, uutistiedostonNimi, "application/json");

  // Luodaan uutisista luokittimelle sopiva tiedosto uutisista ja tallennetaan S3Buckeettin
  // Reformat the news items for the AWS Comprehend analysis job
  let tunnistustekstit = "";
  for (let i of uutiset) {
    tunnistustekstit += `${i.title} ${i.contentSnippet} \n`; // Otetaan mukaan otsikko ja sisältökatkelma
  }

  // Save the formatted news items to s3Bucket
  const tunnistustiedostonNimi = "testiluokittelu.txt";
  await s3Tallenna(
    tunnistustekstit,
    s3Bucket,
    tunnistustiedostonNimi,
    "application/txt"
  );

  // Luodaan ja käynnistetään tunnistusoperaatio AWS:ään
  // Create and run AWS Comprehend analysis job
  await classify(
    s3Bucket,
    tunnistustiedostonNimi,
    s3Classdata,
    classifyModelArn,
    uutistiedostonNimi
  );

  return 0;
};

handler(); // ATTENTION! Comment out this function when deploying the code in lambda
