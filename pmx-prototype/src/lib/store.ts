'use client'

import { create } from 'zustand'
import type {
  User,
  Manufacturer,
  Buyer,
  Notification,
} from './types'

interface PMXStore {
  // ─── State ──────────────────────────────────────────────────────────────
  user: User | null
  manufacturer: Manufacturer | null
  buyer: Buyer | null
  notifications: Notification[]
  unreadCount: number

  // ─── Actions ────────────────────────────────────────────────────────────
  setUser: (user: User | null) => void
  setManufacturer: (manufacturer: Manufacturer | null) => void
  setBuyer: (buyer: Buyer | null) => void
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (notificationId: string) => void
  decrementUnread: () => void
  clearStore: () => void
}

export const usePMXStore = create<PMXStore>((set) => ({
  // ─── Initial State ────────────────────────────────────────────────────
  user: null,
  manufacturer: null,
  buyer: null,
  notifications: [],
  unreadCount: 0,

  // ─── Actions ──────────────────────────────────────────────────────────
  setUser: (user) => set({ user }),

  setManufacturer: (manufacturer) => set({ manufacturer }),

  setBuyer: (buyer) => set({ buyer }),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    })),

  markNotificationRead: (notificationId) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === notificationId
          ? { ...n, read: true, read_at: new Date().toISOString() }
          : n
      )
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      }
    }),

  decrementUnread: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  clearStore: () =>
    set({
      user: null,
      manufacturer: null,
      buyer: null,
      notifications: [],
      unreadCount: 0,
    }),
}))
