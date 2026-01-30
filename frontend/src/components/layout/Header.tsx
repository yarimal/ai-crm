import React, { useState, useRef, useEffect } from 'react';
import styles from './Header.module.css';

export default function Header({ onOpenChat, events = [], onEditEvent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  // Filter events based on search
  const filteredEvents = searchQuery.trim() 
    ? events.filter(event => 
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.providerName?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(e.target.value.trim().length > 0);
  };

  const handleEventClick = (event) => {
    if (onEditEvent) {
      onEditEvent(event);
    }
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const formatEventDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatEventTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>Scheduling Dashboard</h1>
      </div>
      
      <div className={styles.right}>
        {/* Search Bar with Dropdown */}
        <div className={styles.searchContainer} ref={searchRef}>
          <div className={styles.searchInputWrapper}>
            <svg 
              className={styles.searchIcon} 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => searchQuery.trim() && setIsDropdownOpen(true)}
            />
            {searchQuery && (
              <button 
                className={styles.clearButton}
                onClick={() => {
                  setSearchQuery('');
                  setIsDropdownOpen(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown Results */}
          {isDropdownOpen && (
            <div className={styles.dropdown}>
              {filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <div 
                    key={event.id} 
                    className={styles.dropdownItem}
                    onClick={() => handleEventClick(event)}
                  >
                    <div 
                      className={styles.eventColor} 
                      style={{ backgroundColor: event.color || '#1a73e8' }}
                    />
                    <div className={styles.eventInfo}>
                      <span className={styles.eventTitle}>
                        {event.clientName || event.title}
                      </span>
                      <span className={styles.eventDate}>
                        {event.providerName && `${event.providerName} • `}
                        {formatEventDate(event.start)} • {formatEventTime(event.start)}
                      </span>
                    </div>
                    <svg 
                      className={styles.editIcon}
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                ))
              ) : (
                <div className={styles.noResults}>
                  No appointments found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Assistant Button */}
        <button className={styles.aiButton} onClick={onOpenChat}>
          <div className={styles.aiButtonIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            </svg>
          </div>
          <span className={styles.aiButtonText}>AI Assistant</span>
        </button>
      </div>
    </header>
  );
}
