import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PouchDB from 'pouchdb';
import * as XLSX from 'xlsx';

const db = new PouchDB('tote_sales');

const Track = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  const checkDailySync = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const meta = await db.get('app_metadata').catch(() => ({ _id: 'app_metadata', lastSync: '' }));
      if (meta.lastSync !== today) {
        handleExport(); // Trigger auto-download
        meta.lastSync = today;
        await db.put(meta);
      }
    } catch (e) { }
  };



  const refreshOrders = async () => {
    const result = await db.allDocs({ include_docs: true });
    const docs = result.rows
      .filter(r => r.doc._id.startsWith('order_'))
      .map(r => r.doc)
      .sort((a, b) => b.timestamp - a.timestamp);
    setOrders(docs);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(orders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, `LeuTote_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  useEffect(() => {
    refreshOrders();
    checkDailySync();
  }, []);


  return (
    <main className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px', alignItems: 'center' }}>
        <h2>Recent Sales</h2>
        <button onClick={handleExport} className="badge badge-shipped" style={{ border: 'none', cursor: 'pointer' }}>Export Excel</button>
      </div>
      {orders.map(order => (
        <div key={order._id} className="order-card" onClick={() => navigate(`/order/${order._id}`)} style={{ cursor: 'pointer' }}>
          <div className="order-header">
            <div>
              <p className="customer-name">{order.customerName}</p>
              <p className="order-meta">{order.date} • {order.source}</p>
            </div>
            <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>₹{order.price}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Profit: ₹{order.price - order.cost}</span>
          </div>
        </div>
      ))}
    </main>
  );
};

export default Track;
