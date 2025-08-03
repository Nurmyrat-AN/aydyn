// frontend/src/components/ExtraProductIndividualSalesModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../conf';
import InvoiceDetailsModal from '../invoice/InvoiceDetails';

// Базовый URL вашего API для отчетов по дополнительным продуктам
const API_BASE_URL_EXTRA_PRODUCT_REPORTS = `${API_BASE_URL}/api/reports/extraproducts`;

function ExtraProductIndividualSales({ extraProductId, startDate, endDate, isOpen, onClose }) {
    const [extraProductData, setExtraProductData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Состояния для управления модальным окном деталей счета
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

    useEffect(() => {
        const fetchIndividualExtraProductSales = async () => {
            if (!isOpen || !extraProductId) {
                setExtraProductData(null); // Сбрасываем данные при закрытии или отсутствии ID
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const params = {};
                if (startDate) params.startDate = startDate;
                if (endDate) params.endDate = endDate;

                const res = await axios.get(`${API_BASE_URL_EXTRA_PRODUCT_REPORTS}/${extraProductId}`, { params });
                setExtraProductData(res.data);
            } catch (err) {
                setError(err.response?.data?.error || err.message || 'Ошибка при загрузке данных о продажах дополнительного продукта.');
                console.error(`Ошибка при загрузке продаж для дополнительного продукта ID ${extraProductId}:`, err);
            } finally {
                setLoading(false);
            }
        };

        fetchIndividualExtraProductSales();
    }, [extraProductId, startDate, endDate, isOpen]); // Зависимости для перезагрузки данных

    if (!isOpen) {
        return null; // Не рендерим ничего, если модальное окно закрыто
    }

    return (
        <>
            <div style={styles.modalOverlay} className='no-print'>
                <div style={styles.modalContent}>
                    {loading && <p style={styles.loading}>Загрузка данных о продажах дополнительного продукта...</p>}
                    {error && <p style={styles.error}>Ошибка: {error}</p>}

                    {!loading && !error && extraProductData && (
                        <>
                            <h1 style={styles.mainHeading}>Детальные продажи доп. продукта: {extraProductData.name}</h1>
                            <div style={styles.extraProductInfo}>
                                <p><strong>ID Доп. Продукта:</strong> {extraProductData.id}</p>
                                <p><strong>Базовая цена:</strong> {extraProductData.price.toFixed(2)}</p>
                                <p><strong>Единица измерения:</strong> {extraProductData.measure}</p>
                                <p><strong>Тип расчета:</strong> {extraProductData.calculationType}</p>
                            </div>

                            <h2 style={styles.salesHeading}>Отдельные продажи</h2>
                            {extraProductData.sales && extraProductData.sales.length > 0 ? (
                                <div style={styles.tableContainer}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.th}>ID Продажи</th>
                                                <th style={styles.th}>Дата Продажи</th>
                                                <th style={styles.th}>Кол-во</th>
                                                <th style={styles.th}>Цена за ед.</th>
                                                <th style={styles.th}>Общая сумма</th>
                                                <th style={styles.th}>ID Позиции Счета</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {extraProductData.sales.map((sale) => (
                                                <tr key={sale.id} style={styles.tr}>
                                                    <td style={styles.td}>
                                                        <button
                                                            onClick={() => handleOpenInvoiceDetailsModal(sale.invoiceId)}
                                                            style={styles.invoiceIdButton}
                                                        >
                                                            {sale.invoiceId}
                                                        </button>
                                                    </td>
                                                    <td style={styles.td}>{new Date(sale.createdAt).toLocaleString()}</td>
                                                    <td style={styles.td}>{sale.calculatedQuantity.toFixed(2)}</td>
                                                    <td style={styles.td}>{sale.calculatedUnitPrice.toFixed(2)}</td>
                                                    <td style={styles.td}>{sale.calculatedTotalPrice.toFixed(2)} м</td>
                                                    <td style={styles.td}>{sale.invoiceItemId}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p style={styles.infoText}>Нет записей о продажах для этого дополнительного продукта в выбранном диапазоне дат.</p>
                            )}
                        </>
                    )}

                    <div style={styles.closeButtonContainer}>
                        <button onClick={onClose} style={styles.closeButton}>
                            Закрыть отчет
                        </button>
                    </div>
                </div>
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
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#f8f8f8',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
        maxWidth: '90%',
        maxHeight: '90%',
        overflowY: 'auto', // Добавляем прокрутку для содержимого модального окна
        width: '1200px', // Ширина модального окна
        fontFamily: 'Arial, sans-serif',
        position: 'relative',
    },
    mainHeading: {
        textAlign: 'center',
        color: '#2c3e50',
        marginBottom: '20px',
        fontSize: '2.2em', // Немного уменьшен для диалога
        textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
    },
    extraProductInfo: {
        backgroundColor: '#e9ecef',
        padding: '15px 20px',
        borderRadius: '8px',
        marginBottom: '30px',
        borderLeft: '5px solid #007bff', // Цвет, соответствующий кнопке доп. продукта
        fontSize: '1.1em',
        color: '#343a40',
    },
    salesHeading: {
        color: '#2c3e50',
        marginBottom: '15px',
        fontSize: '1.8em',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px',
    },
    tableContainer: {
        overflowX: 'auto',
        marginBottom: '20px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    th: {
        backgroundColor: '#007bff', // Цвет, соответствующий кнопке доп. продукта
        color: 'white',
        padding: '12px 15px',
        textAlign: 'left',
        borderBottom: '1px solid #ddd',
    },
    invoiceIdButton: { // Стиль для кнопки ID счета
        background: 'none',
        border: 'none',
        padding: '0',
        color: '#007bff', // Цвет, соответствующий кнопке счета
        textDecoration: 'underline',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '1em',
        fontFamily: 'inherit',
        textAlign: 'left',
    },
    td: {
        padding: '10px 15px',
        borderBottom: '1px solid #eee',
        textAlign: 'left',
        color: '#333',
        verticalAlign: 'top',
    },
    tr: {
        transition: 'background-color 0.2s ease',
    },
    'tr:nth-child(even)': {
        backgroundColor: '#f9f9f9',
    },
    'tr:hover': {
        backgroundColor: '#f1f1f1',
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
    infoText: {
        textAlign: 'center',
        color: '#6c757d',
        fontStyle: 'italic',
        padding: '20px',
    },
    closeButtonContainer: {
        textAlign: 'center',
        marginTop: '30px',
    },
    closeButton: {
        padding: '10px 20px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1em',
        fontWeight: 'bold',
        transition: 'background-color 0.3s ease',
    },
    'closeButton:hover': {
        backgroundColor: '#5a6268',
    },
};

export default ExtraProductIndividualSales;
