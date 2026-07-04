import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { X, Send, Sparkles } from 'lucide-react';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  products?: any[];
}

export const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, addToCart, removeFromCart } = useCart();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: '👋 Hi! I am your **Blinkit AI assistant**. Ask me anything about our groceries!\n\nTry asking me:\n- *"I need breakfast under ₹500"*\n- *"Find healthy snacks"*\n- *"Show products for making pasta"*'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userText = textToSend;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      // Build chat history context payload
      const chatHistory = messages.map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          chat_history: chatHistory
        })
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.reply,
          products: data.products
        }
      ]);
    } catch (e) {
      console.error('Chat error:', e);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: '⚠️ Sorry, I could not complete your request. Please check if your FastAPI server is running on `http://localhost:8000`.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset: string) => {
    handleSend(preset);
  };

  const parseMessageText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let content = line;
      // Handle Bold markdown formatting: **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(content)) !== null) {
        parts.push(content.substring(lastIndex, match.index));
        parts.push(
          <strong key={match.index} className="font-extrabold text-neutral-900">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }
      parts.push(content.substring(lastIndex));

      // Handle Bullet points: - point
      if (line.trim().startsWith('- ')) {
        const lineText = line.replace(/^\s*-\s+/, '');
        // Run bold regex on the stripped line text
        const bulletParts: React.ReactNode[] = [];
        let bIdx = 0;
        let bMatch;
        const subRegex = /\*\*(.*?)\*\*/g;
        while ((bMatch = subRegex.exec(lineText)) !== null) {
          bulletParts.push(lineText.substring(bIdx, bMatch.index));
          bulletParts.push(
            <strong key={bMatch.index} className="font-extrabold text-neutral-900">
              {bMatch[1]}
            </strong>
          );
          bIdx = subRegex.lastIndex;
        }
        bulletParts.push(lineText.substring(bIdx));

        return (
          <li key={idx} className="list-disc ml-4 mt-1 text-xs text-neutral-700 pl-0.5">
            {bulletParts}
          </li>
        );
      }
      return (
        <p key={idx} className="text-xs text-neutral-700 leading-relaxed mt-1">
          {parts}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Chat Window Panel */}
      {isOpen && (
        <div className="bg-white w-[340px] h-[480px] rounded-3xl border border-neutral-200 shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-yellow-400 p-4 flex justify-between items-center border-b border-yellow-500/30">
            <div className="flex items-center space-x-2 text-neutral-900">
              <Sparkles className="h-4.5 w-4.5 fill-current animate-pulse text-amber-900" />
              <span className="font-black text-sm uppercase tracking-wide">Blinkit AI</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-neutral-950 hover:bg-yellow-500 p-1.5 rounded-xl transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-neutral-50/50 scrollbar-thin">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`p-3 rounded-2xl max-w-[85%] text-left text-xs ${
                    msg.sender === 'user' 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-white border border-neutral-200 rounded-tl-none shadow-sm text-neutral-800'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="leading-relaxed font-semibold">{msg.text}</p>
                  ) : (
                    <div className="space-y-1">
                      {parseMessageText(msg.text)}
                    </div>
                  )}

                  {/* Recommendations Product list rendering */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3 max-w-[280px]">
                      {msg.products.map((product) => {
                        const cartItem = cartItems.find((item) => String(item.id) === String(product.id));
                        const qty = cartItem ? cartItem.qty : 0;
                        return (
                          <div 
                            key={product.id}
                            className="bg-neutral-50 rounded-xl border border-neutral-200 p-2 flex flex-col justify-between text-left shadow-sm hover:shadow transition-shadow"
                          >
                            <div 
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/product/${product.id}`);
                              }}
                              className="bg-white rounded-lg h-16 flex items-center justify-center mb-1.5 relative cursor-pointer hover:bg-neutral-50 overflow-hidden p-1.5"
                            >
                              <img 
                                src={product.icon} 
                                alt={product.name} 
                                className="h-full w-full object-contain mix-blend-multiply" 
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop";
                                }}
                              />
                              {product.discount && (
                                <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {product.discount}
                                </span>
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <h5 
                                onClick={() => {
                                  setIsOpen(false);
                                  navigate(`/product/${product.id}`);
                                }}
                                className="text-[9px] font-black text-neutral-850 line-clamp-1 cursor-pointer hover:text-yellow-600"
                              >
                                {product.name}
                              </h5>
                              <p className="text-[7.5px] text-neutral-550 font-bold">{product.size}</p>
                              <div className="flex justify-between items-center pt-1">
                                <span className="text-[10px] font-black text-neutral-900">₹{product.price}</span>
                                {qty > 0 ? (
                                  <div className="bg-emerald-600 text-white rounded-md flex items-center overflow-hidden">
                                    <button 
                                      onClick={() => removeFromCart(product.id)}
                                      className="px-1 py-0.5 text-[9px] font-black hover:bg-emerald-700"
                                    >
                                      -
                                    </button>
                                    <span className="px-1 text-[9px] font-black min-w-[6px] text-center">{qty}</span>
                                    <button 
                                      onClick={() => addToCart(product)}
                                      className="px-1 py-0.5 text-[9px] font-black hover:bg-emerald-700"
                                      disabled={qty >= (product.stock || 15)}
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => addToCart(product)}
                                    className="bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 font-black text-[8px] px-2 py-0.5 rounded-md flex items-center"
                                  >
                                    ADD
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-neutral-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Buttons */}
          <div className="px-4 py-2 bg-neutral-50/50 border-t border-neutral-100 flex space-x-1.5 overflow-x-auto scrollbar-none shrink-0">
            {[
              'I need breakfast under ₹500',
              'Find healthy snacks',
              'Show products for making pasta'
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(p)}
                className="bg-white border border-neutral-200 hover:border-yellow-400 px-3 py-1.5 rounded-full text-[10px] font-black text-neutral-600 whitespace-nowrap active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 border-t border-neutral-100 flex items-center space-x-2 shrink-0 bg-white"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for recipe materials, diets, budgets..."
              className="flex-grow border border-neutral-200 focus:outline-none focus:border-yellow-400 rounded-xl px-3 py-2 text-xs font-semibold"
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className={`p-2.5 rounded-xl shadow transition-all ${
                !input.trim() || loading
                  ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                  : 'bg-yellow-400 text-neutral-900 hover:bg-yellow-500 cursor-pointer active:scale-95'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* Floating Chat Bubble Button */}
      <button 
        onClick={() => navigate('/blinkai')}
        className="bg-yellow-400 hover:bg-yellow-500 text-neutral-950 h-14 w-14 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform relative group border border-yellow-500/10 cursor-pointer"
      >
        <Sparkles className="h-6 w-6 fill-current animate-pulse text-emerald-800" />
        <span className="absolute -top-1 -left-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        
        {/* Hover Tooltip */}
        <span className="absolute right-16 bg-neutral-900 text-white text-[10px] font-black py-1.5 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow whitespace-nowrap uppercase tracking-wider">
          BlinkAI Planner
        </span>
      </button>

    </div>
  );
};
