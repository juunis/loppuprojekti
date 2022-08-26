"use strict";

const AWS = require("aws-sdk");
const ComprehendAPI = new AWS.Comprehend({
  apiVersion: "2017-11-27",
  region: "eu-central-1",
});
const s3 = new AWS.S3({ region: "us-east-1", apiVersion: "2012-10-17" });
const s3Bucket = "skouppi-bucket";

const handler = async function () {
  // HUOM! Tämä muotoon 'exports.handler = async function () {' Lambdaan laitettaessa

  const uutiset = await S3hae("uutiset/testuutiset.json");

  let tunnistustekstit = "";

  for (let i of uutiset) {
    tunnistustekstit += `${i.title} ${i.contentSnippet} \n`;
  }
  await S3Tallenna(tunnistustekstit, "uutiset/testiluokittelu.txt");
  await filter();
};

async function filter() {
  const params = {
    DataAccessRoleArn:
      "arn:aws:iam::235920682125:role/service-role/AmazonComprehendServiceRole-ristotest" /* required */,
    DocumentClassifierArn:
      "arn:aws:comprehend:eu-central-1:235920682125:document-classifier/jauhotesti/version/0-2-2" /* required */,
    InputDataConfig: {
      /* required */ S3Uri:
        "s3://riston-analyysit/input/testiluokittelu.txt" /* required */,
      InputFormat: "ONE_DOC_PER_LINE",
    },
    OutputDataConfig: {
      /* required */ S3Uri: "s3://riston-analyysit/output/" /* required */,
    },
    JobName: "skouppi-testi2",
    Tags: [
      {
        Key: "Owner" /* required */,
        Value: "Skouppi",
      },
    ],
  };
  const response = await ComprehendAPI.startDocumentClassificationJob(
    params
  ).promise();

  console.log(response);
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

async function S3Tallenna(data, tiedostonNimi) {
  try {
    const params = {
      Bucket: s3Bucket,
      Key: tiedostonNimi,
      Body: data,
      ContentType: "application/text",
    };
    await s3.putObject(params).promise();

    console.log(
      `File uploaded successfully at https:/` + s3Bucket + `.s3.amazonaws.com/`
    );
  } catch (error) {
    console.log("Error: ei onnistunu lataus buckettiin \n", error);
  }
}

handler(); // Tämä pois Lambdaan laitettaessa

// {
//     "Text": "Sanna Marin: Finnish prime minister apologises for topless picture of influencers at official residence",
//     "EndpointArn": "arn:aws:comprehend:eu-central-1:235920682125:document-classifier-endpoint/skouppi-marin"
// }
