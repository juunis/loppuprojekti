"use strict";

/* s3 Bucket functions for the main program
 */
const region = "eu-central-1";
const AWS = require("aws-sdk");
const { luoAikaleima } = require("./apu.js");
const s3 = new AWS.S3({ region: region, apiVersion: "2012-10-17" });
const ComprehendAPI = new AWS.Comprehend({
  region: region,
});

// General function for saving data to s3 bucket
// Parameters: data to be saved, target bucket, target filename, data content type
async function s3Tallenna(data, bucket, tiedostonNimi, tyyppi) {
  if (tyyppi === "application/json") data = JSON.stringify(data);

  try {
    const params = {
      Bucket: bucket,
      Key: tiedostonNimi,
      Body: data,
      ContentType: tyyppi,
    };
    await s3.putObject(params).promise();

    console.log(
      `File uploaded successfully at https:/` + bucket + `.s3.amazonaws.com/`
    );
  } catch (error) {
    console.log("Error: ei onnistunu tallennus buckettiin \n", error);
  }
}

// Function to fetch data from an s3 Bucket
// Parameters: target filename, target bucket-name,
async function s3hae(bucket, tiedostonNimi) {
  try {
    const params = {
      Bucket: bucket,
      Key: tiedostonNimi,
    };
    const file = await s3.getObject(params).promise();
    return file.Body;
  } catch (error) {
    console.log("Error: Ei onnistunut S3 bucketista lataaminen: \n", error);
  }
}

/* Function to create and run a AWS Comprehend analysis job to classify texts
 * Input: input s3 bucket, input filename, output s3 bucket, classification model to be used
 * Output
 */
async function classify(inputBucket, inputfile, output, modelArn) {
  const params = {
    DataAccessRoleArn:
      "arn:aws:iam::235920682125:role/service-role/AmazonComprehendServiceRole-ristotest" /* required */,
    DocumentClassifierArn: modelArn,
    /* required */ InputDataConfig: {
      /* required */ S3Uri: `s3://${inputBucket}/${inputfile}` /* required */,
      InputFormat: "ONE_DOC_PER_LINE",
    },
    OutputDataConfig: {
      /* required */ S3Uri: `s3://${output}` /* required */,
    },
    // Create job name using the name of the classification model and date-time-stamp
    JobName: `skouppi-${modelArn.match(/(?<=\/)[a-z]*/)[0]}-${luoAikaleima(
      new Date()
    )}`,
    Tags: [
      {
        Key: "Owner" /* required */,
        Value: "Skouppi",
      },
    ],
  };

  // Start the analysis job
  const response = await ComprehendAPI.startDocumentClassificationJob(
    params
  ).promise();

  console.log(response);
}

module.exports = { s3hae, s3Tallenna, classify };
