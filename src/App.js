import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Landing from './landing/Landing';
import Order from './order/Order';
import OrderDetail from './order/OrderDetail';
import Track from './track/Track';

function Navigation() {
  const location = useLocation();
  if (location.pathname === '/' || location.pathname.startsWith('/order/'))
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="nav-bar">
      <Link to="/new-order" style={{ textDecoration: 'none' }}>
        <button className={`nav-item ${location.pathname === '/new-order' ? 'active' : ''}`}>
          <span style={{fontSize: '1.2rem'}}>⊕</span>
          <span>New Order</span>
        </button>
      </Link>
      <Link to="/track" style={{ textDecoration: 'none' }}>
        <button className={`nav-item ${location.pathname === '/track' ? 'active' : ''}`}>
          <span style={{fontSize: '1.2rem'}}>☵</span>
          <span>Track</span>
        </button>
      </Link>
    </nav>
  );
}

function PageWrapper({ children }) {
  return (
    <div className="app-container" style={{paddingBottom: '80px'}}>
      <header className="header">
        <h1>LEU TOTE</h1>
      </header>
      {children}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/new-order" element={<PageWrapper><Order /></PageWrapper>} />
          <Route path="/track" element={<PageWrapper><Track /></PageWrapper>} />
          <Route path="/order/:orderId" element={<PageWrapper><OrderDetail /></PageWrapper>} />
        </Routes>
        <Navigation />
      </div>
    </Router>
  );
}

export default App;
