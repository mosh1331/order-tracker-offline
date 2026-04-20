import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PouchDB from 'pouchdb';
import * as XLSX from 'xlsx';

const db = new PouchDB('tote_sales');

const Track = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

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

  const getDaysSinceOrder = (orderDate) => {
    const orderDateObj = new Date(orderDate);
    const today = new Date();
    const diffTime = today - orderDateObj;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredOrders = orders.filter(order => {
    // Status filter
    const statusMatch = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();

    // Time filter
    let timeMatch = true;
    if (timeFilter === '2days') {
      timeMatch = getDaysSinceOrder(order.date) > 2;
    } else if (timeFilter === '4days') {
      timeMatch = getDaysSinceOrder(order.date) > 4;
    }

    return statusMatch && timeMatch;
  });

  useEffect(() => {
    refreshOrders();
    checkDailySync();
  }, []);

  return (
    <main className="animate-in">
      <div style={{ padding: '0 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Recent Sales</h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="badge badge-processing"
          style={{ border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '0.9rem' }}
        >
          Filters {showFilters ? '▼' : '▶'}
        </button>
      </div>

      {/* Filters Popover */}
      {showFilters && (
        <div style={{ 
          position: 'relative', 
          margin: '0 20px 20px 20px', 
          background: 'white', 
          border: '1px solid #eee', 
          borderRadius: '8px', 
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 10
        }}>
          {/* Status Filter Buttons */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: '#666', alignSelf: 'center', marginRight: '8px', fontWeight: 'bold' }}>Status:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`badge ${statusFilter === 'all' ? 'badge-processing' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: '0.9rem' }}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setStatusFilter('processing')}
                className={`badge ${statusFilter === 'processing' ? 'badge-processing' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: '0.9rem' }}
              >
                Processing ({orders.filter(o => o.status === 'Processing').length})
              </button>
              <button
                onClick={() => setStatusFilter('shipped')}
                className={`badge ${statusFilter === 'shipped' ? 'badge-shipped' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: '0.9rem' }}
              >
                Shipped ({orders.filter(o => o.status === 'Shipped').length})
              </button>
              <button
                onClick={() => setStatusFilter('delivered')}
                className={`badge ${statusFilter === 'delivered' ? 'badge-shipped' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: '0.9rem' }}
              >
                Delivered ({orders.filter(o => o.status === 'Delivered').length})
              </button>
            </div>

            {/* Time Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', color: '#666', alignSelf: 'center', marginRight: '8px', fontWeight: 'bold' }}>Time:</span>
              <button
                onClick={() => setTimeFilter('all')}
                className={`badge ${timeFilter === 'all' ? 'badge-processing' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: '0.9rem' }}
              >
                All Time
              </button>
              <button
                onClick={() => setTimeFilter('2days')}
                className={`badge ${timeFilter === '2days' ? 'badge-shipped' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: '0.9rem' }}
              >
                >2 Days ({orders.filter(o => getDaysSinceOrder(o.date) > 2).length})
              </button>
              <button
                onClick={() => setTimeFilter('4days')}
                className={`badge ${timeFilter === '4days' ? 'badge-shipped' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', fontSize: '0.9rem' }}
              >
                >4 Days ({orders.filter(o => getDaysSinceOrder(o.date) > 4).length})
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: '12px', fontSize: '0.85rem', color: '#666' }}>
            Active: {statusFilter === 'all' ? 'All Statuses' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} | {timeFilter === 'all' ? 'All Time' : timeFilter === '2days' ? '>2 Days' : '>4 Days'}
          </div>
        </div>
      )}

      {filteredOrders.map(order => {
        const daysSinceOrder = getDaysSinceOrder(order.date);
        const isOldOrder = daysSinceOrder >= 2 && order.status == 'Processing';
        
        return (
          <div 
            key={order._id} 
            className="order-card" 
            onClick={() => navigate(`/order/${order._id}`)} 
            style={{ 
              cursor: 'pointer',
              backgroundColor: isOldOrder ? '#fff3cd' : undefined,
              border: isOldOrder ? '1px solid #ffc107' : undefined,
              position: 'relative'
            }}
          >
            {isOldOrder && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                zIndex: 1
              }}>
                ⚠️ {daysSinceOrder}d
              </div>
            )}
            <div className="order-header">
              <div>
                <p className="customer-name" style={{ color: isOldOrder ? '#856404' : undefined }}>
                  {order.customerName}
                </p>
                <p className="order-meta" style={{ color: isOldOrder ? '#856404' : undefined }}>
                  {order.date} • {order.source} • {daysSinceOrder} days ago
                </p>
              </div>
              <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: isOldOrder ? '#856404' : undefined }}>₹{order.price}</span>
              <span style={{ fontSize: '0.8rem', color: isOldOrder ? '#856404' : 'var(--success)' }}>Profit: ₹{order.price - order.cost}</span>
            </div>
          </div>
        );
      })}

      {filteredOrders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
          No orders found for the selected filters.
        </div>
      )}
    </main>
  );
};

export default Track;
