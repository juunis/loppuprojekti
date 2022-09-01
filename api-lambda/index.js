const AWS = require("aws-sdk");
const S3 = new AWS.S3();
exports.handler = async (event, context) => {
  try {
    console.log(`Hi from Node.js ${process.version} on Lambda!`);
    // Converted it to async/await syntax just to simplify.
    const data = await S3.getObject({
      Bucket: "skouppi-bucket",
      Key: "output/loppudata.json",
    }).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.parse(data.Body.toString()),
    };
  } catch (err) {
    return {
      statusCode: err.statusCode || 400,
      body: err.message || JSON.stringify(err.message),
    };
  }
};
