const express = require("express");
const bodyParser = require("body-parser");
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
const token = require("/opt/token");
const AWS = require("aws-sdk");

// declare a new express app
const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

const sts = new AWS.STS();

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

/**********************
 * Example get method *
 **********************/

/*app.get("/test", function (req, res) {
  try {
    res.json({ success: "get call succeed!", url: req.url });
  } catch (err) {
    res.status(500).json({ error: err.message, err });
  }
});*/

app.get("/test/*", async function (req, res) {
  let identity;
  try {
    identity = await sts.getCallerIdentity({}).promise();
  } catch (error) {
    identity = { error: error.message, obj: error };
  }

  try {
    const val = token.test();
    const payload = await token.decodeAndVerifyToken(req);
    res.json({
      success: "get call succeed!",
      url: req.url,
      val,
      payload,
      auth: req.headers.authorization,
      headers: req.headers,
      gateway: req.apiGateway,
      identity,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      err,
      auth: req.headers.authorization,
      headers: req.headers,
    });
  }
});

/****************************
 * Example post method *
 ****************************/

app.post("/test", function (req, res) {
  // Add your code here
  res.json({ success: "post call succeed!", url: req.url, body: req.body });
});

app.post("/test/*", function (req, res) {
  // Add your code here
  res.json({ success: "post call succeed!", url: req.url, body: req.body });
});

/****************************
 * Example put method *
 ****************************/

app.put("/test", function (req, res) {
  // Add your code here
  res.json({ success: "put call succeed!", url: req.url, body: req.body });
});

app.put("/test/*", function (req, res) {
  // Add your code here
  res.json({ success: "put call succeed!", url: req.url, body: req.body });
});

/****************************
 * Example delete method *
 ****************************/

app.delete("/test", function (req, res) {
  // Add your code here
  res.json({ success: "delete call succeed!", url: req.url });
});

app.delete("/test/*", function (req, res) {
  // Add your code here
  res.json({ success: "delete call succeed!", url: req.url });
});

app.listen(3000, function () {
  console.log("App started");
});

module.exports = app;
