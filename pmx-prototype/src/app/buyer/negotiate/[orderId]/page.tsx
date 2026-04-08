'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Message {
  sender: 'buyer' | 'seller'
  initials: string
  name: string
  text: string
  date: string
  offer?: {
    title: string
    price: string
    priceHighlight?: boolean
    qty: string
    leadTime: string
    leadTimeHighlight?: boolean
    incoterms: string
    isCurrent: boolean
  }
}

export default function NegotiatePage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [offerSending, setOfferSending] = useState(false)

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'buyer',
      initials: 'GM',
      name: 'Gulf Medical LLC',
      text: "Hi, we're interested in Amoxicillin 250mg. Can you supply 10M caps/month to Nigeria?",
      date: 'Mar 20, 09:14',
    },
    {
      sender: 'seller',
      initials: 'KP',
      name: 'Karachi PharmaCorp',
      text: "Yes, we can supply. Here's our initial offer:",
      date: 'Mar 20, 10:30',
      offer: {
        title: 'OFFER v1 \u2014 Karachi PharmaCorp',
        price: '$0.0062',
        qty: '10,000,000 caps/mo',
        leadTime: '55 days',
        incoterms: 'CIF Lagos',
        isCurrent: false,
      },
    },
    {
      sender: 'buyer',
      initials: 'GM',
      name: 'Gulf Medical LLC',
      text: 'Can we improve on price and lead time? Our ceiling is $0.0055/cap.',
      date: 'Mar 21, 08:45',
    },
    {
      sender: 'seller',
      initials: 'KP',
      name: 'Karachi PharmaCorp',
      text: 'Revised offer:',
      date: 'Mar 22, 11:00',
      offer: {
        title: 'OFFER v2 \u2014 Karachi PharmaCorp (CURRENT)',
        price: '$0.0057',
        priceHighlight: true,
        qty: '10,000,000 caps/mo',
        leadTime: '48 days',
        leadTimeHighlight: true,
        incoterms: 'CIF Lagos',
        isCurrent: true,
      },
    },
  ])

  useEffect(() => {
    // Fetch order details
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          // Could update orderSummary with real data if needed
        }
      })
      .catch(() => {})

    // Fetch messages
    fetch(`/api/orders/${orderId}/messages`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length) {
          setMessages(d.data.map((m: Record<string, unknown>) => ({
            sender: m.sender || (m.role === 'buyer' ? 'buyer' : 'seller'),
            initials: String(m.initials || (m.sender === 'buyer' ? 'GM' : 'KP')),
            name: String(m.name || m.senderName || ''),
            text: String(m.text || m.content || m.message || ''),
            date: String(m.date || m.createdAt || m.timestamp || ''),
            offer: m.offer ? m.offer as Message['offer'] : undefined,
          })))
        }
      })
      .catch(() => {})
  }, [orderId])

  const handleSendMessage = async () => {
    if (!messageText.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText }),
      })
      const d = await res.json()
      if (d.success) {
        setMessages(prev => [...prev, {
          sender: 'buyer' as const,
          initials: 'GM',
          name: 'Gulf Medical LLC',
          text: messageText,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        }])
        setMessageText('')
      }
    } catch {
      // Still add to local state for demo
      setMessages(prev => [...prev, {
        sender: 'buyer' as const,
        initials: 'GM',
        name: 'Gulf Medical LLC',
        text: messageText,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      }])
      setMessageText('')
    } finally {
      setSending(false)
    }
  }

  const handleMakeOffer = async () => {
    setOfferSending(true)
    try {
      await fetch(`/api/orders/${orderId}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: '0.0055', qty: '10000000', leadTime: '45', incoterms: 'CIF Lagos' }),
      })
    } catch {}
    finally { setOfferSending(false) }
  }

  const handleAccept = async () => {
    setAccepting(true)
    try {
      await fetch(`/api/orders/${orderId}/accept`, { method: 'POST' })
    } catch {}
    finally { setAccepting(false) }
  }

  const orderSummary = [
    { label: 'Product', value: 'Amoxicillin 250mg Capsule', bold: true },
    { label: 'Volume', value: '10M caps/month', bold: true },
    { label: 'Destination', value: 'Nigeria', bold: true },
    { label: 'Current offer price', value: '$0.0057/cap', bold: true, highlight: true },
    { label: 'Total order value', value: '~$57,000/month', bold: true },
    { label: 'PMX commission (2.5%)', value: '$1,425', bold: false },
    { label: 'Seller receives', value: '$55,575', bold: true },
  ]

  const nextSteps = [
    'PMX Supply Agreement auto-generated from negotiated terms',
    'Both parties e-sign contract (5-day window or auto-cancel)',
    'PSO escrow sub-account created \u00b7 Buyer receives payment instructions',
    'Seller links batch eBMR \u00b7 CoA auto-generated on release',
    'Escrow auto-releases 3 days after delivery if no dispute',
  ]

  return (
    <>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 11, color: 'var(--pmx-tx3)', marginBottom: 12 }}>
        <Link href="/buyer/dashboard" style={{ color: 'var(--pmx-tx3)', textDecoration: 'none' }}>Dashboard</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <Link href="/buyer/orders" style={{ color: 'var(--pmx-tx3)', textDecoration: 'none' }}>Orders</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <span style={{ color: 'var(--pmx-tx2)' }}>{orderId}</span>
      </nav>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>
            Negotiation &mdash; ORD-2026-0040
          </h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>
            Amoxicillin 250mg &middot; Karachi PharmaCorp &middot; All buyer-seller communication inside PMX
          </p>
        </div>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 7px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            background: 'var(--pmx-amber-light)',
            color: 'var(--pmx-amber)',
          }}
        >
          Negotiating &mdash; Offer v2 pending
        </span>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
        {/* Left: Message Thread */}
        <div
          style={{
            background: 'var(--pmx-bg)',
            border: '0.5px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {/* Thread Header */}
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '0.5px solid var(--border)',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Negotiation thread &mdash; all offers stored with timestamps</span>
            <span style={{ color: 'var(--pmx-tx3)', fontWeight: 400 }}>12 messages</span>
          </div>

          {/* Messages */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxHeight: 320,
              overflowY: 'auto',
              padding: 14,
              background: 'var(--pmx-bg2)',
            }}
          >
            {messages.map((msg, idx) => {
              const isBuyer = msg.sender === 'buyer'
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexDirection: isBuyer ? 'row' : 'row-reverse',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontWeight: 700,
                      flexShrink: 0,
                      background: isBuyer ? 'var(--pmx-blue-light)' : 'var(--pmx-teal-light)',
                      color: isBuyer ? 'var(--pmx-blue)' : 'var(--pmx-teal)',
                    }}
                  >
                    {msg.initials}
                  </div>

                  {/* Bubble */}
                  <div>
                    <div
                      style={{
                        maxWidth: '75%',
                        background: isBuyer ? 'var(--pmx-bg)' : 'var(--pmx-teal-light)',
                        border: isBuyer ? '0.5px solid var(--border)' : '0.5px solid var(--pmx-teal)',
                        borderRadius: 10,
                        padding: '8px 12px',
                        fontSize: 12,
                      }}
                    >
                      {msg.text}

                      {/* Offer Card */}
                      {msg.offer && (
                        <div
                          style={{
                            background: 'var(--pmx-bg)',
                            border: '1px solid var(--pmx-teal)',
                            borderRadius: 8,
                            padding: 12,
                            marginTop: 6,
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pmx-teal)', marginBottom: 8 }}>
                            {msg.offer.title}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: 'var(--pmx-tx2)' }}>Price/capsule</span>
                            <strong style={{ color: msg.offer.priceHighlight ? 'var(--pmx-teal)' : 'inherit' }}>
                              {msg.offer.price}
                            </strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: 'var(--pmx-tx2)' }}>Quantity</span>
                            <strong>{msg.offer.qty}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: 'var(--pmx-tx2)' }}>Lead time</span>
                            <strong style={{ color: msg.offer.leadTimeHighlight ? 'var(--pmx-teal)' : 'inherit' }}>
                              {msg.offer.leadTime}
                            </strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: 'var(--pmx-tx2)' }}>Incoterms</span>
                            <strong>{msg.offer.incoterms}</strong>
                          </div>

                          {msg.offer.isCurrent && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                              <button
                                disabled={accepting}
                                onClick={handleAccept}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '4px 9px',
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  cursor: accepting ? 'wait' : 'pointer',
                                  background: 'var(--pmx-teal)',
                                  color: '#fff',
                                  border: 'none',
                                  fontFamily: 'inherit',
                                  opacity: accepting ? 0.6 : 1,
                                }}
                              >
                                {accepting ? 'Accepting...' : 'Accept \u2192'}
                              </button>
                              <button
                                onClick={handleMakeOffer}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '4px 9px',
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  border: '0.5px solid var(--input)',
                                  background: 'var(--pmx-bg)',
                                  color: 'var(--pmx-tx)',
                                  fontFamily: 'inherit',
                                }}
                              >
                                Counter
                              </button>
                              <button
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '4px 9px',
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  border: '0.5px solid var(--input)',
                                  background: 'var(--pmx-bg)',
                                  color: 'var(--pmx-tx)',
                                  fontFamily: 'inherit',
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--pmx-tx3)', marginTop: 3 }}>
                      {msg.name} &middot; {msg.date}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Compose Bar */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: 12,
              borderTop: '0.5px solid var(--border)',
              background: 'var(--pmx-bg)',
            }}
          >
            <input
              style={{
                flex: 1,
                padding: '8px 10px',
                border: '0.5px solid var(--input)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--pmx-tx)',
                background: 'var(--pmx-bg)',
                fontFamily: 'inherit',
                outline: 'none',
              }}
              placeholder="Type message or use offer button..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !sending) { e.preventDefault(); handleSendMessage(); } }}
            />
            <button
              disabled={offerSending}
              onClick={handleMakeOffer}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 500,
                cursor: offerSending ? 'wait' : 'pointer',
                border: '0.5px solid var(--input)',
                background: 'var(--pmx-bg)',
                color: 'var(--pmx-tx)',
                fontFamily: 'inherit',
                opacity: offerSending ? 0.6 : 1,
              }}
            >
              {offerSending ? 'Sending...' : 'Make offer'}
            </button>
            <button
              disabled={sending}
              onClick={handleSendMessage}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 500,
                cursor: sending ? 'wait' : 'pointer',
                background: 'var(--pmx-teal)',
                color: '#fff',
                border: 'none',
                fontFamily: 'inherit',
                opacity: sending ? 0.6 : 1,
              }}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        {/* Right: Order Summary + What Happens Next */}
        <div>
          {/* Order Summary */}
          <div
            style={{
              background: 'var(--pmx-bg)',
              border: '0.5px solid var(--border)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>Order summary</div>
            <div style={{ fontSize: 12 }}>
              {orderSummary.map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '0.5px solid var(--border)',
                    fontSize: 12,
                  }}
                >
                  <span>{row.label}</span>
                  {row.bold ? (
                    <strong style={{ color: row.highlight ? 'var(--pmx-teal)' : 'inherit' }}>
                      {row.value}
                    </strong>
                  ) : (
                    <span>{row.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* What Happens Next */}
          <div
            style={{
              background: 'var(--pmx-bg)',
              border: '0.5px solid var(--border)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 12 }}>
              On accept &mdash; what happens next
            </div>
            <div style={{ fontSize: 11, color: 'var(--pmx-tx2)', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {nextSteps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--pmx-teal)', flexShrink: 0 }}>{idx + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
