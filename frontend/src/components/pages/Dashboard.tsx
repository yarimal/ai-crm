import { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import api from '../../services/api';
import DashboardHeader from '../dashboard/DashboardHeader';
import OverviewCards from '../dashboard/OverviewCards';
import LiveMetrics from '../dashboard/LiveMetrics';
import ChartsSection from '../dashboard/ChartsSection';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [providers, setProviders] = useState([]);
  const [overview, setOverview] = useState(null);
  const [appointmentsOverTime, setAppointmentsOverTime] = useState([]);
  const [appointmentsByProvider, setAppointmentsByProvider] = useState([]);
  const [appointmentsByStatus, setAppointmentsByStatus] = useState([]);
  const [realtimeMetrics, setRealtimeMetrics] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);
  const [servicePerformance, setServicePerformance] = useState([]);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, selectedProvider]);

  useEffect(() => {
    loadRealtimeMetrics();
    const interval = setInterval(loadRealtimeMetrics, 60000);
    return () => clearInterval(interval);
  }, [selectedProvider]);

  const loadProviders = async () => {
    try {
      const response = await api.get('/providers');
      setProviders(response);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const daysBack = parseInt(dateRange);
      const daysForward = daysBack;

      const endDate = new Date(today.getTime() + daysForward * 24 * 60 * 60 * 1000).toISOString();
      const startDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString();

      const providerId = selectedProvider === 'all' ? null : selectedProvider;

      const [overviewData, timeData, providerData, statusData, revenueData, serviceData] = await Promise.all([
        analyticsService.getOverview(startDate, endDate, providerId),
        analyticsService.getAppointmentsOverTime(startDate, endDate, providerId),
        analyticsService.getAppointmentsByProvider(startDate, endDate, providerId),
        analyticsService.getAppointmentsByStatus(startDate, endDate, providerId),
        analyticsService.getRevenueStats(startDate, endDate, providerId),
        analyticsService.getServicePerformance(startDate, endDate, providerId)
      ]);

      setOverview(overviewData);
      setAppointmentsOverTime(timeData.data);
      setAppointmentsByProvider(providerData.data);
      setAppointmentsByStatus(statusData.data);
      setRevenueStats(revenueData);
      setServicePerformance(serviceData.servicePerformance || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeMetrics = async () => {
    try {
      const providerId = selectedProvider === 'all' ? null : selectedProvider;
      const metrics = await analyticsService.getRealtimeMetrics(providerId);
      setRealtimeMetrics(metrics);
    } catch (error) {
      console.error('Failed to load realtime metrics:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading analytics...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <DashboardHeader
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
        dateRange={dateRange}
        setDateRange={setDateRange}
        providers={providers}
      />

      <OverviewCards overview={overview} />

      {revenueStats && (
        <div className={styles.revenueSection}>
          <h2>Revenue Statistics</h2>
          <div className={styles.revenueCards}>
            <div className={styles.revenueCard}>
              <h3>Total Revenue</h3>
              <div className={styles.revenueValue}>${revenueStats.totalRevenue?.toFixed(2) || '0.00'}</div>
              <div className={styles.revenueLabel}>All Appointments</div>
            </div>
            <div className={styles.revenueCard}>
              <h3>Completed Revenue</h3>
              <div className={styles.revenueValue}>${revenueStats.completedRevenue?.toFixed(2) || '0.00'}</div>
              <div className={styles.revenueLabel}>Paid Appointments</div>
            </div>
            <div className={styles.revenueCard}>
              <h3>Pending Revenue</h3>
              <div className={styles.revenueValue}>${revenueStats.pendingRevenue?.toFixed(2) || '0.00'}</div>
              <div className={styles.revenueLabel}>Scheduled Appointments</div>
            </div>
            <div className={styles.revenueCard}>
              <h3>Average Revenue</h3>
              <div className={styles.revenueValue}>${revenueStats.averageRevenue?.toFixed(2) || '0.00'}</div>
              <div className={styles.revenueLabel}>Per Appointment</div>
            </div>
          </div>
        </div>
      )}

      <LiveMetrics realtimeMetrics={realtimeMetrics} />

      {servicePerformance && servicePerformance.length > 0 && (
        <div className={styles.serviceSection}>
          <h2>Service Performance</h2>
          <div className={styles.serviceTable}>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Appointments</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {servicePerformance.map((service, index) => (
                  <tr key={index}>
                    <td>{service.service}</td>
                    <td>{service.count}</td>
                    <td>${service.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ChartsSection
        appointmentsOverTime={appointmentsOverTime}
        appointmentsByProvider={appointmentsByProvider}
        appointmentsByStatus={appointmentsByStatus}
      />
    </div>
  );
}
