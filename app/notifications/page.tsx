"use client"

import { useState } from "react"
import { AccountLayout } from "@/components/account-layout"
import { cn } from "@/lib/utils"

// Mock notifications
const mockNotifications = [
    {
        id: 1,
        type: "booking_confirmed",
        icon: "check_circle",
        iconBg: "bg-green-50",
        iconColor: "text-green-600",
        title: "Booking Confirmed",
        message: "Your booking for John Deere 5050D on Oct 24 has been confirmed.",
        time: "2 hours ago",
        read: false,
    },
    {
        id: 2,
        type: "payment_received",
        icon: "payments",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
        title: "Payment Received",
        message: "₹2,400 payment received for booking #BK-2024-001.",
        time: "5 hours ago",
        read: false,
    },
    {
        id: 3,
        type: "booking_reminder",
        icon: "alarm",
        iconBg: "bg-orange-50",
        iconColor: "text-orange-600",
        title: "Upcoming Booking Reminder",
        message: "Your Rotavator 6ft rental is scheduled for tomorrow at 9:00 AM.",
        time: "1 day ago",
        read: true,
    },
    {
        id: 4,
        type: "partner_update",
        icon: "handshake",
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600",
        title: "Partner Application Update",
        message: "Your partner application has been approved! Start listing your equipment now.",
        time: "2 days ago",
        read: true,
    },
    {
        id: 5,
        type: "promo",
        icon: "local_offer",
        iconBg: "bg-pink-50",
        iconColor: "text-pink-600",
        title: "Special Offer",
        message: "Get 20% off on your next tractor rental! Use code FARMO20 at checkout.",
        time: "3 days ago",
        read: true,
    },
    {
        id: 6,
        type: "booking_completed",
        icon: "task_alt",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        title: "Booking Completed",
        message: "Your booking for Harvester rental has been completed. Please leave a review!",
        time: "5 days ago",
        read: true,
    },
]

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(mockNotifications)
    const [filter, setFilter] = useState<"all" | "unread">("all")

    const unreadCount = notifications.filter((n) => !n.read).length
    const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }

    const toggleRead = (id: number) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
        )
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
                {filtered.length === 0 ? (
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
                        {filtered.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => toggleRead(notification.id)}
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                                    notification.read
                                        ? "bg-card border-border hover:shadow-sm"
                                        : "bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-sm"
                                )}
                            >
                                {/* Icon */}
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform", notification.iconBg, notification.iconColor)}>
                                    <span className="material-symbols-outlined text-2xl">{notification.icon}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className={cn("text-sm truncate", notification.read ? "font-medium text-foreground" : "font-bold text-foreground")}>
                                            {notification.title}
                                        </h4>
                                        {!notification.read && (
                                            <span className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-1"></span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{notification.message}</p>
                                    <p className="text-[11px] text-muted/70 mt-2">{notification.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AccountLayout>
    )
}
