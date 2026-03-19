import React, { createContext, useContext, useState, useCallback } from 'react';
import { CONVERSATIONS, SAMPLE_BIDS, SAMPLE_BOOKINGS, SAMPLE_ALLOWLIST } from '../data/sampleData';

const MessagingContext = createContext(null);

const SAMPLE_RCS = [
  {
    id: 'rc_CA001',
    loadId: 'CA001',
    brokerId: 'br4_user',
    carrierId: 'c1',
    origin: 'Chicago, IL', dest: 'Atlanta, GA', miles: 716,
    type: 'Dry Van', commodity: 'Consumer Electronics', weight: '42,000 lbs',
    pickup: '2026-03-20', delivery: '2026-03-21',
    rate: 2850, ratePerMile: 3.98,
    paymentTerms: 'Quick-Pay (5 days)',
    paymentMethod: 'ACH',
    brokerName: 'MoLo Solutions', brokerMc: 'MC-456789',
    brokerContact: 'Sarah Johnson', brokerPhone: '(312) 555-0192',
    carrierName: 'Mike Rodriguez', carrierMc: 'MC-123456', carrierDot: 'DOT-789012',
    brokerSignedAt: '2026-03-19T08:00:00Z', brokerSignature: 'Sarah Johnson',
    carrierSignedAt: null, carrierSignature: null,
    status: 'pending_carrier',
    createdAt: '2026-03-19T08:00:00Z',
    specialInstructions: 'Driver must have clean record. No tail-gating. Refrigeration not required.',
  },
];

export function MessagingProvider({ children }) {
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [bids, setBids] = useState(SAMPLE_BIDS);
  const [bookings, setBookings] = useState(SAMPLE_BOOKINGS);
  const [allowlist, setAllowlist] = useState(SAMPLE_ALLOWLIST);
  const [rateConfirmations, setRateConfirmations] = useState(SAMPLE_RCS);

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

  const addToAllowlist = useCallback((carrier, brokerId) => {
    const entry = {
      id: 'al_' + Date.now(),
      brokerId,
      carrierId: carrier.id || null,
      carrierEmail: carrier.email,
      carrierName: carrier.name,
      carrierMc: carrier.mc || null,
      source: carrier.source || 'search',
      addedAt: new Date().toISOString(),
    };
    setAllowlist(prev => [...prev, entry]);
    return entry;
  }, []);

  const removeFromAllowlist = useCallback((entryId) => {
    setAllowlist(prev => prev.filter(e => e.id !== entryId));
  }, []);

  const isOnAllowlist = useCallback((carrierId, carrierEmail, brokerId) => {
    return allowlist.some(e =>
      e.brokerId === brokerId &&
      (e.carrierId === carrierId || e.carrierEmail === carrierEmail)
    );
  }, [allowlist]);

  const generateRC = useCallback((bookingId, loadData, brokerData, carrierData) => {
    const now = new Date().toISOString();
    const newRC = {
      id: 'rc_' + bookingId,
      loadId: loadData.id,
      brokerId: brokerData.id,
      carrierId: carrierData.id,
      origin: loadData.origin,
      dest: loadData.dest,
      miles: loadData.miles,
      type: loadData.type,
      commodity: loadData.commodity,
      weight: loadData.weight,
      pickup: loadData.pickup,
      delivery: loadData.delivery,
      rate: loadData.rate,
      ratePerMile: loadData.ratePerMile,
      paymentTerms: brokerData.paymentTerms || 'Net-30',
      paymentMethod: brokerData.paymentMethod || 'ACH',
      brokerName: brokerData.name,
      brokerMc: brokerData.mc,
      brokerContact: brokerData.contact,
      brokerPhone: brokerData.phone,
      carrierName: carrierData.name,
      carrierMc: carrierData.mc,
      carrierDot: carrierData.dot,
      brokerSignedAt: now,
      brokerSignature: brokerData.name,
      carrierSignedAt: null,
      carrierSignature: null,
      status: 'pending_carrier',
      createdAt: now,
      specialInstructions: loadData.specialInstructions || '',
    };
    setRateConfirmations(prev => [...prev, newRC]);
    return newRC;
  }, []);

  const carrierSignRC = useCallback((rcId, signature) => {
    const now = new Date().toISOString();
    setRateConfirmations(prev => prev.map(rc =>
      rc.id === rcId
        ? { ...rc, carrierSignedAt: now, carrierSignature: signature, status: 'fully_signed' }
        : rc
    ));
  }, []);

  const getRCForLoad = useCallback((loadId) => {
    return rateConfirmations.find(rc => rc.loadId === loadId) || null;
  }, [rateConfirmations]);

  const unreadCount = (userId) => {
    return conversations.reduce((acc, c) => {
      return acc + c.messages.filter(m => m.senderId !== userId && !m.isRead).length;
    }, 0);
  };

  const pendingBookingsCount = (userId) => bookings.filter(b => b.status === 'pending').length;
  const pendingBidsCount = (userId) => bids.filter(b => b.status === 'pending').length;

  return (
    <MessagingContext.Provider value={{
      conversations, bids, bookings, allowlist, rateConfirmations,
      sendMessage, replyMessage,
      placeBid, respondBid,
      requestBooking, reviewBooking,
      addToAllowlist, removeFromAllowlist, isOnAllowlist,
      generateRC, carrierSignRC, getRCForLoad,
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
