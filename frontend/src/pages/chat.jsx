import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import useAxios from '@/utils/useAxios';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const api = useAxios();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== '') {
      setMessages([...messages, { text: inputMessage, sender: 'user' }]);
      setInputMessage('');
      // Simulate a response from the AI
      const response = api.post('/chat/', { message: inputMessage });
      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, { text: 'AI response', sender: 'ai' }]);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 text-center">
        <h1 className="text-2xl font-bold">Cosmic Chat</h1>
      </header>
      <div className="flex-grow overflow-auto p-4" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'} rounded-lg p-3 shadow-lg`}>
              <p className="text-sm">{message.text}</p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="bg-gray-800 p-4 flex">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow bg-gray-700 text-white rounded-l-lg px-4 py-2 focus:outline-none"
        />
        <button type="submit" className="bg-blue-600 text-white rounded-r-lg px-6 py-2 hover:bg-blue-700 transition duration-300">
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPage;