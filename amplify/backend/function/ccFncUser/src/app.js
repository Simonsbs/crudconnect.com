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

app.get(path + hashKeyPath, async function (req, res) {
  const tokenPayload = await decodeAndVerifyToken(req);
  if (
    !tokenPayload ||
    tokenPayload.payload["authType"] === "Public" ||
    tokenPayload.payload["Role"] !== "Admin"
  ) {
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
      req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH,
    ];
  } else {
    try {
      condition[partitionKeyName]["AttributeValueList"] = [
        convertUrlType(req.params[partitionKeyName], partitionKeyType),
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

  try {
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

app.get(
  path + "/object" + hashKeyPath + sortKeyPath,
  async function (req, res) {
    const params = {};
    if (userIdPresent && req.apiGateway) {
      params[partitionKeyName] =
        req.apiGateway.event.requestContext.identity.cognitoIdentityId ||
        UNAUTH;
    } else {
      params[partitionKeyName] = req.params[partitionKeyName];
      try {
        params[partitionKeyName] = convertUrlType(
          req.params[partitionKeyName],
          partitionKeyType
        );
      } catch (err) {
        res.statusCode = 500;
        res.json({ error: "Wrong column type " + err });
      }
    }
    if (hasSortKey) {
      try {
        params[sortKeyName] = convertUrlType(
          req.params[sortKeyName],
          sortKeyType
        );
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

app.put(path + hashKeyPath + sortKeyPath, async function (req, res) {
  const tokenPayload = await decodeAndVerifyToken(req);
  if (!tokenPayload) {
    req.body["Role"] = "Guest";
  }

  const projectID = req.params[partitionKeyName];
  const email = req.params[sortKeyName];

  req.body["Email"] = email;

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

app.post(path, async function (req, res) {
  const tokenPayload = await decodeAndVerifyToken(req);
  if (!tokenPayload) {
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
    const params = {};
    if (userIdPresent && req.apiGateway) {
      params[partitionKeyName] =
        req.apiGateway.event.requestContext.identity.cognitoIdentityId ||
        UNAUTH;
    } else {
      params[partitionKeyName] = req.params[partitionKeyName];
      try {
        params[partitionKeyName] = convertUrlType(
          req.params[partitionKeyName],
          partitionKeyType
        );
      } catch (err) {
        res.statusCode = 500;
        res.json({ error: "Wrong column type " + err });
      }
    }
    if (hasSortKey) {
      try {
        params[sortKeyName] = convertUrlType(
          req.params[sortKeyName],
          sortKeyType
        );
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
