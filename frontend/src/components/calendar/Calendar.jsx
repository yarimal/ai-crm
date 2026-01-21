import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import MonthView from './MonthView';
import DayView from './DayView';
import EventModal from '../ui/EventModal';
import ProviderFilter from './ProviderFilter';
import { extractEventData } from '../../utils/eventUtils';
import { getISODateString } from '../../utils/dateUtils';
import config from '../../config';

const API_BASE = config.apiBaseUrl;

// Inline appointment service
const appointmentService = {
  async getAll() {
    const res = await fetch(`${API_BASE}/appointments`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },
  
  async create(data) {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create appointment');
    return res.json();
  },
  
  async update(id, data) {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update appointment');
    return res.json();
  },
  
  async delete(id) {
    const res = await fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete appointment');
    return true;
  }
};

// Blocked times service
const blockedTimeService = {
  async getAll(providerId = null) {
    const url = providerId 
      ? `${API_BASE}/blocked-times?provider_id=${providerId}`
      : `${API_BASE}/blocked-times`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch blocked times');
    return res.json();
  }
};

export default function Calendar({ refreshTrigger, onEventsLoaded, eventToEdit, onEditComplete }) {
  const [currentView, setCurrentView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // Use ref to avoid infinite loop
  const onEventsLoadedRef = useRef(onEventsLoaded);
  onEventsLoadedRef.current = onEventsLoaded;

  // Filter events by selected provider
  const filteredEvents = useMemo(() => {
    if (!selectedProviderId) return events;
    return events.filter(event => event.providerId === selectedProviderId);
  }, [events, selectedProviderId]);

  // Filter blocked times by selected provider
  const filteredBlockedTimes = useMemo(() => {
    if (!selectedProviderId) return blockedTimes;
    return blockedTimes.filter(bt => bt.providerId === selectedProviderId);
  }, [blockedTimes, selectedProviderId]);

  // Combine appointments and blocked times for calendar display
  const calendarEvents = useMemo(() => {
    const appointmentEvents = filteredEvents.map(event => {
      // Override color and title for cancelled appointments
      if (event.status === 'cancelled') {
        return {
          ...event,
          title: `❌ ${event.title}`,
          color: '#d32f2f',
          backgroundColor: '#d32f2f',
          borderColor: '#b71c1c',
          textColor: '#fff',
          isBlockedTime: false
        };
      }
      return {
        ...event,
        isBlockedTime: false
      };
    });
    
    const blockedEvents = filteredBlockedTimes.map(bt => ({
      id: `blocked-${bt.id}`,
      title: `🚫 ${bt.reason || bt.blockType || 'Blocked'}`,
      start: bt.start,
      end: bt.end,
      color: '#9e9e9e',
      backgroundColor: '#9e9e9e',
      borderColor: '#757575',
      textColor: '#fff',
      isBlockedTime: true,
      blockType: bt.blockType,
      reason: bt.reason,
      providerId: bt.providerId,
      extendedProps: {
        isBlockedTime: true,
        blockType: bt.blockType,
        reason: bt.reason
      }
    }));
    
    return [...appointmentEvents, ...blockedEvents];
  }, [filteredEvents, filteredBlockedTimes]);

  // Fetch events and blocked times
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both appointments and blocked times
      const [appointmentsData, blockedData] = await Promise.all([
        appointmentService.getAll(),
        blockedTimeService.getAll()
      ]);
      
      setEvents(appointmentsData);
      setBlockedTimes(blockedData);
      
      if (onEventsLoadedRef.current) {
        onEventsLoadedRef.current(appointmentsData);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load appointments. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchEvents();
    }
  }, [refreshTrigger, fetchEvents]);

  // Handle edit from search
  useEffect(() => {
    if (eventToEdit) {
      const eventData = {
        id: eventToEdit.id,
        title: eventToEdit.title || eventToEdit.clientName,
        description: eventToEdit.notes || eventToEdit.description || '',
        start: eventToEdit.start,
        end: eventToEdit.end,
        color: eventToEdit.color || '#1a73e8'
      };
      setEditingEvent(eventData);
      setIsModalOpen(true);
    }
  }, [eventToEdit]);

  // Event CRUD
  const addEvent = async (newEvent) => {
    try {
      const created = await appointmentService.create(newEvent);
      const updatedEvents = [...events, created];
      setEvents(updatedEvents);
      if (onEventsLoadedRef.current) onEventsLoadedRef.current(updatedEvents);
      return created;
    } catch (err) {
      console.error('Failed to create event:', err);
      throw err;
    }
  };

  const updateEvent = async (updatedEvent) => {
    try {
      const updated = await appointmentService.update(updatedEvent.id, updatedEvent);
      const updatedEvents = events.map(event => 
        event.id === updated.id ? updated : event
      );
      setEvents(updatedEvents);
      if (onEventsLoadedRef.current) onEventsLoadedRef.current(updatedEvents);
      return updated;
    } catch (err) {
      console.error('Failed to update event:', err);
      throw err;
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      await appointmentService.delete(eventId);
      const updatedEvents = events.filter(event => event.id !== eventId);
      setEvents(updatedEvents);
      if (onEventsLoadedRef.current) onEventsLoadedRef.current(updatedEvents);
    } catch (err) {
      console.error('Failed to delete event:', err);
      throw err;
    }
  };

  // Handlers
  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setCurrentView('day');
  };

  const handleEventClick = (clickInfo) => {
    // Don't open modal for blocked times
    if (clickInfo.event.extendedProps?.isBlockedTime) {
      return;
    }
    
    clickInfo.jsEvent.preventDefault();
    clickInfo.jsEvent.stopPropagation();
    setEditingEvent(extractEventData(clickInfo.event));
    setIsModalOpen(true);
  };

  const handleModalSave = async (formData) => {
    try {
      if (editingEvent) {
        const dateBase = getISODateString(editingEvent.start);
        await updateEvent({
          id: editingEvent.id,
          provider_id: formData.providerId,
          client_id: formData.clientId,
          service_id: formData.serviceId || null,
          start: `${dateBase}T${formData.startTime}:00`,
          end: `${dateBase}T${formData.endTime}:00`,
          service_type: formData.serviceType,
          status: formData.status,
          notes: formData.notes,
          color: formData.color,
        });
      } else {
        const dateBase = selectedSlot ? selectedSlot.split('T')[0] : new Date().toISOString().split('T')[0];
        await addEvent({
          provider_id: formData.providerId,
          client_id: formData.clientId,
          service_id: formData.serviceId || null,
          start: `${dateBase}T${formData.startTime}:00`,
          end: `${dateBase}T${formData.endTime}:00`,
          service_type: formData.serviceType,
          notes: formData.notes,
          color: formData.color,
        });
      }
      handleModalClose();
    } catch (err) {
      console.error('Error in handleModalSave:', err);
      alert('Failed to save. Please try again.');
    }
  };

  const handleModalDelete = async (eventId) => {
    try {
      await deleteEvent(eventId);
      handleModalClose();
    } catch (err) {
      alert('Failed to delete. Please try again.');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setSelectedSlot(null);
    if (onEditComplete) {
      onEditComplete();
    }
  };

  // Loading
  if (loading) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'white' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            border: '3px solid #e8eaed',
            borderTopColor: '#1a73e8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#5f6368' }}>Loading appointments...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'white' 
      }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: '#d93025', marginBottom: 16 }}>{error}</p>
          <button 
            onClick={fetchEvents}
            style={{
              padding: '10px 24px',
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: 24,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, backgroundColor: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Provider Filter Bar */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff'
      }}>
        <ProviderFilter 
          selectedProviderId={selectedProviderId}
          onProviderChange={setSelectedProviderId}
        />
        <div style={{ fontSize: 13, color: '#5f6368' }}>
          {filteredEvents.length} appointment{filteredEvents.length !== 1 ? 's' : ''}
          {filteredBlockedTimes.length > 0 && ` • ${filteredBlockedTimes.length} blocked`}
        </div>
      </div>

      {/* Calendar View */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {currentView === 'month' ? (
          <>
            <MonthView 
              events={calendarEvents}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
            <EventModal 
              isOpen={isModalOpen} 
              onClose={handleModalClose} 
              onSave={handleModalSave}
              onDelete={handleModalDelete}
              defaultDate={selectedSlot}
              editEvent={editingEvent}
              defaultProviderId={selectedProviderId}
            />
          </>
        ) : (
          <DayView 
            currentDate={selectedDate} 
            events={calendarEvents} 
            onAddEvent={addEvent}
            onUpdateEvent={updateEvent}
            onDeleteEvent={deleteEvent}
            onBack={() => setCurrentView('month')}
            defaultProviderId={selectedProviderId}
          />
        )}
      </div>
    </div>
  );
}