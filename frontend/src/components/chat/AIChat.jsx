import React, { useState, useRef, useEffect } from 'react';
import styles from './AIChat.module.css';
import config from '../../config';

const API_BASE = config.apiBaseUrl;

// Check for browser speech support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSynthesis = window.speechSynthesis;

export default function AIChat({ isOpen, onClose, onAppointmentChange, onClientChange }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const recognitionRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        setInputValue(transcript);
        
        // If final result, stop listening
        if (event.results[0].isFinal) {
          setIsListening(false);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    const hasVoice = SpeechRecognition ? '\n\n🎤 Click the microphone to talk, or type your message.' : '';
    setMessages([{
      id: 'welcome',
      type: 'ai',
      content: `Hey! 👋 I'm your scheduling assistant. Just tell me what you need:\n\n• "What appointments do we have tomorrow?"\n• "Book John with Dr. Cohen at 3pm on Monday"\n• "When is Dr. Levy free this week?"\n• "Cancel the 10am appointment with Sarah"${hasVoice}`,
      timestamp: new Date()
    }]);
  }, []);

  // Start/stop listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Try Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputValue('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Text-to-speech
  const speak = (text) => {
    if (!speechSynthesis || !voiceEnabled) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    // Clean text (remove emojis and markdown)
    const cleanText = text
      .replace(/[*_~`#]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/•/g, ',')
      .replace(/\n+/g, '. ')
      .trim();
    
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to get a good voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Samantha') ||
      v.name.includes('Microsoft')
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const sendMessage = async (messageText = inputValue) => {
    const text = messageText.trim();
    if (!text || isLoading) return;

    // Stop listening if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          chat_id: chatId
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      if (!chatId && data.chatId) {
        setChatId(data.chatId);
      }

      const aiMessage = {
        id: data.aiMessage?.id || Date.now() + 1,
        type: 'ai',
        content: data.aiMessage?.content || 'Done!',
        timestamp: new Date(data.aiMessage?.createdAt || Date.now())
      };

      setMessages(prev => [...prev, aiMessage]);

      // Speak the response (remove IDs before speaking)
      if (voiceEnabled) {
        const textToSpeak = aiMessage.content.replace(/\[ID:\s*[a-f0-9-]+\]/gi, '');
        speak(textToSpeak);
      }

      // Notify parent if appointment was created/modified
      if (data.functionCalls?.length > 0) {
        const hasAppointmentAction = data.functionCalls.some(fc =>
          ['create_appointment', 'cancel_appointment'].includes(fc.function) &&
          fc.result?.success
        );
        if (hasAppointmentAction && onAppointmentChange) {
          onAppointmentChange();
        }

        const hasClientAction = data.functionCalls.some(fc =>
          fc.function === 'create_client' &&
          fc.result?.success
        );
        if (hasClientAction && onClientChange) {
          onClientChange();
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: '❌ Sorry, I had trouble processing that. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Parse service options from AI message
  const parseServices = (content) => {
    const services = [];

    // Check if this is a service selection prompt
    const isServicePrompt = content.toLowerCase().includes('would you like to add a service') ||
                           content.toLowerCase().includes('available:');

    if (!isServicePrompt) return services;

    // Split by lines and look for bullet points or service entries
    const lines = content.split('\n');

    for (const line of lines) {
      // Match patterns like:
      // "• Visit - $20.00 (30 min) [ID: uuid]"
      // "• Consultation - $30.00 (30 min) [ID: uuid]"
      const match = line.match(/[•\-]\s*(\w+(?:\s+\w+)?)\s*-\s*\$?([\d.]+)\s*(?:\((\d+)\s*min\))?\s*\[ID:\s*([a-f0-9-]+)\]/i);

      if (match) {
        services.push({
          name: match[1].trim(),
          price: match[2],
          duration: match[3] || null,
          id: match[4]
        });
      }
    }

    return services;
  };

  const handleServiceSelect = (serviceName) => {
    sendMessage(serviceName);
  };

  const handleSkipService = () => {
    sendMessage('no');
  };

  const formatContent = (content) => {
    return content.split('\n').map((line, i) => {
      // Hide [ID: uuid] from display but keep for parsing
      const displayLine = line.replace(/\[ID:\s*[a-f0-9-]+\]/gi, '').trim();

      return (
        <React.Fragment key={i}>
          {displayLine}
          {i < content.split('\n').length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.aiAvatar}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A1.5 1.5 0 0 0 6 14.5A1.5 1.5 0 0 0 7.5 16A1.5 1.5 0 0 0 9 14.5A1.5 1.5 0 0 0 7.5 13m9 0a1.5 1.5 0 0 0-1.5 1.5a1.5 1.5 0 0 0 1.5 1.5a1.5 1.5 0 0 0 1.5-1.5a1.5 1.5 0 0 0-1.5-1.5" />
              </svg>
            </div>
            <div>
              <h2 className={styles.headerTitle}>AI Assistant</h2>
              <span className={styles.headerStatus}>
                {isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : '● Online'}
              </span>
            </div>
          </div>
          <div className={styles.headerActions}>
            {/* Voice toggle */}
            <button 
              className={`${styles.voiceToggle} ${voiceEnabled ? styles.voiceOn : ''}`}
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (isSpeaking) stopSpeaking();
              }}
              title={voiceEnabled ? 'Voice responses on' : 'Voice responses off'}
            >
              {voiceEnabled ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>
            {/* Stop speaking button */}
            {isSpeaking && (
              <button className={styles.stopBtn} onClick={stopSpeaking} title="Stop speaking">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            )}
            {/* Close button */}
            <button className={styles.closeBtn} onClick={onClose} title="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`${styles.message} ${styles[message.type]} ${message.isError ? styles.error : ''}`}
          >
            {message.type === 'ai' && (
              <div className={styles.messageAvatar}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2" />
                </svg>
              </div>
            )}
            <div className={styles.messageContent}>
              <div className={styles.messageText}>
                {formatContent(message.content)}
              </div>

              {/* Service Selection Buttons */}
              {message.type === 'ai' && (() => {
                const services = parseServices(message.content);
                if (services.length > 0) {
                  return (
                    <div className={styles.serviceButtons}>
                      {services.map((service) => (
                        <button
                          key={service.id}
                          className={styles.serviceButton}
                          onClick={() => handleServiceSelect(service.name)}
                        >
                          <div className={styles.serviceName}>{service.name}</div>
                          <div className={styles.serviceDetails}>
                            {service.price && `$${service.price}`}
                            {service.price && service.duration && ' • '}
                            {service.duration && `${service.duration} min`}
                          </div>
                        </button>
                      ))}
                      <button
                        className={styles.skipButton}
                        onClick={handleSkipService}
                      >
                        Skip / No service
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              <span className={styles.messageTime}>
                {formatTime(message.timestamp)}
              </span>
            </div>
            {/* Replay button for AI messages */}
            {message.type === 'ai' && message.id !== 'welcome' && voiceEnabled && (
              <button 
                className={styles.replayBtn}
                onClick={() => speak(message.content)}
                title="Listen again"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </button>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className={`${styles.message} ${styles.ai}`}>
            <div className={styles.messageAvatar}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2" />
              </svg>
            </div>
            <div className={styles.typing}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <div className={`${styles.inputWrapper} ${isListening ? styles.listening : ''}`}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Type or speak your message..."}
            className={styles.input}
            rows={1}
            disabled={isLoading}
          />
          
          {/* Microphone button */}
          {SpeechRecognition && (
            <button 
              className={`${styles.micButton} ${isListening ? styles.micActive : ''}`}
              onClick={toggleListening}
              disabled={isLoading}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          )}
          
          {/* Send button */}
          <button 
            className={styles.sendButton}
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        
        {/* Voice indicator */}
        {isListening && (
          <div className={styles.listeningIndicator}>
            <div className={styles.pulseRing}></div>
            <span>🎤 Listening... speak now</span>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}