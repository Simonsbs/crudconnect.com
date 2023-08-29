const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const bodyParser = require("body-parser");
const express = require("express");
const jwt = require("jsonwebtoken");
const { SecretsManager } = require("aws-sdk");

const ddbClient = new DynamoDBClient({ region: process.env.TABLE_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const secretsManager = new SecretsManager();

const tableName =
  process.env.ENV && process.env.ENV !== "NONE"
    ? `ccTblItem-${process.env.ENV}`
    : "ccTblItem";

const app = express();
app.use(bodyParser.json());

// Enable CORS for all methods
app.use((req, res, next) => {
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

const verifyToken = async (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const jwtSecret = await getJwtSecret();
    try {
      const decoded = jwt.verify(token, jwtSecret);
      return decoded;
    } catch (err) {
      return null; // Invalid token
    }
  }
  return null; // No token
};

// New function to get unique categories based on the ProjectID
const getUniqueCategories = (items) => {
  const categories = new Set();
  items.forEach((item) => {
    const parts = item.ProjectID_Category.split("_");
    if (parts.length > 1) {
      categories.add(parts[1]); // Assuming the format is always "ProjectID_Category"
    }
  });

  return Array.from(categories);
};

// New GET method to fetch categories based on ProjectID
app.get("/category/:ProjectID", async (req, res) => {
  const ProjectID = req.params.ProjectID;
  const tokenPayload = await verifyToken(req);

  const scanParams = {
    TableName: tableName,
    FilterExpression: "begins_with(ProjectID_Category, :pid)",
    ExpressionAttributeValues: {
      ":pid": ProjectID + "_",
    },
  };

  try {
    const data = await ddbDocClient.send(new ScanCommand(scanParams));
    const filteredItems = data.Items.filter((item) => {
      if (tokenPayload) {
        return true; // Return all items if token is valid
      } else {
        return item.Scope === "Public"; // Return only public items if no token
      }
    });

    const categories = getUniqueCategories(filteredItems);
    res.json(categories);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Could not load categories: " + err.message });
  }
});

app.listen(3000, () => {
  console.log("App started on port 3000");
});

module.exports = app;
