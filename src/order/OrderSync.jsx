import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import PouchDB from 'pouchdb';

const db = new PouchDB('tote_sales');
console.log(process.env,'siu')
// Replace these strings with your exact keys from Project Settings > API
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL; // The safe public URL!
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY; // The safe public key!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const OrderSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  const syncToSupabase = async () => {
    setSyncing(true);
    setSyncStatus('Reading local PouchDB cache...');

    try {
      // 1. Fetch data snapshot from local tablet storage
      const result = await db.allDocs({ include_docs: true });
      const localOrders = result.rows
        .filter(r => r.doc._id && !r.doc._id.startsWith('_design'))
        .map(r => r.doc);

      if (localOrders.length === 0) {
        setSyncStatus('No local records found to sync.');
        setSyncing(false);
        return;
      }

      setSyncStatus(`Uploading ${localOrders.length} records to Supabase Cloud...`);

      // 2. Format local PouchDB data to match the SQL database schema columns
      const formattedRows = localOrders.map(order => ({
        id: order._id, // Maps local id to primary key
        customer_name: order.customerName,
        phone_number: order.phoneNumber,
        delivery_address: order.deliveryAddress,
        price: parseFloat(order.price) || 0,
        base_cost: parseFloat(order.baseCost) || 0,
        delivery_charge: parseFloat(order.delivery_charge) || 0,
        cost: parseFloat(order.cost) || 0,
        status: order.status,
        source: order.source,
        order_type: order.orderType,
        selected_elements: order.selectedElements || [],
        notes: order.notes,
        payment_status: order.paymentStatus || 'Pending',
        order_date: order.date // Preserves DD/MM/YYYY
      }));

      // 3. Fire a single batch UPSERT request
      // This inserts new records and automatically overwrites existing ones if IDs match
      const { error } = await supabase
        .from('orders')
        .upsert(formattedRows, { onConflict: 'id' });

      if (error) throw error;

      setSyncStatus('✅ Cloud Sync Successful! Data is backed up.');
    } catch (err) {
      console.error('Supabase Sync error:', err);
      setSyncStatus('❌ Sync aborted. Review browser developer tools.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      <button
        onClick={syncToSupabase}
        disabled={syncing}
        className="btn-primary"
        style={{
          padding: '10px 20px',
          fontSize: '0.85rem',
          backgroundColor: syncing ? '#e2e8f0' : '#3c366b',
          color: syncing ? '#a0aec0' : 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: syncing ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(60, 54, 107, 0.15)'
        }}
      >
        {syncing ? '🔄 Processing Sync...' : '⚡ Sync to Supabase Cloud'}
      </button>
      {syncStatus && (
        <p style={{ fontSize: '0.8rem', color: '#4a5568', marginTop: '8px' }}>
          {syncStatus}
        </p>
      )}
    </div>
  );
};

export default OrderSync;