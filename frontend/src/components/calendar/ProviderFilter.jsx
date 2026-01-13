import React, { useState, useEffect } from 'react';
import styles from './ProviderFilter.module.css';
import config from '../../config';

const API_BASE = config.apiBaseUrl;

export default function ProviderFilter({ selectedProviderId, onProviderChange }) {
  const [providers, setProviders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

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
    }
  };

  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  return (
    <div className={styles.container}>
      <button 
        className={styles.filterButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          className={styles.colorDot} 
          style={{ backgroundColor: selectedProvider?.color || '#1a73e8' }}
        />
        <span className={styles.filterLabel}>
          {selectedProvider ? selectedProvider.displayName : 'All Providers'}
        </span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div 
            className={`${styles.option} ${!selectedProviderId ? styles.optionActive : ''}`}
            onClick={() => {
              onProviderChange(null);
              setIsOpen(false);
            }}
          >
            <div className={styles.colorDot} style={{ backgroundColor: '#1a73e8' }} />
            <span>All Providers</span>
            {!selectedProviderId && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          
          <div className={styles.divider} />
          
          {providers.map(provider => (
            <div 
              key={provider.id}
              className={`${styles.option} ${selectedProviderId === provider.id ? styles.optionActive : ''}`}
              onClick={() => {
                onProviderChange(provider.id);
                setIsOpen(false);
              }}
            >
              <div 
                className={styles.colorDot} 
                style={{ backgroundColor: provider.color }}
              />
              <div className={styles.optionInfo}>
                <span className={styles.optionName}>{provider.displayName}</span>
                {provider.specialty && (
                  <span className={styles.optionSpecialty}>{provider.specialty}</span>
                )}
              </div>
              {selectedProviderId === provider.id && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          ))}

          {providers.length === 0 && (
            <div className={styles.empty}>
              No providers yet. Add one in the Providers page.
            </div>
          )}
        </div>
      )}
    </div>
  );
}