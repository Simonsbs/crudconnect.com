import React, { useState, useEffect, useContext } from "react";
import { Auth, API } from "aws-amplify";
import { Form, Button, Table, Modal, Dropdown } from "react-bootstrap";
import { ProjectsContext } from "../../contexts/ProjectsContext";
import { CheckCircle, XCircle } from "react-bootstrap-icons";
import { Autocomplete } from "@aws-amplify/ui-react";
import apiWrapper from "../../services/apiWrapper";

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
        const response = await apiWrapper.get(
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
        const response = await apiWrapper.get(
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
    await apiWrapper.delete(
      `/item/${selectedProject.ID}_${selectedCategory}/${itemID}`,
      await getAuthHeaders()
    );
    setItems((prevItems) => prevItems.filter((item) => item.ItemID !== itemID));
  };

  const handleSaveItem = async (itemData) => {
    const combinedCategory = `${selectedProject.ID}_${itemData.Category}`;
    if (editingItem) {
      await apiWrapper.put(`/item/${combinedCategory}/${editingItem.ItemID}`, {
        body: itemData,
        ...(await getAuthHeaders()),
      });
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.ItemID === editingItem.ItemID ? itemData : item
        )
      );
    } else {
      const response = await apiWrapper.post(`/item/${combinedCategory}`, {
        body: itemData,
        ...(await getAuthHeaders()),
      });
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
        categories={categories}
        selectedCategory={selectedCategory}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />
    </div>
  );
}

function ItemModal({
  show,
  item,
  categories,
  selectedCategory,
  onClose,
  onSave,
}) {
  const defaultItem = {
    Category: selectedCategory || "",
    Scope: "Public",
    Data: {},
  };

  const [currentItem, setCurrentItem] = useState(item || defaultItem);
  const [isValidJson, setIsValidJson] = useState(true);

  useEffect(() => {
    setCurrentItem(item || defaultItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, selectedCategory]);

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
          categories={categories}
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

function ItemForm({ item, categories, onChange, onValidJsonChange }) {
  const [dataString, setDataString] = useState(
    JSON.stringify(item.Data, null, 2)
  );
  const [isValidJson, setIsValidJson] = useState(true);

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
        <Form.Label>Category</Form.Label>
        <Autocomplete
          options={categories.map((category) => ({
            id: category,
            label: category,
          }))}
          defaultValue={item.Category}
          onChange={(e) => onChange({ ...item, Category: e.target.value })}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Scope</Form.Label>
        <Form.Control
          as="select"
          value={item.Scope}
          onBlur={(e) => onChange({ ...item, Scope: e.target.value })}
          onChange={(e) => onChange({ ...item, Scope: e.target.value })}
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
