// frontend/src/components/ExtraProductPage.js
import React, { useState } from 'react';
import axios from 'axios';                               // For HTTP requests (deletion)
import ExtraProductEditor from '../../edit/ExtraProductEditor';
import ExtraProductList from '../../list/ExtraProductList';

/**
 * Main page for managing "Extra Products".
 * Displays a list of extra products and allows editing/creating them in a modal dialog.
 */
function ExtraProductPage() {
  // State for the ID of the selected extra product (null for creating new)
  const [selectedExtraProductId, setSelectedExtraProductId] = useState(null);
  // State to control the visibility of the editor modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  // Trigger to force a refresh of the extra product list after save/delete
  const [refreshListTrigger, setRefreshListTrigger] = useState(false);

  // Handler to open the editor in new creation mode
  const handleCreateNewExtraProduct = () => {
    setSelectedExtraProductId(null); // Reset ID to put editor in creation mode
    setIsEditorOpen(true);          // Open the modal
  };

  // Handler to open the editor in existing extra product editing mode
  const handleEditExtraProduct = (id) => {
    setSelectedExtraProductId(id);   // Set ID for editing
    setIsEditorOpen(true);          // Open the modal
  };

  // Handler to close the editor modal
  const handleCloseEditor = () => {
    setIsEditorOpen(false);         // Close the modal
    setSelectedExtraProductId(null); // Clear selected ID just in case
  };

  // Handler after successful save or creation of an extra product in the editor
  const handleSaveSuccess = (savedExtraProduct) => {
    console.log('Extra Product successfully saved/created:', savedExtraProduct);
    setRefreshListTrigger(prev => !prev); // Toggle trigger to refresh the list
    handleCloseEditor(); // Close the editor
  };

  // Handler for deleting an extra product
  const handleDeleteExtraProduct = async (id) => {
    // Use window.confirm for deletion confirmation (in a real app, a custom modal is better)
    if (window.confirm(`Вы уверены, что хотите удалить "Extra Product" с ID ${id}?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/extraproducts/${id}`);
        alert('"Extra Product" успешно удален!');
        setRefreshListTrigger(prev => !prev); // Refresh the list after deletion
        // If the deleted extra product was open in the editor, close the editor
        if (selectedExtraProductId === id) {
          handleCloseEditor();
        }
      } catch (err) {
        alert('Ошибка при удалении "Extra Product": ' + (err.response?.data?.error || err.message));
        console.error('Ошибка при удалении "Extra Product":', err);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.mainHeading}>Управление "Extra Products"</h1>

      {/* Button to create a new extra product */}
      <button
        onClick={handleCreateNewExtraProduct}
        style={styles.createButton}
      >
        Создать новый "Extra Product"
      </button>

      {/* Extra Product List Component */}
      <ExtraProductList
        onEdit={handleEditExtraProduct}      // Pass handler for editing
        onDelete={handleDeleteExtraProduct}  // Pass handler for deleting
        refreshTrigger={refreshListTrigger} // Pass trigger for refreshing
      />

      {/* Modal for ExtraProductEditor */}
      {isEditorOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <ExtraProductEditor
              extraProductId={selectedExtraProductId}
              onSaveSuccess={handleSaveSuccess}
            />
            <button
              onClick={handleCloseEditor}
              style={styles.closeModalButton}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '20px auto',
    backgroundColor: '#f8f8f8',
    borderRadius: '10px',
    boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
  },
  mainHeading: {
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: '30px',
    fontSize: '2.5em',
    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
  },
  createButton: {
    display: 'block',
    margin: '0 auto 30px auto',
    padding: '12px 25px',
    backgroundColor: '#ff9800', // Changed color for Extra Products
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.1em',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  'createButton:hover': {
    backgroundColor: '#fb8c00', // Darker shade on hover
    transform: 'translateY(-2px)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
    maxWidth: '650px', // Adjusted max-width for ExtraProductEditor
    width: '90%',
    position: 'relative',
    animation: 'fadeInScale 0.3s ease-out',
  },
  closeModalButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    padding: '8px 15px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
  },
  'closeModalButton:hover': {
    backgroundColor: '#c82333',
  },
  '@keyframes fadeInScale': {
    'from': { opacity: 0, transform: 'scale(0.9)' },
    'to': { opacity: 1, transform: 'scale(1)' }
  }
};

export default ExtraProductPage;
