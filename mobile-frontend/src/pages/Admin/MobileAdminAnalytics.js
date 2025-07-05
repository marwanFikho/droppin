import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
// import { Bar } from 'react-chartjs-2'; // Uncomment if Chart.js is available
import './MobileAdminDashboard.css';

const MobileAdminAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [packagesChart, setPackagesChart] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const statsRes = await adminService.getDashboardStats();
        setStats(statsRes.data);
        // Simulate chart data (replace with real API if available)
        setPackagesChart({
          labels: ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'],
          created: [5, 7, 6, 8, 4, 9, 10],
          delivered: [2, 4, 5, 6, 3, 7, 8]
        });
      } catch (err) {
        setError('Failed to fetch analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading-container">Loading analytics...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="mobile-admin-analytics-page" style={{marginTop: '6rem', marginLeft: '1rem', marginRight: '1rem'}}>
      <h2 className="mobile-admin-dashboard-section-title">System Analytics</h2>
      <div className="mobile-admin-dashboard-stats">
        <div className="mobile-admin-dashboard-stat">
          <div className="mobile-admin-dashboard-stat-icon" style={{ backgroundColor: '#007bff' }}>📦</div>
          <div className="mobile-admin-dashboard-stat-content">
            <div className="mobile-admin-dashboard-stat-number">{stats?.packages.total}</div>
            <div className="mobile-admin-dashboard-stat-label">Total Packages</div>
          </div>
        </div>
        <div className="mobile-admin-dashboard-stat">
          <div className="mobile-admin-dashboard-stat-icon" style={{ backgroundColor: '#28a745' }}>✅</div>
          <div className="mobile-admin-dashboard-stat-content">
            <div className="mobile-admin-dashboard-stat-number">{stats?.packages.delivered}</div>
            <div className="mobile-admin-dashboard-stat-label">Delivered</div>
          </div>
        </div>
        <div className="mobile-admin-dashboard-stat">
          <div className="mobile-admin-dashboard-stat-icon" style={{ backgroundColor: '#ffc107' }}>🚚</div>
          <div className="mobile-admin-dashboard-stat-content">
            <div className="mobile-admin-dashboard-stat-number">{stats?.packages.inTransit}</div>
            <div className="mobile-admin-dashboard-stat-label">In Transit</div>
          </div>
        </div>
        <div className="mobile-admin-dashboard-stat">
          <div className="mobile-admin-dashboard-stat-icon" style={{ backgroundColor: '#6c757d' }}>💰</div>
          <div className="mobile-admin-dashboard-stat-content">
            <div className="mobile-admin-dashboard-stat-number">EGP {stats?.cod?.totalToCollect || 0}</div>
            <div className="mobile-admin-dashboard-stat-label">Total ToCollect</div>
          </div>
        </div>
        <div className="mobile-admin-dashboard-stat">
          <div className="mobile-admin-dashboard-stat-icon" style={{ backgroundColor: '#2e7d32' }}>💸</div>
          <div className="mobile-admin-dashboard-stat-content">
            <div className="mobile-admin-dashboard-stat-number">EGP {stats?.cod?.totalCollected || 0}</div>
            <div className="mobile-admin-dashboard-stat-label">Total Collected</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAdminAnalytics; 