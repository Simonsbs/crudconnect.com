import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import { Form, Button, Table, Modal, Dropdown } from "react-bootstrap";
import { useAuthenticator } from "@aws-amplify/ui-react-core";
import { Loader } from "@aws-amplify/ui-react";

function ProjectUsers() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [users, setUsers] = useState();
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteID, setDeleteID] = useState(null);
  const { user } = useAuthenticator((context) => [context.user]);

  const fetchProjects = async () => {
    const response = await API.get("ccApiBack", `/project`);
    setProjects(response);
  };

  const fetchUsers = async (projectId) => {
    setUsers(null);
    const response = await API.get("ccApiFront", `/user/${projectId}`);
    setUsers(response);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchUsers(selectedProject.ID);
    }
  }, [selectedProject]);

  const handleSelectProject = (project) => {
    setSelectedProject(project);
  };

  const handleAddUser = () => {
    setEditingUser({
      ID: "",
      ProjectID: selectedProject.ID,
      Name: "",
      Role: "", // Assuming users have a 'Role', adjust as needed
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    const userData = { ...editingUser, ProjectID: selectedProject.ID };

    if (userData.ID) {
      await API.put("ccApiFront", `/user`, {
        body: userData,
      });
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.ID === userData.ID ? userData : user))
      );
    } else {
      const newUser = await API.post("ccApiFront", `/user`, {
        body: userData,
      });
      setUsers((prevUsers) => [...prevUsers, newUser]);
    }
    setShowEditModal(false);
  };

  const handleDeleteUserConfirmation = (ID) => {
    setDeleteID(ID);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    await API.del(
      "ccApiFront",
      `/user/object/${selectedProject.ID}/${deleteID}`
    );
    setUsers((prevUsers) => prevUsers.filter((user) => user.ID !== deleteID));
    setShowDeleteModal(false);
  };

  return (
    <div className="container mt-5">
      <h1>ProjectUsers</h1>
      <Dropdown onSelect={(key) => handleSelectProject(projects[key])}>
        <Dropdown.Toggle variant="primary" id="dropdown-basic">
          {selectedProject ? selectedProject.Name : "Select a Project"}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {projects.map((project, index) => (
            <Dropdown.Item key={index} eventKey={index}>
              {project.Name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>

      {selectedProject ? (
        <>
          <Table responsive>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users ? (
                users.length > 0 ? (
                  users.map((user, index) => (
                    <tr key={index}>
                      <td>{user.ID}</td>
                      <td>{user.Name}</td>
                      <td>{user.Email}</td>
                      <td>{user.Role}</td>
                      <td>
                        <Button
                          variant="warning"
                          className="me-2"
                          onClick={() => {
                            setEditingUser(user);
                            setShowEditModal(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDeleteUserConfirmation(user.ID)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>No users yet</td>
                  </tr>
                )
              ) : (
                <td colSpan={4}>
                  <Loader variation="linear" />
                </td>
              )}
            </tbody>
          </Table>

          <Button variant="primary" onClick={handleAddUser}>
            Add User
          </Button>
        </>
      ) : (
        <h2>Select a project</h2>
      )}

      {/* Edit/Add User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser?.ID ? "Edit User" : "Add User"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={editingUser?.Name || ""}
              onChange={(e) =>
                setEditingUser((prev) => ({
                  ...prev,
                  Name: e.target.value,
                }))
              }
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={editingUser?.Email || ""}
              onChange={(e) =>
                setEditingUser((prev) => ({
                  ...prev,
                  Email: e.target.value,
                }))
              }
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="Password"
              value={editingUser?.Password || ""}
              onChange={(e) =>
                setEditingUser((prev) => ({
                  ...prev,
                  Password: e.target.value,
                }))
              }
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Role</Form.Label>
            <Form.Control
              type="text"
              value={editingUser?.Role || ""}
              onChange={(e) =>
                setEditingUser((prev) => ({
                  ...prev,
                  Role: e.target.value,
                }))
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveUser}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this user?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ProjectUsers;
