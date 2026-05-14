import React, { useState, useEffect } from 'react';
import PouchDB from 'pouchdb';

const db = new PouchDB('tote_sales');

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    monthlyData: [],
    totalRevenue: 0,
    totalProfit: 0,
    projectedRevenue: 0, // New
    projectedProfit: 0,  // New
    statusBreakdown: {
      processing: 0,
      shipped: 0,
      delivered: 0
    },
    totalOrders: 0,
    totalPaidOrders: 0
  });

  useEffect(() => {
    calculateAnalytics();
  }, []);

  const calculateAnalytics = async () => {
    try {
      const result = await db.allDocs({ include_docs: true });
      const orders = result.rows
        .filter(r => r.doc._id.startsWith('order_'))
        .map(r => r.doc);

      console.log(orders, 'orders')

      const monthlyData = {};
      const statusBreakdown = { processing: 0, shipped: 0, delivered: 0 };

      let totalRevenue = 0;
      let totalProfit = 0;
      let projectedRevenue = 0;
      let projectedProfit = 0;

      orders.forEach(order => {
        const [dayStr, monthStr, yearStr] = order.date.split('/');
        const monthKey = `${yearStr}-${monthStr.padStart(2, '0')}`;
        console.log(monthKey, 'monthKey');

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            revenue: 0,
            profit: 0,
            projRevenue: 0,
            projProfit: 0,
            orders: 0
          };
        }

        const price = parseFloat(order.price) || 0;
        const cost = parseFloat(order.cost) || 0;
        const profit = price - cost;

        // Logic: Check if the order is marked as Paid
        // Adjust 'Paid' to match your exact database field value
        if (order.paymentStatus === 'Paid' || order.Paid === true) {
          totalRevenue += price;
          totalProfit += profit;
          monthlyData[monthKey].revenue += price;
          monthlyData[monthKey].profit += profit;
        } else {
          projectedRevenue += price;
          projectedProfit += profit;
          monthlyData[monthKey].projRevenue += price;
          monthlyData[monthKey].projProfit += profit;
        }

        monthlyData[monthKey].orders += 1;

        const status = order.status?.toLowerCase();
        if (statusBreakdown.hasOwnProperty(status)) {
          statusBreakdown[status] += 1;
        }
      });

      const monthlyArray = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
      const paidOrders = orders.filter(i => i.paymentStatus === 'Paid')

      setAnalytics({
        monthlyData: monthlyArray,
        totalRevenue,
        totalProfit,
        projectedRevenue,
        projectedProfit,
        statusBreakdown,
        totalOrders: orders.length,
        totalPaidOrders: paidOrders.length || 0
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatMonth = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
  };


  return (
    <main className="animate-in" style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#f8fafc', // Light slate background for contrast
      minHeight: '100vh'
    }}>
      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          Analytics Dashboard
        </h2>
        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
          Landscape View Optimized
        </span>
      </div>

      {/* Summary Cards Grid */}
      <div style={{
        display: 'grid',
        // In landscape, we want 4 columns. If the screen narrows, it drops to 2.
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>

        {/* Revenue Card */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '700', margin: 0 }}>Revenue</h3>
            <span style={{ color: '#10b981', background: '#ecfdf5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>PAID</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', margin: '0 0 12px 0' }}>
            {formatCurrency(analytics.totalRevenue)}
          </p>
          <div style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></span>
            Pending: <span style={{ fontWeight: '700', color: '#475569' }}>{formatCurrency(analytics.projectedRevenue)}</span>
          </div>
        </div>

        {/* Profit Card */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '700', margin: 0 }}>Net Profit</h3>
            <span style={{ color: '#3b82f6', background: '#eff6ff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>MARGIN</span>
          </div>
          <p style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: analytics.totalProfit >= 0 ? '#10b981' : '#ef4444',
            margin: '0 0 12px 0'
          }}>
            {formatCurrency(analytics.totalProfit)}
          </p>
          <div style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></span>
            Pending: <span style={{ fontWeight: '700', color: '#475569' }}>{formatCurrency(analytics.projectedProfit)}</span>
          </div>
        </div>

        {/* Orders Summary Card */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 16px 0' }}>Order Volume</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#3b82f6', margin: 0 }}>{analytics.totalOrders}</p>
            <span style={{ color: '#64748b', fontSize: '1rem' }}>Total</span>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.9rem', color: '#059669', fontWeight: '600' }}>
            ✓ {analytics.totalPaidOrders} Paid & Settled
          </div>
        </div>
      </div>

      {/* Monthly Performance Table - Utilizing Landscape Width */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>Monthly Performance Breakdown</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>MONTH</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>ORDERS</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>PAID REVENUE</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>PROJECTED</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>TOTAL POTENTIAL</th>
              </tr>
            </thead>
            <tbody>
              {analytics.monthlyData.map((month, index) => (
                <tr key={month.month} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px', fontWeight: '700', color: '#334155' }}>{formatMonth(month.month)}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', color: '#475569' }}>{month.orders}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', color: '#059669', fontWeight: '700' }}>
                    {formatCurrency(month.revenue)}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', color: '#94a3b8' }}>
                    {formatCurrency(month.projRevenue)}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '700', color: '#1e293b' }}>
                    {formatCurrency(month.revenue + month.projRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default Analytics;