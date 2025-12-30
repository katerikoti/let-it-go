'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

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
  const [userId, setUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compose' | 'sent'>('compose');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and load their messages
    const storedUserId = sessionStorage.getItem('userId');
    if (!storedUserId) {
      router.push('/');
    } else {
      setUserId(storedUserId);
      setIsAuthenticated(true);
      loadMessages(storedUserId);
    }
  }, [router]);

  const loadMessages = async (uid: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('id, recipient, content, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        recipient: msg.recipient,
        content: msg.content,
        timestamp: new Date(msg.created_at).toLocaleString(),
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recipient.trim() || !content.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!userId) {
      setError('User not authenticated');
      return;
    }

    try {
      const { data: newMsg, error: insertError } = await supabase
        .from('messages')
        .insert([
          {
            user_id: userId,
            recipient: recipient.trim(),
            content: content.trim(),
          },
        ])
        .select('id, recipient, content, created_at')
        .single();

      if (insertError) throw insertError;

      const formattedMessage: Message = {
        id: newMsg.id,
        recipient: newMsg.recipient,
        content: newMsg.content,
        timestamp: new Date(newMsg.created_at).toLocaleString(),
      };

      setMessages([formattedMessage, ...messages]);
      setRecipient('');
      setContent('');
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error(err);
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setMessages(messages.filter((msg) => msg.id !== id));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('username');
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
                Log out
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
              {expandedMessageId ? (
                // Expanded message detail view
                (() => {
                  const msg = messages.find((m) => m.id === expandedMessageId);
                  return msg ? (
                    <div className="sent-message-detail">
                      <span
                        className="back-to-list-text"
                        onClick={() => setExpandedMessageId(null)}
                      >
                        ← Back to Sent
                      </span>
                      <div className="message-detail-frame">
                        <div className="message-detail-content">
                          <div className="detail-header">
                            <h2>{msg.recipient}</h2>
                            <span className="detail-timestamp">{msg.timestamp}</span>
                          </div>
                          <p className="detail-message">{msg.content}</p>
                        </div>
                      </div>
                      <button
                        className="delete-sent-button"
                        onClick={() => {
                          deleteMessage(msg.id);
                          setExpandedMessageId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null;
                })()
              ) : messages.length === 0 ? (
                <div className="sent-empty">
                  <p>No messages sent yet.</p>
                </div>
              ) : (
                <div className="sent-view-list">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="sent-view-item-title"
                      onClick={() => setExpandedMessageId(msg.id)}
                    >
                      <div className="sent-list-item-content">
                        <h3>{msg.recipient}</h3>
                        <span className="sent-list-item-timestamp">
                          {msg.timestamp}
                        </span>
                      </div>
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
