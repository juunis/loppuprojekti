"use strict";
const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "eu-central-1", apiVersion: "2012-10-17" });
const s3Bucket = "riston-analyysit";
const decompress = require("decompress");
const confidenceVAL = 0.7;

async function handler() {
  //   const luokittelut = await S3hae();
  let uutiset = await S3hae("input/testuutiset.json");
  uutiset = JSON.parse(uutiset.Body);
  const output = await S3hae(
    "output/235920682125-CLN-6779efcc5cb788b9d24d56e144c90102/output/output.tar.gz"
  );

  // Luokittimen output-paketin purkaminen
  let luokitteludata = await decompress(output.Body).then((files) => {
    return files[0].data.toString();
  });
  luokitteludata = data.split("\n");

  const valitut = [];
  // Valitaan luokittelun perusteella relevantit uutiset
  for (let i = 0; i < uutiset.length; i++) {
    const test = JSON.parse(luokitteludata[i]).Classes[0];
    if (test.Name === "Jauhogate" && test.Score > confidenceVAL) {
      uutiset[i].score = test.Score;
      valitut.push(uutiset[i]);
    }
  }
  const loppudata = await S3hae("");

  // Muotoillaan lopullinen datapaketti
  valitut.forEach((uutinen) => {
    const pvm = uutinen.isoDate.split("T")[0];
    if (pvm in loppudata) loppudata[pvm].push(uutinen);
    else loppudata[pvm] = [uutinen];
  });

  await S3Tallenna();
}

async function S3hae(tiedostonNimi) {
  try {
    const params = {
      Bucket: s3Bucket,
      Key: tiedostonNimi,
    };
    const file = await s3.getObject(params).promise();
    return file;
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

handler();
