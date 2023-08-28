import React, { useState, useEffect, useContext } from "react";
import { API } from "aws-amplify";
import { Form, Button, Table, Modal } from "react-bootstrap";
import { useAuthenticator } from "@aws-amplify/ui-react-core";
import { Loader } from "@aws-amplify/ui-react";
import { ProjectsContext } from "../../contexts/ProjectsContext";

function Projects() {
  const [editingProject, setEditingProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteID, setDeleteID] = useState(null);
  const { user } = useAuthenticator((context) => [context.user]);

  const { projects, setProjects, addProject, updateProject, removeProject } =
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

  const handleSaveProject = async () => {
    const projectData = { ...editingProject, UserID };

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
            {/* <th>User ID</th> */}
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects ? (
            projects.map((project) => (
              <tr key={project.ID}>
                <td>{project.ID}</td>
                {/* <td>{project.UserID}</td> */}
                <td>{project.Name}</td>
                <td>{project.Description}</td>
                <td>
                  <Button
                    variant="warning"
                    className="me-2"
                    onClick={() => {
                      setEditingProject(project);
                      setShowEditModal(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteProjectConfirmation(project.ID)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
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

      {/* Edit/Add Project Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProject?.ID ? "Edit Project" : "Add Project"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={editingProject?.Name || ""}
              onChange={(e) =>
                setEditingProject((prev) => ({
                  ...prev,
                  Name: e.target.value,
                }))
              }
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              value={editingProject?.Description || ""}
              onChange={(e) =>
                setEditingProject((prev) => ({
                  ...prev,
                  Description: e.target.value,
                }))
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveProject}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this project?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteProject}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Projects;
