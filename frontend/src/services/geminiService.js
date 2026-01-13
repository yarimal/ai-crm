/**
 * Gemini AI Service
 * 
 * This service handles all communication with the Gemini API.
 * Replace the placeholder values with your actual API credentials.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Send a message to Gemini and get a response
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} - The AI response
 */
export async function sendMessage(message, conversationHistory = []) {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured. Using simulated responses.');
    return getSimulatedResponse(message);
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          ...conversationHistory.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          })),
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
}

/**
 * Simulated responses for development/demo
 * @param {string} input - User input
 * @returns {string} - Simulated response
 */
function getSimulatedResponse(input) {
  const lower = input.toLowerCase();
  
  if (lower.includes('schedule') || lower.includes('meeting')) {
    return "I'd be happy to help you schedule a meeting! Just tell me the title, date, time, and any participants you'd like to invite.";
  } else if (lower.includes('today') || lower.includes('calendar')) {
    return "Looking at your calendar for today... You have a few events scheduled. Would you like me to give you a summary or help you add a new event?";
  } else if (lower.includes('help')) {
    return "I can help you with:\n• Scheduling new events\n• Finding free time slots\n• Summarizing your day/week\n• Setting reminders\n• Managing event details\n\nJust ask me anything!";
  } else if (lower.includes('hello') || lower.includes('hi')) {
    return "Hello! Great to chat with you. What would you like to do with your calendar today?";
  } else if (lower.includes('free') || lower.includes('available')) {
    return "Let me check your availability... Based on your calendar, you have some free slots tomorrow afternoon and Thursday morning. Would you like me to schedule something?";
  } else if (lower.includes('remind')) {
    return "I can set up a reminder for you! Just tell me what you'd like to be reminded about and when.";
  }
  
  return `I understand you're asking about "${input.substring(0, 30)}${input.length > 30 ? '...' : ''}". Once connected to Gemini, I'll be able to give you a more detailed response. Is there anything specific about your calendar I can help with?`;
}

export default {
  sendMessage
};
