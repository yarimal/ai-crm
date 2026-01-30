import { useState, useEffect } from 'react';
import { servicesService } from '../../services/servicesService';
import api from '../../services/api';
import styles from './Services.module.css';

export default function Services() {
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [filterProvider, setFilterProvider] = useState('all');
  const [formData, setFormData] = useState({
    providerId: '',
    name: '',
    description: '',
    durationMinutes: 30,
    price: '',
    isActive: true
  });

  useEffect(() => {
    loadProviders();
    loadServices();
  }, [filterProvider]);

  const loadProviders = async () => {
    try {
      const data = await api.get('/providers');
      setProviders(data);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const providerId = filterProvider === 'all' ? null : filterProvider;
      const data = await servicesService.getAll(providerId, true);
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const serviceData = {
        provider_id: formData.providerId,
        name: formData.name,
        description: formData.description,
        duration_minutes: parseInt(formData.durationMinutes),
        price: parseFloat(formData.price),
        is_active: formData.isActive
      };

      if (editingService) {
        await servicesService.update(editingService.id, serviceData);
      } else {
        await servicesService.create(serviceData);
      }

      setShowModal(false);
      resetForm();
      loadServices();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      providerId: service.providerId,
      name: service.name,
      description: service.description || '',
      durationMinutes: service.durationMinutes,
      price: service.price.toString(),
      isActive: service.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await servicesService.delete(serviceId);
      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({
      providerId: '',
      name: '',
      description: '',
      durationMinutes: 30,
      price: '',
      isActive: true
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getProviderName = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.displayName || provider.name : 'Unknown';
  };

  return (
    <div className={styles.servicesContainer}>
      <div className={styles.header}>
        <h1>Services</h1>
        <div className={styles.headerActions}>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Providers</option>
            {providers.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.displayName || provider.name}
              </option>
            ))}
          </select>
          <button onClick={openCreateModal} className={styles.addButton}>
            + Add Service
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading services...</div>
      ) : services.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No services found. Create your first service to get started.</p>
        </div>
      ) : (
        <div className={styles.servicesGrid}>
          {services.map(service => (
            <div key={service.id} className={styles.serviceCard}>
              <div className={styles.serviceHeader}>
                <h3>{service.name}</h3>
                <div className={styles.serviceActions}>
                  <button
                    onClick={() => handleEdit(service)}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.serviceDetails}>
                <div className={styles.serviceProvider}>
                  Provider: {getProviderName(service.providerId)}
                </div>
                {service.description && (
                  <p className={styles.serviceDescription}>{service.description}</p>
                )}
                <div className={styles.serviceInfo}>
                  <span className={styles.serviceDuration}>
                    {service.durationMinutes} min
                  </span>
                  <span className={styles.servicePrice}>
                    ${service.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <button
                onClick={() => setShowModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Provider *</label>
                <select
                  value={formData.providerId}
                  onChange={(e) => setFormData({...formData, providerId: e.target.value})}
                  required
                >
                  <option value="">Select Provider</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.displayName || provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Service Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Haircut, Consultation, Massage"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the service"
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Duration (minutes) *</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({...formData, durationMinutes: e.target.value})}
                    min="1"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
