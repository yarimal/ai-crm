import React from 'react';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { id: 'calendar', icon: 'calendar', label: 'Calendar' },
  { id: 'providers', icon: 'users', label: 'Providers' },
  { id: 'clients', icon: 'contacts', label: 'Clients' },
];

const icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  contacts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  ai: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A1.5 1.5 0 0 0 6 14.5A1.5 1.5 0 0 0 7.5 16A1.5 1.5 0 0 0 9 14.5A1.5 1.5 0 0 0 7.5 13m9 0a1.5 1.5 0 0 0-1.5 1.5a1.5 1.5 0 0 0 1.5 1.5a1.5 1.5 0 0 0 1.5-1.5a1.5 1.5 0 0 0-1.5-1.5" />
    </svg>
  )
};

export default function Sidebar({ activeView, onViewChange, isCollapsed, onToggle, onOpenChat }) {
  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.logo}>
        <svg viewBox="0 0 24 24" width="32" height="32">
          <rect x="3" y="4" width="18" height="18" rx="3" fill="#1a73e8" />
          <rect x="6" y="2" width="3" height="4" rx="1" fill="#1a73e8" />
          <rect x="15" y="2" width="3" height="4" rx="1" fill="#1a73e8" />
          <rect x="6" y="10" width="3" height="3" rx="0.5" fill="white" />
          <rect x="10.5" y="10" width="3" height="3" rx="0.5" fill="white" />
          <rect x="15" y="10" width="3" height="3" rx="0.5" fill="white" />
          <rect x="6" y="15" width="3" height="3" rx="0.5" fill="white" />
          <rect x="10.5" y="15" width="3" height="3" rx="0.5" fill="white" />
        </svg>
        {!isCollapsed && <span className={styles.logoText}>AI CRM</span>}
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activeView === item.id ? styles.active : ''}`}
            onClick={() => onViewChange(item.id)}
            title={isCollapsed ? item.label : ''}
          >
            <span className={styles.navIcon}>{icons[item.icon]}</span>
            {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
          </button>
        ))}
        
        {/* AI Assistant Button - Special styling */}
        <button
          className={`${styles.navItem} ${styles.aiButton}`}
          onClick={onOpenChat}
          title={isCollapsed ? 'AI Assistant' : ''}
        >
          <span className={styles.navIcon}>{icons.ai}</span>
          {!isCollapsed && <span className={styles.navLabel}>AI Assistant</span>}
          {!isCollapsed && <span className={styles.aiBadge}>NEW</span>}
        </button>
      </nav>

      <button className={styles.toggleBtn} onClick={onToggle}>
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
    </aside>
  );
}