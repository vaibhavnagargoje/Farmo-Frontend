"use client"

import { useState } from "react"
import Link from "next/link"
import { AccountLayout } from "@/components/account-layout"
import { cn } from "@/lib/utils"

// FAQ items
const faqItems = [
    {
        question: "How do I book equipment?",
        answer: "Browse our catalog, select the equipment you need, choose your dates, and confirm your booking. You'll receive a confirmation with all the details.",
    },
    {
        question: "What is the cancellation policy?",
        answer: "You can cancel your booking up to 24 hours before the scheduled date for a full refund. Cancellations within 24 hours may incur a fee.",
    },
    {
        question: "How do I become a partner?",
        answer: "Go to your Profile page and click 'Become a Partner'. Complete the onboarding process including KYC verification, and you can start listing your equipment.",
    },
    {
        question: "What payment methods are accepted?",
        answer: "We accept UPI, credit/debit cards, net banking, and cash on delivery for select services.",
    },
    {
        question: "How do I track my booking?",
        answer: "Go to My Bookings to see the real-time status of all your bookings. You'll also receive notifications for status updates.",
    },
]

export default function SupportPage() {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

    return (
        <AccountLayout pageTitle="Help & Support">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-foreground">Help & Support</h2>
                    <p className="text-sm text-muted mt-1">Find answers or reach out to our team</p>
                </div>

                {/* Quick Contact Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <a
                        href="tel:+919876543210"
                        className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:shadow-md transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">call</span>
                        </div>
                        <div>
                            <p className="font-semibold text-foreground text-sm">Call Us</p>
                            <p className="text-xs text-muted">+91 98765 43210</p>
                        </div>
                    </a>

                    <a
                        href="mailto:support@farmo.in"
                        className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:shadow-md transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">mail</span>
                        </div>
                        <div>
                            <p className="font-semibold text-foreground text-sm">Email Us</p>
                            <p className="text-xs text-muted">support@farmo.in</p>
                        </div>
                    </a>

                    <a
                        href="https://wa.me/919876543210"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:shadow-md transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">chat</span>
                        </div>
                        <div>
                            <p className="font-semibold text-foreground text-sm">WhatsApp</p>
                            <p className="text-xs text-muted">Chat with us</p>
                        </div>
                    </a>
                </div>

                {/* FAQ Section */}
                <div className="bg-card rounded-2xl border border-border p-5 lg:p-8">
                    <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
                        <span className="material-symbols-outlined text-2xl text-navy">quiz</span>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Frequently Asked Questions</h3>
                            <p className="text-xs text-muted">Quick answers to common questions</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {faqItems.map((faq, index) => (
                            <div key={index} className="border border-border rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
                                >
                                    <span className="font-medium text-foreground text-sm pr-4">{faq.question}</span>
                                    <span className={cn(
                                        "material-symbols-outlined text-muted transition-transform flex-shrink-0",
                                        expandedFaq === index && "rotate-180"
                                    )}>
                                        expand_more
                                    </span>
                                </button>
                                {expandedFaq === index && (
                                    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                                        <p className="text-sm text-muted leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-card rounded-2xl border border-border p-5 lg:p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                        <span className="material-symbols-outlined text-2xl text-navy">contact_support</span>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Send Us a Message</h3>
                            <p className="text-xs text-muted">We'll get back to you within 24 hours</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-2">Subject</label>
                            <select className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20">
                                <option>Booking Issue</option>
                                <option>Payment Problem</option>
                                <option>Account Issue</option>
                                <option>Partner Support</option>
                                <option>General Inquiry</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-2">Message</label>
                            <textarea
                                rows={4}
                                placeholder="Describe your issue or question..."
                                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all resize-none"
                            />
                        </div>
                        <button className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm">
                            Send Message
                        </button>
                    </div>
                </div>
            </div>
        </AccountLayout>
    )
}
