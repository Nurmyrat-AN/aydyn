import './App.css';
import React from 'react';
import CreateInvoice from './pages/invoice';
import CardsPage from './pages/cards/index';
import ProductDetailedSalesReports from './pages/reports/products/ProductDetailedSalesReports';
import CustomerSalesReports from './pages/reports/customers/CustomerSalesReports';
import ExtraProductSalesReports from './pages/reports/extraProducts/ExtraProductSalesReports';
import InvoiceReports from './pages/reports/invoice/InvoiceReports';
import InvoiceDetails from './pages/reports/invoice/InvoiceDetails';
import ReportsPage from './pages/reports/ReportsPage';



function App() {
  const [activePage, setActivePage] = React.useState(0);

  const pages = [
    {
      page: <CreateInvoice />,
      btns: <div style={styles.navigatorBtn} >
        <button onClick={() => setActivePage(1)} >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '5px' }}>
            <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
          </svg>
          Карточки
        </button>
        {/* <br /> */}
        <button onClick={() => setActivePage(2)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '5px' }}>
            <path d="M16 11V7h4v4h-4zm0 4v4h4v-4h-4zm-6 0v4h4v-4h-4zm0-4v4h4V7h-4zM4 20h4V4H4v16z" />
          </svg>
          Отчеты
        </button>
      </div>
    }, {
      page: <CardsPage />,
      btns: <div key={0} style={styles.navigatorBtn}>
        <button onClick={() => setActivePage(0)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '5px' }}>
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Домой
        </button>
        <button onClick={() => setActivePage(2)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '5px' }}>
            <path d="M16 11V7h4v4h-4zm0 4v4h4v-4h-4zm-6 0v4h4v-4h-4zm0-4v4h4V7h-4zM4 20h4V4H4v16z" />
          </svg>
          Отчеты
        </button>
      </div>
    }, {
      page: <ReportsPage />,
      btns: <div key={0} style={styles.navigatorBtn}>
        <button onClick={() => setActivePage(0)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '5px' }}>
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Домой
        </button>
        <button onClick={() => setActivePage(1)} >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '5px' }}>
            <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
          </svg>
          Карточки
        </button>
      </div>
    }
  ]
  return (
    <div className="App">
      {pages[activePage].btns}
      {pages[activePage].page}
    </div>
  );
}

export default App;


const styles = {
  navigatorBtn: { position: 'fixed', left: 10, bottom: 10, display: 'flex', flexDirection: 'row' }
}