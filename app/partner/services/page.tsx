"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ServiceItem {
    id: number
    title: string
    description: string
    price: string
    price_unit: string
    category: number
    category_name?: string
    status: string
    is_available: boolean
    service_radius_km: number
    location_lat: string | null
    location_lng: string | null
    images: { id: number; image: string; is_thumbnail: boolean }[]
    created_at: string
}

interface CategoryOption {
    id: number
    name: string
    slug: string
}

const priceUnits = [
    { value: "HOUR", label: "Per Hour" },
    { value: "DAY", label: "Per Day" },
    { value: "KM", label: "Per Kilometer" },
    { value: "ACRE", label: "Per Acre" },
    { value: "FIXED", label: "Fixed Price" },
]

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    ACTIVE: { bg: "bg-green-100", text: "text-green-800", label: "Active" },
    DRAFT: { bg: "bg-gray-100", text: "text-gray-800", label: "Draft" },
    PENDING: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending" },
    REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
    HIDDEN: { bg: "bg-purple-100", text: "text-purple-800", label: "Paused" },
}

export default function ManageServicesPage() {
    const [services, setServices] = useState<ServiceItem[]>([])
    const [categories, setCategories] = useState<CategoryOption[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editForm, setEditForm] = useState<Partial<ServiceItem>>({})
    const [showAddForm, setShowAddForm] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)

    // New service form state
    const [newService, setNewService] = useState({
        category: "",
        title: "",
        description: "",
        price: "",
        price_unit: "HOUR",
        service_radius_km: "10",
    })
    const [newImages, setNewImages] = useState<File[]>([])

    useEffect(() => {
        fetchServices()
        fetchCategories()
    }, [])

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 4000)
            return () => clearTimeout(timer)
        }
    }, [message])

    const fetchServices = async () => {
        try {
            const res = await fetch("/api/partner/services")
            if (res.ok) {
                const data = await res.json()
                setServices(Array.isArray(data) ? data : data.results || [])
            }
        } catch (error) {
            console.error("Failed to fetch services:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/services/categories")
            if (res.ok) {
                const data = await res.json()
                setCategories(Array.isArray(data) ? data : data.results || [])
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error)
        }
    }

    const handleToggleAvailability = async (serviceId: number, currentValue: boolean) => {
        // Optimistic update
        setServices(prev => prev.map(s => s.id === serviceId ? { ...s, is_available: !currentValue } : s))

        try {
            const res = await fetch(`/api/partner/services/${serviceId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_available: !currentValue }),
            })

            if (!res.ok) {
                // Revert
                setServices(prev => prev.map(s => s.id === serviceId ? { ...s, is_available: currentValue } : s))
                setMessage({ type: "error", text: "Failed to update availability" })
            }
        } catch {
            setServices(prev => prev.map(s => s.id === serviceId ? { ...s, is_available: currentValue } : s))
        }
    }

    const handleStartEdit = (service: ServiceItem) => {
        setEditingId(service.id)
        setEditForm({
            title: service.title,
            description: service.description,
            price: service.price,
            price_unit: service.price_unit,
            service_radius_km: service.service_radius_km,
        })
    }

    const handleSaveEdit = async (serviceId: number) => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/partner/services/${serviceId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            })

            if (res.ok) {
                setMessage({ type: "success", text: "Service updated successfully" })
                setEditingId(null)
                fetchServices()
            } else {
                const err = await res.json()
                setMessage({ type: "error", text: err.message || "Failed to update" })
            }
        } catch {
            setMessage({ type: "error", text: "Failed to update service" })
        } finally {
            setActionLoading(false)
        }
    }

    const handleDelete = async (serviceId: number) => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/partner/services/${serviceId}`, {
                method: "DELETE",
            })

            if (res.ok) {
                setMessage({ type: "success", text: "Service deleted successfully" })
                setServices(prev => prev.filter(s => s.id !== serviceId))
                setDeleteConfirm(null)
            } else {
                setMessage({ type: "error", text: "Failed to delete service" })
            }
        } catch {
            setMessage({ type: "error", text: "Failed to delete service" })
        } finally {
            setActionLoading(false)
        }
    }

    const handleAddService = async () => {
        if (!newService.category || !newService.title || !newService.price) {
            setMessage({ type: "error", text: "Please fill in all required fields" })
            return
        }

        setActionLoading(true)
        try {
            const formData = new FormData()
            formData.append("category", newService.category)
            formData.append("title", newService.title)
            formData.append("description", newService.description)
            formData.append("price", newService.price)
            formData.append("price_unit", newService.price_unit)
            formData.append("service_radius_km", newService.service_radius_km)

            for (const img of newImages) {
                formData.append("images", img)
            }

            const res = await fetch("/api/partner/services", {
                method: "POST",
                body: formData,
            })

            if (res.ok) {
                setMessage({ type: "success", text: "Service added successfully" })
                setShowAddForm(false)
                setNewService({ category: "", title: "", description: "", price: "", price_unit: "HOUR", service_radius_km: "10" })
                setNewImages([])
                fetchServices()
            } else {
                const err = await res.json()
                setMessage({ type: "error", text: err.message || "Failed to add service" })
            }
        } catch {
            setMessage({ type: "error", text: "Failed to add service" })
        } finally {
            setActionLoading(false)
        }
    }

    const getPriceUnitLabel = (unit: string) => priceUnits.find(u => u.value === unit)?.label || unit

    return (
        <div className="relative flex h-full w-full flex-col overflow-x-hidden bg-background min-h-screen">
            <DesktopHeader variant="partner" />
            <MobileHeader />

            {/* Page Header */}
            <div className="bg-navy pt-14 pb-6 px-5 lg:pt-6 rounded-b-[2rem] lg:rounded-none shadow-lg lg:shadow-none">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/partner" className="size-10 rounded-full bg-white/10 flex items-center justify-center lg:hidden">
                            <span className="material-symbols-outlined text-white">arrow_back</span>
                        </Link>
                        <div>
                            <h1 className="text-white text-xl font-bold">My Services</h1>
                            <p className="text-white/60 text-sm">{services.length} service{services.length !== 1 ? "s" : ""} listed</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add Service
                    </button>
                </div>
            </div>

            {/* Toast Message */}
            {message && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl border text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 ${message.type === "success"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    }`}>
                    <span className="material-symbols-outlined text-lg">
                        {message.type === "success" ? "check_circle" : "error"}
                    </span>
                    {message.text}
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 lg:px-6 py-6 pb-28 lg:pb-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : services.length === 0 && !showAddForm ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="material-symbols-outlined text-6xl text-muted/30 mb-4">construction</span>
                        <h3 className="text-lg font-bold text-foreground mb-2">No Services Yet</h3>
                        <p className="text-muted text-sm mb-6 max-w-sm">
                            Add your first service to start receiving bookings from customers.
                        </p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Add Your First Service
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {/* Add Service Form */}
                        {showAddForm && (
                            <div className="bg-card rounded-2xl border-2 border-primary/20 p-5 lg:p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">add_circle</span>
                                        Add New Service
                                    </h3>
                                    <button onClick={() => setShowAddForm(false)} className="text-muted hover:text-foreground">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-semibold">Category *</Label>
                                        <Select value={newService.category} onValueChange={v => setNewService(p => ({ ...p, category: v }))}>
                                            <SelectTrigger className="h-11 rounded-xl bg-background border-border">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card rounded-xl">
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-semibold">Service Title *</Label>
                                        <Input
                                            value={newService.title}
                                            onChange={e => setNewService(p => ({ ...p, title: e.target.value }))}
                                            placeholder="e.g. Tractor Ploughing"
                                            className="h-11 rounded-xl bg-background"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2 lg:col-span-2">
                                        <Label className="text-sm font-semibold">Description</Label>
                                        <Textarea
                                            value={newService.description}
                                            onChange={e => setNewService(p => ({ ...p, description: e.target.value }))}
                                            placeholder="Describe your service..."
                                            className="rounded-xl bg-background min-h-[80px]"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-semibold">Price (₹) *</Label>
                                        <Input
                                            type="number"
                                            value={newService.price}
                                            onChange={e => setNewService(p => ({ ...p, price: e.target.value }))}
                                            placeholder="500"
                                            className="h-11 rounded-xl bg-background"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-semibold">Price Unit</Label>
                                        <Select value={newService.price_unit} onValueChange={v => setNewService(p => ({ ...p, price_unit: v }))}>
                                            <SelectTrigger className="h-11 rounded-xl bg-background border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card rounded-xl">
                                                {priceUnits.map(u => (
                                                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-semibold">Service Radius (km)</Label>
                                        <Input
                                            type="number"
                                            value={newService.service_radius_km}
                                            onChange={e => setNewService(p => ({ ...p, service_radius_km: e.target.value }))}
                                            className="h-11 rounded-xl bg-background"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-semibold">Images</Label>
                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={e => {
                                                if (e.target.files) setNewImages(Array.from(e.target.files))
                                            }}
                                        />
                                        <button
                                            onClick={() => imageInputRef.current?.click()}
                                            className="h-11 rounded-xl bg-background border border-dashed border-border text-sm text-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">upload</span>
                                            {newImages.length > 0 ? `${newImages.length} file(s) selected` : "Upload Images"}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-5">
                                    <button
                                        onClick={() => setShowAddForm(false)}
                                        className="flex-1 h-11 rounded-xl border border-border text-muted font-semibold hover:bg-muted/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddService}
                                        disabled={actionLoading}
                                        className="flex-1 h-11 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                        ) : (
                                            "Add Service"
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Service Cards */}
                        {services.map(service => (
                            <div key={service.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                                {/* Delete Confirm Overlay */}
                                {deleteConfirm === service.id && (
                                    <div className="bg-red-50 border-b border-red-200 p-4 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-red-600">warning</span>
                                        <p className="text-sm text-red-800 font-medium flex-1">Delete this service? This cannot be undone.</p>
                                        <button
                                            onClick={() => setDeleteConfirm(null)}
                                            className="px-3 py-1.5 rounded-lg border border-border text-sm font-semibold text-muted hover:bg-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleDelete(service.id)}
                                            disabled={actionLoading}
                                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}

                                <div className="p-5">
                                    {editingId === service.id ? (
                                        /* Edit Mode */
                                        <div className="flex flex-col gap-4">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-2">
                                                    <Label className="text-sm font-semibold">Title</Label>
                                                    <Input
                                                        value={editForm.title || ""}
                                                        onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                                                        className="h-10 rounded-xl bg-background"
                                                    />
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="flex flex-col gap-2 flex-1">
                                                        <Label className="text-sm font-semibold">Price (₹)</Label>
                                                        <Input
                                                            type="number"
                                                            value={editForm.price || ""}
                                                            onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))}
                                                            className="h-10 rounded-xl bg-background"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-2 flex-1">
                                                        <Label className="text-sm font-semibold">Unit</Label>
                                                        <Select
                                                            value={editForm.price_unit || "HOUR"}
                                                            onValueChange={v => setEditForm(p => ({ ...p, price_unit: v }))}
                                                        >
                                                            <SelectTrigger className="h-10 rounded-xl bg-background border-border">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-card rounded-xl">
                                                                {priceUnits.map(u => (
                                                                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 lg:col-span-2">
                                                    <Label className="text-sm font-semibold">Description</Label>
                                                    <Textarea
                                                        value={editForm.description || ""}
                                                        onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                                                        className="rounded-xl bg-background min-h-[60px]"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="flex-1 h-10 rounded-xl border border-border text-muted text-sm font-semibold hover:bg-muted/10"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleSaveEdit(service.id)}
                                                    disabled={actionLoading}
                                                    className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                                                >
                                                    {actionLoading ? "Saving..." : "Save Changes"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View Mode */
                                        <div className="flex items-start gap-4">
                                            <div className="size-14 rounded-xl bg-navy/5 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-navy text-2xl">construction</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-foreground font-bold text-base truncate">{service.title}</h3>
                                                        <p className="text-xs text-muted mt-0.5">{service.category_name || `Category #${service.category}`}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {statusColors[service.status] && (
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[service.status].bg} ${statusColors[service.status].text}`}>
                                                                {statusColors[service.status].label}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {service.description && (
                                                    <p className="text-sm text-muted mt-2 line-clamp-2">{service.description}</p>
                                                )}

                                                <div className="flex items-center gap-4 mt-3 flex-wrap">
                                                    <div className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-primary text-sm">payments</span>
                                                        <span className="text-sm font-bold text-foreground">
                                                            ₹{Number(service.price).toLocaleString("en-IN")}
                                                        </span>
                                                        <span className="text-xs text-muted">/ {getPriceUnitLabel(service.price_unit)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm text-muted">radar</span>
                                                        <span className="text-xs text-muted">{service.service_radius_km} km radius</span>
                                                    </div>
                                                </div>

                                                {/* Bottom actions */}
                                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={service.is_available}
                                                            onCheckedChange={() => handleToggleAvailability(service.id, service.is_available)}
                                                            className="scale-90 data-[state=checked]:bg-success data-[state=unchecked]:bg-muted"
                                                        />
                                                        <span className={`text-xs font-semibold ${service.is_available ? "text-success" : "text-muted"}`}>
                                                            {service.is_available ? "Available" : "Unavailable"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleStartEdit(service)}
                                                            className="size-9 rounded-lg border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(service.id)}
                                                            className="size-9 rounded-lg border border-border flex items-center justify-center text-muted hover:text-red-600 hover:border-red-300 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav variant="partner" />
        </div>
    )
}
