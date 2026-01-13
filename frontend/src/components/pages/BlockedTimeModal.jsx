import React, { useState, useEffect } from 'react';
import styles from './BlockedTimeModal.module.css';
import config from '../../config';

const API_BASE = config.apiBaseUrl;

const BLOCK_TYPES = [
  { value: 'lunch', label: '🍽️ Lunch Break', color: '#f6bf26' },
  { value: 'break', label: '☕ Break', color: '#33b679' },
  { value: 'meeting', label: '👥 Meeting', color: '#039be5' },
  { value: 'vacation', label: '🏖️ Vacation', color: '#7986cb' },
  { value: 'sick', label: '🤒 Sick Leave', color: '#ea4335' },
  { value: 'personal', label: '👤 Personal', color: '#8e24aa' },
  { value: 'other', label: '📌 Other', color: '#616161' }
];

export default function BlockedTimeModal({ isOpen, onClose, provider, onSave }) {
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '12:00',
    endDate: '',
    endTime: '13:00',
    blockType: 'lunch',
    reason: '',
    isRecurring: false,
    recurrencePattern: 'weekly',
    recurrenceEndDate: ''
  });

  useEffect(() => {
    if (isOpen && provider) {
      fetchBlockedTimes();
      // Set default dates
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        startDate: today,
        endDate: today
      }));
    }
  }, [isOpen, provider]);

  const fetchBlockedTimes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/blocked-times/provider/${provider.id}`);
      const data = await res.json();
      setBlockedTimes(data);
    } catch (err) {
      console.error('Failed to fetch blocked times:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      provider_id: provider.id,
      start_time: `${formData.startDate}T${formData.startTime}:00`,
      end_time: `${formData.endDate}T${formData.endTime}:00`,
      block_type: formData.blockType,
      reason: formData.reason || null,
      is_recurring: formData.isRecurring,
      recurrence_pattern: formData.isRecurring ? formData.recurrencePattern : null,
      recurrence_end_date: formData.isRecurring && formData.recurrenceEndDate 
        ? `${formData.recurrenceEndDate}T23:59:59` 
        : null
    };

    try {
      const res = await fetch(`${API_BASE}/blocked-times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create');
      
      await fetchBlockedTimes();
      setShowForm(false);
      resetForm();
      if (onSave) onSave();
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save blocked time');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blocked time?')) return;
    
    try {
      await fetch(`${API_BASE}/blocked-times/${id}`, { method: 'DELETE' });
      await fetchBlockedTimes();
      if (onSave) onSave();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      startDate: today,
      startTime: '12:00',
      endDate: today,
      endTime: '13:00',
      blockType: 'lunch',
      reason: '',
      isRecurring: false,
      recurrencePattern: 'weekly',
      recurrenceEndDate: ''
    });
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2>Blocked Schedule</h2>
            <p className={styles.providerName}>
              <span style={{ 
                display: 'inline-block',
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: provider?.color,
                marginRight: 8
              }} />
              {provider?.displayName}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {/* Add New Button */}
          {!showForm && (
            <button 
              className={styles.addButton}
              onClick={() => setShowForm(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Blocked Time
            </button>
          )}

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Type</label>
                  <select
                    value={formData.blockType}
                    onChange={e => setFormData({ ...formData, blockType: e.target.value })}
                  >
                    {BLOCK_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Reason (optional)</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g., Team meeting, Dentist..."
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value, endDate: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.recurringSection}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
                  />
                  <span>Recurring</span>
                </label>

                {formData.isRecurring && (
                  <div className={styles.recurringOptions}>
                    <select
                      value={formData.recurrencePattern}
                      onChange={e => setFormData({ ...formData, recurrencePattern: e.target.value })}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <input
                      type="date"
                      value={formData.recurrenceEndDate}
                      onChange={e => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                      placeholder="End date"
                    />
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Save
                </button>
              </div>
            </form>
          )}

          {/* List */}
          <div className={styles.list}>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : blockedTimes.length === 0 ? (
              <div className={styles.empty}>
                <span>🗓️</span>
                <p>No blocked times yet</p>
              </div>
            ) : (
              blockedTimes.map(bt => {
                const start = formatDateTime(bt.start);
                const end = formatDateTime(bt.end);
                const blockType = BLOCK_TYPES.find(t => t.value === bt.blockType) || BLOCK_TYPES[6];
                
                return (
                  <div key={bt.id} className={styles.listItem}>
                    <div 
                      className={styles.itemColor}
                      style={{ backgroundColor: blockType.color }}
                    />
                    <div className={styles.itemContent}>
                      <div className={styles.itemType}>
                        {blockType.label}
                        {bt.isRecurring && (
                          <span className={styles.recurringBadge}>
                            🔄 {bt.recurrencePattern}
                          </span>
                        )}
                      </div>
                      <div className={styles.itemTime}>
                        {start.date} {start.time} - {end.date === start.date ? '' : end.date + ' '}{end.time}
                      </div>
                      {bt.reason && (
                        <div className={styles.itemReason}>{bt.reason}</div>
                      )}
                    </div>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(bt.id)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}