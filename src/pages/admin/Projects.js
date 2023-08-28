import React, { useState, useEffect, useContext } from "react";
import { API } from "aws-amplify";
import { Form, Button, Table, Modal } from "react-bootstrap";
import { useAuthenticator } from "@aws-amplify/ui-react-core";
import { Loader } from "@aws-amplify/ui-react";
import { ProjectsContext } from "../../contexts/ProjectsContext";
import DeleteModal from "../../components/DeleteModal";

function ProjectRow({ project, onEdit, onDelete, setShowEditModal }) {
  return (
    <tr key={project.ID}>
      <td>{project.ID}</td>
      <td>{project.Name}</td>
      <td>{project.Description}</td>
      <td>
        <Button
          variant="warning"
          className="me-2"
          onClick={() => {
            onEdit(project);
            setShowEditModal(true); // Ensure this line is present
          }}
        >
          Edit
        </Button>
        <Button variant="danger" onClick={() => onDelete(project.ID)}>
          Delete
        </Button>
      </td>
    </tr>
  );
}

function ProjectModal({ show, project, onClose, onSave }) {
  const [currentProject, setCurrentProject] = useState(project);

  useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          {currentProject?.ID ? "Edit Project" : "Add Project"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ProjectForm project={currentProject} onChange={setCurrentProject} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={() => onSave(currentProject)}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function ProjectForm({ project, onChange }) {
  return (
    <>
      <Form.Group>
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          value={project?.Name || ""}
          onChange={(e) => onChange({ ...project, Name: e.target.value })}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          value={project?.Description || ""}
          onChange={(e) =>
            onChange({ ...project, Description: e.target.value })
          }
        />
      </Form.Group>
    </>
  );
}

function Projects() {
  const [editingProject, setEditingProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteID, setDeleteID] = useState(null);
  const { user } = useAuthenticator((context) => [context.user]);

  const { projects, addProject, updateProject, removeProject } =
    useContext(ProjectsContext);

  const UserID = user?.attributes?.sub;

  const handleAddProject = () => {
    setEditingProject({
      ID: "",
      UserID,
      Name: "",
      Description: "",
    });
    setShowEditModal(true);
  };

  const handleSaveProject = async (projectData) => {
    projectData = { ...projectData, UserID };

    if (projectData.ID) {
      await API.put("ccApiBack", "/project", { body: projectData });
      updateProject(projectData);
    } else {
      const response = await API.post("ccApiBack", "/project", {
        body: projectData,
      });
      addProject(response.data);
    }
    setShowEditModal(false);
  };

  const handleDeleteProjectConfirmation = (ID) => {
    setDeleteID(ID);
    setShowDeleteModal(true);
  };

  const handleDeleteProject = async () => {
    await API.del("ccApiBack", `/project/object/${deleteID}/${UserID}`);
    removeProject(deleteID);
    setShowDeleteModal(false);
  };

  return (
    <div className="container mt-5">
      <h1>Projects</h1>
      <Table responsive>
        <thead>
          <tr>
            <th>Project ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects ? (
            projects.map((project) => (
              <ProjectRow
                key={project.ID}
                project={project}
                onEdit={setEditingProject}
                onDelete={handleDeleteProjectConfirmation}
                setShowEditModal={setShowEditModal}
              />
            ))
          ) : (
            <tr>
              <td colSpan={4}>
                <Loader variation="linear" />
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      <Button variant="primary" onClick={handleAddProject}>
        Add Project
      </Button>

      <ProjectModal
        show={showEditModal}
        project={editingProject}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProject}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteProject}
        dataType="project"
      />
    </div>
  );
}

export default Projects;
