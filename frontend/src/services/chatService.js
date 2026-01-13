/**
 * Chat Service - AI chat API operations
 */
import api from './api';

/**
 * Send a message to AI and get a response
 * @param {string} message - User's message
 * @param {string} chatId - Optional chat ID to continue conversation
 */
export async function sendMessage(message, chatId = null) {
  const payload = {
    message,
  };
  
  if (chatId) {
    payload.chat_id = chatId;
  }
  
  return api.post('/ai/chat', payload);
}

/**
 * Get all chat sessions
 * @param {number} skip - Pagination offset
 * @param {number} limit - Number of chats to return
 */
export async function getChats(skip = 0, limit = 20) {
  return api.get(`/chats?skip=${skip}&limit=${limit}`);
}

/**
 * Get a specific chat with all messages
 * @param {string} chatId 
 */
export async function getChat(chatId) {
  return api.get(`/chats/${chatId}`);
}

/**
 * Delete a chat
 * @param {string} chatId 
 */
export async function deleteChat(chatId) {
  return api.delete(`/chats/${chatId}`);
}

/**
 * Search AI memory for similar content
 * @param {string} query - Search query
 * @param {number} limit - Max results
 */
export async function searchMemory(query, limit = 5) {
  return api.get(`/ai/search?query=${encodeURIComponent(query)}&limit=${limit}`);
}

/**
 * Get available AI models
 */
export async function getModels() {
  return api.get('/ai/models');
}

export default {
  sendMessage,
  getChats,
  getChat,
  deleteChat,
  searchMemory,
  getModels,
};
