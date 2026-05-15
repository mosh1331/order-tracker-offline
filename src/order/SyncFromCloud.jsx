import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import PouchDB from 'pouchdb';

const db = new PouchDB('tote_sales');

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL; // The safe public URL!
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY; // The safe public key!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SyncFromCloud = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  const pullFromSupabase = async () => {
    setSyncing(true);
    setSyncStatus('Fetching data from Supabase cloud...');

    try {
      // 1. Download all rows from your Supabase table
      const { data: cloudOrders, error } = await supabase
        .from('orders')
        .select('*');

      if (error) throw error;

      if (!cloudOrders || cloudOrders.length === 0) {
        setSyncStatus('No data found on the cloud server.');
        setSyncing(false);
        return;
      }

      setSyncStatus(`Found ${cloudOrders.length} cloud records. Merging locally...`);

      // 2. Loop through each cloud order and save it to local PouchDB
      for (const row of cloudOrders) {
        
        // Check if this document already exists locally to prevent conflicts
        let existingDoc = null;
        try {
          existingDoc = await db.get(row.id);
        } catch (e) {
          // Document doesn't exist locally yet, which is fine!
        }

        // 3. Map the SQL schema columns back into PouchDB keys
        const updatedLocalDoc = {
          _id: row.id,
          customerName: row.customer_name,
          phoneNumber: row.phone_number,
          deliveryAddress: row.delivery_address,
          price: row.price?.toString() || '',
          baseCost: row.base_cost?.toString() || '',
          delivery_charge: row.delivery_charge || 70,
          cost: row.cost || 0,
          status: row.status,
          source: row.source,
          orderType: row.order_type,
          selectedElements: row.selected_elements || [],
          notes: row.notes,
          paymentStatus: row.payment_status || 'Pending',
          date: row.order_date, // Restores your DD/MM/YYYY string
          
          // CRUCIAL: PouchDB updates require the matching local revision (_rev) string
          ...(existingDoc && { _rev: existingDoc._rev }) 
        };

        // 4. Save/Update inside local PouchDB
        await db.put(updatedLocalDoc);
      }

      setSyncStatus('✅ Sync Complete! Local data matches Cloud.');
      
      // Optional: If you have a custom state-reloader in your view app, trigger it here:
      // window.location.reload(); 

    } catch (err) {
      console.error('Failed pulling from Supabase:', err);
      setSyncStatus('❌ Cloud recovery failed. Review system logs.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      <button
        onClick={pullFromSupabase}
        disabled={syncing}
        className="btn-primary"
        style={{
          padding: '10px 20px',
          fontSize: '0.85rem',
          backgroundColor: syncing ? '#e2e8f0' : '#2b6cb0',
          color: syncing ? '#a0aec0' : 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: syncing ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(43, 108, 176, 0.15)'
        }}
      >
        {syncing ? '🔄 Pulling Cloud Data...' : '⬇️ Pull data from Cloud'}
      </button>
      {syncStatus && (
        <p style={{ fontSize: '0.8rem', color: '#4a5568', marginTop: '8px' }}>
          {syncStatus}
        </p>
      )}
    </div>
  );
};

export default SyncFromCloud;