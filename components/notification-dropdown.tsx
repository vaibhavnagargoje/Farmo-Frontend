"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: "booking" | "payment" | "system" | "promo"
}

const farmerNotifications: Notification[] = [
  {
    id: "1",
    title: "Welcome to Farmo!",
    message: "We're glad to have you here. Explore services and start booking today.",
    time: "Just now",
    read: false,
    type: "system",
  },
]

const partnerNotifications: Notification[] = [
  {
    id: "1",
    title: "Welcome to Farmo!",
    message: "We're glad to have you here. Manage your services and start earning.",
    time: "Just now",
    read: false,
    type: "system",
  },
]

const getIconForType = (type: Notification["type"]) => {
  switch (type) {
    case "booking":
      return { icon: "calendar_month", bg: "bg-blue-50", color: "text-blue-600" }
    case "payment":
      return { icon: "account_balance_wallet", bg: "bg-green-50", color: "text-green-600" }
    case "system":
      return { icon: "info", bg: "bg-gray-50", color: "text-gray-600" }
    case "promo":
      return { icon: "local_offer", bg: "bg-orange-50", color: "text-orange-600" }
  }
}

interface NotificationDropdownProps {
  variant?: "farmer" | "partner"
}

export function NotificationDropdown({ variant = "farmer" }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifications = variant === "partner" ? partnerNotifications : farmerNotifications
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-card rounded-2xl shadow-2xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button className="text-primary text-sm font-semibold hover:underline">Mark all read</button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[60vh] lg:max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => {
              const { icon, bg, color } = getIconForType(notification.type)
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer border-b border-border last:border-0",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className={cn("size-10 rounded-full flex items-center justify-center shrink-0", bg, color)}>
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("font-semibold text-sm", !notification.read ? "text-foreground" : "text-muted-foreground")}>
                        {notification.title}
                      </p>
                      {!notification.read && <span className="size-2 bg-primary rounded-full shrink-0 mt-1.5"></span>}
                    </div>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2">{notification.message}</p>
                    <p className="text-[10px] text-muted/70 mt-1">{notification.time}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border bg-muted/20">
            <button className="w-full text-center text-primary text-sm font-semibold hover:underline">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
