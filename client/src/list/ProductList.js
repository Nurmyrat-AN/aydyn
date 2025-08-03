// frontend/src/components/ProductList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../conf';

// Базовые URL вашего бэкенда
const API_BASE_URL_PRODUCTS = `${API_BASE_URL}/api/products`;
const API_BASE_URL_PRICES = `${API_BASE_URL}/api/prices`;
const API_BASE_URL_EXTRAPRODUCTS = `${API_BASE_URL}/api/extraproducts`;

/**
 * Компонент для отображения списка продуктов с функцией поиска.
 * Включает отображение вложенных дополнительных цен и связанных "Extra Products".
 *
 * @param {object} props - Свойства компонента.
 * @param {function} [props.onEdit] - Опциональная функция обратного вызова,
 * вызываемая при нажатии кнопки "Редактировать". Передает ID продукта.
 * @param {function} [props.onDelete] - Опциональная функция обратного вызова,
 * вызываемая при нажатии кнопки "Удалить". Передает ID продукта.
 * @param {boolean} [props.refreshTrigger] - Триггер для принудительного обновления списка.
 */
function ProductList({ onEdit, onDelete, refreshTrigger }) {
    const [products, setProducts] = useState([]);
    const [availablePrices, setAvailablePrices] = useState([]); // Для сопоставления ID цены с названием
    const [availableExtraProducts, setAvailableExtraProducts] = useState([]); // Для сопоставления ID Extra Product с названием
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Вспомогательная функция для получения названия цены по ID
    const getPriceNameById = (priceId) => {
        const priceObj = availablePrices.find(p => p.id === priceId);
        return priceObj ? priceObj.name : `Неизвестная цена (ID: ${priceId})`;
    };

    // Вспомогательная функция для получения названия Extra Product по ID
    const getExtraProductNameById = (extraProductId) => {
        const extraProductObj = availableExtraProducts.find(ep => ep.id === extraProductId);
        return extraProductObj ? extraProductObj.name : `Неизвестный Extra Product (ID: ${extraProductId})`;
    };

    // Функция для получения всех продуктов, цен и Extra Products
    const fetchAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [productsResponse, pricesResponse, extraProductsResponse] = await Promise.all([
                axios.get(API_BASE_URL_PRODUCTS),
                axios.get(API_BASE_URL_PRICES),
                axios.get(API_BASE_URL_EXTRAPRODUCTS)
            ]);

            const products = productsResponse.data.map(product => ({
                ...product,
                extraPrices: product.extraPrices.map(e => e.extraPrice),
                extraProducts: product.extraProducts.map(e => e.extraProductsConnection)
            }))
            setProducts(products);
            setAvailablePrices(pricesResponse.data);
            setAvailableExtraProducts(extraProductsResponse.data);
        } catch (err) {
            setError('Ошибка при загрузке данных: ' + (err.response?.data?.error || err.message));
            console.error('Ошибка при загрузке данных:', err);
        } finally {
            setLoading(false);
        }
    };

    // Эффект для загрузки данных при первом рендере и при изменении refreshTrigger
    useEffect(() => {
        fetchAllData();
    }, [refreshTrigger]); // Зависимость от refreshTrigger для принудительного обновления

    // Фильтрация продуктов на основе поискового запроса
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.measure.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Список продуктов</h2>

            {/* Поле для поиска */}
            <input
                type="text"
                placeholder="Поиск по названию, штрих-коду или единице измерения..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
            />

            {loading ? (
                <p style={styles.loading}>Загрузка продуктов...</p>
            ) : error ? (
                <p style={styles.error}>Ошибка: {error}</p>
            ) : filteredProducts.length === 0 ? (
                <p style={styles.info}>Продукты не найдены или не соответствуют поиску.</p>
            ) : (
                <ul style={styles.list}>
                    {filteredProducts.map((product) => (
                        <li key={product.id} style={styles.listItem}>
                            <div style={styles.productInfo}>
                                <strong>{product.name}</strong> (ID: {product.id})<br />
                                Штрих-код: {product.barcode} | Цена: {product.price} | Ед. изм.: {product.measure} | Сторон: {product.countOfSides}
                            </div>

                            {product.extraPrices && product.extraPrices.length > 0 && (
                                <div style={styles.nestedSection}>
                                    <strong>Дополнительные цены:</strong>
                                    <ul style={styles.nestedList}>
                                        {product.extraPrices.map((ep, idx) => (
                                            <li key={idx}>
                                                {getPriceNameById(ep.priceId)}: {ep.price}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {product.extraProducts && product.extraProducts.length > 0 && (
                                <div style={styles.nestedSection}>
                                    <strong>Вложенные Extra Products:</strong>
                                    <ul style={styles.nestedList}>
                                        {product.extraProducts.map((ep, idx) => (
                                            <li key={idx}>
                                                {getExtraProductNameById(ep.extraProductId)} (ID: {ep.extraProductId})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div style={styles.buttonsContainer}>
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(product.id)}
                                        style={{ ...styles.button, ...styles.editButton }}
                                    >
                                        Редактировать
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(product.id)}
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
        maxWidth: '700px',
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
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '12px 15px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f9f9f9',
        marginBottom: '10px',
        borderRadius: '5px',
    },
    productInfo: {
        fontSize: '16px',
        color: '#444',
        marginBottom: '10px',
        width: '100%',
    },
    nestedSection: {
        width: '100%',
        marginTop: '10px',
        paddingLeft: '15px',
        borderLeft: '2px solid #ddd',
        fontSize: '0.95em',
        color: '#555',
    },
    nestedList: {
        listStyleType: 'disc',
        paddingLeft: '20px',
        marginTop: '5px',
        marginBottom: '5px',
    },
    buttonsContainer: {
        display: 'flex',
        gap: '10px',
        width: '100%',
        justifyContent: 'flex-end',
        marginTop: '10px',
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

export default ProductList;
