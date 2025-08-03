// frontend/src/components/ProductEditor.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../conf';

// Базовые URL вашего бэкенда
const API_BASE_URL_PRODUCTS = `${API_BASE_URL}/api/products`;
const API_BASE_URL_PRICES = `${API_BASE_URL}/api/prices`;
const API_BASE_URL_EXTRAPRODUCTS = `${API_BASE_URL}/api/extraproducts`;

/**
 * Компонент для редактирования или создания записи продукта.
 * Если productId предоставлен, загружает данные продукта по ID и позволяет их обновлять.
 * Если productId не предоставлен, позволяет создать новый продукт.
 *
 * @param {object} props - Свойства компонента.
 * @param {number|null} props.productId - ID продукта, который нужно редактировать, или null для создания нового.
 * @param {function} [props.onSaveSuccess] - Опциональная функция обратного вызова,
 * вызываемая после успешного сохранения или создания.
 */
function ProductEditor({ productId, onSaveSuccess }) {
    const [name, setName] = useState('');
    const [barcode, setBarcode] = useState('');
    const [price, setPrice] = useState(''); // Основная цена продукта
    const [measure, setMeasure] = useState(''); // Единица измерения
    const [countOfSides, setCountOfSides] = useState(''); // 1, 2 или 3
    const [extraPrices, setExtraPrices] = useState([]); // [{ priceId: ID, price: double }]
    const [extraProducts, setExtraProducts] = useState([]); // [{ extraProductId: ID }]

    const [availablePrices, setAvailablePrices] = useState([]); // Список доступных цен
    const [availableExtraProducts, setAvailableExtraProducts] = useState([]); // Список доступных Extra Products

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [extraPriceError, setExtraPriceError] = useState(null);
    const [extraProductError, setExtraProductError] = useState(null);

    // Эффект для загрузки данных продукта, цен и Extra Products
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setMessage('');
            setExtraPriceError(null);
            setExtraProductError(null);

            try {
                // Загружаем списки доступных цен и Extra Products
                const [pricesResponse, extraProductsResponse] = await Promise.all([
                    axios.get(API_BASE_URL_PRICES),
                    axios.get(API_BASE_URL_EXTRAPRODUCTS)
                ]);
                setAvailablePrices(pricesResponse.data);
                setAvailableExtraProducts(extraProductsResponse.data);

                if (!productId) {
                    // Если productId не предоставлен, очищаем форму для создания нового продукта
                    setName('');
                    setBarcode('');
                    setPrice('');
                    setMeasure('');
                    setCountOfSides('');
                    setExtraPrices([]);
                    setExtraProducts([]);
                    setMessage('Форма готова для создания нового продукта.');
                    setLoading(false);
                    return;
                }

                // Загружаем данные существующего продукта
                const productResponse = await axios.get(`${API_BASE_URL_PRODUCTS}/${productId}`);
                const productData = {
                    ...productResponse.data,
                    extraPrices: productResponse.data.extraPrices.map(e => e.extraPrice),
                    extraProducts: productResponse.data.extraProducts.map(e => e.extraProductsConnection)
                };
                setName(productData.name);
                setBarcode(productData.barcode);
                setPrice(productData.price.toString());
                setMeasure(productData.measure);
                setCountOfSides((productData.countOfSides || 1).toString());
                setExtraPrices(productData.extraPrices || []);
                setExtraProducts(productData.extraProducts || []);
                setMessage(`Продукт ID: ${productId} загружен для редактирования.`);

            } catch (err) {
                setError('Ошибка при загрузке данных: ' + (err.response?.data?.error || err.message));
                console.error('Ошибка при загрузке данных продукта, цен или Extra Products:', err);
                // В случае ошибки загрузки, очищаем форму
                setName('');
                setBarcode('');
                setPrice('');
                setMeasure('');
                setCountOfSides('');
                setExtraPrices([]);
                setExtraProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [productId]); // Зависимость от productId

    // Обработчик отправки формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage('');
        setExtraPriceError(null);
        setExtraProductError(null);

        // Валидация основных полей
        if (!name.trim() || !barcode.trim() || price === '' || !measure.trim() || countOfSides === '') {
            setError('Поля "Название", "Штрих-код", "Цена", "Единица измерения" и "Количество сторон" обязательны.');
            setLoading(false);
            return;
        }
        if (isNaN(parseFloat(price))) {
            setError('Цена должна быть числом.');
            setLoading(false);
            return;
        }
        if (![1, 2, 3].includes(parseInt(countOfSides))) {
            setError('Количество сторон должно быть 1, 2 или 3.');
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
            if (usedPriceIds.has(parseInt(ep.priceId))) {
                setError(`Цена с ID ${ep.priceId} дублируется в "Дополнительных ценах".`);
                setLoading(false);
                return;
            }
            usedPriceIds.add(parseInt(ep.priceId));
        }

        // Валидация вложенных extraProducts
        const usedExtraProductIds = new Set();
        for (const ep of extraProducts) {
            if (!ep.extraProductId) {
                setError('Все поля в "Вложенных Extra Products" должны быть заполнены.');
                setLoading(false);
                return;
            }
            if (usedExtraProductIds.has(parseInt(ep.extraProductId))) {
                setError(`Extra Product с ID ${ep.extraProductId} дублируется во "Вложенных Extra Products".`);
                setLoading(false);
                return;
            }
            usedExtraProductIds.add(parseInt(ep.extraProductId));
        }

        try {
            let response;
            const productData = {
                name: name,
                barcode: barcode,
                price: parseFloat(price),
                measure: measure,
                countOfSides: parseInt(countOfSides),
                extraPrices: extraPrices.map(ep => ({
                    priceId: parseInt(ep.priceId),
                    price: parseFloat(ep.price)
                })),
                extraProducts: extraProducts.map(ep => ({
                    extraProductId: parseInt(ep.extraProductId)
                })),
            };

            if (productId) {
                // Режим редактирования: PUT запрос
                response = await axios.put(`${API_BASE_URL_PRODUCTS}/${productId}`, productData);
                setMessage('Продукт успешно обновлен!');
                console.log('Продукт обновлен:', response.data);
            } else {
                // Режим создания: POST запрос
                response = await axios.post(API_BASE_URL_PRODUCTS, productData);
                setMessage('Продукт успешно создан!');
                console.log('Продукт создан:', response.data);
                // Очищаем форму для новой записи после успешного создания
                setName('');
                setBarcode('');
                setPrice('');
                setMeasure('');
                setCountOfSides('');
                setExtraPrices([]);
                setExtraProducts([]);
            }

            if (onSaveSuccess) {
                onSaveSuccess(response.data); // Вызываем коллбэк с обновленными/созданными данными
            }
        } catch (err) {
            setError('Ошибка при сохранении продукта: ' + (err.response?.data?.error || err.message));
            console.error('Ошибка при сохранении продукта:', err);
        } finally {
            setLoading(false);
        }
    };

    // --- Обработчики для extraPrices ---
    const handleAddExtraPrice = () => {
        setExtraPriceError(null);
        const currentPriceIds = new Set(extraPrices.map(ep => ep.priceId));
        const availableNonUsedPrices = availablePrices.filter(ap => !currentPriceIds.has(ap.id));

        if (availableNonUsedPrices.length > 0) {
            setExtraPrices([...extraPrices, { priceId: availableNonUsedPrices[0].id, price: '' }]);
        } else {
            setExtraPriceError('Все доступные цены уже добавлены.');
        }
    };

    const handleExtraPriceChange = (index, field, value) => {
        setExtraPriceError(null);
        const newExtraPrices = [...extraPrices];

        if (field === 'priceId') {
            const newPriceId = parseInt(value);
            const isDuplicate = newExtraPrices.some((ep, i) => i !== index && ep.priceId === newPriceId);
            if (isDuplicate) {
                setExtraPriceError(`Цена с ID ${newPriceId} уже добавлена.`);
                return;
            }
        }
        newExtraPrices[index][field] = value;
        setExtraPrices(newExtraPrices);
    };

    const handleRemoveExtraPrice = (index) => {
        setExtraPriceError(null);
        const newExtraPrices = extraPrices.filter((_, i) => i !== index);
        setExtraPrices(newExtraPrices);
    };

    // --- Обработчики для extraProducts ---
    const handleAddExtraProduct = () => {
        setExtraProductError(null);
        const currentExtraProductIds = new Set(extraProducts.map(ep => ep.extraProductId));
        const availableNonUsedExtraProducts = availableExtraProducts.filter(aep => !currentExtraProductIds.has(aep.id));

        if (availableNonUsedExtraProducts.length > 0) {
            setExtraProducts([...extraProducts, { extraProductId: availableNonUsedExtraProducts[0].id }]);
        } else {
            setExtraProductError('Все доступные Extra Products уже добавлены.');
        }
    };

    const handleExtraProductChange = (index, value) => {
        setExtraProductError(null);
        const newExtraProducts = [...extraProducts];
        const newExtraProductId = parseInt(value);

        const isDuplicate = newExtraProducts.some((ep, i) => i !== index && ep.extraProductId === newExtraProductId);
        if (isDuplicate) {
            setExtraProductError(`Extra Product с ID ${newExtraProductId} уже добавлен.`);
            return;
        }

        newExtraProducts[index].extraProductId = newExtraProductId;
        setExtraProducts(newExtraProducts);
    };

    const handleRemoveExtraProduct = (index) => {
        setExtraProductError(null);
        const newExtraProducts = extraProducts.filter((_, i) => i !== index);
        setExtraProducts(newExtraProducts);
    };


    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>
                {productId ? `Редактировать продукт (ID: ${productId})` : 'Создать новый продукт'}
            </h2>
            {loading && <p style={styles.loading}>Загрузка...</p>}
            {error && <p style={styles.error}>Ошибка: {error}</p>}
            {message && <p style={styles.message}>{message}</p>}

            <form onSubmit={handleSubmit} style={styles.form}>
                <label style={styles.label}>
                    Название продукта:
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
                    Штрих-код:
                    <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
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
                    Количество сторон:
                    <select
                        value={countOfSides}
                        onChange={(e) => setCountOfSides(e.target.value)}
                        required
                        style={styles.select}
                        disabled={loading}
                    >
                        <option value="">-- Выберите --</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </label>

                {/* Extra Prices Section */}
                <fieldset style={styles.fieldset}>
                    <legend style={styles.legend}>Дополнительные цены</legend>
                    {extraPriceError && <p style={styles.nestedError}>{extraPriceError}</p>}
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

                {/* Extra Products Section */}
                <fieldset style={styles.fieldset}>
                    <legend style={styles.legend}>Вложенные "Extra Products"</legend>
                    {extraProductError && <p style={styles.nestedError}>{extraProductError}</p>}
                    {extraProducts.map((ep, index) => (
                        <div key={index} style={styles.nestedItem}>
                            <select
                                value={ep.extraProductId}
                                onChange={(e) => handleExtraProductChange(index, e.target.value)}
                                required
                                style={styles.nestedSelect}
                                disabled={loading}
                            >
                                <option value="">-- Выберите Extra Product --</option>
                                {availableExtraProducts.map(extraProductOption => (
                                    <option key={extraProductOption.id} value={extraProductOption.id}>
                                        {extraProductOption.name} (ID: {extraProductOption.id})
                                    </option>
                                ))}
                            </select>
                            <button type="button" onClick={() => handleRemoveExtraProduct(index)} style={styles.removeButton} disabled={loading}>
                                Удалить
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddExtraProduct} style={styles.addButton} disabled={loading}>
                        Добавить "Extra Product"
                    </button>
                </fieldset>

                <button type="submit" style={styles.submitButton} disabled={loading}>
                    {productId ? 'Сохранить изменения' : 'Создать продукт'}
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
        maxWidth: '650px',
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
        maxHeight: '70vh',
        overflow: 'auto'
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
    select: {
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginTop: '5px',
        fontSize: '16px',
        width: '100%',
        boxSizing: 'border-box',
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
    nestedError: {
        color: '#dc3545',
        fontSize: '0.9em',
        marginBottom: '10px',
        textAlign: 'center',
    }
};

export default ProductEditor;
