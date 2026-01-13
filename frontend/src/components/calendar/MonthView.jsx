import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function MonthView({ 
  events, 
  onDateClick, 
  onEventClick 
}) {
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
