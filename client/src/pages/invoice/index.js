// frontend/src/components/CreateInvoice.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import CustomerSearchDialog from './CustomerSearchDialog'; // Диалог для выбора клиента
import PriceSearchDialog from './PriceSearchDialog';     // Диалог для выбора цены
import { API_BASE_URL } from '../../conf';
import ProductSearchDialog from './ProductSearchDialog';
import { renderProductImage } from '../../utils/image';
import ExtraProductSelectionDialog from './ExtraProductSelectionDialog';
import InvoiceDetailsModal from '../reports/invoice/InvoiceDetails';

// Базовые URL вашего бэкенда
const API_BASE_URL_CUSTOMERS = `${API_BASE_URL}/api/customers`;
const API_BASE_URL_PRICES = `${API_BASE_URL}/api/prices`;
const API_BASE_URL_PRODUCTS = `${API_BASE_URL}/api/products`;

/**
 * Вспомогательная функция для расчета количества продукта на основе его сторон.
 * @param {number} countOfSides - Количество сторон (1, 2, 3).
 * @param {object} measurements - Объект с измерениями { a, b, c }.
 * @returns {number} Рассчитанное количество.
 */
const calculateProductQuantity = (countOfSides, measurements) => {
    const a = parseFloat(measurements.a) || 0;
    const b = parseFloat(measurements.b) || 0;
    const c = parseFloat(measurements.c) || 0;

    switch (countOfSides) {
        case 1: return a;
        case 2: return a * b;
        case 3: return a * b * c;
        default: return 0;
    }
};

/**
 * Вспомогательная функция для расчета количества Extra Product на основе формулы.
 * @param {object} extraProduct - Объект ExtraProduct, содержащий calculationType.
 * @param {object} productMeasurements - Измерения основного продукта { a, b, c }.
 * @returns {number} Рассчитанное количество Extra Product.
 */
const calculateExtraProductQuantity = (extraProduct, productMeasurements) => {
    if (!extraProduct || !extraProduct.calculationType || !productMeasurements) {
        return 0;
    }

    let formula = extraProduct.calculationType.toLowerCase();
    const a = parseFloat(productMeasurements.a) || 0;
    const b = parseFloat(productMeasurements.b) || 0;
    const c = parseFloat(productMeasurements.c) || 0;

    // Заменяем переменные в формуле их значениями
    formula = formula.replace(/a/g, a);
    formula = formula.replace(/b/g, b);
    formula = formula.replace(/c/g, c);

    try {
        // ВНИМАНИЕ: Использование eval() может быть небезопасным при работе с недоверенными данными.
        // Для реального продакшена рассмотрите использование более безопасной библиотеки для парсинга математических выражений.
        const result = eval(formula);
        return isNaN(result) ? 0 : result;
    } catch (e) {
        console.error(`Ошибка при расчете формулы для Extra Product "${extraProduct.name}": ${formula}`, e);
        return 0;
    }
};


/**
 * Вспомогательная функция для расчета общей цены одного товара на карточке.
 * Учитывает цену по умолчанию счета, собственные extraPrices продукта и подключенные extraProducts.
 * @param {object} product - Объект продукта.
 * @param {string|number|null} invoiceDefaultPriceId - ID цены по умолчанию для счета (может быть null).
 * @param {Array} allAvailablePrices - Все доступные объекты цен.
 * @param {Array} allAvailableExtraProducts - Все доступные объекты ExtraProduct.
 * @param {object} currentProductMeasurements - Текущие измерения основного продукта { a, b, c }.
 * @param {Array} selectedExtraProductsOnCard - Выбранные Extra Products для этой карточки товара.
 * @returns {number} Общая цена для этого товара.
 */
const calculateProductCardPrice = (product, invoiceDefaultPriceId) => {

    const price = product.extraPrices.find(p => p.extraPrice.priceId === invoiceDefaultPriceId)

    return price?.extraPrice?.price || product.price;
};


/**
 * Компонент для создания нового счета-фактуры.
 */
