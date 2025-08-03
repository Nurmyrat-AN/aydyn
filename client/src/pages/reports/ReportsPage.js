// frontend/src/components/ReportsPage.js
import React, { useState } from 'react';
import InvoiceReports from './invoice/InvoiceReports';
import CustomerSalesReports from './customers/CustomerSalesReports';
import ExtraProductSalesReports from './extraProducts/ExtraProductSalesReports';
import ProductDetailedSalesReports from './products/ProductDetailedSalesReports';

/**
 * Главный компонент для страницы отчетов.
 * Позволяет переключаться между различными типами отчетов (счета, продажи продуктов, продажи клиентов, продажи доп. продуктов).
 */
function ReportsPage() {
  // Состояние для отслеживания активного отчета на этой странице
  const [activeReportPage, setActiveReportPage] = useState('invoiceReports'); // По умолчанию показываем отчеты по счетам

  // Функция для условного рендеринга активного отчета
  const renderActiveReport = () => {
    switch (activeReportPage) {
      case 'invoiceReports':
        return <InvoiceReports />;
      case 'productSalesReports':
        return <ProductDetailedSalesReports />; // Используем ProductIndividualSales для детальных отчетов по продуктам
      case 'customerSalesReports':
        return <CustomerSalesReports />;
      case 'extraProductSalesReports':
        return <ExtraProductSalesReports />;
      default:
        return <InvoiceReports />; // Возвращаем отчеты по счетам по умолчанию
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle}>Отчеты</h1>

      {/* Навигационные кнопки для отчетов */}
      <div style={styles.navigation}>
        <button
          onClick={() => setActiveReportPage('invoiceReports')}
          style={{ ...styles.navButton, ...(activeReportPage === 'invoiceReports' && styles.activeNavButton) }}
        >
          Отчеты по счетам
        </button>
        <button
          onClick={() => setActiveReportPage('productSalesReports')}
          style={{ ...styles.navButton, ...(activeReportPage === 'productSalesReports' && styles.activeNavButton) }}
        >
          Отчеты по продажам продуктов
        </button>
        <button
          onClick={() => setActiveReportPage('customerSalesReports')}
          style={{ ...styles.navButton, ...(activeReportPage === 'customerSalesReports' && styles.activeNavButton) }}
        >
          Отчеты по продажам клиентов
        </button>
        <button
          onClick={() => setActiveReportPage('extraProductSalesReports')}
          style={{ ...styles.navButton, ...(activeReportPage === 'extraProductSalesReports' && styles.activeNavButton) }}
        >
          Отчеты по продажам доп. продуктов
        </button>
      </div>

      {/* Контейнер для отображения активного отчета */}
      <div style={styles.reportContent}>
        {renderActiveReport()}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1500px', // Увеличиваем максимальную ширину для отчетов
    margin: '20px auto',
    backgroundColor: '#f8f8f8',
    borderRadius: '10px',
    boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
  },
  mainTitle: {
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: '30px',
    fontSize: '2.8em', // Немного меньше, чем на CardsPage
    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '30px',
    flexWrap: 'wrap',
    borderBottom: '1px solid #eee',
    paddingBottom: '15px',
  },
  navButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  activeNavButton: {
    backgroundColor: '#007bff', // Синий для активной кнопки
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0,123,255,0.3)',
  },
  'navButton:hover': {
    backgroundColor: '#5a6268',
    transform: 'translateY(-1px)',
  },
  'activeNavButton:hover': {
    backgroundColor: '#0056b3',
  },
  reportContent: {
    // Контейнер для отображения активного отчета
  },
};

export default ReportsPage;
