const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const jwksClient = require("jwks-rsa");

const secretsManager = new AWS.SecretsManager();

const userPoolId = "us-east-1_KarZ85pi4";
const jwksUri = `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

const ddbClient = new DynamoDBClient({ region: "us-east-1" });
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const client = jwksClient({
  jwksUri: jwksUri,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

async function getJwtSecret() {
  const secretData = await secretsManager
    .getSecretValue({ SecretId: "jwtSigningKey" })
    .promise();
  return JSON.parse(secretData.SecretString).ccJWTSecret;
}

function test() {
  return "test";
}

async function getProjectsForUser(userId) {
  let scanParams = {
    TableName: "ccTblProject-newdev",
    FilterExpression: "#UserID = :UserIDVal",
    ExpressionAttributeNames: {
      "#UserID": "UserID",
    },
    ExpressionAttributeValues: {
      ":UserIDVal": userId,
    },
  };

  try {
    const data = await ddbDocClient.send(new ScanCommand(scanParams));
    return data.Items;
  } catch (err) {
    console.error("getProjectsForUser: " + err.message, err);
    return {
      error: "Could not load items: " + err.message,
      userId: userId,
      scanParams: scanParams,
    };
  }
}

async function decodeAndVerifyToken(req) {
  const authType = identifyAuthentication(req);
  let tokenPayload = { authType: authType };

  if (authType === "JWT") {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const jwtSecret = await getJwtSecret();

    try {
      const decoded = jwt.verify(token, jwtSecret);
      tokenPayload = {
        authType: "External",
        payload: decoded,
        projects: [decoded.ProjectID],
      };
    } catch (err) {
      tokenPayload = {
        authType: "Public",
        error: "Invalid JWT token",
        err: err,
      };
    }
  } else if (authType === "Cognito") {
    try {
      const token = req.headers.authorization.split(" ")[1];

      const payload = await new Promise((resolve, reject) => {
        jwt.verify(
          token,
          getKey,
          {
            algorithms: ["RS256"],
            issuer: `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`,
          },
          (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded);
          }
        );
      });

      const projects = await getProjectsForUser(payload.sub);

      tokenPayload = {
        authType: "Cognito",
        payload: payload,
        projects: projects ? projects.map((project) => project.ID) : [],
      };
    } catch (err) {
      tokenPayload = {
        authType: "Cognito",
        error: "Invalid Cognito token",
        err: err,
      };
    }
  }

  return tokenPayload;
}

function identifyAuthentication(req) {
  if (req.headers && req.headers.authorization) {
    if (req.headers.authorization.startsWith("Bearer ")) {
      return "JWT";
    } else if (req.headers.authorization.startsWith("Cognito ")) {
      return "Cognito";
    }
  }
  return "Public";
}

module.exports = {
  test,
  identifyAuthentication,
  decodeAndVerifyToken,
  getProjectsForUser,
};
