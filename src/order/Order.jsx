import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PouchDB from 'pouchdb';

const db = new PouchDB('tote_sales');
const defaultForm = {
  customerName: '',
  phoneNumber: '',
  deliveryAddress: '',
  price: '',
  cost: '',
  delivery_charge: '',
  status: 'Processing',
  source: 'Instagram'
};

const Order = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);

  const handleSave = async (e) => {
    e.preventDefault();
    const newOrder = {
      ...form,
      _id: `order_${Date.now()}`,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString()
    };
    console.log('Saving order', newOrder);
    await db.put(newOrder);
    setForm(defaultForm);
    navigate('/track');
  };

  return (
    <main className="card animate-in">
      <h2 style={{marginTop: 0}}>Create Order</h2>
      <form onSubmit={handleSave}>
        <div className="input-group">
          <label className="input-label">Customer Name</label>
          <input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} required />
        </div>

        <div className="input-group">
          <label className="input-label">Phone Number</label>
          <input type="tel" value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})}  />
        </div>

        <div className="input-group">
          <label className="input-label">Delivery Address</label>
          <textarea value={form.deliveryAddress} onChange={e => setForm({...form, deliveryAddress: e.target.value})}  style={{minHeight: '80px', fontFamily: 'inherit'}} />
        </div>

        <div style={{display: 'flex', gap: '12px'}}>
          <div className="input-group" style={{flex: 1}}>
            <label className="input-label">Price (₹)</label>
            <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
          </div>
          <div className="input-group" style={{flex: 1}}>
            <label className="input-label">Cost (₹)</label>
            <input type="number" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} required />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Status</label>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <button type="submit" className="btn-primary">Save Order</button>
      </form>
    </main>
  );
};

export default Order;