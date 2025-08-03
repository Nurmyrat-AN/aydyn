// frontend/src/components/InvoiceReports.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../conf';
import InvoiceDetailsModal from './InvoiceDetails';

// Базовый URL вашего API для отчетов по счетам
const API_BASE_URL_INVOICE_REPORTS = `${API_BASE_URL}/api/reports/invoices`;
const API_BASE_URL_PRICES = `${API_BASE_URL}/api/prices`; // Добавляем URL для цен

// Вспомогательные функции для расчета диапазонов дат (переиспользуем из ProductDetailedSalesReports)
const getTodayRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Начало дня
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999); // Конец дня
    return { start: today.toISOString().slice(0, 10), end: endToday.toISOString().slice(0, 10) };
};

const getYesterdayRange = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const endYesterday = new Date(yesterday);
    endYesterday.setHours(23, 59, 59, 999);
    return { start: yesterday.toISOString().slice(0, 10), end: endYesterday.toISOString().slice(0, 10) };
};

const getLast7DaysRange = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 6); // Сегодняшний день включен, поэтому -6
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
};

const getThisMonthRange = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Последний день текущего месяца
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
};

const getLastMonthRange = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0); // Последний день прошлого месяца
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
};

const getThisYearRange = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 1); // 1 января текущего года
    const end = new Date(today.getFullYear(), 11, 31); // 31 декабря текущего года
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
};

const getQuarterRange = (quarterNum) => {
    const today = new Date();
    const year = today.getFullYear();
    let startMonth, endMonth;

    switch (quarterNum) {
        case 1: startMonth = 0; endMonth = 2; break; // Jan-Mar
        case 2: startMonth = 3; endMonth = 5; break; // Apr-Jun
        case 3: startMonth = 6; endMonth = 8; break; // Jul-Sep
        case 4: startMonth = 9; endMonth = 11; break; // Oct-Dec
        default: return { start: '', end: '' };
    }

    const start = new Date(year, startMonth, 1);
    const end = new Date(year, endMonth + 1, 0); // Последний день месяца
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
};