function CreateInvoice() {
    const [selectedCustomer, setSelectedCustomer] = useState(null); // Выбранный клиент
    const [invoiceDefaultPriceId, setInvoiceDefaultPriceId] = useState(null); // ID цены по умолчанию для счета
    const [invoiceDefaultPriceIdForChecking, setInvoiceDefaultPriceIdForChecking] = useState(null); // ID цены по умолчанию для счета
    const [invoiceDefaultPriceName, setInvoiceDefaultPriceName] = useState('Не выбрана'); // Название цены по умолчанию для счета
    const [invoiceTotal, setInvoiceTotal] = useState(0); // Общая сумма счета

    const [productSearchTerm, setProductSearchTerm] = useState(''); // Поисковый запрос для товаров
    const [addedProducts, setAddedProducts] = useState([]); // Список товаров в счете
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [isInvoicePriceSearchOpen, setIsInvoicePriceSearchOpen] = useState(false);
    const [isProductMeasurementsDialogOpen, setIsProductMeasurementsDialogOpen] = useState(false);
    const [isProductSearchDialogOpen, setIsProductSearchDialogOpen] = useState(false); // Новый стейт для диалога поиска продуктов
    const [isExtraProductSelectionDialogOpen, setIsExtraProductSelectionDialogOpen] = useState(false); // Новый стейт для диалога выбора доп. услуг
    const [currentProductIndexForExtraProducts, setCurrentProductIndexForExtraProducts] = useState(null); // Индекс продукта, для которого выбираются доп. услуги

    const [editingProductIndex, setEditingProductIndex] = useState(null); // Индекс продукта, чьи измерения редактируются

    // Списки доступных сущностей для выпадающих списков и поиска
    const [availableCustomers, setAvailableCustomers] = useState([]);
    const [availablePrices, setAvailablePrices] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); // Состояния для управления модальным окном деталей счета
    const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);
    const [selectedInvoiceIdForDetails, setSelectedInvoiceIdForDetails] = useState(null);
    // Обработчик для закрытия модального окна
    const handleCloseInvoiceDetailsModal = () => {
        setShowInvoiceDetailsModal(false);
        setSelectedInvoiceIdForDetails(null);
    };
    // Обработчик для открытия модального окна деталей счета
    const handleOpenInvoiceDetailsModal = (invoiceId) => {
        setSelectedInvoiceIdForDetails(invoiceId);
        setShowInvoiceDetailsModal(true);
    };

    // Refs для Drag & Drop
    const dragItem = useRef(null); // Индекс перетаскиваемого элемента
    const dragOverItem = useRef(null); // Индекс элемента, над которым находится перетаскиваемый


    useEffect(() => {
        if (invoiceDefaultPriceId !== invoiceDefaultPriceIdForChecking) {
            addedProducts.forEach((_, index) => updateProductItem(index))
            setInvoiceDefaultPriceIdForChecking(invoiceDefaultPriceId)
        }
    }, [invoiceDefaultPriceId, invoiceDefaultPriceIdForChecking])

    // --- Загрузка всех необходимых данных при монтировании компонента ---
    useEffect(() => {
        const fetchAllInitialData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [customersRes, pricesRes, productsRes] = await Promise.all([
                    axios.get(API_BASE_URL_CUSTOMERS),
                    axios.get(API_BASE_URL_PRICES),
                    axios.get(API_BASE_URL_PRODUCTS),
                ]);
                setAvailableCustomers(customersRes.data);
                setAvailablePrices(pricesRes.data);
                setAvailableProducts(productsRes.data);
            } catch (err) {
                setError('Ошибка при загрузке начальных данных: ' + (err.response?.data?.error || err.message));
                console.error('Ошибка загрузки начальных данных:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllInitialData();
    }, []);

    // --- Эффект для обновления цены по умолчанию счета при изменении клиента ---
    useEffect(() => {
        if (selectedCustomer && selectedCustomer.defaultPriceId) {
            const customerPrice = availablePrices.find(p => p.id === selectedCustomer.defaultPriceId);
            if (customerPrice) {
                setInvoiceDefaultPriceId(customerPrice.id);
                setInvoiceDefaultPriceName(customerPrice.name);
            } else {
                setInvoiceDefaultPriceId(null);
                setInvoiceDefaultPriceName('Не найдена');
            }
        } else {
            setInvoiceDefaultPriceId(null);
            setInvoiceDefaultPriceName('Не выбрана');
        }
    }, [selectedCustomer, availablePrices]);

    // --- Эффект для пересчета общей суммы счета ---
    useEffect(() => {
        let total = 0;
        addedProducts.forEach(item => {
            total += (item.totalCardPrice || 0); // Общая сумма счета = сумма общих цен всех карточек
        });
        setInvoiceTotal(total);
    }, [addedProducts]);


    // --- Обработчики выбора из диалогов ---
    const handleCustomerSelected = (customerId) => {
        const customer = availableCustomers.find(c => c.id === customerId);
        setSelectedCustomer(customer);
        setIsCustomerSearchOpen(false);
        setMessage(`Выбран клиент: ${customer?.name || 'Неизвестный'}`);
    };

    const handleInvoicePriceSelected = (priceId) => {
        const price = availablePrices.find(p => p.id === priceId);
        if (price) {
            setInvoiceDefaultPriceId(price.id);
            setInvoiceDefaultPriceName(price.name);
            setMessage(`Цена по умолчанию для счета: ${price.name}`);
        }
        setIsInvoicePriceSearchOpen(false);
    };

    // --- Вспомогательная функция для добавления продукта в счет ---
    const addProductToInvoice = useCallback((product) => {
        // Проверяем, не добавлен ли уже этот продукт
        if (addedProducts.some(item => item.id === product.id)) {
            setMessage(`Продукт "${product.name}" уже добавлен в счет.`);
            return;
        }

        setTimeout(() => {
            setIsProductMeasurementsDialogOpen(true)
            setEditingProductIndex(addedProducts.length)
        }, 200)

        const newProductItem = {
            ...product,
            measurements: { a: '', b: '', c: '' },
            quantity: 0,
            selectedExtraProducts: [],
            notes: '', // Единое поле для заметки, строка
            calculatedPrice: calculateProductCardPrice(
                product,
                invoiceDefaultPriceId,
            ),
            totalCardPrice: 0,
            // Добавляем уникальный локальный ID для React key, особенно для дубликатов
            localId: Date.now() + Math.random(),
        };
        setAddedProducts(prev => [...prev, newProductItem]);
        setMessage(`Продукт "${product.name}" добавлен.`);
        setProductSearchTerm(''); // Очищаем поле поиска штрих-кода
    }, [addedProducts, invoiceDefaultPriceId, availablePrices]);


    // --- Обработчик поиска товара по штрих-коду ---
    const handleProductSearch = async (e) => {
        if (e.key === 'Enter' && productSearchTerm.trim()) {
            setError(null);
            setMessage('');
            try {
                const product = availableProducts.find(p => p.barcode === productSearchTerm.trim());
                if (product) {
                    addProductToInvoice(product);

                } else {
                    setError('Продукт с таким штрих-кодом не найден.');
                }
            } catch (err) {
                setError('Ошибка при поиске продукта: ' + err.message);
            }
        }
    };

    // --- Обработчик выбора продукта из диалога поиска по имени ---
    const handleProductSelectedFromDialog = (productId) => {
        const product = availableProducts.find(p => p.id === productId);
        if (product) {
            addProductToInvoice(product);
        }
        setIsProductSearchDialogOpen(false); // Закрываем диалог после выбора
    };


    // --- Вспомогательная функция для обновления свойств продукта в addedProducts ---
    const updateProductItem = useCallback((index, updates) => {
        setAddedProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            const productToUpdate = { ...updatedProducts[index], ...updates };

            // Пересчитываем количество основного продукта
            productToUpdate.quantity = calculateProductQuantity(
                productToUpdate.countOfSides,
                productToUpdate.measurements
            );

            // Пересчитываем количество и цену для каждого выбранного ExtraProduct
            productToUpdate.selectedExtraProducts = productToUpdate.selectedExtraProducts.map(selectedEp => {
                const fullExtraProduct = productToUpdate.extraProducts.find(aep => aep.id === selectedEp.extraProductId);
                if (fullExtraProduct) {
                    const epQuantity = calculateExtraProductQuantity(fullExtraProduct, productToUpdate.measurements);
                    const calculatedUnitPrice = fullExtraProduct.extraPrices.find(p => p.extraProductPrice.priceId === invoiceDefaultPriceId)?.extraProductPrice?.price || fullExtraProduct.price

                    return {
                        ...selectedEp,
                        calculatedQuantity: epQuantity,
                        calculatedUnitPrice: calculatedUnitPrice, // Цена за единицу ExtraProduct
                        calculatedTotalPrice: epQuantity * calculatedUnitPrice, // Общая цена для этого ExtraProduct
                    };
                }
                return selectedEp;
            });

            // Пересчитываем общую цену для карточки продукта (базовая цена продукта)
            productToUpdate.calculatedPrice = calculateProductCardPrice(
                productToUpdate,
                invoiceDefaultPriceId,
            );

            // Общая стоимость карточки = (количество основного продукта * его цена) + сумма цен всех ExtraProduct
            productToUpdate.totalCardPrice = (productToUpdate.quantity * productToUpdate.calculatedPrice) +
                productToUpdate.selectedExtraProducts.reduce((sum, ep) => sum + (ep.calculatedTotalPrice || 0), 0);


            updatedProducts[index] = productToUpdate;
            return updatedProducts;
        });
    }, [invoiceDefaultPriceId]);


    // --- Обработчики измерений продукта ---
    const openMeasurementsDialog = (index) => {
        setEditingProductIndex(index);
        setIsProductMeasurementsDialogOpen(true);
    };

    const handleMeasurementsChange = (e, field) => {
        const value = e.target.value;
        setAddedProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            const productToUpdate = { ...updatedProducts[editingProductIndex] };
            productToUpdate.measurements = {
                ...productToUpdate.measurements,
                [field]: value,
            };
            updatedProducts[editingProductIndex] = productToUpdate;
            return updatedProducts;
        });
        // Вызываем updateProductItem после того, как состояние обновится
        // Это вызовет пересчет quantity и prices
        // Для этого используем setTimeout или useEffect, но useCallback уже обновит
        updateProductItem(editingProductIndex, {});
    };

    const closeMeasurementsDialog = () => {
        setEditingProductIndex(null);
        setIsProductMeasurementsDialogOpen(false);
    };

    // --- Обработчики Extra Products для карточки товара ---
    // Эта функция теперь вызывается из ExtraProductSelectionDialog
    const handleAddExtraProductFromDialog = (extraProductId) => {
        if (currentProductIndexForExtraProducts === null) return; // Защита от вызова без выбранного продукта

        setAddedProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            const productToUpdate = { ...updatedProducts[currentProductIndexForExtraProducts] };

            // Проверка на дублирование Extra Product ID в рамках одной карточки
            const isDuplicate = productToUpdate.selectedExtraProducts.some(ep => ep.extraProductId === extraProductId);

            if (isDuplicate) {
                setMessage(`Доп. услуга (ID: ${extraProductId}) уже добавлена к этому товару.`);
                return prevProducts; // Не обновляем состояние, если дубликат
            }

            productToUpdate.selectedExtraProducts = [
                ...productToUpdate.selectedExtraProducts,
                { extraProductId: extraProductId, calculatedQuantity: 0, calculatedUnitPrice: 0, calculatedTotalPrice: 0 }
            ];
            updatedProducts[currentProductIndexForExtraProducts] = productToUpdate;
            return updatedProducts;
        });
        setIsExtraProductSelectionDialogOpen(false); // Закрываем диалог после выбора
        setMessage(`Доп. услуга добавлена.`);
        // Пересчитываем после добавления
        updateProductItem(currentProductIndexForExtraProducts, {});
    };


    const handleRemoveExtraProductFromCard = (productIndex, epIndex) => {
        setAddedProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            const productToUpdate = { ...updatedProducts[productIndex] };
            productToUpdate.selectedExtraProducts = productToUpdate.selectedExtraProducts.filter((_, i) => i !== epIndex);
            updatedProducts[productIndex] = productToUpdate;
            return updatedProducts;
        });
        // Пересчитываем после удаления
        updateProductItem(productIndex, {});
    };

    const handleRemoveProductCard = (localIdToRemove) => {
        if (window.confirm('Вы уверены, что хотите удалить этот товар из счета?')) {
            setAddedProducts(prevProducts => prevProducts.filter(p => p.localId !== localIdToRemove)); // Удаляем по localId
            setMessage('Товар удален из счета.');
        }
    };

    // --- Обработчики заметок (теперь одна заметка на карточку) ---
    const handleNoteChange = (productIndex, value) => {
        setAddedProducts(prevProducts => {
            const updatedProducts = [...prevProducts];
            updatedProducts[productIndex].notes = value;
            return updatedProducts;
        });
    };

    // --- Обработчик дублирования карточки товара ---
    const handleDuplicateProductCard = (productIndex) => {
        setAddedProducts(prevProducts => {
            const productToDuplicate = prevProducts[productIndex];
            // Глубокое копирование объекта
            const duplicatedProduct = JSON.parse(JSON.stringify(productToDuplicate));
            duplicatedProduct.localId = Date.now() + Math.random(); // Новый уникальный ID для дубликата

            // Вставляем дубликат сразу после оригинала
            const newProducts = [...prevProducts];
            newProducts.splice(productIndex + 1, 0, duplicatedProduct);
            setMessage(`Продукт "${duplicatedProduct.name}" продублирован.`);
            return newProducts;
        });
    };

    // --- Drag & Drop Handlers ---
    const handleDragStart = (e, index) => {
        dragItem.current = index;
        // Добавляем небольшой таймаут, чтобы элемент успел "отлепиться" от курсора
        // и не было мерцания, когда перетаскиваемый элемент исчезает из потока
        setTimeout(() => {
            e.target.style.opacity = '0.5'; // Делаем перетаскиваемый элемент полупрозрачным
        }, 0);
    };

    const handleDragEnter = (e, index) => {
        e.preventDefault(); // Необходимо для onDrop
        dragOverItem.current = index;
        // Опционально: добавить визуальный эффект для элемента, над которым перетаскивают
        // e.target.style.border = '2px dashed #007bff';
    };

    const handleDragLeave = (e) => {
        // e.target.style.border = '1px solid #ddd'; // Сброс стиля при уходе курсора
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1'; // Возвращаем полную непрозрачность
        // Опционально: сбросить все стили border, если они были добавлены
        // const allCards = document.querySelectorAll('.product-card-draggable'); // Добавьте класс к карточкам
        // allCards.forEach(card => card.style.border = '1px solid #ddd');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dragIndex = dragItem.current;
        const dropIndex = dragOverItem.current;

        if (dragIndex === null || dropIndex === null || dragIndex === dropIndex) {
            return; // Ничего не делаем, если нет перетаскивания или перетаскивание на тот же элемент
        }

        const newAddedProducts = [...addedProducts];
        const [reorderedItem] = newAddedProducts.splice(dragIndex, 1); // Удаляем перетаскиваемый элемент
        newAddedProducts.splice(dropIndex, 0, reorderedItem); // Вставляем его в новую позицию

        setAddedProducts(newAddedProducts);

        dragItem.current = null; // Сброс ref'ов
        dragOverItem.current = null;
        setMessage('Порядок товаров изменен.');
    };


    // --- Основная функция создания счета (заглушка) ---
    const handleCreateInvoice = async () => {
        if (!selectedCustomer) {
            setError('Пожалуйста, выберите клиента.');
            return;
        }
        if (addedProducts.length === 0) {
            setError('Пожалуйста, добавьте хотя бы один товар в счет.');
            return;
        }

        for (const product of addedProducts) {
            const { countOfSides, measurements, name } = product;
            const a = parseFloat(measurements.a);
            const b = parseFloat(measurements.b);
            const c = parseFloat(measurements.c);

            if (countOfSides === 1) {
                if (isNaN(a) || a <= 0) {
                    setError(`Пожалуйста, заполните корректную ширину (A) для товара "${name}".`);
                    return;
                }
            } else if (countOfSides === 2) {
                if (isNaN(a) || a <= 0 || isNaN(b) || b <= 0) {
                    setError(`Пожалуйста, заполните корректную ширину (A) и высоту (B) для товара "${name}".`);
                    return;
                }
            } else if (countOfSides === 3) {
                if (isNaN(a) || a <= 0 || isNaN(b) || b <= 0 || isNaN(c) || c <= 0) {
                    setError(`Пожалуйста, заполните корректную ширину (A), высоту (B) и глубину (C) для товара "${name}".`);
                    return;
                }
            }
        }

        // Здесь будет логика отправки данных счета на бэкенд
        const invoiceData = {
            customerId: selectedCustomer.id,
            defaultPriceId: invoiceDefaultPriceId,
            totalAmount: invoiceTotal,
            items: addedProducts.map(item => ({
                productId: item.id,
                measurements: item.measurements,
                quantity: item.quantity,
                calculatedPricePerUnit: item.calculatedPrice, // Цена за единицу основного товара
                totalItemPrice: item.totalCardPrice, // Общая сумма для этого товара (включая доп. услуги)
                extraItems: item.selectedExtraProducts.map(ep => ({
                    extraProductId: ep.extraProductId,
                    calculatedQuantity: ep.calculatedQuantity,
                    calculatedUnitPrice: ep.calculatedUnitPrice,
                    calculatedTotalPrice: ep.calculatedTotalPrice,
                })),
                notes: item.notes.trim(), // Отправляем заметку (если не пустая)
            })),
        };
        setLoading(true)
        try {
            const response = await axios.post(`${API_BASE_URL}/api/invoices`, invoiceData);
            setMessage('Счет успешно создан (логика отправки на бэкенд не реализована).');
            console.log('Счет создана:', response.data);
            setError(null);
            handleOpenInvoiceDetailsModal(response.data.id)
            // Очистка формы после создания (опционально)
            setSelectedCustomer(null);
            setInvoiceDefaultPriceId(null);
            setInvoiceDefaultPriceName('Не выбрана');
            setAddedProducts([]);
            setInvoiceTotal(0);
            setProductSearchTerm('');
        } catch (err) {
            setError('Ошибка при сохранении счета-фактуры: ' + (err.response?.data?.error || err.message));
            console.error('Ошибка при сохранении счета-фактуры:', err);
        } finally {
            setLoading(false)
        }

    };


    return (
        <>
            <div style={styles.container} className='no-print'>
                <h1 style={styles.mainHeading}>Создание счета-фактуры</h1>

                {loading && <p style={styles.loading}>Загрузка данных...</p>}

                <div style={styles.headerSection}>

                    {/* Кнопка создания счета */}
                    < button onClick={handleCreateInvoice} style={styles.createInvoiceButton} disabled={loading || addedProducts.length === 0}>
                        Создать счет
                    </button >

                    {/* Поиск и добавление товаров */}
                    <div style={styles.productSearchSection}>
                        <div style={styles.productSearchInputWrapper}> {/* Обертка для инпута и иконки */}
                            <input
                                type="text"
                                placeholder="Введите штрих-код товара и нажмите Enter"
                                value={productSearchTerm}
                                onChange={(e) => setProductSearchTerm(e.target.value)}
                                onKeyPress={handleProductSearch}
                                style={styles.productSearchInput}
                                disabled={loading}
                            />
                            {/* Иконка поиска, которая открывает диалог */}
                            <svg onClick={() => setIsProductSearchDialogOpen(true)} style={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3.5-9a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2a.5.5 0 01-.5-.5zm5.5 5.5a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2a.5.5 0 01.5.5zM21.707 20.293l-4.5-4.5a1 1 0 00-1.414 1.414l4.5 4.5a1 1 0 001.414-1.414z" />
                            </svg>
                        </div>
                    </div>

                    {/* Общая сумма счета */}
                    <div style={styles.invoiceTotal}>
                        Общая сумма: <strong>{invoiceTotal.toFixed(2)}</strong>
                    </div>

                </div>


                {error && <p style={styles.error}>Ошибка: {error}</p>}
                {message && <p style={styles.message}>{message}</p>}
                {/* Список добавленных товаров (карточки) */}
                <div style={styles.productsList}>
                    {addedProducts.length === 0 ? (
                        <p style={styles.infoText}>Добавьте товары в счет, используя поиск по штрих-коду.</p>
                    ) : (
                        addedProducts.map((product, index) => (
                            <div
                                key={product.localId || product.id} // Используем localId для уникальности, особенно для дубликатов
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragLeave={handleDragLeave}
                                onDragEnd={handleDragEnd}
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()} // Необходимо для срабатывания onDrop
                                style={styles.productCard}
                                className="product-card-draggable" // Добавляем класс для потенциального стилинга drag/drop
                            >
                                {/* Иконка меню для доп. услуг */}
                                <svg onClick={() => {
                                    if (addedProducts[index].extraProducts?.length > 0) {
                                        setCurrentProductIndexForExtraProducts(index)
                                        setIsExtraProductSelectionDialogOpen(true)
                                    }
                                }} style={styles.menuIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                                </svg>
                                <button onClick={() => handleDuplicateProductCard(index)} style={styles.dublicateProductCardButton}>
                                    C
                                </button>

                                <button onClick={() => handleRemoveProductCard(product.localId || product.id)} style={styles.removeProductCardButton}>
                                    &times;
                                </button>
                                <div style={{ display: 'flex', marginTop: 16, alignItems: 'stretch' }}>
                                    <div style={{ width: 250, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <h3 style={styles.cardTitle}>{product.name}</h3>

                                        <p style={styles.cardBarcode}>Штрих-код: {product.barcode}</p>

                                        {/* Изображение продукта и диалог измерений */}
                                        <div style={styles.imageContainer} onClick={() => openMeasurementsDialog(index)}>
                                            {renderProductImage(product.countOfSides, product.measurements)}
                                            <span style={styles.imageOverlay}>Ввести размеры</span>
                                        </div>
                                    </div>
                                    {/* Количество и цена внизу карточки */}
                                    <div style={styles.cardFooter}>

                                        <span>Кол-во: <strong>{product.quantity.toFixed(2)} {product.measure}</strong> | Цена: <strong>{product.calculatedPrice.toFixed(2)}</strong> | Сумма: {(product.quantity * product.calculatedPrice).toFixed(2)}</span>
                                        <div style={styles.extraProductsSection}>
                                            {/* <h4>Доп. услуги:</h4> */}
                                            {product.selectedExtraProducts.length === 0 ? (
                                                <p style={styles.extraProductInfoText}>Нет добавленных доп. товар.</p>
                                            ) : (
                                                product.selectedExtraProducts.map((selectedEp, epIndex) => {
                                                    const fullExtraProduct = product.extraProducts.find(aep => aep.id === selectedEp.extraProductId);
                                                    return (
                                                        <div key={epIndex} style={styles.extraProductItem}>
                                                            {/* Отображаем только имя доп. услуги */}
                                                            <button onClick={() => handleRemoveExtraProductFromCard(index, epIndex)} style={styles.removeExtraProductButton}>
                                                                &times;
                                                            </button>
                                                            <span style={styles.extraProductName}>{fullExtraProduct?.name || 'Неизвестная доп. тоывр'}</span>
                                                            {fullExtraProduct && (
                                                                <div style={styles.extraProductDetails}>
                                                                    Кол-во: {selectedEp.calculatedQuantity.toFixed(2)} | Цена: {selectedEp.calculatedUnitPrice.toFixed(2)} | Сумма: {selectedEp.calculatedTotalPrice.toFixed(2)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                            {/* Кнопка "Добавить доп. услугу" теперь вызывается через иконку меню */}
                                        </div>
                                        <div style={{ flexGrow: 1 }} />
                                        <span style={styles.totalCardPrice}>Общая сумма товара: <strong>{product.totalCardPrice.toFixed(2)}</strong></span>
                                    </div>

                                </div>

                                {/* Секция заметки (теперь одна заметка) */}
                                < div style={styles.notesSection} >
                                    {/* <h4>Заметка:</h4> */}
                                    < input
                                        type="text"
                                        value={product.notes}
                                        onChange={(e) => handleNoteChange(index, e.target.value)}
                                        placeholder="Введите заметку..."
                                        style={styles.noteInput}
                                    />
                                </div>
                            </div>
                        ))
                    )
                    }
                </div >


                {/* Выбор цены по умолчанию для счета */}
                <div style={{ ...styles.customerPriceSelection, right: 10 }}>
                    <button onClick={() => setIsInvoicePriceSearchOpen(true)} style={styles.selectButton}>
                        {invoiceDefaultPriceName ? `Цена счета: ${invoiceDefaultPriceName}` : 'Выбрать цену счета'}
                    </button>
                </div>


                {/* Выбор клиента */}
                <div style={{ ...styles.customerPriceSelection, left: 10 }}>
                    <button onClick={() => setIsCustomerSearchOpen(true)} style={styles.selectButton}>
                        {selectedCustomer ? `Клиент: ${selectedCustomer.name}` : 'Выбрать клиента'}
                    </button>
                    {selectedCustomer && (
                        <span style={styles.customerInfo}>
                            ({selectedCustomer.phoneNumber})
                        </span>
                    )}
                </div>
                {/* --- Модальные диалоги --- */}

                {/* Диалог выбора клиента */}
                {
                    isCustomerSearchOpen && (
                        <CustomerSearchDialog
                            onSelect={handleCustomerSelected}
                            onClose={() => setIsCustomerSearchOpen(false)}
                        />
                    )
                }

                {/* Диалог выбора цены для счета */}
                {
                    isInvoicePriceSearchOpen && (
                        <PriceSearchDialog
                            onSelect={handleInvoicePriceSelected}
                            onClose={() => setIsInvoicePriceSearchOpen(false)}
                        />
                    )
                }

                {/* Диалог ввода измерений продукта */}
                {
                    isProductMeasurementsDialogOpen && editingProductIndex !== null && (
                        <div style={styles.modalOverlay}>
                            <div style={styles.modalContent}>
                                <h3 style={styles.modalTitle}>Введите измерения для {addedProducts[editingProductIndex]?.name}</h3>
                                <p style={styles.modalSubtitle}>Сторон: {addedProducts[editingProductIndex]?.countOfSides}</p>
                                <div style={styles.measurementsInputGroup}>
                                    {addedProducts[editingProductIndex]?.countOfSides >= 1 && (
                                        <label style={styles.modalLabel}>
                                            Ширина:
                                            <input
                                                type="number"
                                                step="0.01"
                                                autoFocus
                                                value={addedProducts[editingProductIndex]?.measurements.a || ''}
                                                onChange={(e) => handleMeasurementsChange(e, 'a')}
                                                style={styles.modalInput}
                                            />
                                        </label>
                                    )}
                                    {addedProducts[editingProductIndex]?.countOfSides >= 2 && (
                                        <label style={styles.modalLabel}>
                                            Высота:
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={addedProducts[editingProductIndex]?.measurements.b || ''}
                                                onChange={(e) => handleMeasurementsChange(e, 'b')}
                                                style={styles.modalInput}
                                            />
                                        </label>
                                    )}
                                    {addedProducts[editingProductIndex]?.countOfSides >= 3 && (
                                        <label style={styles.modalLabel}>
                                            Глубина:
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={addedProducts[editingProductIndex]?.measurements.c || ''}
                                                onChange={(e) => handleMeasurementsChange(e, 'c')}
                                                style={styles.modalInput}
                                            />
                                        </label>
                                    )}
                                </div>
                                <button onClick={closeMeasurementsDialog} style={styles.closeModalButton}>
                                    Применить
                                </button>
                            </div>
                        </div>
                    )
                }

                {/* Диалог для поиска продуктов по имени */}
                {
                    isProductSearchDialogOpen && (
                        <ProductSearchDialog
                            onSelect={handleProductSelectedFromDialog}
                            onClose={() => setIsProductSearchDialogOpen(false)}
                        />
                    )
                }

                {/* Диалог для выбора дополнительных услуг */}
                {
                    isExtraProductSelectionDialogOpen && (
                        <ExtraProductSelectionDialog
                            availableExtraProducts={addedProducts[currentProductIndexForExtraProducts].extraProducts || []} // Передаем все доступные доп. услуги
                            onSelect={handleAddExtraProductFromDialog}
                            onClose={() => setIsExtraProductSelectionDialogOpen(false)}
                        />
                    )
                }
            </div>
            {/* Модальное окно деталей счета */}
            <InvoiceDetailsModal
                invoiceId={selectedInvoiceIdForDetails}
                isOpen={showInvoiceDetailsModal}
                onClose={handleCloseInvoiceDetailsModal}
            />
        </>
    );
}

const styles = {
    container: {
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '1400px',
        margin: '20px auto',
        backgroundColor: '#f8f8f8',
        borderRadius: '10px',
        boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
        position: 'relative'
    },
    mainHeading: {
        textAlign: 'center',
        color: '#2c3e50',
        margin: '0 auto 70px auto',
        fontSize: '2.5em',
        textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
    },
    headerSection: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #eee',
        flexWrap: 'wrap',
        gap: '15px',
    },
    customerPriceSelection: {
        flex: 1,
        minWidth: '200px',
        textAlign: 'center',
        position: 'absolute',
        transform: 'scale(.7)',
        top: 0
    },
    selectButton: {
        padding: '10px 15px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1em',
        fontWeight: 'bold',
        transition: 'background-color 0.3s ease',
    },
    'selectButton:hover': {
        backgroundColor: '#0056b3',
    },
    customerInfo: {
        marginLeft: '10px',
        fontSize: '0.9em',
        color: '#555',
    },
    invoiceTotal: {
        minWidth: '200px',
        textAlign: 'center',
        fontSize: '1.8em',
        color: '#28a745',
        fontWeight: 'bold',
    },
    productSearchSection: {
        textAlign: 'center',
        flexGrow: 1
    },
    productSearchInputWrapper: {
        position: 'relative',
        width: '80%',
        maxWidth: '500px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
    },
    productSearchInput: {
        padding: '12px 15px',
        paddingRight: '40px', // Добавляем отступ для иконки
        width: '100%',
        border: '2px solid #007bff',
        borderRadius: '8px',
        fontSize: '1.1em',
        boxSizing: 'border-box',
        outline: 'none',
        transition: 'border-color 0.3s ease',
    },
    'productSearchInput:focus': {
        borderColor: '#0056b3',
    },
    searchIcon: {
        position: 'absolute',
        right: '10px',
        color: '#007bff',
        width: '24px',
        height: '24px',
        cursor: 'pointer', // Делаем иконку кликабельной
        transition: 'color 0.2s ease',
    },
    'searchIcon:hover': {
        color: '#0056b3',
    },
    productsList: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(430px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
    },
    productCard: {
        border: '1px solid #ddd',
        borderRadius: '10px',
        padding: '15px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    menuIcon: {
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: '#555',
        width: '24px',
        height: '24px',
        cursor: 'pointer',
        zIndex: 10,
        transition: 'color 0.2s ease',
    },
    'menuIcon:hover': {
        color: '#000',
    },
    dublicateProductCardButton: {
        position: 'absolute',
        top: '10px',
        left: '45px',
        backgroundColor: '#376079ff',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '25px',
        height: '25px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '1.2em',
        fontWeight: 'bold',
        transition: 'background-color 0.2s ease',
    },
    removeProductCardButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '25px',
        height: '25px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '1.2em',
        fontWeight: 'bold',
        transition: 'background-color 0.2s ease',
    },
    'removeProductCardButton:hover': {
        backgroundColor: '#c82333',
    },
    cardTitle: {
        color: '#333',
        marginBottom: '5px',
        textAlign: 'center',
    },
    cardBarcode: {
        fontSize: '0.9em',
        color: '#666',
        marginBottom: '10px',
    },
    imageContainer: {
        width: '100px',
        height: '100px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '30px',
        cursor: 'pointer',
        position: 'relative',
        marginRight: 50,
        marginLeft: 50,
        overflow: 'hidden',
        transform: 'scale(1.7)'
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        transition: 'opacity 0.3s ease',
        fontSize: '0.9em',
        textAlign: 'center',
        padding: '5px',
    },
    'imageContainer:hover .imageOverlay': {
        opacity: 1,
    },
    measurementsDisplay: {
        fontSize: '0.9em',
        color: '#555',
        marginBottom: '15px',
        textAlign: 'center',
    },
    extraProductsSection: {
        width: '100%',
        borderTop: '1px dashed #eee',
        paddingTop: '5px',
        marginTop: '5px',
    },
    extraProductItem: {
        display: 'flex',
        justifyContent: 'space-between', // Выравнивание элемента и кнопки
        alignItems: 'center',
        gap: '10px',
        marginBottom: '8px',
        border: '1px solid #f0f0f0',
        borderRadius: '5px',
        padding: '8px',
        backgroundColor: '#fafafa',
    },
    extraProductName: {
        flexGrow: 1, // Занимает все доступное пространство
        fontSize: '0.9em',
        color: '#333',
        fontWeight: 'bold',
    },
    removeExtraProductButton: {
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '15px',
        height: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '0.8em',
        fontWeight: 'bold',
        transition: 'background-color 0.2s ease',
    },
    'removeExtraProductButton:hover': {
        backgroundColor: '#c82333',
    },
    extraProductDetails: {
        fontSize: '0.85em',
        color: '#777',
        width: '100%',
        textAlign: 'right',
        marginTop: '5px', // Отступ от названия
    },
    extraProductInfoText: {
        fontSize: '0.9em',
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
        padding: '10px 0',
    },
    notesSection: {
        width: '100%',
        borderTop: '1px dashed #eee',
        paddingTop: '15px',
        marginTop: '15px',
    },
    noteInput: {
        width: '100%',
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '0.9em',
        boxSizing: 'border-box',
        marginTop: '5px',
    },
    duplicateButton: {
        padding: '8px 12px',
        backgroundColor: '#ffc107',
        color: 'black',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '0.9em',
        fontWeight: 'bold',
        transition: 'background-color 0.3s ease',
        marginTop: '15px',
        width: '100%',
    },
    cardFooter: {
        display: 'flex',
        flexDirection: 'column', // Изменено на column для лучшего расположения
        justifyContent: 'space-between',
        width: '100%',
        marginTop: '25px',
        paddingTop: '10px',
        borderTop: '1px solid #eee',
        fontSize: '0.9em',
        fontWeight: 'bold',
        color: '#333',
        gap: '5px', // Отступ между строками
    },
    totalCardPrice: {
        color: '#007bff', // Отдельный цвет для общей суммы товара
        fontSize: '1.2em',
        marginTop: '5px',
    },
    createInvoiceButton: {
        display: 'block',
        margin: '0 auto',
        padding: '12px 30px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '1.4em',
        fontWeight: 'bold',
        transition: 'background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
    },
    'createInvoiceButton:hover': {
        backgroundColor: '#218838',
        transform: 'translateY(-2px)',
        boxShadow: '0 7px 20px rgba(0,0,0,0.3)',
    },
    'createInvoiceButton:disabled': {
        backgroundColor: '#cccccc',
        cursor: 'not-allowed',
        boxShadow: 'none',
        transform: 'none',
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
        padding: '10px',
        backgroundColor: '#ffe3e6',
        borderRadius: '5px',
        marginBottom: '15px',
    },
    message: {
        color: '#28a745',
        textAlign: 'center',
        fontWeight: 'bold',
        padding: '10px',
        backgroundColor: '#e6ffe3',
        borderRadius: '5px',
        marginBottom: '15px',
    },
    infoText: {
        textAlign: 'center',
        color: '#6c757d',
        fontStyle: 'italic',
        padding: '20px',
    },
    // Modal styles (reused from other pages)
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
        maxWidth: '450px',
        width: '90%',
        position: 'relative',
        animation: 'fadeInScale 0.3s ease-out',
    },
    modalTitle: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '10px',
    },
    modalSubtitle: {
        textAlign: 'center',
        color: '#666',
        marginBottom: '20px',
        fontSize: '0.9em',
    },
    measurementsInputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '20px',
    },
    modalLabel: {
        display: 'flex',
        flexDirection: 'column',
        fontWeight: 'bold',
        color: '#555',
    },
    modalInput: {
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginTop: '5px',
        fontSize: '16px',
        width: 'calc(100% - 22px)',
    },
    closeModalButton: {
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1em',
        fontWeight: 'bold',
        transition: 'background-color 0.3s ease',
        display: 'block',
        width: '100%',
    },
    'closeModalButton:hover': {
        backgroundColor: '#0056b3',
    },
    '@keyframes fadeInScale': {
        'from': { opacity: 0, transform: 'scale(0.9)' },
        'to': { opacity: 1, transform: 'scale(1)' }
    }
};

export default CreateInvoice;
