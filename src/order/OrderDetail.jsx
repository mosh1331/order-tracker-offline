import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PouchDB from 'pouchdb';
import { bagOptions, pouchOptions } from '../helper/Data';

const db = new PouchDB('tote_sales');

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [confirmDelete, setConfirmDelete] = useState(false);
    const elementOptions = (editForm.orderType || 'Bag') === 'Bag' ? bagOptions : pouchOptions;
    const selectedElementsCost = (editForm.selectedElements || []).reduce((sum, key) => {
        const option = elementOptions.find(item => item.key === key);
        return sum + (option?.price || 0);
    }, 0);
    const totalCost = (parseFloat(editForm.baseCost) || 0) + selectedElementsCost;

    const loadOrder = async () => {
        try {
            const doc = await db.get(orderId);
            const loadedDoc = {
                ...doc,
                baseCost: doc.baseCost != null ? doc.baseCost : doc.cost || ''
            };
            setOrder(loadedDoc);
            setEditForm(loadedDoc);
        } catch (e) {
            console.error('Order not found');
        }
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        try {
            await db.put({
                ...editForm,
                cost: totalCost,
                _rev: order._rev
            });
            setOrder({ ...editForm, cost: totalCost });
            setIsEditing(false);
        } catch (e) {
            console.error('Error saving order', e);
        }
    };

    const handleDelete = async () => {
        try {
            await db.remove(order);
            navigate('/track');
        } catch (e) {
            console.error('Error deleting order', e);
        }
    };

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    

    if (!order) {
        return (
            <main className="card animate-in">
                <p>Loading order details...</p>
            </main>
        );
    }

    return (
        <main className="card animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ marginTop: 0 }}>Order Details</h2>
                <button onClick={() => navigate('/track')} className="nav-item" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            {isEditing ? (
                <form onSubmit={handleSaveChanges}>
                    <div className="input-group">
                        <label className="input-label">Customer Name</label>
                        <input value={editForm.customerName} disabled style={{ backgroundColor: '#f0f0f0' }} />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Phone Number</label>
                        <input type="tel" value={editForm.phoneNumber || ''} onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })} />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Delivery Address</label>
                        <textarea value={editForm.deliveryAddress || ''} onChange={e => setEditForm({ ...editForm, deliveryAddress: e.target.value })} style={{ minHeight: '80px', fontFamily: 'inherit' }} />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Notes</label>
                        <textarea
                            value={editForm.notes || ''}
                            onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                            placeholder="Add any additional notes..."
                            style={{ minHeight: '80px', fontFamily: 'inherit' }}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Order Type</label>
                        <select value={editForm.orderType || 'Bag'} onChange={e => setEditForm({ ...editForm, orderType: e.target.value, selectedElements: [] })}>
                            <option value="Bag">Bag</option>
                            <option value="Pouch">Pouch</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Base Cost (₹)</label>
                        <input
                            type="number"
                            value={editForm.baseCost || ''}
                            onChange={e => setEditForm({ ...editForm, baseCost: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Order Elements</label>
                        <select
                            multiple
                            value={editForm.selectedElements || []}
                            onChange={e => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                setEditForm({ ...editForm, selectedElements: selected });
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
                            {(editForm.selectedElements || []).length > 0 ? (
                                (editForm.selectedElements || []).map(key => {
                                    const option = elementOptions.find(item => item.key === key);
                                    return (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '999px', background: '#eef2ff' }}>
                                            <span style={{ fontSize: '0.95rem' }}>{option?.label || key}</span>
                                            <button
                                                type="button"
                                                onClick={() => setEditForm({ ...editForm, selectedElements: (editForm.selectedElements || []).filter(item => item !== key) })}
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
                        <label className="input-label">Total Cost (₹)</label>
                        <input type="number" value={totalCost} readOnly style={{ backgroundColor: '#f8f9fa' }} />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Status</label>
                        <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Changes</button>
                        <button type="button" onClick={() => { setIsEditing(false); setEditForm(order); }} className="btn-primary" style={{ flex: 1, background: '#999' }}>Cancel</button>
                    </div>
                </form>
            ) : (
                <>
                    <div className="order-details">
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4px' }}>Customer Name</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{order.customerName}</p>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4px' }}>Phone Number</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{order.phoneNumber || 'Not provided'}</p>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4px' }}>Delivery Address</p>
                            <p style={{ fontSize: '1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{order.deliveryAddress || 'Not provided'}</p>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4px' }}>Notes</p>
                            <p style={{ fontSize: '1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{order.notes || 'No notes'}</p>
                        </div>

                        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4px' }}>Price</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333' }}>₹{order.price}</p>
                            </div>
                            <div>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4px' }}>Cost</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333' }}>₹{order.cost}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4px' }}>Profit</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--success)' }}>₹{order.price - order.cost}</p>
                            </div>
                            <div>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4px' }}>Status</p>
                                <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4px' }}>Order Type</p>
                                <p style={{ fontSize: '1rem' }}>{order.orderType || 'Bag'}</p>
                            </div>
                            <div>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4px' }}>Source</p>
                                <p style={{ fontSize: '1rem' }}>{order.source}</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '8px' }}>Selected Elements</p>
                            {order.selectedElements && order.selectedElements.length > 0 ? (
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    {(order.selectedElements || []).map(key => {
                                        const option = (order.orderType === 'Bag' ? bagOptions : pouchOptions).find(item => item.key === key);
                                        return (
                                            <div key={key} style={{ padding: '12px', borderRadius: '12px', background: '#f7f7f7' }}>
                                                <strong>{option?.label || key}</strong>
                                                {option?.price != null && (
                                                    <span style={{ float: 'right', color: '#555' }}>₹{option.price}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p style={{ color: '#666', margin: 0 }}>No elements selected.</p>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4px' }}>Date</p>
                                <p style={{ fontSize: '1rem' }}>{order.date}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button onClick={() => setIsEditing(true)} className="btn-primary" style={{ flex: 1 }}>Edit</button>
                            <button onClick={() => setConfirmDelete(true)} className="btn-primary" style={{ flex: 1, background: '#dc3545' }}>Delete</button>
                        </div>
                    </div>

                    {confirmDelete && (
                        <div style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            zIndex: 50
                        }}>
                            <div style={{
                                width: '100%',
                                maxWidth: '420px',
                                background: '#fff',
                                borderRadius: '16px',
                                boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                                padding: '24px',
                                textAlign: 'center'
                            }}>
                                <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem' }}>Confirm Delete</h3>
                                <p style={{ color: '#555', marginBottom: '24px' }}>
                                    Are you sure you want to remove this order? This action cannot be undone.
                                </p>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDelete(false)}
                                        className="btn-primary"
                                        style={{ flex: 1, background: '#999' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await handleDelete();
                                            setConfirmDelete(false);
                                        }}
                                        className="btn-primary"
                                        style={{ flex: 1, background: '#dc3545' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </main>
    );
};

export default OrderDetail;
