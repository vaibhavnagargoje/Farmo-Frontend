"use client"

import { useEffect, useState, useRef } from "react"
import { PartnerLayout } from "@/components/partner-layout"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface ServiceItem {
    id: number; title: string; description: string; price: string; price_unit: string
    category: number; category_name?: string; status: string; is_available: boolean
    service_radius_km: number
    images: { id: number; image: string; is_thumbnail: boolean }[]; created_at: string
}
interface CategoryOption { id: number; name: string; slug: string }

const priceUnits = [
    { value: "HOUR", label: "Per Hour" }, { value: "DAY", label: "Per Day" },
    { value: "KM", label: "Per Kilometer" }, { value: "ACRE", label: "Per Acre" },
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
    const [newService, setNewService] = useState({ category: "", title: "", description: "", price: "", price_unit: "HOUR", service_radius_km: "10" })
    const [newImages, setNewImages] = useState<File[]>([])

    // Image compression utility (same as onboarding)
    const compressImage = (file: File, maxSize = 1200, quality = 0.7): Promise<File> => {
        return new Promise((resolve, reject) => {
            // If already small enough, skip compression
            if (file.size <= 500 * 1024) {
                resolve(file)
                return
            }

            const img = new window.Image()
            img.onload = () => {
                const canvas = document.createElement("canvas")
                let { width, height } = img
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = Math.round((height * maxSize) / width)
                        width = maxSize
                    } else {
                        width = Math.round((width * maxSize) / height)
                        height = maxSize
                    }
                }
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext("2d")
                if (!ctx) { resolve(file); return }
                ctx.drawImage(img, 0, 0, width, height)
                canvas.toBlob(
                    (blob) => {
                        if (!blob) { resolve(file); return }
                        const compressed = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        })
                        resolve(compressed)
                    },
                    "image/jpeg",
                    quality
                )
            }
            img.onerror = () => resolve(file)
            img.src = URL.createObjectURL(file)
        })
    }

    useEffect(() => { fetchServices(); fetchCategories() }, [])
    useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t) } }, [message])

    const fetchServices = async () => {
        try { const res = await fetch("/api/partner/services"); if (res.ok) { const d = await res.json(); setServices(Array.isArray(d) ? d : d.results || []) } } catch (e) { console.error(e) } finally { setIsLoading(false) }
    }
    const fetchCategories = async () => {
        try { const res = await fetch("/api/services/categories"); if (res.ok) { const d = await res.json(); setCategories(Array.isArray(d) ? d : d.results || []) } } catch (e) { console.error(e) }
    }
    const handleToggleAvailability = async (id: number, cur: boolean) => {
        setServices(p => p.map(s => s.id === id ? { ...s, is_available: !cur } : s))
        try { const r = await fetch(`/api/partner/services/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_available: !cur }) }); if (!r.ok) { setServices(p => p.map(s => s.id === id ? { ...s, is_available: cur } : s)); setMessage({ type: "error", text: "Failed to update" }) } } catch { setServices(p => p.map(s => s.id === id ? { ...s, is_available: cur } : s)) }
    }
    const handleStartEdit = (s: ServiceItem) => { setEditingId(s.id); setEditForm({ title: s.title, description: s.description, price: s.price, price_unit: s.price_unit, service_radius_km: s.service_radius_km }) }
    const handleSaveEdit = async (id: number) => {
        setActionLoading(true)
        try { const r = await fetch(`/api/partner/services/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) }); if (r.ok) { setMessage({ type: "success", text: "Service updated" }); setEditingId(null); fetchServices() } else { const e = await r.json(); setMessage({ type: "error", text: e.message || "Failed" }) } } catch { setMessage({ type: "error", text: "Failed to update" }) } finally { setActionLoading(false) }
    }
    const handleDelete = async (id: number) => {
        setActionLoading(true)
        try { const r = await fetch(`/api/partner/services/${id}`, { method: "DELETE" }); if (r.ok) { setMessage({ type: "success", text: "Deleted" }); setServices(p => p.filter(s => s.id !== id)); setDeleteConfirm(null) } else { setMessage({ type: "error", text: "Failed" }) } } catch { setMessage({ type: "error", text: "Failed" }) } finally { setActionLoading(false) }
    }
    const handleAddService = async () => {
        if (!newService.category || !newService.title || !newService.price) { setMessage({ type: "error", text: "Fill required fields" }); return }
        setActionLoading(true)
        try {
            const fd = new FormData()
            fd.append("category", newService.category)
            fd.append("title", newService.title)
            fd.append("description", newService.description)
            fd.append("price", newService.price)
            fd.append("price_unit", newService.price_unit)
            fd.append("service_radius_km", newService.service_radius_km)

            // Compress images before uploading
            for (const img of newImages) {
                try {
                    const compressed = await compressImage(img)
                    fd.append("images", compressed)
                } catch {
                    fd.append("images", img) // fallback to original
                }
            }

            const r = await fetch("/api/partner/services", { method: "POST", body: fd })
            if (r.ok) {
                setMessage({ type: "success", text: "Service added successfully!" })
                setShowAddForm(false)
                setNewService({ category: "", title: "", description: "", price: "", price_unit: "HOUR", service_radius_km: "10" })
                setNewImages([])
                fetchServices()
            } else {
                const e = await r.json().catch(() => ({ message: "Server error" }))
                // Surface actual validation errors from backend
                let errorText = e.message || "Failed to add service"
                if (e.errors && typeof e.errors === "object") {
                    const firstError = Object.entries(e.errors).find(([k]) => k !== "message")
                    if (firstError) {
                        const [field, msgs] = firstError
                        errorText = `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`
                    }
                }
                setMessage({ type: "error", text: errorText })
            }
        } catch { setMessage({ type: "error", text: "Network error. Please try again." }) } finally { setActionLoading(false) }
    }
    const getPriceUnitLabel = (u: string) => priceUnits.find(x => x.value === u)?.label || u

    return (
        <PartnerLayout pageTitle="Manage Services">
            {message && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl border text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                    <span className="material-symbols-outlined text-lg">{message.type === "success" ? "check_circle" : "error"}</span>
                    {message.text}
                </div>
            )}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-foreground">My Services</h2>
                    <p className="text-sm text-muted mt-1">{services.length} service{services.length !== 1 ? "s" : ""} listed</p>
                </div>
                <button onClick={() => setShowAddForm(true)} className="bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg">
                    <span className="material-symbols-outlined text-lg">add</span>Add Service
                </button>
            </div>
            {isLoading ? (
                <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
            ) : services.length === 0 && !showAddForm ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="material-symbols-outlined text-6xl text-muted/30 mb-4">construction</span>
                    <h3 className="text-lg font-bold text-foreground mb-2">No Services Yet</h3>
                    <p className="text-muted text-sm mb-6 max-w-sm">Add your first service to start receiving bookings.</p>
                    <button onClick={() => setShowAddForm(true)} className="bg-primary text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90"><span className="material-symbols-outlined">add</span>Add Your First Service</button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {showAddForm && (
                        <div className="bg-card rounded-2xl border-2 border-primary/20 p-5 lg:p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><span className="material-symbols-outlined text-primary">add_circle</span>Add New Service</h3>
                                <button onClick={() => setShowAddForm(false)} className="text-muted hover:text-foreground"><span className="material-symbols-outlined">close</span></button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2"><Label className="text-sm font-semibold">Category *</Label><Select value={newService.category} onValueChange={v => setNewService(p => ({ ...p, category: v }))}><SelectTrigger className="h-11 rounded-xl bg-background border-border"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent className="bg-card rounded-xl">{categories.map(c => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}</SelectContent></Select></div>
                                <div className="flex flex-col gap-2"><Label className="text-sm font-semibold">Title *</Label><Input value={newService.title} onChange={e => setNewService(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Tractor Ploughing" className="h-11 rounded-xl bg-background" /></div>
                                <div className="flex flex-col gap-2 lg:col-span-2"><Label className="text-sm font-semibold">Description</Label><Textarea value={newService.description} onChange={e => setNewService(p => ({ ...p, description: e.target.value }))} placeholder="Describe your service..." className="rounded-xl bg-background min-h-[80px]" /></div>
                                <div className="flex flex-col gap-2"><Label className="text-sm font-semibold">Price (₹) *</Label><Input type="number" value={newService.price} onChange={e => setNewService(p => ({ ...p, price: e.target.value }))} placeholder="500" className="h-11 rounded-xl bg-background" /></div>
                                <div className="flex flex-col gap-2"><Label className="text-sm font-semibold">Price Unit</Label><Select value={newService.price_unit} onValueChange={v => setNewService(p => ({ ...p, price_unit: v }))}><SelectTrigger className="h-11 rounded-xl bg-background border-border"><SelectValue /></SelectTrigger><SelectContent className="bg-card rounded-xl">{priceUnits.map(u => (<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>))}</SelectContent></Select></div>
                                <div className="flex flex-col gap-2"><Label className="text-sm font-semibold">Service Radius (km)</Label><Input type="number" value={newService.service_radius_km} onChange={e => setNewService(p => ({ ...p, service_radius_km: e.target.value }))} className="h-11 rounded-xl bg-background" /></div>
                                <div className="flex flex-col gap-2"><Label className="text-sm font-semibold">Images</Label><input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) setNewImages(Array.from(e.target.files)) }} /><button onClick={() => imageInputRef.current?.click()} className="h-11 rounded-xl bg-background border border-dashed border-border text-sm text-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"><span className="material-symbols-outlined text-lg">upload</span>{newImages.length > 0 ? `${newImages.length} file(s)` : "Upload Images"}</button></div>
                            </div>
                            <div className="flex gap-3 mt-5">
                                <button onClick={() => setShowAddForm(false)} className="flex-1 h-11 rounded-xl border border-border text-muted font-semibold hover:bg-muted/10">Cancel</button>
                                <button onClick={handleAddService} disabled={actionLoading} className="flex-1 h-11 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50">{actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Add Service"}</button>
                            </div>
                        </div>
                    )}
                    {services.map(service => (
                        <div key={service.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                            {deleteConfirm === service.id && (
                                <div className="bg-red-50 border-b border-red-200 p-4 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-600">warning</span>
                                    <p className="text-sm text-red-800 font-medium flex-1">Delete this service? Cannot be undone.</p>
                                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-lg border border-border text-sm font-semibold text-muted hover:bg-white">Cancel</button>
                                    <button onClick={() => handleDelete(service.id)} disabled={actionLoading} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">Delete</button>
                                </div>
                            )}
                            <div className="p-5">
                                {editingId === service.id ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-2"><Label className="text-sm font-semibold">Title</Label><Input value={editForm.title || ""} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="h-10 rounded-xl bg-background" /></div>
                                            <div className="flex gap-3">
                                                <div className="flex flex-col gap-2 flex-1"><Label className="text-sm font-semibold">Price (₹)</Label><Input type="number" value={editForm.price || ""} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} className="h-10 rounded-xl bg-background" /></div>
                                                <div className="flex flex-col gap-2 flex-1"><Label className="text-sm font-semibold">Unit</Label><Select value={editForm.price_unit || "HOUR"} onValueChange={v => setEditForm(p => ({ ...p, price_unit: v }))}><SelectTrigger className="h-10 rounded-xl bg-background border-border"><SelectValue /></SelectTrigger><SelectContent className="bg-card rounded-xl">{priceUnits.map(u => (<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>))}</SelectContent></Select></div>
                                            </div>
                                            <div className="flex flex-col gap-2 lg:col-span-2"><Label className="text-sm font-semibold">Description</Label><Textarea value={editForm.description || ""} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className="rounded-xl bg-background min-h-[60px]" /></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setEditingId(null)} className="flex-1 h-10 rounded-xl border border-border text-muted text-sm font-semibold hover:bg-muted/10">Cancel</button>
                                            <button onClick={() => handleSaveEdit(service.id)} disabled={actionLoading} className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">{actionLoading ? "Saving..." : "Save Changes"}</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-4">
                                        <div className="size-14 rounded-xl bg-navy/5 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-navy text-2xl">construction</span></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div><h3 className="text-foreground font-bold text-base truncate">{service.title}</h3><p className="text-xs text-muted mt-0.5">{service.category_name || `Category #${service.category}`}</p></div>
                                                {statusColors[service.status] && (<span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[service.status].bg} ${statusColors[service.status].text}`}>{statusColors[service.status].label}</span>)}
                                            </div>
                                            {service.description && <p className="text-sm text-muted mt-2 line-clamp-2">{service.description}</p>}
                                            <div className="flex items-center gap-4 mt-3 flex-wrap">
                                                <div className="flex items-center gap-1"><span className="material-symbols-outlined text-primary text-sm">payments</span><span className="text-sm font-bold text-foreground">₹{Number(service.price).toLocaleString("en-IN")}</span><span className="text-xs text-muted">/ {getPriceUnitLabel(service.price_unit)}</span></div>
                                                <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-muted">radar</span><span className="text-xs text-muted">{service.service_radius_km} km</span></div>
                                            </div>
                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                                                <div className="flex items-center gap-2"><Switch checked={service.is_available} onCheckedChange={() => handleToggleAvailability(service.id, service.is_available)} className="scale-90 data-[state=checked]:bg-success data-[state=unchecked]:bg-muted" /><span className={`text-xs font-semibold ${service.is_available ? "text-success" : "text-muted"}`}>{service.is_available ? "Available" : "Unavailable"}</span></div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleStartEdit(service)} className="size-9 rounded-lg border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
                                                    <button onClick={() => setDeleteConfirm(service.id)} className="size-9 rounded-lg border border-border flex items-center justify-center text-muted hover:text-red-600 hover:border-red-300 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
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
        </PartnerLayout>
    )
}
