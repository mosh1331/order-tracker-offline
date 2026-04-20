import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PouchDB from 'pouchdb';

const db = new PouchDB('tote_sales');
const defaultForm = {
  customerName: '',
  phoneNumber: '',
  deliveryAddress: '',
  price: '',
  cost: '',
  delivery_charge: 70,
  status: 'Processing',
  source: 'Instagram'
};

// Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const Order = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if (!recognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
    setIsListening(true);
    recognition.start();
  };

  if (recognition) {
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setIsListening(false);
      parseVoiceCommand(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  }

  // Simple Parsing Logic
  const parseVoiceCommand = (text) => {
    const updatedForm = { ...form };

    // Regex patterns for better matching
    const nameMatch = text.match(/name (?:is )?([a-z\s]+)(?= price| cost| phone| status|$)/);
    const priceMatch = text.match(/price (?:is )?(\d+)/);
    const costMatch = text.match(/cost (?:is )?(\d+)/);
    const phoneMatch = text.match(/phone (?:is )?(\d+)/);
    const statusMatch = text.match(/(processing|shipped|delivered)/);

    if (nameMatch) updatedForm.customerName = nameMatch[1].trim();
    if (priceMatch) updatedForm.price = priceMatch[1];
    if (costMatch) updatedForm.cost = costMatch[1];
    if (phoneMatch) updatedForm.phoneNumber = phoneMatch[1];
    if (statusMatch) updatedForm.status = statusMatch[0].charAt(0).toUpperCase() + statusMatch[0].slice(1);

    setForm(updatedForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const newOrder = {
      ...form,
      _id: `order_${Date.now()}`,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString()
    };
    await db.put(newOrder);
    setForm(defaultForm);
    navigate('/track');
  };

  console.log(form,'form.delivery_charge')

  return (
    <main className="card animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Create Order</h2>
        <button 
          type="button" 
          onClick={startListening}
          className={`voice-btn ${isListening ? 'listening' : ''}`}
          style={{
            background: isListening ? '#ef4444' : '#4f46e5',
            color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer'
          }}
        >
          {isListening ? '...' : '🎙️'}
        </button>
      </div>

      {isListening && <p className="voice-hint">Say: "Name [X] price [Y] cost [Z]"</p>}

      <form onSubmit={handleSave}>
        <div className="input-group">
          <label className="input-label">Customer Name</label>
          <input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} required />
        </div>

        {/* <div className="input-group">
          <label className="input-label">Phone Number</label>
          <input type="tel" value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})}  />
        </div>

        <div className="input-group">
          <label className="input-label">Delivery Address</label>
          <textarea value={form.deliveryAddress} onChange={e => setForm({...form, deliveryAddress: e.target.value})}  style={{minHeight: '80px', fontFamily: 'inherit'}} />
        </div> */}

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
          <label className="input-label">Delivery Charge (₹)</label>
          <input type="number" value={form.delivery_charge} onChange={e => setForm({...form, delivery_charge: e.target.value})} />
        </div>

        {/* <div className="input-group">
          <label className="input-label">Status</label>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div> */}

        <button type="submit" className="btn-primary">Save Order</button>
      </form>
    </main>
  );
};

export default Order;