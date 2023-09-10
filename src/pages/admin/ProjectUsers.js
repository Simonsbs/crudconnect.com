import React, { useState, useEffect, useContext } from "react";
import { Form, Button, Table, Modal } from "react-bootstrap";
import { Loader } from "@aws-amplify/ui-react";
import { ProjectsContext } from "../../contexts/ProjectsContext";
import { useNavigate } from "react-router-dom";
import apiWrapper from "../../services/apiWrapper";

function ProjectUsers() {
  const [users, setUsers] = useState();
  const [editingUser, setEditingUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteID, setDeleteID] = useState(null);
  const { selectedProject } = useContext(ProjectsContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedProject) {
      navigate("/admin/projects/");
    }
  }, [selectedProject, navigate]);

  const fetchUsers = async (projectId) => {
    setUsers(null);
    const response = await apiWrapper.get(`/user/${projectId}`);
    setUsers(response);
  };

  useEffect(() => {
    if (selectedProject) {
      fetchUsers(selectedProject.ID);
    }
  }, [selectedProject]);

  const handleAddUser = () => {
    setEditingUser({
      ProjectID: selectedProject.ID,
      Name: "",
      Role: "",
    });
    setIsEditMode(false);
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    const userData = { ...editingUser, ProjectID: selectedProject.ID };

    console.log(userData);
    console.log(isEditMode);

    if (isEditMode) {
      // Existing user, so update
      await apiWrapper.put(`/user/${selectedProject.ID}/${userData.Email}`, {
        body: userData,
      });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.Email === userData.Email ? userData : user
        )
      );
    } else {
      // New user, so add
      await apiWrapper.post(`/user`, {
        body: userData,
      });
      setUsers((prevUsers) => [...prevUsers, userData]);
    }
    setShowEditModal(false);
  };

  const handleDeleteUserConfirmation = (Email) => {
    setDeleteID(Email);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    await apiWrapper.delete(`/user/object/${selectedProject.ID}/${deleteID}`);
    setUsers((prevUsers) =>
      prevUsers.filter((user) => user.Email !== deleteID)
    );
    setShowDeleteModal(false);
  };

  return (
    <div className="container mt-5">
      <h1>Project Users</h1>
      {selectedProject ? (
        <>
          <Table responsive>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users ? (
                users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.Email}>
                      <td>{user.Email}</td>
                      <td>{user.Name}</td>
                      <td>{user.Role}</td>
                      <td>
                        <Button
                          variant="warning"
                          className="me-2"
                          onClick={() => {
                            setEditingUser(user);
                            setIsEditMode(true);
                            setShowEditModal(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() =>
                            handleDeleteUserConfirmation(user.Email)
                          }
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
                <tr>
                  <td colSpan={4}>
                    <Loader variation="linear" />
                  </td>
                </tr>
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
          <Modal.Title>{isEditMode ? "Edit User" : "Add User"}</Modal.Title>
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
              readOnly={isEditMode}
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
