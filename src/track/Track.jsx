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
                backgroundColor: isOldOrder ? '#fff9e6' : '#fff', // Slightly softer yellow
                border: isOldOrder ? '1px solid #ffeeba' : '1px solid #edf2f7',
                position: 'relative',
                padding: '16px',
                borderRadius: '12px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
              }}
            >
              {isOldOrder && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)',
                  zIndex: 1
                }}>
                  DELAYED {daysSinceOrder}d
                </div>
              )}

              <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <p className="customer-name" style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: isOldOrder ? '#856404' : '#2d3748',
                    textTransform: 'capitalize'
                  }}>
                    {order.customerName}
                  </p>
                  <p className="order-meta" style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.8rem',
                    color: isOldOrder ? '#997404' : '#718096'
                  }}>
                    {order.date} • {order.source} • {daysSinceOrder} days ago
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  {/* Primary Status Badge */}
                  <span className={`badge badge-${order.status.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                    {order.status}
                  </span>

                  {/* Payment Status Chip - The Beautiful Part */}
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    backgroundColor:
                      order.paymentStatus === 'Paid' ? '#e6fffa' :
                        order.paymentStatus === 'Partial' ? '#fffaf0' : '#fff5f5',
                    color:
                      order.paymentStatus === 'Paid' ? '#2c7a7b' :
                        order.paymentStatus === 'Partial' ? '#b7791f' : '#e53e3e',
                    border: `1px solid ${order.paymentStatus === 'Paid' ? '#b2f5ea' :
                        order.paymentStatus === 'Partial' ? '#fbe3a1' : '#feb2b2'
                      }`
                  }}>
                    ₹{order.paymentStatus || 'Pending'}
                  </span>
                </div>
              </div>

              {/* Ready to Ship indicator positioned more subtly */}
              {order.status === "Completed" && (
                <div style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.7rem',
                  color: '#38a169',
                  fontWeight: '600'
                }}>
                  <span role="img" aria-label="package">📦</span> Ready to ship
                </div>
              )}

              <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #f7fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.7rem', color: '#a0aec0', textTransform: 'uppercase', fontWeight: 'bold' }}>Revenue</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isOldOrder ? '#856404' : '#1a202c' }}>₹{order.price}</span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: isOldOrder ? '#856404' : '#38a169',
                    backgroundColor: isOldOrder ? 'transparent' : '#f0fff4',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    Profit: ₹{order.price - order.cost}
                  </span>
                </div>
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
