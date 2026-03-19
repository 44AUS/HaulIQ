import React, { createContext, useContext, useState, useCallback } from 'react';
import { CONVERSATIONS, SAMPLE_BIDS, SAMPLE_BOOKINGS } from '../data/sampleData';

const MessagingContext = createContext(null);

export function MessagingProvider({ children }) {
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [bids, setBids] = useState(SAMPLE_BIDS);
  const [bookings, setBookings] = useState(SAMPLE_BOOKINGS);

  const sendMessage = useCallback((loadId, brokerId, brokerName, loadRoute, body, currentUser) => {
    setConversations(prev => {
      const existing = prev.find(c => c.loadId === loadId && c.carrierId === currentUser.id);
      const newMsg = {
        id: 'm_' + Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        body,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      if (existing) {
        return prev.map(c => c.id === existing.id
          ? { ...c, messages: [...c.messages, newMsg], updatedAt: new Date().toISOString() }
          : c
        );
      }
      return [...prev, {
        id: 'conv_' + Date.now(),
        loadId,
        carrierId: currentUser.id,
        brokerId,
        brokerName,
        loadRoute,
        updatedAt: new Date().toISOString(),
        messages: [newMsg],
      }];
    });
  }, []);

  // Broker reply
  const replyMessage = useCallback((conversationId, body, currentUser) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        updatedAt: new Date().toISOString(),
        messages: [...c.messages, {
          id: 'm_' + Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          body,
          createdAt: new Date().toISOString(),
          isRead: false,
        }],
      };
    }));
  }, []);

  const placeBid = useCallback((loadId, amount, note, currentUser) => {
    const newBid = {
      id: 'bid_' + Date.now(),
      loadId,
      carrierId: currentUser.id,
      amount,
      note,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setBids(prev => [...prev, newBid]);
    return newBid;
  }, []);

  const respondBid = useCallback((bidId, action, counterAmount, counterNote) => {
    setBids(prev => prev.map(b => b.id === bidId
      ? { ...b, status: action, counterAmount, counterNote }
      : b
    ));
  }, []);

  const requestBooking = useCallback((loadId, note, isInstant, currentUser) => {
    const newBooking = {
      id: 'bk_' + Date.now(),
      loadId,
      carrierId: currentUser.id,
      status: isInstant ? 'approved' : 'pending',
      isInstant,
      note,
      createdAt: new Date().toISOString(),
    };
    setBookings(prev => [...prev, newBooking]);
    return newBooking;
  }, []);

  const reviewBooking = useCallback((bookingId, approved, brokerNote) => {
    setBookings(prev => prev.map(b => b.id === bookingId
      ? { ...b, status: approved ? 'approved' : 'denied', brokerNote }
      : b
    ));
  }, []);

  const unreadCount = (userId) => {
    return conversations.reduce((acc, c) => {
      return acc + c.messages.filter(m => m.senderId !== userId && !m.isRead).length;
    }, 0);
  };

  const pendingBookingsCount = (userId) => bookings.filter(b => b.status === 'pending').length;
  const pendingBidsCount = (userId) => bids.filter(b => b.status === 'pending').length;

  return (
    <MessagingContext.Provider value={{
      conversations, bids, bookings,
      sendMessage, replyMessage,
      placeBid, respondBid,
      requestBooking, reviewBooking,
      unreadCount, pendingBookingsCount, pendingBidsCount,
    }}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error('useMessaging must be used within MessagingProvider');
  return ctx;
}
