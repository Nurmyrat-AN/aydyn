// frontend/src/components/InvoiceDetailsModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { renderProductImage } from '../../../utils/image';
import { API_BASE_URL } from '../../../conf';

// Базовый URL вашего API для отчетов по счетам
const API_BASE_URL_INVOICE_REPORTS = `${API_BASE_URL}/api/reports/invoices`;

function InvoiceDetailsModal({ invoiceId, isOpen, onClose }) {
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!isOpen || !invoiceId) {
        setInvoiceData(null); // Сбрасываем данные при закрытии или отсутствии ID
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL_INVOICE_REPORTS}/${invoiceId}`);
        setInvoiceData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Ошибка при загрузке данных счета.');
        console.error(`Ошибка при загрузке счета ID ${invoiceId}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [invoiceId, isOpen]); // Зависимости для перезагрузки данных

  if (!isOpen) {
    return null; // Не рендерим ничего, если модальное окно закрыто
  }


  // Обработчик для печати
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={styles.modalOverlay} className="modal-overlay-print"> {/* Добавлен класс для печати */}
      {/* Стили для печати, инжектированные напрямую в DOM */}
      <style>
        {`
          @media print {
            body {
                -webkit-print-color-adjust: exact; /* Для лучшей поддержки цвета в Chrome */
                print-color-adjust: exact;
            }
            .modal-overlay-print {
              background-color: transparent !important;
              align-items: flex-start !important; /* Выравнивание по верху для печати */
            }
            .modal-content-print {
              background-color: white !important;
              box-shadow: none !important;
              width: auto !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .only-print{
                display: block !important
            }
            .print-heading {
                color: black !important;
                text-shadow: none !important;
                border-bottom: 1px solid #ccc !important;
            }
            .print-summary {
                background-color: #f0f0f0 !important;
                border-left: 2px solid #00bcd4 !important;
                color: black !important;
            }
            .print-nested-info {
                color: black !important;
            }
            .print-items-heading {
                color: black !important;
                border-bottom: 1px solid #ccc !important;
            }
            .print-table-container {
                overflow-x: visible !important;
            }
            .print-table {
                box-shadow: none !important;
                border: 1px solid #ccc !important;
            }
            .print-th {
                background-color: #e0f7fa !important;
                color: black !important;
                border: 1px solid #ccc !important;
            }
            .print-td {
                border: 1px solid #ccc !important;
                color: black !important;
            }
            .print-tr {
                background-color: white !important;
            }
            .print-info-text {
                color: black !important;
            }
          }
            .only-print{
              display: none;
            }
        `}
      </style>
      <div style={styles.modalContent} className="modal-content-print">
        {loading && <p style={styles.loading} className="no-print">Загрузка данных счета...</p>}
        {error && <p style={styles.error} className="no-print">Ошибка: {error}</p>}

        {!loading && !error && invoiceData && (
          <>
            <h1 style={styles.mainHeading} className="print-heading no-print">Детали счета: #{invoiceData.id}</h1>
            <div style={styles.invoiceSummary} className="print-summary">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
                <p className='only-print'><strong>Счета №:</strong> {invoiceData.id}</p>
                <p><strong>Клиент:</strong> {invoiceData.customer ? invoiceData.customer.name : 'Неизвестно'}</p>
                {invoiceData.customer && (
                  <>
                    <p style={styles.nestedInfo} className="print-nested-info">Телефон клиента: {invoiceData.customer.phoneNumber}</p>
                    <p style={styles.nestedInfo} className="print-nested-info">Адрес клиента: {invoiceData.customer.address}</p>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
                <p><strong>Дата счета:</strong> {new Date(invoiceData.createdAt).toLocaleString()}</p>
                <p className='no-print'><strong>Тип цены:</strong> {invoiceData.defaultPrice ? invoiceData.defaultPrice.name : 'Не выбрана'}</p>
                <p><strong>Общая сумма:</strong> {parseFloat(invoiceData.totalAmount).toFixed(2)} м</p>
              </div>
            </div>

            <h2 style={styles.itemsHeading} className="print-items-heading">Позиции счета</h2>
            {invoiceData.items && invoiceData.items.length > 0 ? (
              <div style={styles.tableContainer} className="print-table-container">
                <table style={styles.table} className="print-table">
                  <thead>
                    <tr>
                      <th style={styles.th} className="print-th">Продукт</th>
                      <th style={styles.th} className="print-th">Измерения</th>
                      <th style={styles.th} className="print-th">Кол-во</th>
                      <th style={styles.th} className="print-th">Цена за ед.</th>
                      <th style={styles.th} className="print-th">Сумма</th>
                      <th style={styles.th} className="print-th">Примечания</th>
                      {/* <th style={styles.th} className="print-th">Доп. элементы</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items.map((item) => (
                      <>
                        <tr key={item.id} style={styles.tr} className="print-tr">
                          <td rowSpan={item.extraItems && item.extraItems.length > 0 ? 2 : 1} style={styles.td} className="print-td">{item.product ? item.product.name : 'Неизвестный продукт'}</td>
                          <td style={styles.td} className="print-td">{
                            renderProductImage(item.product.countOfSides, item.measurements)
                            // formatMeasurements(item.measurements)
                          }</td>
                          <td style={styles.td} className="print-td" align='center'>{`${item.quantity} ${item.product.measure}`}</td>
                          <td style={styles.td} className="print-td" align='center'>{parseFloat(item.calculatedPricePerUnit).toFixed(2)} м</td>
                          <td style={styles.td} className="print-td" align='center'>{parseFloat(item.totalItemPrice).toFixed(2)} м</td>
                          <td style={styles.td} className="print-td">{item.notes || 'Нет'}</td>

                        </tr>
                        {item.extraItems && item.extraItems.length > 0 && (
                          <tr style={styles.tr} className="print-tr">
                            <td colSpan={5} style={styles.td} className="print-td" align='right'>
                              <ul>
                                {item.extraItems.map((extra, idx) => (
                                  <li key={idx} style={{ fontSize: 14 }}>
                                    {/* Обновлено для доступа к имени через extraProduct */}
                                    {extra.extraProduct ? extra.extraProduct.name : 'Неизвестный доп. элемент'} ({extra.calculatedQuantity} x {extra.calculatedUnitPrice.toFixed(2)} = {extra.calculatedTotalPrice.toFixed(2)} м)
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={styles.infoText} className="print-info-text">В этом счете нет позиций.</p>
            )}
          </>
        )}

        <div style={styles.closeButtonContainer} className="no-print"> {/* Добавлен класс no-print */}
          <button onClick={handlePrint} style={{ ...styles.closeButton, ...styles.printButton }}>
            Печать
          </button>
          <button onClick={onClose} style={styles.closeButton}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
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
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
    maxWidth: '1300px',
    maxHeight: '90%',
    width: '95%',
    overflowY: 'auto',
    fontFamily: 'Arial, sans-serif',
    position: 'relative',
  },
  mainHeading: {
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: '20px',
    fontSize: '2.4em',
    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px',
  },
  invoiceSummary: {
    backgroundColor: '#e9ecef',
    padding: '15px 40px',
    borderRadius: '8px',
    marginBottom: '30px',
    borderLeft: '5px solid #00bcd4',
    fontSize: '1.1em',
    color: '#343a40',
    display: 'flex',
    justifyContent: 'space-between'
  },
  nestedInfo: {
    marginLeft: '20px',
    fontSize: '0.95em',
    color: '#555',
  },
  itemsHeading: {
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
    backgroundColor: '#00bcd4',
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
    verticalAlign: 'middle',
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
    marginLeft: '10px',
  },
  'closeButton:hover': {
    backgroundColor: '#5a6268',
  },
  printButton: {
    backgroundColor: '#007bff',
    marginRight: '10px',
  },
  'printButton:hover': {
    backgroundColor: '#0056b3',
  },
};

export default InvoiceDetailsModal;
