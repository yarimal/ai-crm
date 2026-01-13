import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventModal from '../ui/EventModal';
import styles from './DayView.module.css';

export default function DayView({ currentDate, events, onAddEvent, onUpdateEvent, onDeleteEvent, onBack, defaultProviderId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  const date = new Date(currentDate);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNumber = date.getDate();

  const handleDateClick = (arg) => {
    setSelectedSlot(arg.dateStr);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    // Don't open modal for blocked times
    if (clickInfo.event.extendedProps?.isBlockedTime) {
      return;
    }
    
    clickInfo.jsEvent.preventDefault();
    clickInfo.jsEvent.stopPropagation();
    
    const event = clickInfo.event;
    setEditingEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      color: event.backgroundColor || event.extendedProps?.color,
      providerId: event.extendedProps?.providerId,
      clientId: event.extendedProps?.clientId,
      providerName: event.extendedProps?.providerName,
      clientName: event.extendedProps?.clientName,
      serviceType: event.extendedProps?.serviceType,
      status: event.extendedProps?.status,
      notes: event.extendedProps?.notes
    });
    setSelectedSlot(null);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      const dateBase = editingEvent 
        ? new Date(editingEvent.start).toISOString().split('T')[0]
        : selectedSlot.split('T')[0];
      
      const appointmentData = {
        provider_id: formData.providerId,
        client_id: formData.clientId,
        start: `${dateBase}T${formData.startTime}:00`,
        end: `${dateBase}T${formData.endTime}:00`,
        service_type: formData.serviceType,
        notes: formData.notes,
        color: formData.color
      };

      if (editingEvent) {
        appointmentData.id = editingEvent.id;
        appointmentData.status = formData.status;
        await onUpdateEvent(appointmentData);
      } else {
        await onAddEvent(appointmentData);
      }
      
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save appointment:', err);
      alert('Failed to save. Please make sure you selected a provider and client.');
    }
  };

  const handleDelete = async (eventId) => {
    try {
      await onDeleteEvent(eventId);
      handleCloseModal();
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete appointment.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    setEditingEvent(null);
  };

  const openNewAppointment = () => {
    setSelectedSlot(`${currentDate}T09:00:00`);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton} title="Back to Month">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className={styles.dateSection}>
          <span className={styles.monthYear}>{monthYear}</span>
          <div className={styles.dateRow}>
            <span className={styles.dayName}>{dayName}</span>
            <span className={isToday ? styles.dayNumberToday : styles.dayNumber}>
              {dayNumber}
            </span>
          </div>
        </div>

        <button onClick={openNewAppointment} className={styles.addButton} title="Add Appointment">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Add</span>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendarWrapper}>
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          initialDate={currentDate}
          headerToolbar={false}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="100%"
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          nowIndicator={true}
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            omitZeroMinute: true,
            meridiem: 'short'
          }}
          eventContent={(eventInfo) => {
            const isBlocked = eventInfo.event.extendedProps?.isBlockedTime;
            
            return (
              <div className={styles.eventContent} style={{ 
                opacity: isBlocked ? 0.7 : 1,
                cursor: isBlocked ? 'not-allowed' : 'pointer'
              }}>
                <div className={styles.eventTitle}>
                  {eventInfo.event.title}
                </div>
                <div className={styles.eventTime}>
                  {eventInfo.timeText}
                </div>
                {!isBlocked && eventInfo.event.extendedProps?.providerName && (
                  <div className={styles.eventDescription}>
                    👨‍⚕️ {eventInfo.event.extendedProps.providerName}
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSave}
        onDelete={handleDelete}
        defaultDate={selectedSlot}
        editEvent={editingEvent}
        defaultProviderId={defaultProviderId}
      />
    </div>
  );
}