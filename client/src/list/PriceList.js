import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../conf';


/**
 * Компонент для отображения списка цен с функцией поиска.
 *
 * @param {object} props - Свойства компонента.
 * @param {function} [props.onEdit] - Опциональная функция обратного вызова,
 * вызываемая при нажатии кнопки "Редактировать". Передает ID цены.
 * @param {function} [props.onDelete] - Опциональная функция обратного вызова,
 * вызываемая при нажатии кнопки "Удалить". Передает ID цены.
 * @param {boolean} [props.refreshTrigger] - Триггер для принудительного обновления списка.
 */
function PriceList({ onEdit, onDelete, refreshTrigger }) {
  const [prices, setPrices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функция для получения всех цен
  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/prices?q=${searchTerm}`);
      setPrices(response.data);
    } catch (err) {
      setError('Ошибка при загрузке списка цен: ' + (err.response?.data?.error || err.message));
      console.error('Ошибка при загрузке списка цен:', err);
    } finally {
      setLoading(false);
    }
  };

  // Эффект для загрузки цен при первом рендере и при изменении refreshTrigger
  useEffect(() => {
    fetchPrices();
  }, [refreshTrigger, searchTerm]); // Зависимость от refreshTrigger для принудительного обновления

  // Фильтрация цен на основе поискового запроса
  const filteredPrices = prices.filter(price =>
    price.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Список цен</h2>
      {/* Поле для поиска */}
      <input
        type="text"
        placeholder="Поиск по названию цены..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.searchInput}
      />

      {loading ? (
        <p style={styles.loading}>Загрузка цен...</p>
      ) : error ? (
        <p style={styles.error}>Ошибка: {error}</p>
      ) : filteredPrices.length === 0 ? (
        <p style={styles.info}>Цены не найдены или не соответствуют поиску.</p>
      ) : (
        <ul style={styles.list}>
          {filteredPrices.map((price) => (
            <li key={price.id} style={styles.listItem}>
              <span style={styles.priceInfo}>
                <strong>{price.name}</strong> (ID: {price.id})
              </span>
              <div style={styles.buttonsContainer}>
                {onEdit && (
                  <button
                    onClick={() => onEdit(price.id)}
                    style={{ ...styles.button, ...styles.editButton }}
                  >
                    Редактировать
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(price.id)}
                    style={{ ...styles.button, ...styles.deleteButton }}
                  >
                    Удалить
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '20px auto',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    fontFamily: 'Arial, sans-serif',
  },
  heading: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px',
  },
  searchInput: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    width: 'calc(100% - 22px)', // Учитываем padding и border
    marginBottom: '20px',
    fontSize: '16px',
  },
  list: {
    listStyleType: 'none',
    padding: 0,
    maxHeight: '400px', // Ограничиваем высоту списка
    overflowY: 'auto', // Добавляем прокрутку, если список большой
    border: '1px solid #eee',
    borderRadius: '5px',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 15px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f9f9f9',
  },
  priceInfo: {
    fontSize: '16px',
    color: '#444',
  },
  buttonsContainer: {
    display: 'flex',
    gap: '10px',
  },
  button: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
  },
  editButton: {
    backgroundColor: '#007bff',
    color: 'white',
  },
  'editButton:hover': {
    backgroundColor: '#0056b3',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
  },
  'deleteButton:hover': {
    backgroundColor: '#c82333',
  },
  loading: {
    color: '#007bff',
    textAlign: 'center',
    padding: '20px',
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    fontWeight: 'bold',
    padding: '20px',
  },
  info: {
    textAlign: 'center',
    color: '#6c757d',
    fontStyle: 'italic',
    padding: '20px',
  }
};

export default PriceList;