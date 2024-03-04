import React from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

const ApiDocumentation = () => {
  return <SwaggerUI url={`${process.env.PUBLIC_URL}/docs/ccApiFront.yaml`} />;
};

export default ApiDocumentation;
