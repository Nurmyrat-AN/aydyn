// frontend/src/components/ExtraProductList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../conf';

// Базовые URL вашего бэкенда
const API_BASE_URL_EXTRAPRODUCTS = `${API_BASE_URL}/api/extraproducts`;
const API_BASE_URL_PRICES = `${API_BASE_URL}/api/prices`;

/**
 * Компонент для отображения списка "Extra Products" с функцией поиска.
 *
 * @param {object} props - Свойства компонента.
 * @param {function} [props.onEdit] - Опциональная функция обратного вызова,
 * вызываемая при нажатии кнопки "Редактировать". Передает ID "Extra Product".
 * @param {function} [props.onDelete] - Опциональная функция обратного вызова,
 * вызываемая при нажатии кнопки "Удалить". Передает ID "Extra Product".
 * @param {boolean} [props.refreshTrigger] - Триггер для принудительного обновления списка.
 */
function ExtraProductList({ onEdit, onDelete, refreshTrigger }) {
    const [extraProducts, setExtraProducts] = useState([]);
    const [availablePrices, setAvailablePrices] = useState([]); // Для сопоставления ID цены с названием
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Вспомогательная функция для получения названия цены по ID
    const getPriceNameById = (priceId) => {
        const price = availablePrices.find(p => p.id === priceId);
        return price ? price.name : 'Неизвестная цена';
    };

    // Функция для получения всех "Extra Products" и цен
    const fetchExtraProductsAndPrices = async () => {
        setLoading(true);
        setError(null);
        try {
            // Загружаем "Extra Products"
            const extraProductsResponse = await axios.get(API_BASE_URL_EXTRAPRODUCTS);
            // Загружаем цены (для отображения имени вложенных цен)
            const pricesResponse = await axios.get(API_BASE_URL_PRICES);

            setExtraProducts(extraProductsResponse.data);
            setAvailablePrices(pricesResponse.data);
        } catch (err) {
            setError('Ошибка при загрузке списка "Extra Products" или цен: ' + (err.response?.data?.error || err.message));
            console.error('Ошибка при загрузке данных:', err);
        } finally {
            setLoading(false);
        }
    };

    // Эффект для загрузки данных при первом рендере и при изменении refreshTrigger
    useEffect(() => {
        fetchExtraProductsAndPrices();
    }, [refreshTrigger]); // Зависимость от refreshTrigger для принудительного обновления

    // Фильтрация "Extra Products" на основе поискового запроса
    const filteredExtraProducts = extraProducts.filter(ep =>
        ep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ep.calculationType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Список "Extra Products"</h2>

            {/* Поле для поиска */}
            <input
                type="text"
                placeholder="Поиск по названию или типу расчета..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
            />

            {loading ? (
                <p style={styles.loading}>Загрузка "Extra Products"...</p>
            ) : error ? (
                <p style={styles.error}>Ошибка: {error}</p>
            ) : filteredExtraProducts.length === 0 ? (
                <p style={styles.info}>"Extra Products" не найдены или не соответствуют поиску.</p>
            ) : (
                <ul style={styles.list}>
                    {filteredExtraProducts.map((ep) => (
                        <li key={ep.id} style={styles.listItem}>
                            <div style={styles.extraProductInfo}>
                                <strong>{ep.name}</strong> (ID: {ep.id})<br />
                                Цена: {ep.price} | Тип расчета: {ep.calculationType}
                                {ep.extraPrices && ep.extraPrices.length > 0 && (
                                    <div style={styles.nestedPrices}>
                                        <strong>Доп. цены:</strong>
                                        <ul>
                                            {ep.extraPrices.map((nestedEp, nestedIdx) => (
                                                <li key={nestedIdx}>
                                                    {getPriceNameById(nestedEp.priceId)}: {nestedEp.price}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div style={styles.buttonsContainer}>
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(ep.id)}
                                        style={{ ...styles.button, ...styles.editButton }}
                                    >
                                        Редактировать
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(ep.id)}
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
        flexDirection: 'column', // Изменено на column для лучшего отображения информации
        alignItems: 'flex-start', // Выравнивание по левому краю
        padding: '12px 15px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f9f9f9',
    },
    extraProductInfo: {
        fontSize: '16px',
        color: '#444',
        marginBottom: '10px', // Отступ между информацией и кнопками
        width: '100%', // Занимает всю ширину
    },
    nestedPrices: {
        marginTop: '5px',
        marginLeft: '15px',
        fontSize: '0.9em',
        color: '#666',
    },
    buttonsContainer: {
        display: 'flex',
        gap: '10px',
        width: '100%', // Занимает всю ширину
        justifyContent: 'flex-end', // Выравнивание кнопок по правому краю
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

export default ExtraProductList;
