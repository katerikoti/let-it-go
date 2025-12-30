'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  recipient: string;
  content: string;
  timestamp: string;
}

export default function ProfilePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compose' | 'sent'>('compose');
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and load their messages
    const user = localStorage.getItem('currentUser');
    if (!user) {
      router.push('/');
    } else {
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // Load messages for this user from localStorage
      const messagesKey = `messages_${user}`;
      const savedMessages = localStorage.getItem(messagesKey);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          setMessages([]);
        }
      }
    }
  }, [router]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recipient.trim() || !content.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      recipient: recipient.trim(),
      content: content.trim(),
      timestamp: new Date().toLocaleString(),
    };

    const updatedMessages = [newMessage, ...messages];
    setMessages(updatedMessages);
    
    // Save messages to localStorage for this user
    if (currentUser) {
      const messagesKey = `messages_${currentUser}`;
      localStorage.setItem(messagesKey, JSON.stringify(updatedMessages));
    }
    
    setRecipient('');
    setContent('');
  };

  const deleteMessage = (id: string) => {
    const updatedMessages = messages.filter((msg) => msg.id !== id);
    setMessages(updatedMessages);
    
    // Update localStorage for this user
    if (currentUser) {
      const messagesKey = `messages_${currentUser}`;
      localStorage.setItem(messagesKey, JSON.stringify(updatedMessages));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="profile-main">
      <div className="profile-layout">
        {/* Main compose section */}
        <section className="profile-container">
          <div className="profile-header">
            <h1 className="profile-title">
              {viewMode === 'compose' ? 'Write a Message' : 'Sent Messages'}
            </h1>
            <div className="profile-header-buttons">
              {viewMode === 'sent' && (
                <button
                  className="back-to-compose-button"
                  onClick={() => setViewMode('compose')}
                >
                  Write a Message
                </button>
              )}
              {viewMode === 'compose' && (
                <span
                  className="sent-text-header"
                  onClick={() => setViewMode('sent')}
                >
                  Sent ({messages.length})
                </span>
              )}
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          {viewMode === 'compose' ? (
            <div className="compose-section">
              {error && <div className="auth-error">{error}</div>}
              <form onSubmit={handleSendMessage} className="compose-form">
                <div className="form-group">
                  <label htmlFor="recipient">Recipient</label>
                  <input
                    id="recipient"
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter recipient name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your message here..."
                    rows={10}
                    required
                  />
                </div>

                <button type="submit" className="send-button">
                  Let it go
                </button>
              </form>
            </div>
          ) : (
            <div className="sent-view">
              {messages.length === 0 ? (
                <div className="sent-empty">
                  <p>No messages sent yet.</p>
                </div>
              ) : (
                <div className="sent-view-list">
                  {messages.map((msg) => (
                    <div key={msg.id} className="sent-view-item">
                      <div className="sent-view-item-header">
                        <h3>{msg.recipient}</h3>
                        <button
                          className="delete-sent-button"
                          onClick={() => deleteMessage(msg.id)}
                        >
                          Delete
                        </button>
                      </div>
                      <p>{msg.content}</p>
                      <span className="sent-view-timestamp">{msg.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
