/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

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
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const { SecretsManager } = require("aws-sdk");

const ddbClient = new DynamoDBClient({ region: process.env.TABLE_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const secretsManager = new SecretsManager();

let tableName = "ccTblUser";
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + "-" + process.env.ENV;
}

const userIdPresent = false; // TODO: update in case is required to use that definition
const partitionKeyName = "ProjectID";
const partitionKeyType = "S";
const sortKeyName = "Email";
const sortKeyType = "S";
const hasSortKey = sortKeyName !== "";
const path = "/user";
const UNAUTH = "UNAUTH";
const hashKeyPath = "/:" + partitionKeyName;
const sortKeyPath = hasSortKey ? "/:" + sortKeyName : "";

// declare a new express app
const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

// convert url string param to expected Type
const convertUrlType = (param, type) => {
  switch (type) {
    case "N":
      return Number.parseInt(param);
    default:
      return param;
  }
};

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

/********************************
 * HTTP Get method for list objects *
 ********************************/

app.get(path + hashKeyPath, async function (req, res) {
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

    // Remove the password field from each item
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

/*****************************************
 * HTTP Get method for get single object *
 *****************************************/

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

/************************************
 * HTTP put method for insert object *
 *************************************/

app.put(path + hashKeyPath + sortKeyPath, async function (req, res) {
  const tokenPayload = await verifyToken(req);
  if (!tokenPayload) {
    req.body["Role"] = "Guest";
  }

  const projectID = req.params[partitionKeyName];
  const email = req.params[sortKeyName];

  // Ensure Email from the path is used and not from the body
  req.body["Email"] = email;

  // Check if the item already exists
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
      // If the item doesn't exist, return an error
      res.statusCode = 404;
      res.json({ error: "Item not found!" });
      return;
    }

    // If the item exists, proceed to update it
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

/************************************
 * HTTP post method for insert object *
 *************************************/

app.post(path, async function (req, res) {
  const tokenPayload = await verifyToken(req);
  if (!tokenPayload) {
    req.body["Role"] = "Guest";
  }

  // Check if the item already exists
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
      // If the item exists, return it
      existingItem.Item["Password"] = "*****";
      res.json({ success: "Item already exists!" });
      return;
    }

    // If the item doesn't exist, proceed to insert it
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

/**************************************
 * HTTP remove method to delete object *
 ***************************************/

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

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
