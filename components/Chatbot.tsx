
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Product } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatIcon, CloseIcon, SendIcon } from './icons';

interface ChatbotProps {
  products: Product[];
}

const Chatbot: React.FC<ChatbotProps> = ({ products }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialMessage: ChatMessage = { role: 'model', text: '¡Hola! Soy NutriBot. ¿En qué puedo ayudarte hoy?' };

  useEffect(() => {
    if (isOpen) {
      setMessages([initialMessage]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (textToSend.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(textToSend, products);
      const modelMessage: ChatMessage = { role: 'model', text: responseText };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'model', text: 'Hubo un error al conectar con el asistente. Intenta de nuevo.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestionButtons = [
    "Consultar stock",
    "Registrar producto",
    "Ayuda rápida",
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-brand-primary text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-brand-primary/90 transition-transform duration-300 transform hover:scale-110 z-50"
        aria-label="Abrir chat de ayuda"
        title="Habla con NutriBot, el asistente de IA"
      >
        {isOpen ? <CloseIcon className="w-8 h-8"/> : <ChatIcon className="w-8 h-8" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[32rem] bg-white rounded-lg shadow-2xl flex flex-col z-50 transition-opacity duration-300 animate-fade-in-up">
          <header className="bg-brand-dark text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold">Asistente NutriBot</h3>
          </header>

          <div className="flex-grow p-4 overflow-y-auto bg-slate-50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-brand-secondary text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="max-w-xs px-4 py-2 rounded-2xl bg-slate-200 text-slate-800 rounded-bl-none">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                    </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-2 border-t bg-slate-50">
            <div className="flex space-x-2 mb-2">
                {suggestionButtons.map(text => (
                    <button 
                        key={text}
                        onClick={() => handleSend(text)}
                        className="text-xs border border-brand-secondary text-brand-secondary rounded-full px-3 py-1 hover:bg-brand-secondary/10"
                    >
                       {text}
                    </button>
                ))}
            </div>
          </div>

          <div className="p-4 border-t">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
              <div className="flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  className="flex-grow border rounded-l-md px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  disabled={isLoading}
                />
                <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-r-md hover:bg-brand-primary/90 disabled:bg-slate-400" disabled={isLoading}>
                  <SendIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
       <style>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Chatbot;