import React, { useState } from 'react';
import axios from 'axios';               // Для выполнения HTTP-запросов (удаление)
import PriceEditor from '../../edit/PriceEditor';
import PriceList from '../../list/PriceList';

/**
 * Главная страница для управления ценами.
 * Отображает список цен и позволяет редактировать/создавать цены в модальном диалоге.
 */
function PricePage() {
  // Состояние для ID выбранной цены (null для создания новой)
  const [selectedPriceId, setSelectedPriceId] = useState(null);
  // Состояние для управления видимостью модального окна редактора
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  // Триггер для принудительного обновления списка цен после сохранения/удаления
  const [refreshListTrigger, setRefreshListTrigger] = useState(false);

  // Обработчик для открытия редактора в режиме создания новой цены
  const handleCreateNewPrice = () => {
    setSelectedPriceId(null); // Сбрасываем ID, чтобы редактор перешел в режим создания
    setIsEditorOpen(true);    // Открываем модальное окно
  };

  // Обработчик для открытия редактора в режиме редактирования существующей цены
  const handleEditPrice = (id) => {
    setSelectedPriceId(id);   // Устанавливаем ID для редактирования
    setIsEditorOpen(true);    // Открываем модальное окно
  };

  // Обработчик для закрытия модального окна редактора
  const handleCloseEditor = () => {
    setIsEditorOpen(false);   // Закрываем модальное окно
    setSelectedPriceId(null); // Очищаем выбранный ID на всякий случай
  };

  // Обработчик после успешного сохранения или создания цены в редакторе
  const handleSaveSuccess = (savedPrice) => {
    console.log('Цена успешно сохранена/создана:', savedPrice);
    setRefreshListTrigger(prev => !prev); // Переключаем триггер для обновления списка
    handleCloseEditor(); // Закрываем редактор
  };

  // Обработчик для удаления цены
  const handleDeletePrice = async (id) => {
    // Используем window.confirm для подтверждения удаления (в реальном приложении лучше использовать кастомный модал)
    if (window.confirm(`Вы уверены, что хотите удалить цену с ID ${id}?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/prices/${id}`);
        alert('Цена успешно удалена!');
        setRefreshListTrigger(prev => !prev); // Обновляем список после удаления
        // Если удалили цену, которая была открыта в редакторе, закрываем редактор
        if (selectedPriceId === id) {
          handleCloseEditor();
        }
      } catch (err) {
        alert('Ошибка при удалении цены: ' + (err.response?.data?.error || err.message));
        console.error('Ошибка при удалении цены:', err);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.mainHeading}>Управление ценами</h1>

      {/* Кнопка для создания новой цены */}
      <button
        onClick={handleCreateNewPrice}
        style={styles.createButton}
      >
        Создать новую цену
      </button>

      {/* Компонент списка цен */}
      <PriceList
        onEdit={handleEditPrice}      // Передаем обработчик для редактирования
        onDelete={handleDeletePrice}  // Передаем обработчик для удаления
        refreshTrigger={refreshListTrigger} // Передаем триггер для обновления
      />

      {/* Модальное окно для PriceEditor */}
      {isEditorOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <PriceEditor
              priceId={selectedPriceId}
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
    backgroundColor: '#218838',
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
    maxWidth: '550px',
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

export default PricePage;
