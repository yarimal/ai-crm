import React, { useState, useEffect } from 'react';
import styles from './EventModal.module.css';
import config from '../../config';

const API_BASE = config.apiBaseUrl;

const COLORS = [
  '#ea4335', '#e91e63', '#f4511e', '#f6bf26', 
  '#33b679', '#0b8043', '#039be5', '#4285f4',
  '#7986cb', '#8e24aa', '#616161'
];

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', color: '#4285f4' },
  { value: 'confirmed', label: 'Confirmed', color: '#33b679' },
  { value: 'completed', label: 'Completed', color: '#0b8043' },
  { value: 'cancelled', label: 'Cancelled', color: '#ea4335' },
  { value: 'no_show', label: 'No Show', color: '#616161' }
];

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  defaultDate,
  editEvent,
  defaultProviderId
}) {
  const [providers, setProviders] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    providerId: '',
    clientId: '',
    clientName: '',
    serviceId: '',
    startTime: '09:00',
    endTime: '09:30',
    serviceType: '',
    status: 'scheduled',
    notes: '',
    color: '#4285f4'
  });

  // Fetch providers, clients, and services
  useEffect(() => {
    if (isOpen) {
      fetchProviders();
      fetchClients();
    }
  }, [isOpen]);

  // Fetch services when provider changes or modal opens with editEvent
  useEffect(() => {
    if (formData.providerId) {
      fetchServices(formData.providerId);
    }
  }, [formData.providerId, isOpen]);

  const fetchProviders = async () => {
    try {
      const res = await fetch(`${API_BASE}/providers`);
      const data = await res.json();
      setProviders(data);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    }
  };

  const fetchClients = async (search = '') => {
    try {
      const url = search
        ? `${API_BASE}/clients?search=${encodeURIComponent(search)}`
        : `${API_BASE}/clients`;
      const res = await fetch(url);
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchServices = async (providerId) => {
    try {
      const res = await fetch(`${API_BASE}/services?provider_id=${providerId}`);
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setServices([]);
    }
  };

  // Initialize form data
  useEffect(() => {
    if (editEvent) {
      const startDate = new Date(editEvent.start);
      const endDate = new Date(editEvent.end);
      
      setFormData({
        title: editEvent.title || '',
        providerId: editEvent.providerId || editEvent.extendedProps?.providerId || '',
        clientId: editEvent.clientId || editEvent.extendedProps?.clientId || '',
        clientName: editEvent.clientName || editEvent.extendedProps?.clientName || editEvent.title || '',
        serviceId: editEvent.serviceId || editEvent.extendedProps?.serviceId || '',
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        serviceType: editEvent.serviceType || editEvent.extendedProps?.serviceType || '',
        status: editEvent.status || editEvent.extendedProps?.status || 'scheduled',
        notes: editEvent.notes || editEvent.extendedProps?.notes || editEvent.description || '',
        color: editEvent.color || '#4285f4'
      });
      setClientSearch(editEvent.clientName || editEvent.extendedProps?.clientName || editEvent.title || '');
    } else {
      // Use defaultProviderId if provided, otherwise first provider
      const providerId = defaultProviderId || providers[0]?.id || '';
      const provider = providers.find(p => p.id === providerId);
      
      setFormData({
        title: '',
        providerId: providerId,
        clientId: '',
        clientName: '',
        serviceId: '',
        startTime: '09:00',
        endTime: '09:30',
        serviceType: '',
        status: 'scheduled',
        notes: '',
        color: provider?.color || '#4285f4'
      });
      setClientSearch('');
    }
  }, [editEvent, isOpen, providers, defaultProviderId]);

  const handleClientSearch = (value) => {
    setClientSearch(value);
    setShowClientDropdown(true);
    fetchClients(value);
  };

  const selectClient = (client) => {
    setFormData({
      ...formData,
      clientId: client.id,
      clientName: client.name
    });
    setClientSearch(client.name);
    setShowClientDropdown(false);
  };

  const handleProviderChange = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    setFormData({
      ...formData,
      providerId,
      serviceId: '', // Reset service when provider changes
      color: provider?.color || '#4285f4'
    });
  };

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      // Auto-fill duration from service
      const durationMinutes = service.durationMinutes;
      const [hours, minutes] = formData.startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + durationMinutes;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

      setFormData({
        ...formData,
        serviceId,
        endTime
      });
    } else {
      setFormData({
        ...formData,
        serviceId
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const getStatusColor = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || '#4285f4';
  };

  if (!isOpen) return null;

  const selectedProvider = providers.find(p => p.id === formData.providerId);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{editEvent ? 'Edit Appointment' : 'New Appointment'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Provider Selection */}
          <div className={styles.formGroup}>
            <label>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Provider/Doctor *
            </label>
            <select
              value={formData.providerId}
              onChange={(e) => handleProviderChange(e.target.value)}
              required
              className={styles.select}
            >
              <option value="">Select provider...</option>
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.displayName} {provider.specialty ? `- ${provider.specialty}` : ''}
                </option>
              ))}
            </select>
            {selectedProvider && (
              <div className={styles.providerInfo}>
                <span 
                  className={styles.colorDot} 
                  style={{ backgroundColor: selectedProvider.color }}
                />
                <span>Hours: {selectedProvider.workingHours}</span>
              </div>
            )}
          </div>

          {/* Client Selection */}
          <div className={styles.formGroup}>
            <label>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Client *
            </label>
            <div className={styles.clientSearch}>
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => handleClientSearch(e.target.value)}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Search client by name or phone..."
                className={styles.input}
                required
              />
              {showClientDropdown && clients.length > 0 && (
                <div className={styles.clientDropdown}>
                  {clients.slice(0, 8).map(client => (
                    <div 
                      key={client.id}
                      className={styles.clientOption}
                      onClick={() => selectClient(client)}
                    >
                      <span className={styles.clientName}>{client.name}</span>
                      {client.phone && (
                        <span className={styles.clientPhone}>{client.phone}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Service Selection */}
          <div className={styles.formGroup}>
            <label>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 9h5M16 15h5M4 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
                <path d="M7 15h.01M7 9h4" />
              </svg>
              Service (Optional)
            </label>
            <select
              value={formData.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className={styles.select}
              disabled={!formData.providerId}
            >
              <option value="">No service selected</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price.toFixed(2)} ({service.durationMinutes} min)
                </option>
              ))}
            </select>
            {!formData.providerId && (
              <div className={styles.fieldHint}>Select a provider first to see available services</div>
            )}
          </div>

          {/* Date Display */}
          <div className={styles.formGroup}>
            <label>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Date
            </label>
            <div className={styles.dateDisplay}>
              {editEvent 
                ? new Date(editEvent.start).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                : defaultDate 
                  ? new Date(defaultDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : 'Select from calendar'
              }
            </div>
          </div>

          {/* Time Selection */}
          <div className={styles.formGroup}>
            <label>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Time
            </label>
            <div className={styles.timeRow}>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className={styles.timeInput}
              />
              <span className={styles.timeSeparator}>–</span>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className={styles.timeInput}
              />
            </div>
          </div>

          {/* Service Type */}
          <div className={styles.formGroup}>
            <label>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Service Type
            </label>
            <input
              type="text"
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              placeholder="e.g. Consultation, Check-up, Follow-up"
              className={styles.input}
            />
          </div>

          {/* Status */}
          {editEvent && (
            <div className={styles.formGroup}>
              <label>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Status
              </label>
              <div className={styles.statusOptions}>
                {STATUS_OPTIONS.map(status => (
                  <button
                    key={status.value}
                    type="button"
                    className={`${styles.statusBtn} ${formData.status === status.value ? styles.statusActive : ''}`}
                    style={{ 
                      '--status-color': status.color,
                      borderColor: formData.status === status.value ? status.color : '#e0e0e0',
                      backgroundColor: formData.status === status.value ? `${status.color}15` : 'white'
                    }}
                    onClick={() => setFormData({ ...formData, status: status.value })}
                  >
                    <span 
                      className={styles.statusDot}
                      style={{ backgroundColor: status.color }}
                    />
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className={styles.formGroup}>
            <label>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="17" y1="10" x2="3" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="17" y1="18" x2="3" y2="18" />
              </svg>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
              className={styles.textarea}
              rows={3}
            />
          </div>

          {/* Color */}
          <div className={styles.formGroup}>
            <label>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
              </svg>
              Color
            </label>
            <div className={styles.colorPicker}>
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.colorBtn} ${formData.color === color ? styles.colorActive : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            {editEvent && (
              <button 
                type="button" 
                className={styles.deleteBtn}
                onClick={() => onDelete(editEvent.id)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete
              </button>
            )}
            <div className={styles.rightActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={styles.saveBtn}>
                {editEvent ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}