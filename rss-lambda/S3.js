"use strict";

const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "us-east-1", apiVersion: "2012-10-17" });
const s3Bucket = "skouppi-bucket";

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

module.exports = { S3hae, s3Tallenna };