function InvoiceReports() {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [customerNameSearch, setCustomerNameSearch] = useState('');
    const [paymentType, setPaymentType] = useState(''); // Для фильтра по типу оплаты (ID цены)
    const [availablePrices, setAvailablePrices] = useState([]); // Список доступных цен
    const [totalOverallRevenue, setTotalOverallRevenue] = useState(0); // Общая сумма выручки по всем счетам

    // Состояния для управления модальным окном деталей счета
    const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);
    const [selectedInvoiceIdForDetails, setSelectedInvoiceIdForDetails] = useState(null);


    // Функция для получения данных отчета
    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (customerNameSearch) params.customerName = customerNameSearch;
            if (paymentType) params.defaultPriceId = paymentType; // Отправляем defaultPriceId в API

            const res = await axios.get(API_BASE_URL_INVOICE_REPORTS, { params });
            setReportData(res.data);

            // Рассчитываем общую сумму выручки по всем счетам
            const totalRevenue = res.data.reduce((sum, invoice) => sum + (parseFloat(invoice.totalAmount) || 0), 0);
            setTotalOverallRevenue(totalRevenue);

        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Ошибка при загрузке отчета.');
            console.error('Ошибка при загрузке отчета по счетам:', err);
        } finally {
            setLoading(false);
        }
    };

    // Функция для получения списка цен
    const fetchPrices = async () => {
        try {
            const res = await axios.get(API_BASE_URL_PRICES);
            setAvailablePrices(res.data);
        } catch (err) {
            console.error('Ошибка при загрузке списка цен:', err);
        }
    };

    // Загружаем отчет и цены при первом рендере и при изменении фильтров
    useEffect(() => {
        fetchPrices(); // Загружаем цены один раз при монтировании компонента
    }, []);

    useEffect(() => {
        fetchReport();
    }, [startDate, endDate, customerNameSearch, paymentType]); // Добавили paymentType в зависимости

    // Обработчик для быстрого выбора диапазона дат
    const handleQuickDateSelect = (e) => {
        const period = e.target.value;
        let range = { start: '', end: '' };
        switch (period) {
            case 'today': range = getTodayRange(); break;
            case 'yesterday': range = getYesterdayRange(); break;
            case 'last7days': range = getLast7DaysRange(); break;
            case 'thisMonth': range = getThisMonthRange(); break;
            case 'lastMonth': range = getLastMonthRange(); break;
            case 'thisYear': range = getThisYearRange(); break;
            case 'q1': range = getQuarterRange(1); break;
            case 'q2': range = getQuarterRange(2); break;
            case 'q3': range = getQuarterRange(3); break;
            case 'q4': range = getQuarterRange(4); break;
            case 'custom': // Если выбрано "Выбрать вручную", сбрасываем даты
            default: range = { start: '', end: '' }; break;
        }
        setStartDate(range.start);
        setEndDate(range.end);
    };

    // Обработчик для открытия модального окна деталей счета
    const handleOpenInvoiceDetailsModal = (invoiceId) => {
        setSelectedInvoiceIdForDetails(invoiceId);
        setShowInvoiceDetailsModal(true);
    };

    // Обработчик для закрытия модального окна
    const handleCloseInvoiceDetailsModal = () => {
        setShowInvoiceDetailsModal(false);
        setSelectedInvoiceIdForDetails(null);
    };

    return (
        <>
            <div style={styles.container} className='no-print'>
                <h1 style={styles.mainHeading}>Отчеты по счетам (фактурам)</h1>

                {/* Общая сумма выручки по всем счетам */}
                <div style={styles.totalRevenueDisplay}>
                    Общая сумма выручки: <strong>{totalOverallRevenue.toFixed(2)} м</strong>
                </div>

                <div style={styles.filtersSection}>
                    <div style={styles.dateFilterGroup}>
                        <label style={styles.filterLabel}>
                            Начальная дата:
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={styles.filterInput}
                            />
                        </label>

                        <select onChange={handleQuickDateSelect} style={styles.quickSelectDropdown}>
                            <option value="custom">Выбрать интервал</option>
                            <option value="today">Сегодня</option>
                            <option value="yesterday">Вчера</option>
                            <option value="last7days">Последние 7 дней</option>
                            <option value="thisMonth">Этот месяц</option>
                            <option value="lastMonth">Прошлый месяц</option>
                            <option value="thisYear">Этот год</option>
                            <option value="q1">Квартал 1</option>
                            <option value="q2">Квартал 2</option>
                            <option value="q3">Квартал 3</option>
                            <option value="q4">Квартал 4</option>
                        </select>

                        <label style={styles.filterLabel}>
                            Конечная дата:
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={styles.filterInput}
                            />
                        </label>
                    </div>

                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>
                            Поиск по имени клиента:
                            <input
                                type="text"
                                placeholder="Введите имя клиента..."
                                value={customerNameSearch}
                                onChange={(e) => setCustomerNameSearch(e.target.value)}
                                style={styles.filterInput}
                            />
                        </label>
                    </div>

                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>
                            Тип цены: {/* Изменено "Тип оплаты" на "Тип цены" */}
                            <select
                                value={paymentType}
                                onChange={(e) => setPaymentType(e.target.value)}
                                style={styles.filterInput}
                            >
                                <option value="">Все</option>
                                {availablePrices.map(price => (
                                    <option key={price.id} value={price.id}>
                                        {price.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <button onClick={fetchReport} style={styles.fetchReportButton} disabled={loading}>
                        {loading ? 'Загрузка...' : 'Обновить отчет'}
                    </button>
                </div>

                {error && <p style={styles.error}>Ошибка: {error}</p>}

                {reportData.length === 0 && !loading && !error ? (
                    <p style={styles.infoText}>Нет данных для отображения отчета. Попробуйте изменить фильтры.</p>
                ) : (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID Счета</th>
                                    <th style={styles.th}>Дата Счета</th>
                                    <th style={styles.th}>Клиент</th>
                                    <th style={styles.th}>Тип цены</th>
                                    <th style={styles.th}>Общая сумма</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((invoice) => (
                                    <tr key={invoice.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            {/* Кнопка для открытия модального окна деталей счета */}
                                            <button
                                                onClick={() => handleOpenInvoiceDetailsModal(invoice.id)}
                                                style={styles.invoiceIdButton}
                                            >
                                                {invoice.id}
                                            </button>
                                        </td>
                                        <td style={styles.td}>{new Date(invoice.createdAt).toLocaleString()}</td>
                                        <td style={styles.td}>{invoice.customer ? invoice.customer.name : 'Неизвестно'}</td>
                                        <td style={styles.td}>{invoice.defaultPrice ? invoice.defaultPrice.name : 'Не выбрана'}</td>
                                        <td style={styles.td}>{parseFloat(invoice.totalAmount).toFixed(2)} м</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

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
    },
    mainHeading: {
        textAlign: 'center',
        color: '#2c3e50',
        marginBottom: '20px',
        fontSize: '2.5em',
        textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
    },
    totalRevenueDisplay: {
        textAlign: 'center',
        fontSize: '1.8em',
        color: '#28a745',
        fontWeight: 'bold',
        marginBottom: '30px',
        padding: '10px 0',
        borderBottom: '2px solid #eee',
    },
    filtersSection: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '30px',
        padding: '20px',
        border: '1px solid #eee',
        borderRadius: '8px',
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    dateFilterGroup: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
    },
    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    filterLabel: {
        fontWeight: 'bold',
        color: '#555',
        marginBottom: '5px',
        whiteSpace: 'nowrap',
    },
    filterInput: {
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '1em',
        minWidth: '180px',
    },
    quickSelectDropdown: {
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '1em',
        backgroundColor: '#f0f0f0',
        cursor: 'pointer',
        minWidth: '150px',
    },
    fetchReportButton: {
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1.1em',
        fontWeight: 'bold',
        transition: 'background-color 0.3s ease',
    },
    'fetchReportButton:hover': {
        backgroundColor: '#0056b3',
    },
    'fetchReportButton:disabled': {
        backgroundColor: '#cccccc',
        cursor: 'not-allowed',
    },
    tableContainer: {
        overflowX: 'auto',
        marginBottom: '20px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    th: {
        backgroundColor: '#007bff',
        color: 'white',
        padding: '12px 15px',
        textAlign: 'left',
        borderBottom: '1px solid #ddd',
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
    invoiceIdButton: { // Стиль для кнопки ID счета
        background: 'none',
        border: 'none',
        padding: '0',
        color: '#00bcd4', // Цвет, соответствующий кнопке счета
        textDecoration: 'underline',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '1em',
        fontFamily: 'inherit',
        textAlign: 'left',
    },
    'invoiceIdButton:hover': {
        color: '#00838f',
    },
};

export default InvoiceReports;
