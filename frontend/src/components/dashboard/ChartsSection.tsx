import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from './ChartsSection.module.css';

const COLORS = ['#0088FE', '#FF4444', '#FFBB28', '#00C49F'];

const STATUS_COLORS = {
  scheduled: '#0088FE',
  confirmed: '#0088FE',
  completed: '#00C49F',
  cancelled: '#FF4444',
  canceled: '#FF4444',
  'no-show': '#FFBB28',
  no_show: '#FFBB28'
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function ChartsSection({
  appointmentsOverTime,
  appointmentsByProvider,
  appointmentsByStatus
}) {
  return (
    <div className={styles.chartsGrid}>
      {/* Appointments Over Time */}
      <div className={styles.chartCard}>
        <h2>Appointments Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={appointmentsOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip
              labelFormatter={formatDate}
              formatter={(value) => [value, 'Appointments']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#0088FE"
              strokeWidth={2}
              name="Appointments"
              dot={{ fill: '#0088FE' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Appointments by Provider */}
      <div className={styles.chartCard}>
        <h2>Appointments by Provider</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={appointmentsByProvider}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="provider"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="count"
              name="Appointments"
            >
              {appointmentsByProvider.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Appointments by Status */}
      <div className={styles.chartCard}>
        <h2>Appointments by Status</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={appointmentsByStatus.filter(item => item.count > 0)}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ status, percent }) =>
                percent > 0 ? `${status} (${(percent * 100).toFixed(0)}%)` : null
              }
              outerRadius={90}
              fill="#8884d8"
              dataKey="count"
              nameKey="status"
            >
              {appointmentsByStatus.filter(item => item.count > 0).map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, name]} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Status Breakdown Table */}
      <div className={styles.chartCard}>
        <h2>Status Breakdown</h2>
        <div className={styles.statusTable}>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {appointmentsByStatus.map((item) => {
                const total = appointmentsByStatus.reduce((sum, s) => sum + s.count, 0);
                const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                return (
                  <tr key={item.status}>
                    <td>
                      <span
                        className={styles.statusDot}
                        style={{ backgroundColor: STATUS_COLORS[item.status] }}
                      />
                      {item.status}
                    </td>
                    <td>{item.count}</td>
                    <td>{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
