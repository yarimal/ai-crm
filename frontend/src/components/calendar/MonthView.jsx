import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function MonthView({
  events,
  onDateClick,
  onEventClick,
  sidebarCollapsed
}) {
  const calendarRef = useRef(null);

  // Force calendar to resize when sidebar state changes
  useEffect(() => {
    // Trigger immediately for instant response
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.updateSize();
    }

    // Also trigger after animation completes to ensure accuracy
    const timer = setTimeout(() => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [sidebarCollapsed]);

  // Also handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const renderEventContent = (eventInfo) => {
    return (
      <div className="fc-custom-event">
        <span className="fc-event-time">{eventInfo.timeText}</span>
        <span className="fc-event-title">{eventInfo.event.title}</span>
      </div>
    );
  };

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: ''
      }}
      events={events}
      dateClick={onDateClick}
      eventClick={onEventClick}
      height="100%"
      dayMaxEvents={3}
      eventContent={renderEventContent}
      eventDisplay="block"
      fixedWeekCount={false}
      showNonCurrentDates={true}
      eventTimeFormat={{
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }}
      eventDidMount={(info) => {
        info.el.title = info.event.extendedProps.description || info.event.title;
        info.el.style.cursor = 'pointer';
      }}
    />
  );
}
