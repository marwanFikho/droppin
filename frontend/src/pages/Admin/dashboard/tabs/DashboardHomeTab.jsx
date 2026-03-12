/**
 * File Purpose:
 * - Overview/analytics tab for Admin.
 * - Displays KPI cards, charts, operational funnel metrics, recent updates, and finance snapshots.
 * - Used as the default executive view for platform health and performance.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faStore, faTruck, faBox, faEye, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Card, Statistic, Flex, Row, Col, Spin } from 'antd';

const chartBoxStyle = { height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' };

const DashboardHomeTab = ({
  stats,
  packages,
  users,
  dashboardData,
  analytics,
  analyticsLoading,
  moneyTransactions,
  shopSort,
  setShopSort,
  fetchRecentUpdatedPackages,
  recentUpdatedLoading,
  recentUpdatedPackages,
  viewDetails,
  forwardPackageStatus,
  forwardingPackageId
}) => {
  // Use backend value for delivered revenue if available
  let deliveredRevenue = stats.revenueDeliveredPackages;
  const missingShippingFeePackages = [];
  if (deliveredRevenue === undefined || deliveredRevenue === null) {
    // Fallback: sum shop shipping fees for each delivered package
    const deliveredPackages = packages.filter((pkg) => pkg.status === 'delivered');
    deliveredRevenue = 0;
    deliveredPackages.forEach((pkg) => {
      let shippingFees = null;
      if (pkg.shop && pkg.shop.shippingFees != null && pkg.shop.shippingFees !== undefined) {
        shippingFees = pkg.shop.shippingFees;
      } else {
        const shopId = pkg.shopId || (pkg.shop && pkg.shop.id);
        const shop = users.find((u) => u.role === 'shop' && (u.id === shopId || u.shopId === shopId));
        if (shop && shop.shippingFees != null && shop.shippingFees !== undefined) {
          shippingFees = shop.shippingFees;
        }
      }
      if (shippingFees != null && shippingFees !== undefined) {
        deliveredRevenue += parseFloat(shippingFees);
      } else {
        missingShippingFeePackages.push(pkg);
      }
    });
  }

  // Last-mile operational KPIs
  const totalCreated = Number(stats?.packages?.total || 0);
  const totalDelivered = Number(stats?.packages?.delivered || 0);
  const totalInTransit = Number(stats?.packages?.inTransit || 0);
  const undeliveredCount = Math.max(totalCreated - totalDelivered, 0);
  const createdToDeliveredPct = totalCreated > 0 ? (totalDelivered / totalCreated) * 100 : 0;
  const undeliveredPct = totalCreated > 0 ? (undeliveredCount / totalCreated) * 100 : 0;
  const inTransitPct = totalCreated > 0 ? (totalInTransit / totalCreated) * 100 : 0;
  const pendingOtherCount = Math.max(totalCreated - totalDelivered - totalInTransit, 0);

  const createdLast7 = (dashboardData?.packagesChart?.datasets?.[0]?.data || []).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const deliveredLast7 = (dashboardData?.packagesChart?.datasets?.[1]?.data || []).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const createdToDeliveredLast7Pct = createdLast7 > 0 ? (deliveredLast7 / createdLast7) * 100 : 0;

  const rateColor = (value) => {
    if (value >= 80) return '#2e7d32';
    if (value >= 60) return '#f57c00';
    return '#c62828';
  };

  const kpiData = [
    { title: 'Total Users', value: stats.users.total, icon: faUser },
    { title: 'Shops', value: stats.users.shops, icon: faStore },
    { title: 'Drivers', value: stats.users.drivers, icon: faTruck },
    { title: 'Packages', value: stats.packages.total, icon: faBox },
    { title: 'COD Collected (All Time)', value: stats.cod?.totalCollected || 0, icon: faDollarSign, prefix: 'EGP ' },
    { title: 'To Collect COD (All Time)', value: stats.cod?.totalToCollect || 0, icon: faDollarSign, prefix: 'EGP ' },
    { title: 'Revenue (Delivered Packages)', value: deliveredRevenue, icon: faDollarSign, prefix: 'EGP ' }
  ];

  const months = analytics.packagesPerMonth.map((row) => row.month);
  const createdData = analytics.packagesPerMonth.map((row) => row.created);
  const deliveredData = analytics.packagesPerMonth.map((row) => row.delivered);
  const codMonths = analytics.codPerMonth.map((row) => row.month);
  const codData = analytics.codPerMonth.map((row) => row.codCollected);

  const statusRaw = analytics.statusDistribution;
  const statusMap = {};
  statusRaw.forEach((row) => {
    const status = row.status.toLowerCase();
    const count = Number(row.count) || 0;

    if (status === 'delivered' || status === 'delivered-returned') {
      statusMap.Delivered = (statusMap.Delivered || 0) + count;
    } else if (status.includes('pickedup') || status.includes('in-transit') || status === 'assigned') {
      statusMap['In-Transit'] = (statusMap['In-Transit'] || 0) + count;
    } else if (status === 'awaiting_schedule' || status === 'scheduled_for_pickup' || status === 'awaiting_pickup') {
      statusMap['Awaiting Pickup'] = (statusMap['Awaiting Pickup'] || 0) + count;
    } else if (status === 'pending') {
      statusMap.Pending = (statusMap.Pending || 0) + count;
    } else if (status.includes('return')) {
      statusMap['Return Flow'] = (statusMap['Return Flow'] || 0) + count;
    } else if (status.includes('exchange')) {
      statusMap['Exchange Flow'] = (statusMap['Exchange Flow'] || 0) + count;
    } else if (status.includes('rejected')) {
      statusMap.Rejected = (statusMap.Rejected || 0) + count;
    } else if (status.includes('cancelled')) {
      statusMap.Cancelled = (statusMap.Cancelled || 0) + count;
    } else {
      statusMap.Other = (statusMap.Other || 0) + count;
    }
  });

  const statusLabels = Object.keys(statusMap);
  const statusCounts = Object.values(statusMap);
  const statusColorMap = {
    Delivered: '#2E7D32',
    'In-Transit': '#EF6C00',
    'Awaiting Pickup': '#1E88E5',
    Pending: '#F9A825',
    'Return Flow': '#8E24AA',
    'Exchange Flow': '#00838F',
    Rejected: '#AD1457',
    Cancelled: '#C62828',
    Other: '#546E7A'
  };
  const statusColors = statusLabels.map((label) => statusColorMap[label] || '#546E7A');

  const topShopNames = analytics.topShops.volume.map((row) => row.businessName);
  const topShopVolumes = analytics.topShops.volume.map((row) => row.packageCount);
  const topShopCodNames = analytics.topShops.cod.map((row) => row.businessName);
  const topShopCods = analytics.topShops.cod.map((row) => row.codCollected);

  const recentTransactions = moneyTransactions
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  const allShops = users.filter((u) => u.role === 'shop');
  const shopRows = allShops.map((shop) => {
    const deliveredCount = shop.financialData?.packageCount || 0;
    const shippingFees = parseFloat(shop.shippingFees || 0);
    const revenue = deliveredCount * shippingFees;
    return {
      id: shop.shopId || shop.id,
      name: shop.businessName,
      shippingFees,
      deliveredCount,
      revenue
    };
  });

  const sortedShopRows = [...shopRows].sort((a, b) => {
    const { field, order } = shopSort;
    let valA = a[field];
    let valB = b[field];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const handleShopSort = (field) => {
    setShopSort((prev) => {
      if (prev.field === field) {
        return { field, order: prev.order === 'asc' ? 'desc' : 'asc' };
      }
      return { field, order: 'desc' };
    });
  };

  const renderSortIcon = (field) => {
    if (shopSort.field !== field) return null;
    return <span style={{ marginLeft: 4 }}>{shopSort.order === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="dashboard-home">
      {missingShippingFeePackages.length > 0 && (
        <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', color: '#ad8b00', padding: 16, borderRadius: 8, marginBottom: 24 }}>
          <strong>Warning:</strong> {missingShippingFeePackages.length} delivered package(s) belong to shops with no shipping fees set. Revenue may be undercounted. <br />
          <span style={{ fontSize: 13 }}>
            Please set <b>Shipping Fees</b> for all shops in the <b>Shops</b> tab or by clicking on a shop in the dashboard.
          </span>
        </div>
      )}
      <Flex gap="large" wrap="wrap">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <Statistic
              title={kpi.title}
              value={kpi.value}
              prefix={kpi.prefix}
              valueStyle={{ color: '#2c3e50', fontSize: '2rem' }}
              formatter={(value) => (kpi.prefix === 'EGP ' ? parseFloat(value).toFixed(2) : value)}
            />
          </Card>
        ))}
      </Flex>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <Card title="Operational KPIs (Last-Mile)">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} lg={6}>
                <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                  <div style={{ color: '#666', fontSize: 13 }}>Created → Delivered</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: rateColor(createdToDeliveredPct) }}>{createdToDeliveredPct.toFixed(1)}%</div>
                  <div style={{ fontSize: 12, color: '#777' }}>{totalDelivered} / {totalCreated} packages</div>
                </div>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                  <div style={{ color: '#666', fontSize: 13 }}>Undelivered Backlog</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#c62828' }}>{undeliveredCount}</div>
                  <div style={{ fontSize: 12, color: '#777' }}>{undeliveredPct.toFixed(1)}% of all created</div>
                </div>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                  <div style={{ color: '#666', fontSize: 13 }}>In-Transit Share</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1565c0' }}>{inTransitPct.toFixed(1)}%</div>
                  <div style={{ fontSize: 12, color: '#777' }}>{totalInTransit} in transit now</div>
                </div>
              </Col>
              <Col xs={24} md={12} lg={6}>
                <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                  <div style={{ color: '#666', fontSize: 13 }}>7-Day Conversion</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: rateColor(createdToDeliveredLast7Pct) }}>{createdToDeliveredLast7Pct.toFixed(1)}%</div>
                  <div style={{ fontSize: 12, color: '#777' }}>{deliveredLast7} delivered / {createdLast7} created</div>
                </div>
              </Col>
            </Row>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Delivery Funnel</div>
              <div style={{ height: 10, borderRadius: 999, background: '#eee', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${Math.min(createdToDeliveredPct, 100)}%`, background: '#2e7d32' }} />
                <div style={{ width: `${Math.min(inTransitPct, 100)}%`, background: '#1565c0' }} />
                <div style={{ width: `${Math.min(Math.max(100 - createdToDeliveredPct - inTransitPct, 0), 100)}%`, background: '#f57c00' }} />
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                Delivered: {totalDelivered} · In Transit: {totalInTransit} · Pending/Other: {pendingOtherCount}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Packages Over Time (Last 7 Days)">
            <div className="chart-wrapper">
              <Line data={dashboardData.packagesChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="COD Collected (Last 4 Weeks)">
            <div className="chart-wrapper">
              <Bar data={dashboardData.codChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <Card
            title="Recently Updated Packages"
            extra={
              <button className="action-btn" onClick={fetchRecentUpdatedPackages} disabled={recentUpdatedLoading}>
                {recentUpdatedLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            }
          >
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Updated</th>
                    <th>Tracking #</th>
                    <th>Status</th>
                    <th>Shop</th>
                    <th>Driver</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUpdatedPackages.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center' }}>No recent updates.</td></tr>
                  ) : (
                    recentUpdatedPackages.map((pkg) => {
                      const isNew = pkg.createdAt && pkg.updatedAt && (new Date(pkg.createdAt).getTime() === new Date(pkg.updatedAt).getTime());
                      return (
                        <tr key={pkg.id}>
                          <td>
                            {new Date(pkg.updatedAt).toLocaleString()}
                            {isNew && <span className="status-badge status-pending" style={{ marginLeft: 8 }}>New</span>}
                          </td>
                          <td>{pkg.trackingNumber}</td>
                          <td>
                            <span className={`status-badge status-${pkg.status}`}>
                              {pkg.status}
                            </span>
                          </td>
                          <td>{pkg.shop?.businessName || pkg.Shop?.businessName || '-'}</td>
                          <td>{pkg.driver?.contact?.name || pkg.Driver?.User?.name || '-'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className="action-btn view-btn"
                                title="View details"
                                onClick={() => viewDetails(pkg, 'package')}
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              {['assigned', 'pickedup', 'in-transit'].includes(pkg.status) && (
                                <button
                                  className="action-btn"
                                  title="Forward status"
                                  onClick={async () => {
                                    await forwardPackageStatus(pkg);
                                    fetchRecentUpdatedPackages();
                                  }}
                                  disabled={forwardingPackageId === pkg.id}
                                >
                                  {forwardingPackageId === pkg.id ? 'Forwarding…' : 'Forward'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </Col>
      </Row>

      <div className="dashboard-tables">
        <div className="dashboard-table" />
        <div className="dashboard-table" />
      </div>

      <div style={{ marginTop: 32 }}>
        {analyticsLoading ? (
          <Spin size="large" style={{ margin: '40px auto', display: 'block' }} />
        ) : (
          <>
            <Card title="Monthly Package Trends (Last 12 Months)" style={{ marginBottom: 24 }}>
              <div style={chartBoxStyle}>
                {months.length === 0 ? 'No data available' : (
                  <Bar
                    data={{
                      labels: months,
                      datasets: [
                        { label: 'Created', data: createdData, backgroundColor: 'rgba(54, 162, 235, 0.6)' },
                        { label: 'Delivered', data: deliveredData, backgroundColor: 'rgba(75, 192, 192, 0.6)' }
                      ]
                    }}
                    options={{ responsive: true, plugins: { legend: { position: 'top' } }, maintainAspectRatio: false }}
                  />
                )}
              </div>
            </Card>
            <Card title="Monthly COD Collected (Last 12 Months)" style={{ marginBottom: 24 }}>
              <div style={chartBoxStyle}>
                {codMonths.length === 0 ? 'No data available' : (
                  <Line
                    data={{
                      labels: codMonths,
                      datasets: [
                        {
                          label: 'COD Collected',
                          data: codData,
                          borderColor: 'rgba(255, 206, 86, 1)',
                          backgroundColor: 'rgba(255, 206, 86, 0.3)',
                          fill: true,
                          tension: 0.4
                        }
                      ]
                    }}
                    options={{ responsive: true, plugins: { legend: { position: 'top' } }, maintainAspectRatio: false }}
                  />
                )}
              </div>
            </Card>
            <Card title="Current Package Status Distribution" style={{ marginBottom: 24 }}>
              <div style={chartBoxStyle}>
                {statusLabels.length === 0 ? 'No data available' : (
                  <Pie
                    data={{
                      labels: statusLabels,
                      datasets: [
                        { data: statusCounts, backgroundColor: statusColors }
                      ]
                    }}
                    options={{ responsive: true, plugins: { legend: { position: 'right' } }, maintainAspectRatio: false }}
                  />
                )}
              </div>
            </Card>
            <Card title="Top 5 Shops by Package Volume" style={{ marginBottom: 24 }}>
              <div style={chartBoxStyle}>
                {topShopNames.length === 0 ? 'No data available' : (
                  <Bar
                    data={{
                      labels: topShopNames,
                      datasets: [
                        { label: 'Packages', data: topShopVolumes, backgroundColor: 'rgba(54, 162, 235, 0.7)' }
                      ]
                    }}
                    options={{ responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false }}
                  />
                )}
              </div>
            </Card>
            <Card title="Top 5 Shops by COD Collected" style={{ marginBottom: 24 }}>
              <div style={chartBoxStyle}>
                {topShopCodNames.length === 0 ? 'No data available' : (
                  <Bar
                    data={{
                      labels: topShopCodNames,
                      datasets: [
                        { label: 'COD Collected', data: topShopCods, backgroundColor: 'rgba(255, 206, 86, 0.7)' }
                      ]
                    }}
                    options={{ responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false }}
                  />
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      <div style={{ marginTop: 48 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Recent Money Transactions (Last 10)">
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table className="admin-table money-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Shop</th>
                      <th>Type</th>
                      <th>Amount (EGP)</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center' }}>No transactions found.</td></tr>
                    ) : (
                      recentTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{new Date(tx.createdAt).toLocaleString()}</td>
                          <td>{tx.Shop?.businessName || tx.shopId || '-'}</td>
                          <td>{tx.changeType}</td>
                          <td>EGP {parseFloat(tx.amount).toFixed(2)}</td>
                          <td>{tx.description || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="All Shops Revenue (Delivered Packages)">
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleShopSort('name')} style={{ cursor: 'pointer' }}>Shop Name {renderSortIcon('name')}</th>
                      <th onClick={() => handleShopSort('shippingFees')} style={{ cursor: 'pointer' }}>Shipping Fees (EGP) {renderSortIcon('shippingFees')}</th>
                      <th onClick={() => handleShopSort('deliveredCount')} style={{ cursor: 'pointer' }}>Delivered {renderSortIcon('deliveredCount')}</th>
                      <th onClick={() => handleShopSort('revenue')} style={{ cursor: 'pointer' }}>Revenue (EGP) {renderSortIcon('revenue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedShopRows.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center' }}>No shops found.</td></tr>
                    ) : (
                      sortedShopRows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.name}</td>
                          <td>EGP {row.shippingFees.toFixed(2)}</td>
                          <td>{row.deliveredCount}</td>
                          <td>EGP {row.revenue.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default DashboardHomeTab;
