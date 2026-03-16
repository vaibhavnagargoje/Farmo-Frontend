"use client"

import { useState, useEffect, useCallback } from "react"
import { AccountLayout } from "@/components/account-layout"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface ApiNotification {
  id: number
  title: string
  message: string
  is_read: boolean
  booking_id: string | null
  created_at: string
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function getIconForTitle(title: string) {
  const lower = title.toLowerCase()
  if (lower.includes("confirm") || lower.includes("accept"))
    return { icon: "check_circle", iconBg: "bg-green-50", iconColor: "text-green-600" }
  if (lower.includes("payment") || lower.includes("paid"))
    return { icon: "payments", iconBg: "bg-blue-50", iconColor: "text-blue-600" }
  if (lower.includes("job") || lower.includes("new"))
    return { icon: "work", iconBg: "bg-orange-50", iconColor: "text-orange-600" }
  if (lower.includes("cancel"))
    return { icon: "cancel", iconBg: "bg-red-50", iconColor: "text-red-600" }
  if (lower.includes("complete"))
    return { icon: "task_alt", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" }
  if (lower.includes("reminder"))
    return { icon: "alarm", iconBg: "bg-orange-50", iconColor: "text-orange-600" }
  if (lower.includes("partner"))
    return { icon: "handshake", iconBg: "bg-purple-50", iconColor: "text-purple-600" }
  if (lower.includes("offer") || lower.includes("promo"))
    return { icon: "local_offer", iconBg: "bg-pink-50", iconColor: "text-pink-600" }
  return { icon: "notifications", iconBg: "bg-gray-50", iconColor: "text-gray-600" }
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const router = useRouter()

  const fetchNotifications = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const filtered = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications

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

  const handleClick = async (notification: ApiNotification) => {
    if (!notification.is_read) {
      try {
        const res = await fetch(`/api/notifications/${notification.id}/read`, {
          method: "POST",
          credentials: "include",
        })
        if (res.ok) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
          )
        }
      } catch (err) {
        console.error("Failed to mark notification read:", err)
      }
    }

    if (notification.booking_id) {
      if (user?.role === "PARTNER") {
        router.push('/partner')
      } else {
        router.push(`/bookings/${notification.booking_id}`)
      }
    }
  }

  return (
    <AccountLayout pageTitle="Notifications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-destructive text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-sm text-muted mt-1">Stay updated on your bookings and account</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors hidden sm:block"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                filter === "all"
                  ? "bg-navy text-white"
                  : "bg-card text-foreground border border-border hover:bg-muted/50"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                filter === "unread"
                  ? "bg-navy text-white"
                  : "bg-card text-foreground border border-border hover:bg-muted/50"
              )}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors sm:hidden"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-muted animate-spin mb-4">progress_activity</span>
            <p className="text-sm text-muted">Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-6xl text-muted mb-4">notifications_off</span>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {filter === "unread" ? "All caught up!" : "No Notifications"}
            </h3>
            <p className="text-muted text-sm">
              {filter === "unread"
                ? "You've read all your notifications."
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((notification) => {
              const { icon, iconBg, iconColor } = getIconForTitle(notification.title)
              return (
                <div
                  key={notification.id}
                  onClick={() => handleClick(notification)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                    notification.is_read
                      ? "bg-card border-border hover:shadow-sm"
                      : "bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-sm"
                  )}
                >
                  {/* Icon */}
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform", iconBg, iconColor)}>
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn("text-sm truncate", notification.is_read ? "font-medium text-foreground" : "font-bold text-foreground")}>
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <span className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-1"></span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{notification.message}</p>
                    <p className="text-[11px] text-muted/70 mt-2">{timeAgo(notification.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
