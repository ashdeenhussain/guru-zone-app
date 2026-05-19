"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ContactContentProps {
    content: any;
}

export default function ContactContent({ content }: ContactContentProps) {
    if (!content) return null;

    const contact = content.contactInfo;

    return (
        <main className="min-h-screen bg-background text-foreground">
            {/* Nav */}
             <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border h-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest text-sm">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-3">
                        <Image src="/logo.jpg" alt="Logo" width={40} height={40} className="rounded-xl" loading="lazy" />
                        <span className="font-black text-xl tracking-tighter uppercase">GURU <span className="text-primary">ZONE</span></span>
                    </div>
                    <div className="w-24"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-32 pb-20">
                <div className="text-center mb-16">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black mb-6"
                    >
                        GET IN TOUCH
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground text-lg max-w-2xl mx-auto"
                    >
                        Have questions? Our elite support team is here to help you dominate.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-start">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <ContactCard 
                            icon={Mail} 
                            title="Email Support" 
                            value={contact?.email || "support@guruzone.com"} 
                            sub="We usually reply within 24 hours"
                        />
                        {contact?.phone && (
                            <ContactCard 
                                icon={Phone} 
                                title="Phone" 
                                value={contact.phone} 
                                sub="Mon - Fri, 9am - 6pm"
                            />
                        )}
                        {contact?.address && (
                            <ContactCard 
                                icon={MapPin} 
                                title="Physical Office" 
                                value={contact.address} 
                                sub="Visit us for partnerships"
                            />
                        )}
                        
                        {content.socialLinks?.whatsapp && (
                            <a 
                                href={`https://wa.me/${content.socialLinks.whatsapp.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 w-full py-6 bg-green-500 hover:bg-green-600 text-white font-black rounded-3xl transition-all shadow-xl shadow-green-900/20 group"
                            >
                                <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                Chat on WhatsApp
                            </a>
                        )}
                    </div>

                    {/* Simple Message Form Placeholder */}
                    <div className="bg-card border border-border p-8 md:p-10 rounded-[2.5rem] shadow-sm">
                        <h3 className="text-2xl font-bold mb-6">Send a Message</h3>
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Name</label>
                                    <input type="text" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary" placeholder="Your Name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
                                    <input type="email" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary" placeholder="Email Address" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
                                <input type="text" className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary" placeholder="How can we help?" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Message</label>
                                <textarea className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary h-32 resize-none" placeholder="Your message here..."></textarea>
                            </div>
                            <button className="w-full py-4 bg-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                                <Send className="w-4 h-4" />
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </div>

             <footer className="border-t border-border py-12 text-center text-muted-foreground text-sm">
                <p>© {new Date().getFullYear()} Guru Zone Esports. All rights reserved.</p>
            </footer>
        </main>
    );
}

function ContactCard({ icon: Icon, title, value, sub }: any) {
    return (
        <div className="flex items-start gap-4 p-6 bg-card border border-border rounded-3xl shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{title}</h4>
                <p className="text-xl font-bold text-foreground mt-1">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{sub}</p>
            </div>
        </div>
    );
}
