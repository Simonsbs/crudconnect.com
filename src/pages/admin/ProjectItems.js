import React, { useState, useEffect, useContext } from "react";
import { Auth, API } from "aws-amplify";
import { Form, Button, Table, Modal, Dropdown } from "react-bootstrap";
import { ProjectsContext } from "../../contexts/ProjectsContext";
import { CheckCircle, XCircle } from "react-bootstrap-icons";

function ProjectItems() {
  const { selectedProject } = useContext(ProjectsContext);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const getAuthHeaders = async () => {
    const session = await Auth.currentSession();
    const idToken = session.getIdToken().getJwtToken();

    return {
      headers: {
        Authorization: `Cognito ${idToken}`,
      },
    };
  };

  useEffect(() => {
    if (selectedProject) {
      const fetchCategories = async () => {
        const response = await API.get(
          "ccApiFront",
          `/category/${selectedProject.ID}`,
          await getAuthHeaders()
        );
        setCategories(response);
      };
      fetchCategories();
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedCategory) {
      const fetchItems = async () => {
        const response = await API.get(
          "ccApiFront",
          `/item/${selectedProject.ID}_${selectedCategory}`,
          await getAuthHeaders()
        );
        setItems(response);
      };
      fetchItems();
    }
  }, [selectedCategory, selectedProject]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  const handleDeleteItem = async (itemID) => {
    await API.delete(
      "ccApiFront",
      `/item/${selectedProject.ID}_${selectedCategory}/${itemID}`,
      await getAuthHeaders()
    );
    setItems((prevItems) => prevItems.filter((item) => item.ItemID !== itemID));
  };

  const handleSaveItem = async (itemData) => {
    if (editingItem) {
      console.log("editing item");
      console.log(itemData);

      await API.put(
        "ccApiFront",
        `/item/${selectedProject.ID}_${selectedCategory}/${editingItem.ItemID}`,
        { body: itemData, ...(await getAuthHeaders()) }
      );
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.ItemID === editingItem.ItemID ? itemData : item
        )
      );
    } else {
      const response = await API.post(
        "ccApiFront",
        `/item/${selectedProject.ID}_${selectedCategory}`,
        { body: itemData, ...(await getAuthHeaders()) }
      );
      setItems((prevItems) => [...prevItems, response]);
    }
    setShowItemModal(false);
  };

  return (
    <div>
      <h1>Project Items</h1>
      <Dropdown onSelect={handleCategorySelect}>
        <Dropdown.Toggle variant="success" id="dropdown-basic">
          {selectedCategory || "Select Category"}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {categories.map((category) => (
            <Dropdown.Item key={category} eventKey={category}>
              {category}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
      <Table responsive>
        <thead>
          <tr>
            <th>Item ID</th>
            <th>Scope</th>
            <th>Data</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.ItemID}>
              <td>{item.ItemID}</td>
              <td>{item.Scope}</td>
              <td>
                <pre>
                  <code>{JSON.stringify(item.Data, null, 2)}</code>
                </pre>
              </td>
              <td>
                <Button
                  variant="warning"
                  onClick={() => handleEditItem(item)}
                  className="me-2"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteItem(item.ItemID)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Button onClick={() => setShowItemModal(true)}>Add New Item</Button>
      <ItemModal
        show={showItemModal}
        item={editingItem}
        onClose={() => setShowItemModal(false)}
        onSave={handleSaveItem}
      />
    </div>
  );
}

function ItemModal({ show, item, onClose, onSave }) {
  const defaultItem = {
    Scope: "Public",
    Data: {},
  };

  const [currentItem, setCurrentItem] = useState(item || defaultItem);
  const [isValidJson, setIsValidJson] = useState(true); // New state to track JSON validity

  useEffect(() => {
    setCurrentItem(item || defaultItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          {currentItem?.ItemID ? "Edit Item" : "Add Item"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ItemForm
          item={currentItem}
          onChange={setCurrentItem}
          onValidJsonChange={setIsValidJson}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => onSave(currentItem)}
          disabled={!isValidJson}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function ItemForm({ item, onChange, onValidJsonChange }) {
  const [dataString, setDataString] = useState(
    JSON.stringify(item.Data, null, 2)
  );
  const [isValidJson, setIsValidJson] = useState(true); // State to track JSON validity

  useEffect(() => {
    setDataString(JSON.stringify(item.Data, null, 2));
  }, [item]);

  const handleDataChange = (e) => {
    setDataString(e.target.value);
    try {
      const parsedData = JSON.parse(e.target.value);
      onChange({ ...item, Data: parsedData });
      setIsValidJson(true);
      onValidJsonChange(true);
    } catch (e) {
      setIsValidJson(false);
      onValidJsonChange(false);
    }
  };

  return (
    <>
      <Form.Group>
        <Form.Label>Scope</Form.Label>
        <Form.Control
          as="select"
          value={item.Scope}
          onBlur={(e) => onChange({ ...item, Scope: e.target.value })}
          onChange={(e) => onChange({ ...item, Scope: e.target.value })}
          readOnly={false}
        >
          <option value="Public">Public</option>
          <option value="Private">Private</option>
        </Form.Control>
      </Form.Group>
      <Form.Group>
        <Form.Label>Data</Form.Label>
        <Form.Control
          as="textarea"
          value={dataString}
          onChange={handleDataChange}
          style={{ height: "200px" }}
        />
        {/* Indication for valid or invalid JSON */}
        {isValidJson ? (
          <div className="text-success mt-2">
            <CheckCircle className="me-2" /> Valid JSON
          </div>
        ) : (
          <div className="text-danger mt-2">
            <XCircle className="me-2" /> Invalid JSON
          </div>
        )}
      </Form.Group>
    </>
  );
}

export default ProjectItems;
