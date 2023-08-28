import { API } from "aws-amplify";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const ProjectsContext = createContext();

export function ProjectsProvider({ children }) {
  const [projects, setProjects] = useState();
  const [selectedProject, setSelectedProject] = useState();
  const navigate = useNavigate();

  const fetchProjects = async () => {
    const response = await API.get("ccApiBack", `/project`);
    setProjects(response);
    if (response.length > 0) {
      const selectedProjectUUID = localStorage.getItem("SELECTED_PROJECT_UUID");
      const selectedProj =
        response.find((proj) => proj.ID === selectedProjectUUID) || response[0];
      setSelectedProject(selectedProj);
    } else {
      navigate("/admin/projects/");
    }
  };

  const selectProject = (project) => {
    setSelectedProject(project);
    localStorage.setItem("SELECTED_PROJECT_UUID", project?.ID);
  };

  const addProject = (newProject) => {
    setProjects((prevProjects) => [...prevProjects, newProject]);
  };

  const updateProject = (updatedProject) => {
    setProjects((prevProjects) => {
      return prevProjects.map((proj) =>
        proj.ID === updatedProject.ID ? updatedProject : proj
      );
    });
  };

  const removeProject = (projectIdentifier) => {
    setProjects((prevProjects) => {
      if (typeof projectIdentifier === "object") {
        return prevProjects.filter((proj) => proj.ID !== projectIdentifier.ID);
      }
      return prevProjects.filter((proj) => proj.ID !== projectIdentifier);
    });
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        selectProject,
        selectedProject,
        removeProject,
        addProject,
        updateProject,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}
