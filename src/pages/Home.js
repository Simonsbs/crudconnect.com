import React from "react";
import { Container, Row, Col, Image } from "react-bootstrap";
import { Link } from "react-router-dom";

function Home() {
  return (
    <Container>
      <Row className="mt-5">
        <Col md={6}>
          <h1>CRUD - Connect</h1>
          <p>
            This is the home page for CRUD - Connect, a tool designed
            specifically for web developers.
          </p>
          <ul>
            <li>
              Allows you to build a front-end website without worrying about the
              backend API.
            </li>
            <li>Quickly set up a REST API.</li>
            <li>Free to try!</li>
            <li>
              <strong>Note:</strong> We are currently in beta stages. Your
              feedback is invaluable to us.
            </li>
          </ul>
          <Link className="btn btn-primary" to={"/login"}>
            Get Started
          </Link>
        </Col>
        <Col md={6}>
          <Image
            src="https://images.unsplash.com/photo-1593720213428-28a5b9e94613?ixid=M3w0NDgzMDl8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudHxlbnwwfHx8fDE2OTI3NzA1OTB8MA&ixlib=rb-4.0.3"
            alt="Web Development"
            fluid
          />
        </Col>
      </Row>
    </Container>
  );
}

export default Home;
