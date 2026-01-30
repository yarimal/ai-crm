import styles from './LiveMetrics.module.css';

const formatTimeUntil = (minutes) => {
  if (minutes < 0) return 'Past due';
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `in ${hours}h`;
  return `in ${hours}h ${mins}m`;
};

export default function LiveMetrics({ realtimeMetrics }) {
  if (!realtimeMetrics) return null;

  return (
    <div className={styles.realtimeSection}>
      <h2>Live Updates</h2>
      <div className={styles.realtimeCards}>
        <div className={styles.realtimeCard}>
          <h3>Today&apos;s Appointments</h3>
          <div className={styles.realtimeValue}>{realtimeMetrics.totalToday}</div>
          <div className={styles.realtimeLabel}>
            {realtimeMetrics.todayByStatus?.completed || 0} completed
            {(realtimeMetrics.todayByStatus?.scheduled || 0) > 0 && ` • ${realtimeMetrics.todayByStatus.scheduled} scheduled`}
          </div>
        </div>

        <div className={styles.realtimeCard}>
          <h3>Occupancy Rate</h3>
          <div className={styles.realtimeValue}>{realtimeMetrics.occupancyRate}%</div>
          <div className={styles.realtimeLabel}>of available time</div>
        </div>

        {realtimeMetrics.currentAppointment && (
          <div className={`${styles.realtimeCard} ${styles.currentAppointment}`}>
            <h3>Current Appointment</h3>
            <div className={styles.appointmentInfo}>
              <div className={styles.appointmentTitle}>{realtimeMetrics.currentAppointment.title}</div>
              <div className={styles.appointmentDetails}>
                {realtimeMetrics.currentAppointment.provider}
              </div>
              <div className={styles.timeRemaining}>
                {formatTimeUntil(realtimeMetrics.currentAppointment.minutesRemaining)} remaining
              </div>
            </div>
          </div>
        )}

        {realtimeMetrics.nextAppointment && !realtimeMetrics.currentAppointment && (
          <div className={`${styles.realtimeCard} ${styles.nextAppointment}`}>
            <h3>Next Appointment</h3>
            <div className={styles.appointmentInfo}>
              <div className={styles.appointmentTitle}>{realtimeMetrics.nextAppointment.title}</div>
              <div className={styles.appointmentDetails}>
                {realtimeMetrics.nextAppointment.provider}
              </div>
              <div className={styles.timeUntil}>
                {formatTimeUntil(realtimeMetrics.nextAppointment.minutesUntil)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
