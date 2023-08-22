import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import { Form, Button, Table } from "react-bootstrap";
import { useAuthenticator } from "@aws-amplify/ui-react-core";

function DataUsers() {
  const [users, setUsers] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
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
    setUsers([
      ...users,
      { id: "", userName: "", password: "", email: "", accountID },
    ]);
  };

  const handleSaveUser = async (user, index) => {
    const userData = { ...user, accountID }; // Adding accountID to the user data

    if (userData.id) {
      await API.put("apiData", `/user/${userData.id}`, { body: userData });
    } else {
      await API.post("apiData", "/user", { body: userData });
      fetchUsers();
    }
    setEditingIndex(null);
  };

  const handleDeleteUser = async (id) => {
    await API.del("apiData", `/user/${id}`);
    fetchUsers();
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
              <td>
                {editingIndex === index ? (
                  <Form.Control
                    value={user.userName}
                    onChange={(e) => {
                      const newUser = { ...user, userName: e.target.value };
                      const newUsers = [...users];
                      newUsers[index] = newUser;
                      setUsers(newUsers);
                    }}
                  />
                ) : (
                  user.userName
                )}
              </td>
              <td>
                {editingIndex === index ? (
                  <Form.Control
                    type="password"
                    value={user.password}
                    onChange={(e) => {
                      const newUser = { ...user, password: e.target.value };
                      const newUsers = [...users];
                      newUsers[index] = newUser;
                      setUsers(newUsers);
                    }}
                  />
                ) : (
                  "••••••"
                )}
              </td>
              <td>
                {editingIndex === index ? (
                  <Form.Control
                    value={user.email || ""}
                    onChange={(e) => {
                      const newUser = { ...user, email: e.target.value };
                      const newUsers = [...users];
                      newUsers[index] = newUser;
                      setUsers(newUsers);
                    }}
                  />
                ) : (
                  user.email
                )}
              </td>
              <td>
                {editingIndex === index ? (
                  <Button
                    variant="success"
                    onClick={() => handleSaveUser(user, index)}
                  >
                    Save
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="warning"
                      onClick={() => setEditingIndex(index)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan="5">
              <Button variant="primary" onClick={handleAddUser}>
                Add User
              </Button>
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default DataUsers;
