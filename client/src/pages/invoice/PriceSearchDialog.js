// frontend/src/components/PriceSearchDialog.js
import { useState, useEffect } from 'react';
import axios from 'axios'; // Используем axios
import { API_BASE_URL } from '../../conf';

// Базовый URL вашего бэкенда
const API_BASE_URL_PRICES = `${API_BASE_URL}/api/prices`;

export default function PriceSearchDialog({ onSelect, onClose }) {
  const [prices, setPrices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функция для получения всех цен
  const fetchAllPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_BASE_URL_PRICES);
      setPrices(res.data);
    } catch (err) {
      setError('Ошибка при загрузке цен: ' + (err.response?.data?.error || err.message));
      console.error('Ошибка при получении всех цен для диалога:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPrices();
  }, []);

  // Фильтрация цен на основе поискового запроса
  const filteredPrices = prices.filter(price =>
    price.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={dialogOverlayStyle}>
      <div style={dialogContentStyle}>
        <h2 style={{ marginBottom: '15px' }}>Выбрать цену</h2>
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', marginBottom: '15px' }}
        />

        {loading ? (
          <p>Загрузка цен...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Ошибка: {error}</p>
        ) : filteredPrices.length === 0 ? (
          <p>Цены не найдены или не соответствуют поиску.</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
            {filteredPrices.map((price) => (
              <li
                key={price.id}
                onClick={() => onSelect(price.id)} // При выборе передаем ID обратно
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor: '#f9f9f9',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
              >
                {price.name} (ID: {price.id})
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={onClose}
          style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}

// Стили для модального окна (переиспользуем из CustomerSearchDialog)
const dialogOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const dialogContentStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  maxWidth: '500px',
  width: '90%',
  fontFamily: 'Arial, sans-serif',
};
