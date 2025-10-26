import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import './MessagesView.css'

export default function MessagesView() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUserId) {
      loadConversations()
      subscribeToMessages()
    }
  }, [currentUserId])

  useEffect(() => {
    if (selectedConversation && currentUserId) {
      loadMessages(selectedConversation.id)
    }
  }, [selectedConversation, currentUserId])

  const loadCurrentUser = async () => {
    const user = await supabase.auth.getUser()
    setCurrentUserId(user.data.user.id)
  }

  const subscribeToMessages = () => {
    // Subscribe to new messages in real-time
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          // Reload conversations and messages when new message arrives
          loadConversations()
          if (selectedConversation) {
            loadMessages(selectedConversation.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const loadConversations = async () => {
    try {
      setLoading(true)

      // Get all messages where user is sender or receiver
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(id, full_name), receiver:profiles!messages_receiver_id_fkey(id, full_name)')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group messages by conversation partner
      const conversationsMap = new Map()

      allMessages.forEach(msg => {
        const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id
        const partnerName = msg.sender_id === currentUserId ? msg.receiver.full_name : msg.sender.full_name

        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            id: partnerId,
            name: partnerName,
            lastMessage: msg.message,
            lastMessageTime: msg.created_at,
            unread: msg.receiver_id === currentUserId && !msg.read
          })
        }
      })

      setConversations(Array.from(conversationsMap.values()))
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (partnerId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(full_name), receiver:profiles!messages_receiver_id_fkey(full_name)')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', currentUserId)
        .eq('sender_id', partnerId)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedConversation.id,
          message: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      loadMessages(selectedConversation.id)
      loadConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="messages-loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="messages-container">
      <div className="conversations-list">
        <h3 style={{fontSize: '16px', marginBottom: '16px', padding: '0 12px'}}>Messages</h3>

        {conversations.length === 0 ? (
          <div className="empty-state" style={{padding: '20px'}}>
            <p className="text-muted text-center">No messages yet</p>
          </div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
              onClick={() => setSelectedConversation(conv)}
            >
              <div className="conversation-avatar">
                {conv.name.charAt(0).toUpperCase()}
              </div>
              <div className="conversation-info">
                <div className="conversation-name">{conv.name}</div>
                <div className="conversation-preview">{conv.lastMessage}</div>
              </div>
              {conv.unread && <div className="unread-badge"></div>}
            </div>
          ))
        )}
      </div>

      <div className="messages-panel">
        {!selectedConversation ? (
          <div className="empty-state">
            <p className="text-muted">Select a conversation to view messages</p>
          </div>
        ) : (
          <>
            <div className="messages-header">
              <h3>{selectedConversation.name}</h3>
            </div>

            <div className="messages-list">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}
                >
                  <div className="message-bubble">
                    <div className="message-text">{msg.message}</div>
                    <div className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form className="message-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
                disabled={sending}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!newMessage.trim() || sending}
                style={{padding: '10px 20px'}}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
