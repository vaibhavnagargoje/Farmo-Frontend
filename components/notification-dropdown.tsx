"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { onForegroundMessage } from "@/lib/firebase"
import { useLanguage } from "@/contexts/language-context"

interface ApiNotification {
  id: number
  title: string
  message: string
  is_read: boolean
  booking_id: string | null
  notification_type: 'CUSTOMER_BOOKING' | 'PROVIDER_JOB' | 'GENERAL'
  created_at: string
}

function timeAgo(dateStr: string, t: (key: string) => string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return t("time.just_now")
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return t("time.m_ago").replace("{m}", String(minutes))
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t("time.h_ago").replace("{h}", String(hours))
  const days = Math.floor(hours / 24)
  if (days < 7) return t("time.d_ago").replace("{d}", String(days))
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function getIconForTitle(title: string) {
  const lower = title.toLowerCase()
  if (lower.includes("confirm") || lower.includes("accept"))
    return { icon: "check_circle", bg: "bg-green-50", color: "text-green-600" }
  if (lower.includes("payment") || lower.includes("paid"))
    return { icon: "account_balance_wallet", bg: "bg-blue-50", color: "text-blue-600" }
  if (lower.includes("job") || lower.includes("booking") || lower.includes("new"))
    return { icon: "work", bg: "bg-orange-50", color: "text-orange-600" }
  if (lower.includes("cancel"))
    return { icon: "cancel", bg: "bg-red-50", color: "text-red-600" }
  if (lower.includes("complete"))
    return { icon: "task_alt", bg: "bg-emerald-50", color: "text-emerald-600" }
  return { icon: "notifications", bg: "bg-gray-50", color: "text-gray-600" }
}

export function NotificationDropdown() {
  const { isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { t } = useLanguage()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/notifications", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setNotifications(Array.isArray(data) ? data : data.results ?? [])
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Fetch on mount (and auth change), plus when opened if needed
  useEffect(() => {
    if (isAuthenticated) fetchNotifications()
  }, [isAuthenticated, fetchNotifications])

  // Setup foreground listener
  useEffect(() => {
    if (!isAuthenticated) return

    let unsubscribe: (() => void) | undefined;
    const setupListener = async () => {
      const unsub = await onForegroundMessage((payload) => {
        const title = payload.notification?.title || "New Notification"
        const message = payload.notification?.body || ""
        const booking_id = payload.data?.booking_id || null
        const notification_type = (payload.data?.type === 'new_job' || payload.data?.type === 'direct_booking'
          ? 'PROVIDER_JOB'
          : payload.data?.type === 'booking_confirmed' || payload.data?.type === 'booking_cancelled' || payload.data?.type === 'booking_expired'
            ? 'CUSTOMER_BOOKING'
            : 'GENERAL') as ApiNotification['notification_type']

        const newNotif: ApiNotification = {
          id: Date.now(),
          title,
          message,
          is_read: false,
          booking_id,
          notification_type,
          created_at: new Date().toISOString()
        }

        setNotifications(prev => [newNotif, ...prev])
      })

      if (unsub) unsubscribe = unsub;
    }

    setupListener()

    return () => {
      if (unsubscribe) unsubscribe();
    }
  }, [isAuthenticated])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  const markSingleRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error("Failed to mark notification read:", err)
    }
  }

  // Show max 5 notifications in dropdown
  const displayNotifications = notifications.slice(0, 5)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative size-10 rounded-full bg-muted/30 hover:bg-muted/50 flex items-center justify-center transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 size-5 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="fixed left-1/2 -translate-x-1/2 top-[72px] w-[calc(100vw-32px)] max-w-[340px] sm:absolute sm:left-auto sm:-translate-x-0 sm:right-0 sm:top-full sm:mt-2 sm:w-[340px] bg-card rounded-xl shadow-2xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground">{t("notifications.title")}</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                  {t("notifications.new").replace("{count}", String(unreadCount))}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-primary text-sm font-semibold hover:underline"
              >
                {t("notifications.mark_all_read")}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[60vh] lg:max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="material-symbols-outlined text-3xl text-muted animate-spin">progress_activity</span>
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                <span className="material-symbols-outlined text-4xl text-muted mb-2">notifications_off</span>
                <p className="text-sm text-muted">{t("notifications.empty")}</p>
              </div>
            ) : (
              displayNotifications.map((notification) => {
                const { icon, bg, color } = getIconForTitle(notification.title)
                return (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.is_read) markSingleRead(notification.id)
                      setIsOpen(false)
                      if (notification.notification_type === 'PROVIDER_JOB') {
                        router.push('/partner')
                      } else if (notification.notification_type === 'CUSTOMER_BOOKING' && notification.booking_id) {
                        router.push(`/bookings/${notification.booking_id}`)
                      } else {
                        router.push('/')
                      }
                    }}
                    className={cn(
                      "flex gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer border-b border-border last:border-0",
                      !notification.is_read && "bg-primary/5"
                    )}
                  >
                    <div className={cn("size-10 rounded-full flex items-center justify-center shrink-0", bg, color)}>
                      <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("font-semibold text-sm", !notification.is_read ? "text-foreground" : "text-muted-foreground")}>
                          {notification.title}
                        </p>
                        {!notification.is_read && <span className="size-2 bg-primary rounded-full shrink-0 mt-1.5"></span>}
                      </div>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{notification.message}</p>
                      <p className="text-[10px] text-muted/70 mt-1">{timeAgo(notification.created_at, t)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border bg-muted/20">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="w-full block text-center text-primary text-sm font-semibold hover:underline"
            >
              {t("notifications.view_all")}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
