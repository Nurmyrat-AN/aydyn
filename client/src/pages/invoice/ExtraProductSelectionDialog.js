// frontend/src/components/ExtraProductSelectionDialog.js
import { useState } from 'react';

export default function ExtraProductSelectionDialog({ availableExtraProducts, onSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExtraProducts = availableExtraProducts.filter(ep =>
    ep.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={dialogOverlayStyle}>
      <div style={dialogContentStyle}>
        <h2 style={{ marginBottom: '15px' }}>Выбрать дополнительный товар</h2>
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', marginBottom: '15px' }}
        />

        {filteredExtraProducts.length === 0 ? (
          <p>Дополнительные услуги не найдены или не соответствуют поиску.</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
            {filteredExtraProducts.map((ep) => (
              <li
                key={ep.id}
                onClick={() => onSelect(ep.id)} // При выборе передаем ID доп. услуги
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor: '#f9f9f9',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
              >
                {ep.name} (Тип: {ep.calculationType})
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

// Стили для модального окна (переиспользуем из других диалогов)
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
