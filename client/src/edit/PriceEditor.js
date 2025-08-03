// frontend/src/components/PriceEditor.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../conf';


/**
 * Компонент для редактирования или создания записи цены.
 * Если priceId предоставлен, загружает данные цены по ID и позволяет их обновлять.
 * Если priceId не предоставлен, позволяет создать новую цену.
 *
 * @param {object} props - Свойства компонента.
 * @param {number|null} props.priceId - ID цены, которую нужно редактировать, или null для создания новой.
 * @param {function} [props.onSaveSuccess] - Опциональная функция обратного вызова,
 * вызываемая после успешного сохранения или создания.
 */
function PriceEditor({ priceId, onSaveSuccess }) {
  const [priceName, setPriceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Эффект для загрузки данных цены при изменении priceId
  useEffect(() => {
    const fetchPrice = async () => {
      if (!priceId) {
        // Если priceId не предоставлен, очищаем форму для создания новой цены
        setPriceName('');
        setMessage('Форма готова для создания новой цены.');
        setLoading(false); // Убедимся, что загрузка не активна
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      setMessage('');
      try {
        const response = await axios.get(`${API_BASE_URL}/api/prices/${priceId}`);
        setPriceName(response.data.name);
        setMessage(`Цена ID: ${priceId} загружена для редактирования.`);
      } catch (err) {
        setError('Ошибка при загрузке цены: ' + (err.response?.data?.error || err.message));
        console.error('Ошибка при загрузке цены:', err);
        setMessage('');
        // Если произошла ошибка загрузки, очищаем форму, чтобы не показывать некорректные данные
        setPriceName('');
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
  }, [priceId]); // Зависимость от priceId

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');

    if (!priceName.trim()) {
      setError('Название цены не может быть пустым.');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (priceId) {
        // Режим редактирования: PUT запрос
        response = await axios.put(`${API_BASE_URL}/api/prices/${priceId}`, { name: priceName });
        setMessage('Цена успешно обновлена!');
        console.log('Цена обновлена:', response.data);
      } else {
        // Режим создания: POST запрос
        response = await axios.post(`${API_BASE_URL}/api/prices`, { name: priceName });
        setMessage('Цена успешно создана!');
        console.log('Цена создана:', response.data);
        // Если создали новую запись, можно автоматически установить ее ID для дальнейшего редактирования
        // или очистить форму, чтобы создать еще одну.
        // setPriceId(response.data.id); // Если вы хотите перейти в режим редактирования только что созданной записи
        setPriceName(''); // Очищаем форму для новой записи
      }

      if (onSaveSuccess) {
        onSaveSuccess(response.data); // Вызываем коллбэк с обновленными/созданными данными
      }
    } catch (err) {
      setError('Ошибка при сохранении цены: ' + (err.response?.data?.error || err.message));
      console.error('Ошибка при сохранении цены:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        {priceId ? `Редактировать цену (ID: ${priceId})` : 'Создать новую цену'}
      </h2>
      {loading && <p style={styles.loading}>Загрузка...</p>}
      {error && <p style={styles.error}>Ошибка: {error}</p>}
      {message && <p style={styles.message}>{message}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Название цены:
          <input
            type="text"
            value={priceName}
            onChange={(e) => setPriceName(e.target.value)}
            required
            style={styles.input}
            disabled={loading}
          />
        </label>
        <button type="submit" style={styles.button} disabled={loading}>
          {priceId ? 'Сохранить изменения' : 'Создать цену'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    maxWidth: '500px',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    marginTop: '5px',
    fontSize: '16px',
    width: 'calc(100% - 22px)', // Учитываем padding и border
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
  },
  'button:hover': {
    backgroundColor: '#0056b3',
  },
  loading: {
    color: '#007bff',
    textAlign: 'center',
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  message: {
    color: '#28a745',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  info: {
    textAlign: 'center',
    color: '#6c757d',
    fontStyle: 'italic',
  }
};

export default PriceEditor;
