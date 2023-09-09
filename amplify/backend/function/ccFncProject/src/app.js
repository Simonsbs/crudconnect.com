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
} = require("@aws-sdk/lib-dynamodb");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const bodyParser = require("body-parser");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getProjectsForUser } = require("/opt/token");

const ddbClient = new DynamoDBClient({ region: process.env.TABLE_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

let tableName = "ccTblProject";
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + "-" + process.env.ENV;
}

const userIdPresent = false; // TODO: update in case is required to use that definition
const partitionKeyName = "ID";
const partitionKeyType = "S";
const sortKeyName = "UserID";
const sortKeyType = "S";
const hasSortKey = sortKeyName !== "";
const path = "/project";
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

/********************************
 * HTTP Get method for list objects *
 ********************************/

function getUserFromRequest(req) {
  try {
    return req.apiGateway.event.requestContext.identity.cognitoAuthenticationProvider.split(
      ":"
    )[2];
  } catch {
    return null;
  }
}

// 1. Get all projects using the authorization sub (UserID)
app.get(path, async function (req, res) {
  try {
    let userId = getUserFromRequest(req) || UNAUTH;

    const projects = await getProjectsForUser(userId);

    if (!projects) {
      res.statusCode = 500;
      res.json({ error: "Could not load items" });
      return;
    }

    res.json(projects);
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: "Could not load items: " + err.message });
  }
  /*let scanParams = {
    TableName: tableName,
    FilterExpression: "#UserID = :UserIDVal",
    ExpressionAttributeNames: {
      "#UserID": sortKeyName,
    },
    ExpressionAttributeValues: {
      ":UserIDVal": userId,
    },
  };

  try {
    const data = await ddbDocClient.send(new ScanCommand(scanParams));
    res.json(data.Items);
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: "Could not load items: " + err.message });
  }*/
});

/*****************************************
 * HTTP Get method for get single object *
 *****************************************/

// 2. Get a single project using the project id (ID) and verify it belongs to the UserID that is in the authorization sub
app.get(path + hashKeyPath, async function (req, res) {
  const userId = getUserFromRequest(req) || UNAUTH;
  const projectId = req.params[partitionKeyName];

  let getItemParams = {
    TableName: tableName,
    Key: {
      [partitionKeyName]: projectId,
      [sortKeyName]: userId,
    },
  };

  try {
    const data = await ddbDocClient.send(new GetCommand(getItemParams));
    if (data.Item) {
      res.json(data.Item);
    } else {
      res.json(data);
    }
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: "Could not load items: " + err.message });
  }
});

/************************************
 * HTTP put method for insert object *
 *************************************/

app.put(path, async function (req, res) {
  req.body["UserID"] = getUserFromRequest(req);

  let putItemParams = {
    TableName: tableName,
    Item: req.body,
  };
  try {
    let data = await ddbDocClient.send(new PutCommand(putItemParams));
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
  req.body["ID"] = uuidv4();
  req.body["UserID"] = getUserFromRequest(req);

  let putItemParams = {
    TableName: tableName,
    Item: req.body,
  };
  try {
    await ddbDocClient.send(new PutCommand(putItemParams));
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
      params[partitionKeyName] = getUserFromRequest(req) || UNAUTH;
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
      let data = await ddbDocClient.send(new DeleteCommand(removeItemParams));
      res.json({ url: req.url, data: data });
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
