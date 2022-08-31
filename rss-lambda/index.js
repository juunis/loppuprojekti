"use strict";
const { luoAikaleima, haeFeedit } = require("./apu.js");
const { s3hae, s3Tallenna, classify } = require("./aws.js");

const s3Bucket = "skouppi-bucket";
const s3Classdata = "skouppi-classdata";
const classifyModelArn =
  "arn:aws:comprehend:us-east-1:235920682125:document-classifier/ukraine-with-grays/version/0-0";
const uutislahteet = "feeds/feeds.json";

exports.handler = async function (event) {
  // const handler = async function (event) {
  // ATTENTION! Comment out the appropriate line above whether your are testing locally with node or running on AWS Lambda

  let feedURLs = await s3hae(s3Bucket, uutislahteet); // News source RSS-feeds || test feeds
  feedURLs = JSON.parse(feedURLs);

  console.log("Feed-lähteet haettu."); //Debug

  // Haetaan uutiset, parametrina lähteet ja aikaikkuna tästä hetkestä taaksepäin
  // Fetch the news, sources and a time window (from this moment backwards) as parameters.
  const uutiset = await haeFeedit(
    feedURLs,
    new Date().setHours(new Date().getHours() - 12)
  );
  console.log("Uutiset haettu feedeistä"); //Debug

  // S3:een tallennettavan tiedostonnimen muotoilu (uutiset/<aikaleima>.json)
  // Filename for the file going into the S3 Bucket (uutiset/<timestamp>.json)
  const uutistiedostonNimi = `uutiset/${luoAikaleima(new Date())}.json`;

  // Save the news items into a s3 bucket as json.
  await s3Tallenna(uutiset, s3Bucket, uutistiedostonNimi, "application/json");

  console.log(`Uutiset tallennettu ${s3Bucket}:iin: ${uutistiedostonNimi}`); //Debug

  // Luodaan uutisista luokittimelle sopiva tiedosto uutisista ja tallennetaan S3Buckeettin
  // Reformat the news items for the AWS Comprehend analysis job
  let tunnistustekstit = "";
  for (let i of uutiset) {
    tunnistustekstit += `${i.title.trim()} ${i.contentSnippet.trim()}-- \n`; // Otetaan mukaan otsikko ja sisältökatkelma
  }

  // Save the formatted news items to s3Bucket
  const tunnistustiedostonNimi = "testiluokittelu.txt";
  await s3Tallenna(
    tunnistustekstit,
    s3Bucket,
    tunnistustiedostonNimi,
    "application/txt"
  );
  console.log(`Testiluokittelu-tiedosto luotu ja tallennettu ${s3Bucket}:iin`); //Debug

  // Luodaan ja käynnistetään tunnistusoperaatio AWS:ään
  // Create and run AWS Comprehend analysis job
  await classify(
    s3Bucket,
    tunnistustiedostonNimi,
    s3Classdata,
    classifyModelArn,
    uutistiedostonNimi
  );
  console.log("Luokittelu käynnistetty"); //Debug
  return 0;
};

// handler(); // ATTENTION! Comment out this function when deploying the code in lambda
