import { API } from "aws-amplify";
import { createContext, useEffect, useState } from "react";

export const ProjectsContext = createContext();

export function ProjectsProvider({ children }) {
  const [projects, setProjects] = useState();
  const [selectedProject, setSelectedProject] = useState();

  const fetchProjects = async () => {
    const response = await API.get("ccApiBack", `/project`);
    setProjects(response);
    if (response.length > 0) {
      const selectedProjectUUID = localStorage.getItem("SELECTED_PROJECT_UUID");
      const selectedProject =
        response.find((proj) => proj.ID === selectedProjectUUID) || response[0];
      setSelectedProject(selectedProject);
    }
  };

  const selectProject = (project) => {
    setSelectedProject(project);
    localStorage.setItem("SELECTED_PROJECT_UUID", project?.ID);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <ProjectsContext.Provider
      value={{ projects, setProjects, selectProject, selectedProject }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}
