import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PouchDB from 'pouchdb';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

const db = new PouchDB('tote_sales');

const Track = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('all');

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
    checkDailySync();
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(orders);
    console.log('Exporting orders to Excel:', orders);
    console.log('ws orders to Excel:', ws);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, `LeuTote_${new Date().toISOString().split('T')[0]}.xlsx`);
  };


  dayjs.extend(customParseFormat);

  const getDaysSinceOrder = (orderDate) => {
    if (!orderDate) return 0;

    // 2. Explicitly tell dayjs the input format
    const order = dayjs(orderDate, "DD/MM/YYYY");
    const today = dayjs().startOf('day');

    // Check if parsing failed
    if (!order.isValid()) {
      console.error("Invalid date format received:", orderDate);
      return 0;
    }

    return today.diff(order.startOf('day'), 'day');
  };

 const filteredOrders = orders.filter(order => {
  // Status filter
  const statusMatch = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
console.log(paymentFilter,'paymentFilter')
  // Payment filter
  // We check for 'all' first, otherwise compare the database value with the filter state
  const paymentMatch = paymentFilter === 'all' || (order.paymentStatus && order.paymentStatus == paymentFilter);

  // Time filter
  let timeMatch = true;
  if (timeFilter === '2days') {
    timeMatch = getDaysSinceOrder(order.date) > 2;
  } else if (timeFilter === '4days') {
    timeMatch = getDaysSinceOrder(order.date) > 4;
  }

  // Only return true if all three conditions are met
  return statusMatch && paymentMatch && timeMatch;
});

  useEffect(() => {
    refreshOrders();

  }, []);


  console.log(orders, 'orders')

  return (
    <main className="animate-in">
      <div style={{ padding: '0 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Recent Sales ({filteredOrders?.length})</h2>
        {/* <button
          onClick={handleExport}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer' }}
        >
          📥 Export Sales
        </button> */}
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
          padding: '12px', // Reduced from 16px
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#666', alignSelf: 'center', width: '60px', fontWeight: 'bold' }}>Status:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`badge ${statusFilter === 'all' ? 'badge-processing' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem' }}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setStatusFilter('processing')}
                className={`badge ${statusFilter === 'processing' ? 'badge-processing' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem' }}
              >
                Processing ({orders.filter(o => o.status === 'Processing').length})
              </button>
              <button
                onClick={() => setStatusFilter('shipped')}
                className={`badge ${statusFilter === 'shipped' ? 'badge-shipped' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem' }}
              >
                Shipped ({orders.filter(o => o.status === 'Shipped').length})
              </button>
              <button
                onClick={() => setStatusFilter('delivered')}
                className={`badge ${statusFilter === 'delivered' ? 'badge-shipped' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem' }}
              >
                Delivered ({orders.filter(o => o.status === 'Delivered').length})
              </button>
            </div>

            {/* Payment Status Filter Buttons */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#666', alignSelf: 'center', width: '60px', fontWeight: 'bold' }}>Payment:</span>
              <button
                onClick={() => setPaymentFilter('all')}
                className={`badge ${paymentFilter === 'all' ? 'badge-processing' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem' }}
              >
                All
              </button>
              <button
                onClick={() => setPaymentFilter('Paid')}
                className={`badge ${paymentFilter === 'Paid' ? 'badge-shipped' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem' }}
              >
                Paid ({orders.filter(o => o.paymentStatus === 'Paid').length})
              </button>
              <button
                onClick={() => setPaymentFilter('Partial')}
                className={`badge ${paymentFilter === 'Partial' ? 'badge-shipped' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem' }}
              >
                Partial ({orders.filter(o => o.paymentStatus === 'Partial').length})
              </button>
              <button
                onClick={() => setPaymentFilter('Pending')}
                className={`badge ${paymentFilter === 'Pending' ? 'badge-shipped' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem' }}
              >
                Pending ({orders.filter(o => o.paymentStatus === 'Pending').length})
              </button>
            </div>

            {/* Time Filter Buttons */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#666', alignSelf: 'center', width: '60px', fontWeight: 'bold' }}>Time:</span>
              <button
                onClick={() => setTimeFilter('all')}
                className={`badge ${timeFilter === 'all' ? 'badge-processing' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem' }}
              >
                All Time
              </button>
              <button
                onClick={() => setTimeFilter('2days')}
                className={`badge ${timeFilter === '2days' ? 'badge-shipped' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem' }}
              >
                &gt;2 Days ({orders.filter(o => getDaysSinceOrder(o.date) > 2).length})
              </button>
              <button
                onClick={() => setTimeFilter('4days')}
                className={`badge ${timeFilter === '4days' ? 'badge-shipped' : 'badge-delivered'}`}
                style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem' }}
              >
                &gt;4 Days ({orders.filter(o => getDaysSinceOrder(o.date) > 4).length})
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          <div style={{ borderTop: '1px solid #eee', marginTop: '12px', paddingTop: '8px', fontSize: '0.75rem', color: '#888' }}>
            <strong>Active:</strong> {statusFilter} • {paymentFilter || 'all'} • {timeFilter}
          </div>
        </div>
      )}

      <div className="" style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '70vh', overflow: 'auto' }}>
        {filteredOrders.map(order => {
          const daysSinceOrder = getDaysSinceOrder(order.date);
          const isOldOrder = daysSinceOrder >= 4 && order.status == 'Processing';

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
                  <p className="customer-name" style={{ color: isOldOrder ? '#856404' : undefined, textTransform: 'capitalize' }}>
                    {order.customerName}
                  </p>
                  <p className="order-meta" style={{ color: isOldOrder ? '#856404' : undefined }}>
                    {order.date} • {order.source} • {daysSinceOrder} days ago
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>

                  {/* Ready to Ship Label */}
                  {order.status === "Completed" && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '0.65rem',
                      color: 'var(--success)', // Or #28a745
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      <span>📦</span> <span>Ready to ship</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: isOldOrder ? '#856404' : undefined }}>₹{order.price}</span>
                <span style={{ fontSize: '0.8rem', color: isOldOrder ? '#856404' : 'var(--success)' }}>
                  Profit: ₹{order.price - order.cost}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
          No orders found for the selected filters.
        </div>
      )}
    </main>
  );
};

export default Track;
