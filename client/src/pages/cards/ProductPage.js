// frontend/src/components/ProductPage.js
import React, { useState } from 'react';
import axios from 'axios';                   // Для выполнения HTTP-запросов (удаление)
import ProductList from '../../list/ProductList';
import ProductEditor from '../../edit/ProductEditor';

/**
 * Главная страница для управления продуктами.
 * Отображает список продуктов и позволяет редактировать/создавать продукты в модальном диалоге.
 */
function ProductPage() {
  // Состояние для ID выбранного продукта (null для создания нового)
  const [selectedProductId, setSelectedProductId] = useState(null);
  // Состояние для управления видимостью модального окна редактора
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  // Триггер для принудительного обновления списка продуктов после сохранения/удаления
  const [refreshListTrigger, setRefreshListTrigger] = useState(false);

  // Обработчик для открытия редактора в режиме создания нового продукта
  const handleCreateNewProduct = () => {
    setSelectedProductId(null); // Сбрасываем ID, чтобы редактор перешел в режим создания
    setIsEditorOpen(true);      // Открываем модальное окно
  };

  // Обработчик для открытия редактора в режиме редактирования существующего продукта
  const handleEditProduct = (id) => {
    setSelectedProductId(id);   // Устанавливаем ID для редактирования
    setIsEditorOpen(true);      // Открываем модальное окно
  };

  // Обработчик для закрытия модального окна редактора
  const handleCloseEditor = () => {
    setIsEditorOpen(false);     // Закрываем модальное окно
    setSelectedProductId(null); // Очищаем выбранный ID на всякий случай
  };

  // Обработчик после успешного сохранения или создания продукта в редакторе
  const handleSaveSuccess = (savedProduct) => {
    console.log('Продукт успешно сохранен/создан:', savedProduct);
    setRefreshListTrigger(prev => !prev); // Переключаем триггер для обновления списка
    handleCloseEditor(); // Закрываем редактор
  };

  // Обработчик для удаления продукта
  const handleDeleteProduct = async (id) => {
    // Используем window.confirm для подтверждения удаления (в реальном приложении лучше использовать кастомный модал)
    if (window.confirm(`Вы уверены, что хотите удалить продукт с ID ${id}?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${id}`);
        alert('Продукт успешно удален!');
        setRefreshListTrigger(prev => !prev); // Обновляем список после удаления
        // Если удалили продукт, который был открыт в редакторе, закрываем редактор
        if (selectedProductId === id) {
          handleCloseEditor();
        }
      } catch (err) {
        alert('Ошибка при удалении продукта: ' + (err.response?.data?.error || err.message));
        console.error('Ошибка при удалении продукта:', err);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.mainHeading}>Управление продуктами</h1>

      {/* Кнопка для создания нового продукта */}
      <button
        onClick={handleCreateNewProduct}
        style={styles.createButton}
      >
        Создать новый продукт
      </button>

      {/* Компонент списка продуктов */}
      <ProductList
        onEdit={handleEditProduct}      // Передаем обработчик для редактирования
        onDelete={handleDeleteProduct}  // Передаем обработчик для удаления
        refreshTrigger={refreshListTrigger} // Передаем триггер для обновления
      />

      {/* Модальное окно для ProductEditor */}
      {isEditorOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <ProductEditor
              productId={selectedProductId}
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
    maxWidth: '900px', // Увеличена максимальная ширина
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
    backgroundColor: '#ff9800', // Цвет для продуктов
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
    backgroundColor: '#fb8c00', // Темнее при наведении
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
    maxWidth: '700px', // Увеличена максимальная ширина для редактора продуктов
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

export default ProductPage;
