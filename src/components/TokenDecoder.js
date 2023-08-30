import { CognitoJwtVerifier } from "aws-jwt-verify";
import React, { useState } from "react";

const verifier = CognitoJwtVerifier.create({
  userPoolId: "us-east-1_KarZ85pi4",
  tokenUse: "access",
});

function TokenDecoder() {
  const [token, setToken] = useState("");
  const [decodedToken, setDecodedToken] = useState(null);

  const handleTokenChange = (e) => {
    setToken(e.target.value);
  };

  const decodeToken = async () => {
    try {
      const payload = await verifier.verify(token);
      setDecodedToken(payload);
      console.log("Token is valid. Payload:", payload);
    } catch {
      console.log("Token not valid!");
    }
  };

  return (
    <div>
      <h2>Token Decoder</h2>
      <textarea
        rows="5"
        cols="50"
        value={token}
        onChange={handleTokenChange}
        placeholder="Enter your token here"
      />
      <br />
      <button onClick={decodeToken}>Decode Token</button>
      <br />
      {decodedToken && (
        <div>
          <h3>Decoded Token:</h3>
          <pre>{JSON.stringify(decodedToken, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default TokenDecoder;
