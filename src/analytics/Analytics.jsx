import React, { useState, useEffect } from 'react';
import PouchDB from 'pouchdb';

const db = new PouchDB('tote_sales');

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    monthlyData: [],
    totalRevenue: 0,
    totalProfit: 0,
    statusBreakdown: {
      processing: 0,
      shipped: 0,
      delivered: 0
    },
    totalOrders: 0
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

      // Calculate monthly data
      const monthlyData = {};
      const statusBreakdown = { processing: 0, shipped: 0, delivered: 0 };
      let totalRevenue = 0;
      let totalProfit = 0;

      orders.forEach(order => {
        // Parse date and get month-year
        const orderDate = new Date(order.date);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            revenue: 0,
            profit: 0,
            orders: 0
          };
        }

        // Update monthly data
        monthlyData[monthKey].revenue += parseFloat(order.price) || 0;
        monthlyData[monthKey].profit += (parseFloat(order.price) || 0) - (parseFloat(order.cost) || 0);
        monthlyData[monthKey].orders += 1;

        // Update status breakdown
        const status = order.status.toLowerCase();
        if (statusBreakdown.hasOwnProperty(status)) {
          statusBreakdown[status] += 1;
        }

        // Update totals
        totalRevenue += parseFloat(order.price) || 0;
        totalProfit += (parseFloat(order.price) || 0) - (parseFloat(order.cost) || 0);
      });

      // Convert monthly data to array and sort by month
      const monthlyArray = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

      setAnalytics({
        monthlyData: monthlyArray,
        totalRevenue,
        totalProfit,
        statusBreakdown,
        totalOrders: orders.length
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
    <main className="animate-in">
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <h2>Analytics Dashboard</h2>
      </div>

      {/* Summary Cards */}
      <div style={{ padding: '0 20px', marginBottom: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Total Revenue</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--success)', margin: '0' }}>
              {formatCurrency(analytics.totalRevenue)}
            </p>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Total Profit</h3>
            <p style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: analytics.totalProfit >= 0 ? 'var(--success)' : '#dc3545',
              margin: '0'
            }}>
              {formatCurrency(analytics.totalProfit)}
            </p>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Total Orders</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#007bff', margin: '0' }}>
              {analytics.totalOrders}
            </p>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div style={{ padding: '0 20px', marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '16px' }}>Order Status Breakdown</h3>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#ffc107',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {analytics.statusBreakdown.processing}
              </div>
              <p style={{ margin: '0', fontWeight: 'bold' }}>Processing</p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#17a2b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {analytics.statusBreakdown.shipped}
              </div>
              <p style={{ margin: '0', fontWeight: 'bold' }}>Shipped</p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#28a745',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {analytics.statusBreakdown.delivered}
              </div>
              <p style={{ margin: '0', fontWeight: 'bold' }}>Delivered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Data Table */}
      <div style={{ padding: '0 20px', marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '16px' }}>Monthly Performance</h3>
        <div className="card" style={{ padding: '20px' }}>
          {analytics.monthlyData.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Month</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Orders</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Revenue</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Profit</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Avg Order</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.monthlyData.map((month, index) => (
                    <tr key={month.month} style={{
                      borderBottom: '1px solid #dee2e6',
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                    }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>
                        {formatMonth(month.month)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {month.orders}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--success)' }}>
                        {formatCurrency(month.revenue)}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'right',
                        color: month.profit >= 0 ? 'var(--success)' : '#dc3545'
                      }}>
                        {formatCurrency(month.profit)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {formatCurrency(month.revenue / month.orders)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#666', margin: '40px 0' }}>
              No data available yet. Start creating orders to see analytics.
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Analytics;