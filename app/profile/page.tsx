'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { encryptMessage, decryptMessage, isMessageEncrypted } from '../lib/encryption';

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
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compose' | 'sent'>('compose');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and load their messages
    const storedUserId = sessionStorage.getItem('userId');
    const storedKey = sessionStorage.getItem('encryptionKey');
    if (!storedUserId || !storedKey) {
      router.push('/');
    } else {
      setUserId(storedUserId);
      setEncryptionKey(storedKey);
      setIsAuthenticated(true);
      loadMessages(storedUserId, storedKey);
    }
  }, [router]);

  const loadMessages = async (uid: string, key: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('id, recipient, content, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Decrypt messages and migrate any unencrypted ones
      const formattedMessages: Message[] = await Promise.all(
        (data || []).map(async (msg: any) => {
          let decryptedRecipient: string;
          let decryptedContent: string;
          const contentEncrypted = await isMessageEncrypted(msg.content, key);
          const recipientEncrypted = await isMessageEncrypted(msg.recipient, key);
          
          console.log(`Message ${msg.id}: content encrypted=${contentEncrypted}, recipient encrypted=${recipientEncrypted}`);
          
          if (contentEncrypted && recipientEncrypted) {
            // Already encrypted, just decrypt for display
            decryptedRecipient = await decryptMessage(msg.recipient, key);
            decryptedContent = await decryptMessage(msg.content, key);
          } else {
            // Plain text fields - encrypt them and update in database
            decryptedRecipient = recipientEncrypted ? await decryptMessage(msg.recipient, key) : msg.recipient;
            decryptedContent = contentEncrypted ? await decryptMessage(msg.content, key) : msg.content;
            
            const encryptedRecipient = recipientEncrypted ? msg.recipient : await encryptMessage(msg.recipient, key);
            const encryptedContent = contentEncrypted ? msg.content : await encryptMessage(msg.content, key);
            
            // Update the message in the database with encrypted version
            await supabase
              .from('messages')
              .update({ 
                recipient: encryptedRecipient,
                content: encryptedContent 
              })
              .eq('id', msg.id);
            
            console.log(`Migrated message ${msg.id} to encrypted format`);
          }
          
          console.log(`Displaying - recipient: ${decryptedRecipient}, content preview: ${decryptedContent.substring(0, 50)}...`);
          
          return {
            id: msg.id,
            recipient: decryptedRecipient,
            content: decryptedContent,
            timestamp: new Date(msg.created_at).toLocaleString(),
          };
        })
      );

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

    if (!userId || !encryptionKey) {
      setError('User not authenticated');
      return;
    }

    try {
      // Encrypt both the recipient and message before sending
      const encryptedRecipient = await encryptMessage(recipient.trim(), encryptionKey);
      const encryptedContent = await encryptMessage(content.trim(), encryptionKey);

      const { data: newMsg, error: insertError } = await supabase
        .from('messages')
        .insert([
          {
            user_id: userId,
            recipient: encryptedRecipient,
            content: encryptedContent,
          },
        ])
        .select('id, recipient, content, created_at')
        .single();

      if (insertError) throw insertError;

      // Decrypt for display
      const decryptedRecipient = await decryptMessage(newMsg.recipient, encryptionKey);
      const decryptedContent = await decryptMessage(newMsg.content, encryptionKey);

      const formattedMessage: Message = {
        id: newMsg.id,
        recipient: decryptedRecipient,
        content: decryptedContent,
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
    sessionStorage.removeItem('encryptionKey');
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
