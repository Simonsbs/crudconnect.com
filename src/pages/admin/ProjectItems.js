import React, { useState, useEffect, useContext } from "react";
import { API } from "aws-amplify";
import { Form, Button, Table, Modal, Dropdown } from "react-bootstrap";
import { ProjectsContext } from "../../contexts/ProjectsContext";

function ProjectItems() {
  const { selectedProject } = useContext(ProjectsContext);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (selectedProject) {
      const fetchCategories = async () => {
        const response = await API.get(
          "ccApiFront",
          `/category/${selectedProject.ID}`
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
          `/item/${selectedProject.ID}_${selectedCategory}`
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
      `/item/${selectedProject.ID}_${selectedCategory}/${itemID}`
    );
    setItems((prevItems) => prevItems.filter((item) => item.ItemID !== itemID));
  };

  const handleSaveItem = async (itemData) => {
    if (editingItem) {
      await API.put(
        "ccApiFront",
        `/item/${selectedProject.ID}_${selectedCategory}/${editingItem.ItemID}`,
        { body: itemData }
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
        { body: itemData }
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
              <td>{JSON.stringify(item.Data)}</td>
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

  useEffect(() => {
    setCurrentItem(item || defaultItem);
  }, [item]);

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          {currentItem?.ItemID ? "Edit Item" : "Add Item"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ItemForm item={currentItem} onChange={setCurrentItem} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={() => onSave(currentItem)}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function ItemForm({ item, onChange }) {
  return (
    <>
      <Form.Group>
        <Form.Label>Scope</Form.Label>
        <Form.Control
          as="select"
          value={item.Scope}
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
          value={JSON.stringify(item.Data)}
          onChange={(e) =>
            onChange({ ...item, Data: JSON.parse(e.target.value) })
          }
        />
      </Form.Group>
    </>
  );
}

export default ProjectItems;
