const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const bodyParser = require("body-parser");
const express = require("express");
const { decodeAndVerifyToken } = require("/opt/token");

const ddbClient = new DynamoDBClient({ region: process.env.TABLE_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

let tableName = "ccTblUser";
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + "-" + process.env.ENV;
}

const userIdPresent = false;
const partitionKeyName = "ProjectID";
const partitionKeyType = "S";
const sortKeyName = "Email";
const sortKeyType = "S";
const hasSortKey = sortKeyName !== "";
const path = "/user";
const UNAUTH = "UNAUTH";
const hashKeyPath = "/:" + partitionKeyName;
const sortKeyPath = hasSortKey ? "/:" + sortKeyName : "";

const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

const convertUrlType = (param, type) => {
  switch (type) {
    case "N":
      return Number.parseInt(param);
    default:
      return param;
  }
};

// get all project users
app.get(path + hashKeyPath, async function (req, res) {
  try {
    const tokenPayload = await decodeAndVerifyToken(req);
    const projectID = req.params[partitionKeyName];

    if (
      !tokenPayload ||
      tokenPayload?.authType?.toLowerCase() === "public" ||
      !tokenPayload.projects ||
      tokenPayload.projects.length === 0 ||
      !tokenPayload.projects.includes(projectID)
    ) {
      res.statusCode = 403;
      res.json({ error: "Not authorized" });
      return;
    }

    const isAdmin = tokenPayload.payload?.Role?.toLowerCase() === "admin";

    if (tokenPayload.authType === "JWT" && !isAdmin) {
      res.statusCode = 403;
      res.json({ error: "Not authorized" });
      return;
    }

    const condition = {};
    condition[partitionKeyName] = {
      ComparisonOperator: "EQ",
    };

    if (userIdPresent && req.apiGateway) {
      condition[partitionKeyName]["AttributeValueList"] = [
        req.apiGateway.event.requestContext.identity.cognitoIdentityId ||
          UNAUTH,
      ];
    } else {
      try {
        condition[partitionKeyName]["AttributeValueList"] = [
          convertUrlType(projectID, partitionKeyType),
        ];
      } catch (err) {
        res.statusCode = 500;
        res.json({ error: "Wrong column type " + err });
      }
    }

    let queryParams = {
      TableName: tableName,
      KeyConditions: condition,
    };

    const data = await ddbDocClient.send(new QueryCommand(queryParams));

    const sanitizedItems = data.Items.map((item) => {
      item.Password = "*****";
      return item;
    });

    res.json(sanitizedItems);
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: "Could not load items: " + err.message });
  }
});

// get a single project user
app.get(
  path + "/object" + hashKeyPath + sortKeyPath,
  async function (req, res) {
    const tokenPayload = await decodeAndVerifyToken(req);
    const projectID = req.params[partitionKeyName];
    const email = req.params[sortKeyName];

    if (
      !tokenPayload ||
      tokenPayload.authType?.toLowerCase() === "public" ||
      !tokenPayload.projects ||
      tokenPayload.projects.length === 0 ||
      !tokenPayload.projects.includes(projectID)
    ) {
      res.statusCode = 403;
      res.json({ error: "Not authorized" });
      return;
    }

    const isAdmin = tokenPayload.payload?.Role?.toLowerCase() === "admin";
    const isOwner =
      tokenPayload.payload?.Email?.toLowerCase() === email.toLowerCase();

    if (tokenPayload.authType === "JWT") {
      if (!isAdmin && !isOwner) {
        res.statusCode = 403;
        res.json({ error: "Not authorized" });
        return;
      }
    }

    const params = {};
    if (userIdPresent && req.apiGateway) {
      params[partitionKeyName] =
        req.apiGateway.event.requestContext.identity.cognitoIdentityId ||
        UNAUTH;
    } else {
      params[partitionKeyName] = projectID;
      try {
        params[partitionKeyName] = convertUrlType(projectID, partitionKeyType);
      } catch (err) {
        res.statusCode = 500;
        res.json({ error: "Wrong column type " + err });
      }
    }
    if (hasSortKey) {
      try {
        params[sortKeyName] = convertUrlType(email, sortKeyType);
      } catch (err) {
        res.statusCode = 500;
        res.json({ error: "Wrong column type " + err });
      }
    }

    let getItemParams = {
      TableName: tableName,
      Key: params,
    };

    try {
      const data = await ddbDocClient.send(new GetCommand(getItemParams));

      if (data.Item) {
        data.Item["Password"] = "*****";
        res.json(data.Item);
      } else {
        res.json({});
      }
    } catch (err) {
      res.statusCode = 500;
      res.json({ error: "Could not load items: " + err.message });
    }
  }
);

