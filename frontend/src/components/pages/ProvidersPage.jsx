import React, { useState, useEffect } from 'react';
import styles from './DataPages.module.css';
import BlockedTimeModal from './BlockedTimeModal';
import config from '../../config';

const API_BASE = config.apiBaseUrl;

const COLORS = [
  '#1a73e8', '#e91e63', '#9c27b0', '#673ab7', 
  '#3f51b5', '#00bcd4', '#009688', '#4caf50',
  '#ff9800', '#ff5722', '#795548', '#607d8b'
];

export default function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [blockedTimeProvider, setBlockedTimeProvider] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    title: 'Dr.',
    specialty: '',
    email: '',
    phone: '',
    color: '#1a73e8',
    working_hours: '09:00-17:00'
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch(`${API_BASE}/providers`);
      const data = await res.json();
      setProviders(data);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingProvider 
        ? `${API_BASE}/providers/${editingProvider.id}`
        : `${API_BASE}/providers`;
      
      const res = await fetch(url, {
        method: editingProvider ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        fetchProviders();
        closeModal();
      }
    } catch (err) {
      console.error('Failed to save provider:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this provider?')) return;
    
    try {
      await fetch(`${API_BASE}/providers/${id}`, { method: 'DELETE' });
      fetchProviders();
    } catch (err) {
      console.error('Failed to delete provider:', err);
    }
  };

  const openModal = (provider = null) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        name: provider.name,
        title: provider.title || '',
        specialty: provider.specialty || '',
        email: provider.email || '',
        phone: provider.phone || '',
        color: provider.color || '#1a73e8',
        working_hours: provider.workingHours || '09:00-17:00'
      });
    } else {
      setEditingProvider(null);
      setFormData({
        name: '',
        title: 'Dr.',
        specialty: '',
        email: '',
        phone: '',
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        working_hours: '09:00-17:00'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProvider(null);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading providers...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Providers</h1>
          <p className={styles.subtitle}>Manage doctors, consultants, and staff members</p>
        </div>
        <button className={styles.addButton} onClick={() => openModal()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Provider
        </button>
      </div>

      {providers.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👨‍⚕️</div>
          <h3>No providers yet</h3>
          <p>Add your first provider to get started</p>
          <button className={styles.addButton} onClick={() => openModal()}>
            Add Provider
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {providers.map(provider => (
            <div key={provider.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div 
                  className={styles.avatar}
                  style={{ backgroundColor: provider.color }}
                >
                  {provider.name.charAt(0)}
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardName}>{provider.displayName}</h3>
                  {provider.specialty && (
                    <span className={styles.cardSubtitle}>{provider.specialty}</span>
                  )}
                </div>
              </div>
              
              <div className={styles.cardDetails}>
                {provider.email && (
                  <div className={styles.detailRow}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>{provider.email}</span>
                  </div>
                )}
                {provider.phone && (
                  <div className={styles.detailRow}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>{provider.phone}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Hours: {provider.workingHours}</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button 
                  className={styles.blockedBtn}
                  onClick={() => setBlockedTimeProvider(provider)}
                  title="Manage blocked times"
                >
                  🚫 Blocked
                </button>
                <button 
                  className={styles.editBtn}
                  onClick={() => openModal(provider)}
                >
                  Edit
                </button>
                <button 
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(provider.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Add Provider Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingProvider ? 'Edit Provider' : 'Add Provider'}
            </h2>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: '0 0 80px' }}>
                  <label>Title</label>
                  <select
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  >
                    <option value="">None</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Mrs.">Mrs.</option>
                  </select>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Full name"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Specialty</label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="e.g. Cardiologist, General Practitioner"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Working Hours</label>
                  <input
                    type="text"
                    value={formData.working_hours}
                    onChange={e => setFormData({ ...formData, working_hours: e.target.value })}
                    placeholder="09:00-17:00"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Calendar Color</label>
                  <div className={styles.colorPicker}>
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`${styles.colorOption} ${formData.color === color ? styles.colorSelected : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingProvider ? 'Save Changes' : 'Add Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blocked Time Modal */}
      <BlockedTimeModal
        isOpen={!!blockedTimeProvider}
        onClose={() => setBlockedTimeProvider(null)}
        provider={blockedTimeProvider}
        onSave={() => {}}
      />
    </div>
  );
}