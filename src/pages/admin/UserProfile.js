import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import { Form, Button } from "react-bootstrap";

function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get("ccApiBack", "/profile");
        if (response) {
          setProfile(response);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      await API.put("ccApiBack", "/profile", { body: profile });
      console.log("Profile updated successfully!");
      console.log(profile);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="container mt-5">
      <h1>User Profile</h1>
      <Form>
        <Form.Group>
          <Form.Label>ID</Form.Label>
          <Form.Control type="text" value={profile.UserID} readOnly />
        </Form.Group>

        <Form.Group>
          <Form.Label>First Name</Form.Label>
          <Form.Control
            type="text"
            name="firstName"
            value={profile.firstName}
            onChange={handleInputChange}
            readOnly={!isEditing}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Last Name</Form.Label>
          <Form.Control
            type="text"
            name="lastName"
            value={profile.lastName}
            onChange={handleInputChange}
            readOnly={!isEditing}
          />
        </Form.Group>

        {isEditing ? (
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        ) : (
          <Button variant="warning" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </Form>
    </div>
  );
}

export default UserProfile;
