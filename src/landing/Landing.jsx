import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="app-container">
      <header className="header">
        <h1>LEU TOTE</h1>
      </header>
      
      <main className="card animate-in" style={{ textAlign: 'center', marginTop: '60px' }}>
        <h2>Welcome to Order Tracker</h2>
        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '40px' }}>
          Manage your orders, track sales, and export data with ease.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link to="/new-order" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ width: '100%', padding: '12px 24px', fontSize: '1rem', cursor: 'pointer' }}>
              ⊕ Create New Order
            </button>
          </Link>
          
          <Link to="/track" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ width: '100%', padding: '12px 24px', fontSize: '1rem', cursor: 'pointer' }}>
              ☵ Track Orders
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Landing;
