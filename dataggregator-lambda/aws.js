"use strict";

/* AWS service functions for the main program
 */

const region = "us-east-1";
const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: region, apiVersion: "2012-10-17" });
const ComprehendAPI = new AWS.Comprehend({
  region: region,
});

// General function for saving data to s3 bucket
// Parameters: data to be saved, target bucket, target filename, data content type
// Output: -
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
// Parameters: string (target bucket name), string (target object name)
// Output: file object
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

async function getLatesClassify(bucket) {
  const params = { Bucket: bucket };

  const response = await s3.listObjectsV2(params).promise();
  const files = response.Contents.sort(
    (a, b) => b.LastModified - a.LastModified
  );
  return files[0].Key;
}

// Function for getting information from a Analysis Job's tags
// Input: string (Analysis JobId)
// Output: string (the object key for the original file used as the source for the input data of the analysis job)
async function getNewssource(JobId) {
  let data;

  try {
    const response = await ComprehendAPI.describeDocumentClassificationJob({
      JobId: JobId,
    }).promise();

    console.log(response);
    const response2 = await ComprehendAPI.listTagsForResource({
      ResourceArn: response.DocumentClassificationJobProperties.JobArn,
    }).promise();
    for (let x of response2.Tags) {
      if (x.Key === "source-news") {
        data = x.Value;
        break;
      }
    }
  } catch (error) {
    console.log("Error! \n", error);
  }
  return data;
}

module.exports = { s3hae, s3Tallenna, getLatesClassify, getNewssource };
