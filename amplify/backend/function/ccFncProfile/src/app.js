const AWS = require("aws-sdk");
const express = require("express");
const bodyParser = require("body-parser");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");

const app = express();
const dynamoDb = new AWS.DynamoDB.DocumentClient(); // Initialize DynamoDB Document Client
const PROFILE_TABLE = "ccUserProfile";

app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

const userSub = (req) => {
  return req.apiGateway.event.requestContext.identity.cognitoAuthenticationProvider.split(
    ":CognitoSignIn:"
  )[1];
};

app.put("/profile", async function (req, res) {
  const profileData = req.body;

  // Ensure the userSub from the request matches the userSub from the token
  if (profileData.id !== userSub(req)) {
    return res.status(403).json({
      error: "Unauthorized",
    });
  }

  const putParams = {
    TableName: PROFILE_TABLE,
    Item: profileData,
  };

  try {
    await dynamoDb.put(putParams).promise();
    res.json({
      success: "Profile updated successfully!",
      body: profileData,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to update profile",
      details: error.message,
    });
  }
});

app.get("/profile", async function (req, res) {
  // Fetch profile from DynamoDB
  const params = {
    TableName: PROFILE_TABLE,
    Key: {
      id: "" + userSub(req),
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();

    let profile;
    if (result.Item) {
      // Profile exists in DynamoDB
      profile = result.Item;
    } else {
      // Profile doesn't exist, create with default values
      profile = {
        id: userSub(req),
        firstName: "",
        lastName: "",
      };

      const putParams = {
        TableName: PROFILE_TABLE,
        Item: profile,
      };

      await dynamoDb.put(putParams).promise();
    }

    res.json({
      success: "get call succeed!",
      url: req.url,
      body: profile,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch or create profile",
      details: error.message,
    });
  }
});

module.exports = app;
