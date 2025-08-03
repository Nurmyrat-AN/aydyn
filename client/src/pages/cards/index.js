// frontend/src/components/CardsPage.js
import React, { useState } from 'react';
import PricePage from './PricePage';
import CustomerPage from './CustomerPage';
import ProductPage from './ProductPage';
import ExtraProductPage from './ExtraProductPage';

/**
 * Главный компонент, объединяющий все страницы управления.
 * Позволяет переключаться между страницами с помощью внутреннего состояния.
 */
function CardsPage() {
  // Состояние для отслеживания активной страницы
  const [activePage, setActivePage] = useState('customers'); // По умолчанию показываем страницу цен

  // Функция для условного рендеринга активной страницы
  const renderActivePage = () => {
    switch (activePage) {
      case 'prices':
        return <PricePage />;
      case 'customers':
        return <CustomerPage />;
      case 'products':
        return <ProductPage />;
      case 'extraproducts':
        return <ExtraProductPage />;
      default:
        return <PricePage />; // Возвращаем страницу цен по умолчанию
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle}>Панель управления данными</h1>

      {/* Навигационные кнопки */}
      <div style={styles.navigation}>
        <button
          onClick={() => setActivePage('customers')}
          style={{ ...styles.navButton, ...(activePage === 'customers' && styles.activeNavButton) }}
        >
          Клиенты
        </button>
        <button
          onClick={() => setActivePage('products')}
          style={{ ...styles.navButton, ...(activePage === 'products' && styles.activeNavButton) }}
        >
          Продукты
        </button>
        <button
          onClick={() => setActivePage('extraproducts')}
          style={{ ...styles.navButton, ...(activePage === 'extraproducts' && styles.activeNavButton) }}
        >
          Доп. Продукты
        </button>
        <button
          onClick={() => setActivePage('prices')}
          style={{ ...styles.navButton, ...(activePage === 'prices' && styles.activeNavButton) }}
        >
          Цены
        </button>
      </div>

      {/* Контейнер для отображения активной страницы */}
      <div style={styles.pageContent}>
        {renderActivePage()}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#eef2f6',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
  mainTitle: {
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: '30px',
    fontSize: '3em',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  navButton: {
    padding: '12px 25px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.1em',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  activeNavButton: {
    backgroundColor: '#007bff',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 10px rgba(0,123,255,0.3)',
  },
  'navButton:hover': {
    backgroundColor: '#5a6268',
    transform: 'translateY(-1px)',
  },
  'activeNavButton:hover': {
    backgroundColor: '#0056b3',
  },
  pageContent: {
    // Стиль для контейнера, в котором будет отображаться активная страница
    // Дочерние страницы уже имеют свои стили maxWidth и margin auto
  },
};

export default CardsPage;
