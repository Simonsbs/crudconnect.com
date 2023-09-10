import { useEffect } from "react";
import apiWrapper from "../services/apiWrapper";

function About() {
  useEffect(() => {
    async function fetchProjects() {
      const response = await apiWrapper.get("/test/test");
      console.log(response);
    }
    fetchProjects();
  }, []);

  return <h1>About US</h1>;
}

export default About;
