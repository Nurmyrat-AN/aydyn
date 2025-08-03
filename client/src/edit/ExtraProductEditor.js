// frontend/src/components/ExtraProductEditor.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../conf';

// Базовые URL вашего бэкенда
// ВНИМАНИЕ: '/api/extraproducts' - это ПРЕДПОЛАГАЕМЫЙ новый эндпоинт для этой сущности.
// Вам нужно будет реализовать его на бэкенде или адаптировать существующий /api/products.
const API_BASE_URL_EXTRAPRODUCTS = `${API_BASE_URL}/api/extraproducts`;
const API_BASE_URL_PRICES = `${API_BASE_URL}/api/prices`;

/**
 * Компонент для редактирования или создания записи "Extra Product".
 * Если extraProductId предоставлен, загружает данные по ID и позволяет их обновлять.
 * Если extraProductId не предоставлен, позволяет создать новый "Extra Product".
 *
 * @param {object} props - Свойства компонента.
 * @param {number|null} props.extraProductId - ID "Extra Product" для редактирования, или null для создания новой.
 * @param {function} [props.onSaveSuccess] - Опциональная функция обратного вызова,
 * вызываемая после успешного сохранения или создания.
 */
function ExtraProductEditor({ extraProductId, onSaveSuccess }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(''); // Основная цена "extraproduct"
  const [measure, setMeasure] = useState(''); // Единица измерения
  const [calculationType, setCalculationType] = useState('');
  const [extraPrices, setExtraPrices] = useState([]); // Массив { priceId: ID, price: double }

  const [availablePrices, setAvailablePrices] = useState([]); // Список доступных цен для выпадающих списков

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [extraPriceError, setExtraPriceError] = useState(null); // Ошибка для extraPrices

  // Эффект для загрузки данных "Extra Product" и доступных цен
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setMessage('');
      setExtraPriceError(null); // Очищаем ошибку extraPrices при загрузке новых данных

      try {
        // Загружаем список доступных цен (для вложенных extraPrices)
        const pricesResponse = await axios.get(API_BASE_URL_PRICES);
        setAvailablePrices(pricesResponse.data);

        if (!extraProductId) {
          // Если extraProductId не предоставлен, очищаем форму для создания новой записи
          setName('');
          setPrice('');
          setCalculationType('');
          setMeasure('');
          setExtraPrices([]);
          setMessage('Форма готова для создания новой записи "Extra Product".');
          setLoading(false);
          return;
        }

        // Загружаем данные существующего "Extra Product"
        const response = await axios.get(`${API_BASE_URL_EXTRAPRODUCTS}/${extraProductId}`);
        const data = response.data;
        data.extraPrices = data.extraPrices.map(e => e.extraProductPrice)
        setName(data.name);
        setPrice(data.price.toString());
        setMeasure(data.measure);
        setCalculationType(data.calculationType);
        setExtraPrices(data.extraPrices || []); // Убедимся, что это массив, если null
        setMessage(`"Extra Product" ID: ${extraProductId} загружен для редактирования.`);

      } catch (err) {
        setError('Ошибка при загрузке данных: ' + (err.response?.data?.error || err.message));
        console.error('Ошибка при загрузке данных "Extra Product" или цен:', err);
        // В случае ошибки загрузки, очищаем форму
        setName('');
        setPrice('');
        setCalculationType('');
        setExtraPrices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [extraProductId]); // Зависимость от extraProductId

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');
    setExtraPriceError(null);

    if (!name.trim() || price === '' || !measure.trim() || !calculationType.trim()) {
      setError('Поля "Название", "Цена", "Единица измерения" и "Тип расчета" обязательны.');
      setLoading(false);
      return;
    }
    if (isNaN(parseFloat(price))) {
      setError('Цена должна быть числом.');
      setLoading(false);
      return;
    }

    // Валидация вложенных extraPrices
    const usedPriceIds = new Set();
    for (const ep of extraPrices) {
      if (!ep.priceId || ep.price === '' || isNaN(parseFloat(ep.price))) {
        setError('Все поля в "Дополнительных ценах" должны быть заполнены и цена должна быть числом.');
        setLoading(false);
        return;
      }
      // Проверка на дублирование priceId
      if (usedPriceIds.has(parseInt(ep.priceId))) {
        setError(`Цена с ID ${ep.priceId} дублируется в "Дополнительных ценах".`);
        setLoading(false);
        return;
      }
      usedPriceIds.add(parseInt(ep.priceId));
    }


    try {
      let response;
      const extraProductData = {
        name: name,
        price: parseFloat(price),
        measure: measure,
        calculationType: calculationType,
        extraPrices: extraPrices.map(ep => ({
          priceId: parseInt(ep.priceId),
          price: parseFloat(ep.price)
        })),
      };

      if (extraProductId) {
        // Режим редактирования: PUT запрос
        response = await axios.put(`${API_BASE_URL_EXTRAPRODUCTS}/${extraProductId}`, extraProductData);
        setMessage('"Extra Product" успешно обновлен!');
        console.log('"Extra Product" обновлен:', response.data);
      } else {
        // Режим создания: POST запрос
        response = await axios.post(API_BASE_URL_EXTRAPRODUCTS, extraProductData);
        setMessage('"Extra Product" успешно создан!');
        console.log('"Extra Product" создан:', response.data);
        // Очищаем форму для новой записи после успешного создания
        setName('');
        setPrice('');
        setCalculationType('');
        setExtraPrices([]);
      }

      if (onSaveSuccess) {
        onSaveSuccess(response.data); // Вызываем коллбэк с обновленными/созданными данными
      }
    } catch (err) {
      setError('Ошибка при сохранении "Extra Product": ' + (err.response?.data?.error || err.message));
      console.error('Ошибка при сохранении "Extra Product":', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Обработчики для extraPrices ---
  const handleAddExtraPrice = () => {
    setExtraPriceError(null); // Очищаем предыдущие ошибки

    const currentPriceIds = new Set(extraPrices.map(ep => ep.priceId));
    const availableNonUsedPrices = availablePrices.filter(ap => !currentPriceIds.has(ap.id));

    if (availableNonUsedPrices.length > 0) {
      // Добавляем новую запись, автоматически выбирая первый доступный Price ID
      setExtraPrices([...extraPrices, { priceId: availableNonUsedPrices[0].id, price: '' }]);
    } else {
      setExtraPriceError('Все доступные цены уже добавлены.');
    }
  };

  const handleExtraPriceChange = (index, field, value) => {
    setExtraPriceError(null); // Очищаем ошибку при изменении

    const newExtraPrices = [...extraPrices];

    if (field === 'priceId') {
      const newPriceId = parseInt(value);
      // Проверяем, существует ли этот priceId уже в других элементах extraPrices
      const isDuplicate = newExtraPrices.some((ep, i) => i !== index && ep.priceId === newPriceId);

      if (isDuplicate) {
        setExtraPriceError(`Цена с ID ${newPriceId} уже добавлена.`);
        // Можно сбросить значение или просто не обновлять его, пока пользователь не исправит
        // newExtraPrices[index][field] = ''; // Сбросить выбор, если дубликат
        return; // Предотвращаем дальнейшее обновление
      }
    }

    newExtraPrices[index][field] = value;
    setExtraPrices(newExtraPrices);
  };

  const handleRemoveExtraPrice = (index) => {
    setExtraPriceError(null); // Очищаем ошибку при удалении
    const newExtraPrices = extraPrices.filter((_, i) => i !== index);
    setExtraPrices(newExtraPrices);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        {extraProductId ? `Редактировать "Extra Product" (ID: ${extraProductId})` : 'Создать новый "Extra Product"'}
      </h2>
      {loading && <p style={styles.loading}>Загрузка...</p>}
      {error && <p style={styles.error}>Ошибка: {error}</p>}
      {message && <p style={styles.message}>{message}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Название:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
            disabled={loading}
          />
        </label>
        <label style={styles.label}>
          Цена:
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            style={styles.input}
            disabled={loading}
          />
        </label>
        <label style={styles.label}>
          Единица измерения:
          <input
            type="text"
            value={measure}
            onChange={(e) => setMeasure(e.target.value)}
            required
            style={styles.input}
            disabled={loading}
          />
        </label>
        <label style={styles.label}>
          Тип расчета:
          <input
            type="text"
            value={calculationType}
            onChange={(e) => setCalculationType(e.target.value)}
            required
            style={styles.input}
            disabled={loading}
          />
        </label>

        {/* Extra Prices Section */}
        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>Дополнительные цены</legend>
          {extraPriceError && <p style={styles.extraPriceError}>{extraPriceError}</p>}
          {extraPrices.map((ep, index) => (
            <div key={index} style={styles.nestedItem}>
              <select
                value={ep.priceId}
                onChange={(e) => handleExtraPriceChange(index, 'priceId', e.target.value)}
                required
                style={styles.nestedSelect}
                disabled={loading}
              >
                <option value="">-- Выберите цену --</option>
                {availablePrices.map(priceOption => (
                  <option key={priceOption.id} value={priceOption.id}>
                    {priceOption.name} (ID: {priceOption.id})
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Цена"
                value={ep.price}
                onChange={(e) => handleExtraPriceChange(index, 'price', e.target.value)}
                required
                style={styles.nestedInput}
                disabled={loading}
              />
              <button type="button" onClick={() => handleRemoveExtraPrice(index)} style={styles.removeButton} disabled={loading}>
                Удалить
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddExtraPrice} style={styles.addButton} disabled={loading}>
            Добавить дополнительную цену
          </button>
        </fieldset>

        <button type="submit" style={styles.submitButton} disabled={loading}>
          {extraProductId ? 'Сохранить изменения' : 'Создать "Extra Product"'}
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
    width: 'calc(100% - 22px)',
  },
  fieldset: {
    border: '1px solid #ddd',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '15px',
  },
  legend: {
    fontWeight: 'bold',
    padding: '0 10px',
    color: '#333',
  },
  nestedItem: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    alignItems: 'center',
  },
  nestedSelect: {
    flex: 1,
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  },
  nestedInput: {
    flex: 1,
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  },
  addButton: {
    padding: '8px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
    marginTop: '10px',
  },
  removeButton: {
    padding: '8px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
  },
  submitButton: {
    padding: '12px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
    marginTop: '20px',
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
  extraPriceError: { // Стиль для ошибок, связанных с extraPrices
    color: '#dc3545',
    fontSize: '0.9em',
    marginBottom: '10px',
    textAlign: 'center',
  }
};

export default ExtraProductEditor;
