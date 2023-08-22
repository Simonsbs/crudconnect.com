import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import { Form, Button, Table, Modal } from "react-bootstrap";
import { useAuthenticator } from "@aws-amplify/ui-react-core";

function DataUsers() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const { user } = useAuthenticator((context) => [context.user]);

  const accountID = user && user.attributes && user.attributes.sub;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const response = await API.get("apiData", "/user");
    setUsers(response);
  };

  const handleAddUser = () => {
    setEditingUser({
      id: "",
      userName: "",
      password: "",
      email: "",
      accountID,
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (editingUser.email && !editingUser.email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    if (editingUser.password && editingUser.password.length < 6) {
      alert("Password should be at least 6 characters long.");
      return;
    }

    const userData = { ...editingUser, accountID };

    if (userData.id) {
      await API.put("apiData", `/user?id=${userData.id}`, { body: userData });
    } else {
      await API.post("apiData", "/user", { body: userData });
    }
    fetchUsers();
    setShowEditModal(false);
  };

  const handleDeleteUserConfirmation = (id) => {
    setDeleteUserId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    await API.del("apiData", `/user?id=${deleteUserId}`);
    fetchUsers();
    setShowDeleteModal(false);
  };

  return (
    <div className="container mt-5">
      <h1>Data Users</h1>
      <Table responsive>
        <thead>
          <tr>
            <th>Username</th>
            <th>Password</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={index}>
              <td>{user.userName}</td>
              <td>••••••</td>
              <td>{user.email}</td>
              <td>
                <Button
                  variant="warning"
                  onClick={() => {
                    setEditingUser(user);
                    setShowEditModal(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteUserConfirmation(user.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Button variant="primary" onClick={handleAddUser}>
        Add User
      </Button>

      {/* Edit/Add User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser?.id ? "Edit User" : "Add User"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Form controls for editing/adding user */}
          <Form.Group>
            <Form.Label>Username</Form.Label>
            <Form.Control
              value={editingUser?.userName || ""}
              onChange={(e) =>
                setEditingUser((prev) => ({
                  ...prev,
                  userName: e.target.value,
                }))
              }
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={editingUser?.password || ""}
              onChange={(e) =>
                setEditingUser((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Email</Form.Label>
            <Form.Control
              value={editingUser?.email || ""}
              onChange={(e) =>
                setEditingUser((prev) => ({ ...prev, email: e.target.value }))
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

export default DataUsers;
