"use strict";

/* This application is written to be run on AWS Lambda, triggered by s3 putObject event.
 * It is meant to process the output of a AWS Comprehend Custom classification analysis job and perform
 * a selection task on the original data used for the input of the classification job
 *
 */

const AWS = require("aws-sdk");
const decompress = require("decompress");
const { s3hae, s3Tallenna, getNewssource } = require("./aws.js");
const s3Bucket = "skouppi-bucket";
const s3Classdata = "skouppi-classdata";
const loppudataTiedosto = "output/loppudata.json";

const className = "Ukraine";
const confidenceVAL = 0.7;

exports.handler = async function (event) {
  // const handler = async function (event) {
  // ATTENTION! Comment out the appropriate line above whether your are testing locally with node or running on AWS Lambda

  /* Haetaan luokittelun pohjalla olleet alkuperäiset uutistiedot
   *  luokittelutiedoston ja analyysityön perusteella
   *  Get the initial news items which which were the basis of the Classification
   *  analysis job that is being processed here
   */

  const jobId = event.Records[0].s3.object.key.match(/(?<=CLN-)[a-z0-9]*/)[0];
  const orignewsTiedosto = await getNewssource(jobId);

  console.log("haetaan bucketista ", orignewsTiedosto); // Debug

  let uutiset = await s3hae(s3Bucket, orignewsTiedosto);
  uutiset = JSON.parse(uutiset);

  console.log("output paketin prosessointi"); // Debug

  // Luokittimen output-paketin prosessointi
  // Process the Classification analysis job output file
  console.log(event.Records[0].s3.object.key);
  const output = await s3hae(s3Classdata, event.Records[0].s3.object.key);

  let luokitteludata = await decompress(output).then((files) => {
    return files[0].data.toString().split("\n");
  });

  console.log("valitaan uutisia"); // Debug

  const valitut = [];
  const hylatyt = []; // TESTING

  /* Valitaan luokittimen tulosten ja valitsemamme raja-arvon(confidenceVAL) perusteella relevantit uutiset
   *  Selecting the relevant news items according to the classifier's results and our confidence cut-off point.
   */

  for (let i = 0; i < uutiset.length; i++) {
    const test = JSON.parse(luokitteludata[i]).Classes[0];
    if (test.Name === className && test.Score > confidenceVAL) {
      valitut.push(uutiset[i]);
      uutiset[i].score = { name: test.Name, score: test.Score };
    } else {
      uutiset[i].score = { name: test.Name, score: test.Score };
      hylatyt.push(uutiset[i]);
    }
  }

  console.log("Tallenna luokittelun testaus tiedostot");
  // TESTING! <----
  await s3Tallenna(
    valitut,
    s3Bucket,
    "testing/valitut.json",
    "application/json"
  );
  await s3Tallenna(
    hylatyt,
    s3Bucket,
    "testing/hylatyt.json",
    "application/json"
  ); // ---->

  console.log("Koosta loppullinen datatiedosto"); // Debug

  /* Lisätään valitut uutiset lopulliseen tiedostoon ja tallennetaan
   *  Adding the news items to final data file ja tallenetaan
   */
  let loppudata = await s3hae(s3Bucket, loppudataTiedosto);
  loppudata = JSON.parse(loppudata);

  valitut.forEach((uutinen) => {
    const pvm = uutinen.isoDate.split("T")[0];
    if (pvm in loppudata) loppudata[pvm].push(uutinen);
    else loppudata[pvm] = [uutinen];
  });

  await s3Tallenna(loppudata, s3Bucket, loppudataTiedosto, "application/json");

  console.log("Loppudata tallennettu. Valmis."); // Debug

  return 0;
};

// Lambda's event input testing from s3 trigger

// handler({
//   Records: [
//     {
//       eventVersion: "2.0",
//       eventSource: "aws:s3",
//       awsRegion: "us-east-1",
//       eventTime: "1970-01-01T00:00:00.000Z",
//       eventName: "ObjectCreated:Put",
//       userIdentity: {
//         principalId: "EXAMPLE",
//       },
//       requestParameters: {
//         sourceIPAddress: "127.0.0.1",
//       },
//       responseElements: {
//         "x-amz-request-id": "EXAMPLE123456789",
//         "x-amz-id-2":
//           "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH",
//       },
//       s3: {
//         s3SchemaVersion: "1.0",
//         configurationId: "testConfigRule",
//         bucket: {
//           name: "tiina-testibucket",
//           ownerIdentity: {
//             principalId: "EXAMPLE",
//           },
//           arn: "arn:aws:s3:::tiina-testibucket",
//         },
//         object: {
//           key: "235920682125-CLN-fdf3c3e6dce1cc6dc358f28d7a322002/output/output.tar.gz",
//           size: 1024,
//           eTag: "0123456789abcdef0123456789abcdef",
//           sequencer: "0A1B2C3D4E5F678901",
//         },
//       },
//     },
//   ],
// });
