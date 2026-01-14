import styles from './DashboardHeader.module.css';

export default function DashboardHeader({
  selectedProvider,
  setSelectedProvider,
  dateRange,
  setDateRange,
  providers
}) {
  return (
    <div className={styles.header}>
      <h1>Dashboard</h1>
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Provider:</label>
          <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)}>
            <option value="all">All Providers</option>
            {providers.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.displayName || provider.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Date Range:</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="7">7 days (past & future)</option>
            <option value="30">30 days (past & future)</option>
            <option value="90">90 days (past & future)</option>
            <option value="365">365 days (past & future)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
