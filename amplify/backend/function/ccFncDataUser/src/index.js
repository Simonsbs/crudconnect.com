const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const tableName = "ccDataUser";

  try {
    switch (event.httpMethod) {
      case "GET":
        if (event.pathParameters && event.pathParameters.id) {
          return await getUser(event, tableName);
        } else if (
          event.queryStringParameters &&
          event.queryStringParameters.accountID
        ) {
          return await getUsersByAccountID(event, tableName);
        } else {
          return await getAllUsers(tableName);
        }
      case "POST":
        return await createUser(event, tableName);
      case "PUT":
        return await updateUser(event, tableName);
      case "DELETE":
        return await deleteUser(event, tableName);
      default:
        throw new Error("Invalid operation");
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: error.message }),
    };
  }
};

const corsHeaders = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
});

const getAllUsers = async (tableName) => {
  const result = await dynamo
    .scan({
      TableName: tableName,
    })
    .promise();

  let res = [];

  if (result.Items && result.Items.length > 0) {
    res = result.Items;
  }

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(res),
  };
};

const getUser = async (event, tableName) => {
  const userId = event.pathParameters.id;

  const result = await dynamo
    .get({
      TableName: tableName,
      Key: { id: userId },
    })
    .promise();

  if (!result.Item) {
    throw new Error("User not found");
  }

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(result.Item),
  };
};

const getUsersByAccountID = async (event, tableName) => {
  const accountID = event.queryStringParameters.accountID;

  const result = await dynamo
    .query({
      TableName: tableName,
      IndexName: "accountID-index",
      KeyConditionExpression: "accountID = :accountID",
      ExpressionAttributeValues: {
        ":accountID": accountID,
      },
    })
    .promise();

  if (!result.Items || result.Items.length === 0) {
    throw new Error("No users found for this accountID");
  }

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(result.Items),
  };
};

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const createUser = async (event, tableName) => {
  const user = JSON.parse(event.body);

  if (!user.accountID || !user.userName || !user.password) {
    throw new Error("Missing mandatory fields");
  }

  user.id = user.id || generateUUID();

  await dynamo
    .put({
      TableName: tableName,
      Item: user,
    })
    .promise();

  return {
    statusCode: 201,
    headers: corsHeaders(),
    body: JSON.stringify(user),
  };
};

const updateUser = async (event, tableName) => {
  const userId = event.pathParameters.id;
  const userUpdates = JSON.parse(event.body);

  // Password and accountID shouldn't be updated without specific logic
  delete userUpdates.password;
  delete userUpdates.accountID;

  const updateExpression = Object.keys(userUpdates)
    .map((key) => `${key} = :${key}`)
    .join(", ");
  const expressionAttributeValues = {};
  for (let key in userUpdates) {
    expressionAttributeValues[`:${key}`] = userUpdates[key];
  }

  await dynamo
    .update({
      TableName: tableName,
      Key: { id: userId },
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeValues: expressionAttributeValues,
    })
    .promise();

  return {
    statusCode: 204,
    headers: corsHeaders(),
    body: "",
  };
};

const deleteUser = async (event, tableName) => {
  const userId = event.pathParameters.id;

  console.log(`Deleting user ${userId}`);

  await dynamo
    .delete({
      TableName: tableName,
      Key: { id: userId },
    })
    .promise();

  return {
    statusCode: 204,
    headers: corsHeaders(),
    body: "",
  };
};
