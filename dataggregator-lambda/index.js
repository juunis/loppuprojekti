"use strict";

/* This application is written to be run on AWS Lambda, triggered by s3 putObject event.
 * It is meant to process the output of a AWS Comprehend Custom classification analysis job and perform
 * a selection task on the original data used for the input of the classification job
 *
 */

const AWS = require("aws-sdk");
const decompress = require("decompress");
const {
  s3hae,
  S3Tallenna,
  getLatestClassify,
  getNewssource,
} = require("./aws.js");
const s3Bucket = "skouppi-bucket";
const s3Classdata = "skouppi-classdata";
const loppudataTiedosto = "output/loppudata.json";

const confidenceVAL = 0.7;

// exports.handler = async function (event) {
const handler = async function (event) {
  // ATTENTION! Comment out the appropriate line above whether your are testing locally with node or running on AWS Lambda

  /* Haetaan luokittelun pohjalla olleet alkuperäiset uutistiedot
   *  luokittelutiedoston ja analyysityön perusteella
   *  Get the initial news items which which were the basis of the Classification
   *  analysis job that is being processed here
   */
  const jobId = event.Records[0].s3.object.key.match(/(?<CLN-)[a-z0-9]*/)[0];
  const orignewsTiedosto = await getNewssource(jobId);
  let uutiset = await S3hae(s3Bucket, orignewsTiedosto);
  uutiset = JSON.parse(uutiset.Body);

  // Luokittimen output-paketin prosessointi
  // Process the Classification analysis job output file
  const output = await S3hae(s3Classdata, event.Records[0].s3.object.key);
  let luokitteludata = await decompress(output.Body).then((files) => {
    return files[0].data.toString();
  });
  luokitteludata = data.split("\n");

  const valitut = [];
  /* Valitaan luokittimen tulosten ja valitsemamme raja-arvon(confidenceVAL) perusteella relevantit uutiset
   *  Selecting the relevant news items according to the classifier's results and our confidence cut-off point.
   */
  for (let i = 0; i < uutiset.length; i++) {
    const test = JSON.parse(luokitteludata[i]).Classes[0];
    if (test.Name === "Energycrisis" && test.Score > confidenceVAL) {
      uutiset[i].score = test.Score;
      valitut.push(uutiset[i]);
    }
  }

  /* Lisätään valitut uutiset lopulliseen tiedostoon ja tallennetaan
   *  Adding the news items to final data file ja tallenetaan
   */
  let loppudata = await S3hae(s3Bucket, loppudataTiedosto);
  loppudata = JSON.parse(loppudata);

  valitut.forEach((uutinen) => {
    const pvm = uutinen.isoDate.split("T")[0];
    if (pvm in loppudata) loppudata[pvm].push(uutinen);
    else loppudata[pvm] = [uutinen];
  });

  await S3Tallenna(loppudata, s3Bucket, loppudataTiedosto, "application/json");
};

handler();
