import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../conf';

// Базовые URL вашего бэкенда
const API_BASE_URL_CUSTOMERS = `${API_BASE_URL}/api/customers`;
const API_BASE_URL_PRICES = `${API_BASE_URL}/api/prices`;

/**
 * Компонент для редактирования или создания записи клиента.
 * Если customerId предоставлен, загружает данные клиента по ID и позволяет их обновлять.
 * Если customerId не предоставлен, позволяет создать нового клиента.
 *
 * @param {object} props - Свойства компонента.
 * @param {number|null} props.customerId - ID клиента, которого нужно редактировать, или null для создания нового.
 * @param {function} [props.onSaveSuccess] - Опциональная функция обратного вызова,
 * вызываемая после успешного сохранения или создания.
 */
function CustomerEditor({ customerId, onSaveSuccess }) {
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [defaultPriceId, setDefaultPriceId] = useState(''); // ID выбранной цены по умолчанию
    const [availablePrices, setAvailablePrices] = useState([]); // Список доступных цен для выпадающего списка

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    // Эффект для загрузки данных клиента и доступных цен
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setMessage('');

            try {
                // Загружаем список доступных цен
                const pricesResponse = await axios.get(API_BASE_URL_PRICES);
                setAvailablePrices(pricesResponse.data);

                if (!customerId) {
                    // Если customerId не предоставлен, очищаем форму для создания нового клиента
                    setCustomerName('');
                    setPhoneNumber('');
                    setAddress('');
                    setDefaultPriceId(''); // Сбрасываем выбранную цену
                    setMessage('Форма готова для создания нового клиента.');
                    return; // Выходим, так как нет клиента для загрузки
                }

                // Загружаем данные существующего клиента
                const customerResponse = await axios.get(`${API_BASE_URL_CUSTOMERS}/${customerId}`);
                const customerData = customerResponse.data;
                setCustomerName(customerData.name);
                setPhoneNumber(customerData.phoneNumber);
                setAddress(customerData.address);
                // Устанавливаем defaultPriceId, если он есть, иначе пустую строку
                setDefaultPriceId(customerData.defaultPriceId ? customerData.defaultPriceId.toString() : '');
                setMessage(`Клиент ID: ${customerId} загружен для редактирования.`);

            } catch (err) {
                setError('Ошибка при загрузке данных: ' + (err.response?.data?.error || err.message));
                console.error('Ошибка при загрузке данных клиента или цен:', err);
                // В случае ошибки загрузки, очищаем форму
                setCustomerName('');
                setPhoneNumber('');
                setAddress('');
                setDefaultPriceId('');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [customerId]); // Зависимость от customerId

    // Обработчик отправки формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage('');

        if (!customerName.trim() || !phoneNumber.trim() || !address.trim()) {
            setError('Поля "Имя", "Телефон" и "Адрес" обязательны.');
            setLoading(false);
            return;
        }

        try {
            let response;
            const customerData = {
                name: customerName,
                phoneNumber: phoneNumber,
                address: address,
                // Преобразуем defaultPriceId в число или null, если пустая строка
                defaultPriceId: defaultPriceId === '' ? null : parseInt(defaultPriceId),
            };

            if (customerId) {
                // Режим редактирования: PUT запрос
                response = await axios.put(`${API_BASE_URL_CUSTOMERS}/${customerId}`, customerData);
                setMessage('Клиент успешно обновлен!');
                console.log('Клиент обновлен:', response.data);
            } else {
                // Режим создания: POST запрос
                response = await axios.post(API_BASE_URL_CUSTOMERS, customerData);
                setMessage('Клиент успешно создан!');
                console.log('Клиент создан:', response.data);
                // Очищаем форму для новой записи после успешного создания
                setCustomerName('');
                setPhoneNumber('');
                setAddress('');
                setDefaultPriceId('');
            }

            if (onSaveSuccess) {
                onSaveSuccess(response.data); // Вызываем коллбэк с обновленными/созданными данными
            }
        } catch (err) {
            setError('Ошибка при сохранении клиента: ' + (err.response?.data?.error || err.message));
            console.error('Ошибка при сохранении клиента:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>
                {customerId ? `Редактировать клиента (ID: ${customerId})` : 'Создать нового клиента'}
            </h2>
            {loading && <p style={styles.loading}>Загрузка...</p>}
            {error && <p style={styles.error}>Ошибка: {error}</p>}
            {message && <p style={styles.message}>{message}</p>}

            <form onSubmit={handleSubmit} style={styles.form}>
                <label style={styles.label}>
                    Имя:
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        style={styles.input}
                        disabled={loading}
                    />
                </label>
                <label style={styles.label}>
                    Телефон:
                    <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        style={styles.input}
                        disabled={loading}
                    />
                </label>
                <label style={styles.label}>
                    Адрес:
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        style={styles.input}
                        disabled={loading}
                    />
                </label>
                <label style={styles.label}>
                    Цена по умолчанию:
                    <select
                        value={defaultPriceId}
                        onChange={(e) => setDefaultPriceId(e.target.value)}
                        style={styles.select}
                        disabled={loading}
                    >
                        <option value="">-- Не выбрана --</option>
                        {availablePrices.map(price => (
                            <option key={price.id} value={price.id}>
                                {price.name} (ID: {price.id})
                            </option>
                        ))}
                    </select>
                </label>
                <button type="submit" style={styles.button} disabled={loading}>
                    {customerId ? 'Сохранить изменения' : 'Создать клиента'}
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
    select: {
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginTop: '5px',
        fontSize: '16px',
        width: '100%',
        boxSizing: 'border-box',
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
};

export default CustomerEditor;