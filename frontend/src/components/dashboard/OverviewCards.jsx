import styles from './OverviewCards.module.css';

export default function OverviewCards({ overview }) {
  if (!overview) return null;

  return (
    <div className={styles.overviewCards}>
      <div className={styles.card}>
        <h3>Total Appointments</h3>
        <div className={styles.cardValue}>{overview.total_appointments || 0}</div>
        <div className={styles.cardLabel}>in selected period</div>
      </div>
      <div className={styles.card}>
        <h3>Today</h3>
        <div className={styles.cardValue}>{overview.today_appointments || 0}</div>
        <div className={styles.cardLabel}>appointments</div>
      </div>
      <div className={styles.card}>
        <h3>This Week</h3>
        <div className={styles.cardValue}>{overview.week_appointments || 0}</div>
        <div className={styles.cardLabel}>appointments</div>
      </div>
      <div className={styles.card}>
        <h3>Total Clients</h3>
        <div className={styles.cardValue}>{overview.total_clients || 0}</div>
        <div className={styles.cardLabel}>active clients</div>
      </div>
      <div className={styles.card}>
        <h3>Total Providers</h3>
        <div className={styles.cardValue}>{overview.total_providers || 0}</div>
        <div className={styles.cardLabel}>active providers</div>
      </div>
    </div>
  );
}
