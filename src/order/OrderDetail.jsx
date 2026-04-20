import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PouchDB from 'pouchdb';

const db = new PouchDB('tote_sales');

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const doc = await db.get(orderId);
      setOrder(doc);
      setEditForm(doc);
    } catch (e) {
      console.error('Order not found');
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    try {
      await db.put({
        ...editForm,
        _rev: order._rev
      });
      setOrder(editForm);
      setIsEditing(false);
    } catch (e) {
      console.error('Error saving order', e);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await db.remove(order);
        navigate('/track');
      } catch (e) {
        console.error('Error deleting order', e);
      }
    }
  };

  if (!order) {
    return (
      <main className="card animate-in">
        <p>Loading order details...</p>
      </main>
    );
  }

  return (
    <main className="card animate-in">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h2 style={{marginTop: 0}}>Order Details</h2>
        <button onClick={() => navigate('/track')} className="nav-item" style={{background: 'none', border: 'none', cursor: 'pointer'}}>✕</button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSaveChanges}>
          <div className="input-group">
            <label className="input-label">Customer Name</label>
            <input value={editForm.customerName} disabled style={{backgroundColor: '#f0f0f0'}} />
          </div>

          <div className="input-group">
            <label className="input-label">Phone Number</label>
            <input type="tel" value={editForm.phoneNumber || ''} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} />
          </div>

          <div className="input-group">
            <label className="input-label">Delivery Address</label>
            <textarea value={editForm.deliveryAddress || ''} onChange={e => setEditForm({...editForm, deliveryAddress: e.target.value})} style={{minHeight: '80px', fontFamily: 'inherit'}} />
          </div>

          <div className="input-group">
            <label className="input-label">Status</label>
            <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
            <button type="submit" className="btn-primary" style={{flex: 1}}>Save Changes</button>
            <button type="button" onClick={() => {setIsEditing(false); setEditForm(order);}} className="btn-primary" style={{flex: 1, background: '#999'}}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <div className="order-details">
            <div style={{marginBottom: '20px'}}>
              <p style={{color: '#666', fontSize: '0.9rem', marginBottom: '4px'}}>Customer Name</p>
              <p style={{fontSize: '1.1rem', fontWeight: 600}}>{order.customerName}</p>
            </div>

            <div style={{marginBottom: '20px'}}>
              <p style={{color: '#666', fontSize: '0.9rem', marginBottom: '4px'}}>Phone Number</p>
              <p style={{fontSize: '1.1rem', fontWeight: 600}}>{order.phoneNumber || 'Not provided'}</p>
            </div>

            <div style={{marginBottom: '20px'}}>
              <p style={{color: '#666', fontSize: '0.9rem', marginBottom: '4px'}}>Delivery Address</p>
              <p style={{fontSize: '1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>{order.deliveryAddress || 'Not provided'}</p>
            </div>

            <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid #eee'}} />

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
              <div>
                <p style={{color: '#666', fontSize: '0.9rem', marginBottom: '4px'}}>Price</p>
                <p style={{fontSize: '1.2rem', fontWeight: 700, color: '#333'}}>₹{order.price}</p>
              </div>
              <div>
                <p style={{color: '#666', fontSize: '0.9rem', marginBottom: '4px'}}>Cost</p>
                <p style={{fontSize: '1.2rem', fontWeight: 700, color: '#333'}}>₹{order.cost}</p>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
              <div>
                <p style={{color: '#666', fontSize: '0.9rem', marginBottom: '4px'}}>Profit</p>
                <p style={{fontSize: '1.1rem', fontWeight: 600, color: 'var(--success)'}}>₹{order.price - order.cost}</p>
              </div>
              <div>
                <p style={{color: '#666', fontSize: '0.9rem', marginBottom: '4px'}}>Status</p>
                <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
              <div>
                <p style={{color: '#666', fontSize: '0.9rem', marginBottom: '4px'}}>Source</p>
                <p style={{fontSize: '1rem'}}>{order.source}</p>
              </div>
              <div>
                <p style={{color: '#666', fontSize: '0.9rem', marginBottom: '4px'}}>Date</p>
                <p style={{fontSize: '1rem'}}>{order.date}</p>
              </div>
            </div>

            <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
              <button onClick={() => setIsEditing(true)} className="btn-primary" style={{flex: 1}}>Edit</button>
              <button onClick={handleDelete} className="btn-primary" style={{flex: 1, background: '#dc3545'}}>Delete</button>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default OrderDetail;
