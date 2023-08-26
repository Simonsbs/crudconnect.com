const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { SecretsManager } = require("aws-sdk");

const ddbClient = new DynamoDBClient({ region: process.env.TABLE_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const secretsManager = new SecretsManager();

const tableName = "ccTblUser-newdev";
const partitionKeyName = "ProjectID";
const sortKeyName = "Email";

const app = express();
app.use(bodyParser.json());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

async function getJwtSecret() {
  const secretData = await secretsManager
    .getSecretValue({ SecretId: "jwtSigningKey" })
    .promise();
  return JSON.parse(secretData.SecretString).ccJWTSecret;
}

app.post("/login/:ProjectID", async function (req, res) {
  const { Email, Password } = req.body;
  const ProjectID = req.params.ProjectID;

  const queryParams = {
    TableName: tableName,
    KeyConditionExpression: `${partitionKeyName} = :ProjectID and ${sortKeyName} = :Email`,
    ExpressionAttributeValues: {
      ":ProjectID": ProjectID,
      ":Email": Email,
    },
  };

  try {
    const data = await ddbDocClient.send(new QueryCommand(queryParams));
    const user = data.Items[0];

    if (user && user.Password === Password) {
      const jwtSecret = await getJwtSecret();
      const token = jwt.sign(
        { ID: user.ID, ProjectID: user.ProjectID },
        jwtSecret
      );
      res.json({ token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3000, function () {
  console.log("App started");
});

module.exports = app;
