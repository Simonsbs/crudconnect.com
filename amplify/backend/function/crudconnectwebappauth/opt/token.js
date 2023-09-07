const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const jwksClient = require("jwks-rsa");

const secretsManager = new AWS.SecretsManager();

const userPoolId = "us-east-1_KarZ85pi4";
const jwksUri = `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

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

async function decodeAndVerifyToken(req) {
  const authType = await identifyAuthentication(req);
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

      tokenPayload = {
        authType: "Cognito",
        payload: payload,
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

async function identifyAuthentication(req) {
  if (req.headers && req.headers.authorization) {
    if (req.headers.authorization.startsWith("Bearer ")) {
      return "JWT";
    } else if (req.headers.authorization.startsWith("Cognito ")) {
      return "Cognito";
    }
  }
  return "Public";
}

// const extractProjectIDFromCategory = (projectID_Category) => {
//   const parts = projectID_Category.split("_");
//   return parts[0];
// };

module.exports = { test, identifyAuthentication, decodeAndVerifyToken };
