const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const bodyParser = require("body-parser");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
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

const extractProjectIDFromCategory = (projectID_Category) => {
  const parts = projectID_Category.split("_");
  return parts[0]; // Assuming the format is always "ProjectID_Category"
};

// 1. Get All Items in project
app.get("/item/:ProjectID_Category", async (req, res) => {
  const ProjectID_Category = req.params.ProjectID_Category;
  const tokenPayload = await verifyToken(req);

  const queryParams = {
    TableName: tableName,
    KeyConditionExpression: "ProjectID_Category = :pid",
    ExpressionAttributeValues: {
      ":pid": ProjectID_Category,
    },
  };

  try {
    const data = await ddbDocClient.send(new QueryCommand(queryParams));
    const filteredItems = data.Items.filter((item) => {
      if (tokenPayload) {
        return true; // Return all items if token is valid
      } else {
        return item.Scope === "Public"; // Return only public items if no token
      }
    });
    res.json(filteredItems);
  } catch (err) {
    res.status(500).json({ error: "Could not load items: " + err.message });
  }
});

// 3. Post a new item to the project
app.post("/item/:ProjectID_Category", async (req, res) => {
  const ProjectID_Category = req.params.ProjectID_Category;
  const ProjectID = extractProjectIDFromCategory(ProjectID_Category);
  const tokenPayload = await verifyToken(req);

  if (!tokenPayload || tokenPayload.ProjectID !== ProjectID) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const newItem = {
    ProjectID_Category: ProjectID_Category,
    ItemID: uuidv4(),
    ...req.body,
  };

  const putItemParams = {
    TableName: tableName,
    Item: newItem,
  };

  try {
    await ddbDocClient.send(new PutCommand(putItemParams));
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Could not insert item: " + err.message });
  }
});

// 4. Update an item in the project
app.put("/item/:ProjectID_Category/:ItemID", async (req, res) => {
  const { ProjectID_Category, ItemID } = req.params;
  const ProjectID = extractProjectIDFromCategory(ProjectID_Category);
  const tokenPayload = await verifyToken(req);

  if (!tokenPayload || tokenPayload.ProjectID !== ProjectID) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  for (let key in req.body) {
    if (key !== "ProjectID_Category" && key !== "ItemID") {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = req.body[key];
    }
  }

  const updateItemParams = {
    TableName: tableName,
    Key: {
      ProjectID_Category: ProjectID_Category,
      ItemID: ItemID,
    },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  };

  try {
    const data = await ddbDocClient.send(new UpdateCommand(updateItemParams));
    res.json(data.Attributes);
  } catch (err) {
    res.status(500).json({ error: "Could not update item: " + err.message });
  }
});

// 5. Delete item from the project
app.delete("/item/:ProjectID_Category/:ItemID", async (req, res) => {
  const { ProjectID_Category, ItemID } = req.params;
  const ProjectID = extractProjectIDFromCategory(ProjectID_Category);
  const tokenPayload = await verifyToken(req);

  if (!tokenPayload || tokenPayload.ProjectID !== ProjectID) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const deleteItemParams = {
    TableName: tableName,
    Key: {
      ProjectID_Category: ProjectID_Category,
      ItemID: ItemID,
    },
  };

  try {
    await ddbDocClient.send(new DeleteCommand(deleteItemParams));
    res.json({ success: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete item: " + err.message });
  }
});

app.listen(3000, () => {
  console.log("App started on port 3000");
});

module.exports = app;
