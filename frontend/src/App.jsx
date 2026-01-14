import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Calendar from './components/calendar/Calendar';
import ProvidersPage from './components/pages/ProvidersPage';
import ClientsPage from './components/pages/ClientsPage';
import Dashboard from './components/pages/Dashboard';
import AIChat from './components/chat/AIChat';
import './styles/App.css';

function App() {
  const [activeView, setActiveView] = useState('calendar');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);
  const [events, setEvents] = useState([]);
  const [eventToEdit, setEventToEdit] = useState(null);

  const handleEventsChanged = () => {
    setCalendarRefreshTrigger(prev => prev + 1);
  };

  const handleEventsLoaded = (loadedEvents) => {
    setEvents(loadedEvents);
  };

  const handleEditEvent = (event) => {
    setEventToEdit(event);
  };

  const handleEditComplete = () => {
    setEventToEdit(null);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'providers':
        return <ProvidersPage />;
      case 'clients':
        return <ClientsPage />;
      case 'calendar':
      default:
        return (
          <Calendar
            refreshTrigger={calendarRefreshTrigger}
            onEventsLoaded={handleEventsLoaded}
            eventToEdit={eventToEdit}
            onEditComplete={handleEditComplete}
          />
        );
    }
  };

  return (
    <div className="app-layout">
      <Sidebar 
        activeView={activeView}
        onViewChange={setActiveView}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenChat={() => setIsChatOpen(true)}
      />
      
      <div className="main-area">
        <Header 
          onOpenChat={() => setIsChatOpen(true)}
          events={events}
          onEditEvent={handleEditEvent}
        />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>

      <AIChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        onAppointmentChange={handleEventsChanged}
      />
    </div>
  );
}

export default App;