// update a single project user
app.put(path + hashKeyPath + sortKeyPath, async function (req, res) {
  const tokenPayload = await decodeAndVerifyToken(req);
  const projectID = req.params[partitionKeyName];
  const email = req.params[sortKeyName];

  if (
    !tokenPayload ||
    tokenPayload.authType?.toLowerCase() === "public" ||
    !tokenPayload.projects ||
    tokenPayload.projects.length === 0 ||
    !tokenPayload.projects.includes(projectID)
  ) {
    res.statusCode = 403;
    res.json({ error: "Not authorized" });
    return;
  }

  const isAdmin = tokenPayload.payload?.Role?.toLowerCase() === "admin";
  const isOwner =
    tokenPayload.payload?.Email?.toLowerCase() === email.toLowerCase();

  if (tokenPayload.authType === "JWT") {
    if (!isAdmin && !isOwner) {
      res.statusCode = 403;
      res.json({ error: "Not authorized" });
      return;
    }
  }

  const getItemParams = {
    TableName: tableName,
    Key: {
      ProjectID: projectID,
      Email: email,
    },
  };

  try {
    const existingItem = await ddbDocClient.send(new GetCommand(getItemParams));

    if (!existingItem.Item) {
      res.statusCode = 404;
      res.json({ error: "Item not found!" });
      return;
    }

    // Admin and Owner can update the password
    // only update password if it is sent
    if (!req.body["Password"]) {
      req.body["Password"] = existingItem.Item["Password"];
    }

    // Only Admin can update the role
    if (!isAdmin) {
      req.body["Role"] = existingItem.Item["Role"];
    }

    // No one can update the email
    req.body["Email"] = existingItem.Item["Email"];

    let putItemParams = {
      TableName: tableName,
      Item: req.body,
    };

    await ddbDocClient.send(new PutCommand(putItemParams));

    req.body["Password"] = "*****";
    res.json({ success: "put call succeed!", url: req.url, data: req.body });
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err, url: req.url, body: req.body });
  }
});

// create a new project user
app.post(path, async function (req, res) {
  const tokenPayload = await decodeAndVerifyToken(req);

  if (!tokenPayload || tokenPayload.authType?.toLowerCase() === "public") {
    req.body["Role"] = "Guest";
  } else if (
    tokenPayload.authType?.toLowerCase() === "jwt" &&
    tokenPayload.payload?.Role?.toLowerCase() !== "admin"
  ) {
    req.body["Role"] = "Guest";
  }

  const getItemParams = {
    TableName: tableName,
    Key: {
      ProjectID: req.body["ProjectID"],
      Email: req.body["Email"],
    },
  };

  try {
    const existingItem = await ddbDocClient.send(new GetCommand(getItemParams));

    if (existingItem.Item) {
      existingItem.Item["Password"] = "*****";
      res.json({ success: "Item already exists!" });
      return;
    }

    let putItemParams = {
      TableName: tableName,
      Item: req.body,
    };

    await ddbDocClient.send(new PutCommand(putItemParams));
    req.body["Password"] = "*****";
    res.json({ success: "post call succeed!", url: req.url, data: req.body });
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err, url: req.url, body: req.body });
  }
});

app.delete(
  path + "/object" + hashKeyPath + sortKeyPath,
  async function (req, res) {
    const tokenPayload = await decodeAndVerifyToken(req);
    const projectID = req.params[partitionKeyName];
    const email = req.params[sortKeyName];

    if (
      !tokenPayload ||
      tokenPayload.authType?.toLowerCase() === "public" ||
      !tokenPayload.projects ||
      tokenPayload.projects.length === 0 ||
      !tokenPayload.projects.includes(projectID)
    ) {
      res.statusCode = 403;
      res.json({ error: "Not authorized" });
      return;
    }

    const isAdmin = tokenPayload.payload?.Role?.toLowerCase() === "admin";
    const isOwner =
      tokenPayload.payload?.Email?.toLowerCase() === email.toLowerCase();

    if (tokenPayload.authType?.toLowerCase() === "jwt") {
      if (!isAdmin && !isOwner) {
        res.statusCode = 403;
        res.json({ error: "Not authorized" });
        return;
      }
    }

    const params = {};
    if (userIdPresent && req.apiGateway) {
      params[partitionKeyName] =
        req.apiGateway.event.requestContext.identity.cognitoIdentityId ||
        UNAUTH;
    } else {
      params[partitionKeyName] = projectID;
      try {
        params[partitionKeyName] = convertUrlType(projectID, partitionKeyType);
      } catch (err) {
        res.statusCode = 500;
        res.json({ error: "Wrong column type " + err });
      }
    }
    if (hasSortKey) {
      try {
        params[sortKeyName] = convertUrlType(email, sortKeyType);
      } catch (err) {
        res.statusCode = 500;
        res.json({ error: "Wrong column type " + err });
      }
    }

    let removeItemParams = {
      TableName: tableName,
      Key: params,
    };

    try {
      await ddbDocClient.send(new DeleteCommand(removeItemParams));
      res.json({ url: req.url });
    } catch (err) {
      res.statusCode = 500;
      res.json({ error: err, url: req.url });
    }
  }
);

app.listen(3000, function () {
  console.log("App started");
});

module.exports = app;
