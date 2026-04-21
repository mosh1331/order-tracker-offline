import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PouchDB from 'pouchdb';
import { bagOptions, pouchOptions } from '../helper/Data';

const db = new PouchDB('tote_sales');
const defaultForm = {
  customerName: '',
  phoneNumber: '',
  deliveryAddress: '',
  price: '',
  baseCost: '',
  delivery_charge: 70,
  status: 'Processing',
  source: 'Instagram',
  orderType: 'Bag',
  selectedElements: [],
  notes: ''
};

// Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const Order = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [isListening, setIsListening] = useState(false);

  const elementOptions = form.orderType === 'Bag' ? bagOptions : pouchOptions;
  const selectedElementsCost = form.selectedElements.reduce((sum, key) => {
    const option = elementOptions.find(item => item.key === key);
    return sum + (option?.price || 0);
  }, 0);
  const totalCost = (parseFloat(form.baseCost) || 0) + selectedElementsCost + (parseFloat(form.delivery_charge) || 0);

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
    if (costMatch) updatedForm.baseCost = costMatch[1];
    if (phoneMatch) updatedForm.phoneNumber = phoneMatch[1];
    if (statusMatch) updatedForm.status = statusMatch[0].charAt(0).toUpperCase() + statusMatch[0].slice(1);

    setForm(updatedForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const newOrder = {
      ...form,
      baseCost: parseFloat(form.baseCost) || 0,
      cost: totalCost,
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
            <label className="input-label">Base Cost (₹)</label>
            <input type="number" value={form.baseCost} onChange={e => setForm({...form, baseCost: e.target.value})} required />
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Total Cost (₹)</label>
          <input type="number" value={totalCost} readOnly style={{ backgroundColor: '#f8f9fa' }} />
        </div>

      <div className="input-group">
        <label className="input-label">Order Type</label>
        <select
          value={form.orderType}
          onChange={e => setForm({ ...form, orderType: e.target.value, selectedElements: [] })}
        >
          <option value="Bag">Bag</option>
          <option value="Pouch">Pouch</option>
        </select>
      </div>

      <div className="input-group">
        <label className="input-label">Order Elements</label>
        <select
          multiple
          value={form.selectedElements}
          onChange={e => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            setForm({ ...form, selectedElements: selected });
          }}
          style={{ width: '100%', minHeight: '140px', borderRadius: '10px', padding: '10px' }}
        >
          {elementOptions.map(option => (
            <option key={option.key} value={option.key}>
              {option.label} ({option.price ? `₹${option.price}` : 'No price'})
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {form.selectedElements.length > 0 ? (
            form.selectedElements.map(key => {
              const option = elementOptions.find(item => item.key === key);
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '999px', background: '#eef2ff' }}>
                  <span style={{ fontSize: '0.95rem' }}>{option?.label || key}</span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, selectedElements: form.selectedElements.filter(item => item !== key) })}
                    style={{ border: 'none', background: 'transparent', color: '#333', cursor: 'pointer', fontSize: '1rem' }}
                  >
                    ×
                  </button>
                </div>
              );
            })
          ) : (
            <p style={{ margin: 0, color: '#666' }}>No elements selected yet.</p>
          )}
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Delivery Charge (₹)</label>
        <input type="number" value={form.delivery_charge} onChange={e => setForm({...form, delivery_charge: e.target.value})} />
      </div>

      <div className="input-group">
        <label className="input-label">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setForm({...form, notes: e.target.value})}
          placeholder="Add any additional notes..."
          style={{ minHeight: '80px', fontFamily: 'inherit' }}
        />
      </div>

        <button type="submit" className="btn-primary">Save Order</button>
      </form>
    </main>
  );
};

export default Order;