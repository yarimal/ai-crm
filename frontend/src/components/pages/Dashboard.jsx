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

      const [overviewData, timeData, providerData, statusData] = await Promise.all([
        analyticsService.getOverview(startDate, endDate, providerId),
        analyticsService.getAppointmentsOverTime(startDate, endDate, providerId),
        analyticsService.getAppointmentsByProvider(startDate, endDate, providerId),
        analyticsService.getAppointmentsByStatus(startDate, endDate, providerId)
      ]);

      setOverview(overviewData);
      setAppointmentsOverTime(timeData.data);
      setAppointmentsByProvider(providerData.data);
      setAppointmentsByStatus(statusData.data);
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

      <LiveMetrics realtimeMetrics={realtimeMetrics} />

      <ChartsSection
        appointmentsOverTime={appointmentsOverTime}
        appointmentsByProvider={appointmentsByProvider}
        appointmentsByStatus={appointmentsByStatus}
      />
    </div>
  );
}
