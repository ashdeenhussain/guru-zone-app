'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Search,
    Filter,
    MessageSquare,
    CheckCircle,
    Clock,
    Send,
    User,
    MoreVertical,
    AlertCircle,
    ChevronDown,
    Check,
    RefreshCcw,
    X,
    Inbox,
    ChevronLeft
} from 'lucide-react';

interface IMessage {
    sender: 'user' | 'admin';
    message: string;
    timestamp: string;
}

interface ITicket {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    subject: string;
    category: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    message: string;
    status: 'Open' | 'In Progress' | 'Closed';
    conversation: IMessage[];
    createdAt: string;
    updatedAt: string;
}

export default function AdminSupportPage() {
    // -- State --
    const [tickets, setTickets] = useState<ITicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'All' | 'Open' | 'In Progress' | 'Closed'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [replyStatus, setReplyStatus] = useState<'Open' | 'In Progress' | 'Closed'>('In Progress');
    const [sending, setSending] = useState(false);

    // -- Refs --
    const chatEndRef = useRef<HTMLDivElement>(null);

    // -- Fetch --
    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/support/tickets');
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        } catch (error) {
            console.error('Failed to fetch tickets', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // -- Effects --
    useEffect(() => {
        if (selectedTicket) {
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [selectedTicket?.conversation, selectedTicket]);

    // -- Computed --
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket._id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'All' ? true : ticket.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const stats = {
        open: tickets.filter(t => t.status === 'Open').length,
        inProgress: tickets.filter(t => t.status === 'In Progress').length,
        closed: tickets.filter(t => t.status === 'Closed').length
    };

    // -- Handlers --
    const handleSendMessage = async () => {
        if (!selectedTicket || !replyMessage.trim()) return;

        setSending(true);
        try {
            const res = await fetch(`/api/admin/support/${selectedTicket._id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: replyMessage,
                    newStatus: replyStatus
                })
            });

            if (res.ok) {
                const { ticket: updatedTicket } = await res.json();
                setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
                setSelectedTicket(updatedTicket);
                setReplyMessage('');
                setReplyStatus(updatedTicket.status); // Sync reply status
            } else {
                alert('Failed to send reply');
            }
        } catch (error) {
            console.error(error);
            alert('Error sending reply');
        } finally {
            setSending(false);
        }
    };

    const handleUpdateStatus = async (newStatus: 'Open' | 'In Progress' | 'Closed') => {
        if (!selectedTicket) return;
        const autoMsg = `[System]: Status updated to ${newStatus}`;
        setSending(true);
        try {
            const res = await fetch(`/api/admin/support/${selectedTicket._id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: autoMsg,
                    newStatus: newStatus
                })
            });

            if (res.ok) {
                const { ticket: updatedTicket } = await res.json();
                setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
                setSelectedTicket(updatedTicket);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    // -- Render Helpers --
    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'Urgent': return 'bg-red-500/20 text-red-500 border-red-500/30';
            case 'High': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
            case 'Medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
            case 'Low': return 'bg-green-500/20 text-green-500 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'Open': return 'bg-green-500 text-green-950';
            case 'In Progress': return 'bg-yellow-500 text-yellow-950';
            case 'Closed': return 'bg-gray-500 text-gray-950';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="fixed inset-x-0 top-16 bottom-16 z-30 flex flex-col bg-background lg:static lg:h-[calc(100vh-2rem)] lg:-m-8">
            {/* Header */}
            <div className="relative z-30 border-b border-white/5 bg-background/80 backdrop-blur-xl px-4 lg:px-6 py-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-cyan-500/10 rounded-xl shrink-0 border border-cyan-500/20">
                        <MessageSquare className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-foreground leading-none">Support Desk</h1>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Manage user inquiries</p>
                    </div>
                </div>
                <button
                    onClick={fetchTickets}
                    className="p-1.5 hover:bg-muted/50 rounded-full text-muted-foreground hover:text-foreground transition-colors active:scale-95"
                    title="Refresh Tickets"
                >
                    <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Main Content (Split View) */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">

                {/* LEFT: Ticket List */}
                <div className={`w-full lg:w-96 flex flex-col border-r border-white/5 bg-background/50 backdrop-blur-sm z-20 absolute inset-0 lg:static transition-transform duration-300 ${selectedTicket ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>

                    {/* Controls & Stats */}
                    <div className="p-3 border-b border-white/5 space-y-3 shrink-0">
                        {/* Status Pills */}
                        <div className="flex gap-2 text-xs overflow-x-auto no-scrollbar">
                            <button onClick={() => setFilterStatus('All')} className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${filterStatus === 'All' ? 'bg-muted/80 text-foreground border-white/10' : 'text-muted-foreground border-transparent hover:bg-muted/50'}`}>All</button>
                            <button onClick={() => setFilterStatus('Open')} className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 ${filterStatus === 'Open' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'text-muted-foreground border-transparent hover:bg-green-500/10'}`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Open <span className="opacity-50">({stats.open})</span>
                            </button>
                            <button onClick={() => setFilterStatus('In Progress')} className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 ${filterStatus === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'text-muted-foreground border-transparent hover:bg-yellow-500/10'}`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> In Progress <span className="opacity-50">({stats.inProgress})</span>
                            </button>
                            <button onClick={() => setFilterStatus('Closed')} className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 ${filterStatus === 'Closed' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'text-muted-foreground border-transparent hover:bg-gray-500/10'}`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Closed <span className="opacity-50">({stats.closed})</span>
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-muted/40 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {loading ? (
                            <div className="flex justify-center py-10"><RefreshCcw className="animate-spin text-muted-foreground" size={20} /></div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground/50 text-xs">No tickets found</div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <div
                                    key={ticket._id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`group p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedTicket?._id === ticket._id
                                        ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/30'
                                        : 'bg-card/40 border-white/5 hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full shadow-sm ${ticket.status === 'Open' ? 'bg-green-500 shadow-green-500/50' : ticket.status === 'In Progress' ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-gray-500'}`} />
                                            <span className={`font-semibold text-xs line-clamp-1 ${selectedTicket?._id === ticket._id ? 'text-cyan-400' : 'text-foreground'}`}>
                                                {ticket.subject}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap font-mono opacity-70">
                                            {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2 pl-4 border-l-2 border-white/10 group-hover:border-cyan-500/30 transition-colors">
                                        {ticket.message}
                                    </p>
                                    <div className="flex items-center justify-between pl-4">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80">
                                            <User size={10} />
                                            <span className="truncate max-w-[80px]">{ticket.userId?.name}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${ticket.status === 'Open' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                    ticket.status === 'In Progress' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                        'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                                }`}>
                                                {ticket.status}
                                            </span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: Chat Area */}
                <div className={`flex-1 flex flex-col bg-muted/5 absolute inset-0 lg:static transition-transform duration-300 z-40 lg:z-auto ${selectedTicket ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>

                    {selectedTicket ? (
                        <>
                            {/* Chat Header (Mobile Optimized) */}
                            <div className="px-4 py-3 border-b border-border bg-background/95 backdrop-blur-md flex justify-between items-center shadow-sm shrink-0 h-[60px]">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <button
                                        onClick={() => setSelectedTicket(null)}
                                        className="lg:hidden p-2 -ml-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-sm font-bold text-cyan-600 shrink-0 border border-white/10 uppercase">
                                            {selectedTicket.userId?.name.slice(0, 2)}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h2 className="font-bold text-sm text-foreground truncate leading-tight">
                                                {selectedTicket.userId?.name}
                                            </h2>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                                                <span className="font-medium truncate max-w-[150px]">{selectedTicket.subject}</span>
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                                <span className={`text-[10px] uppercase font-bold ${selectedTicket.status === 'Open' ? 'text-green-500' : selectedTicket.status === 'In Progress' ? 'text-yellow-500' : 'text-gray-500'}`}>
                                                    {selectedTicket.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative group shrink-0">
                                    <button className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                                        <MoreVertical size={20} />
                                    </button>
                                    <div className="absolute right-0 top-full mt-2 w-40 bg-popover border border-border rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-3 py-2 text-[10px] font-bold uppercase text-muted-foreground bg-muted/50">Change Status</div>
                                        {['Open', 'In Progress', 'Closed'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => handleUpdateStatus(s as any)}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors flex items-center justify-between text-foreground border-b border-white/5 last:border-0"
                                            >
                                                {s}
                                                {selectedTicket.status === s && <Check size={14} className="text-cyan-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 scrollbar-thin scrollbar-thumb-muted-foreground/10">
                                {/* First Inquiry */}
                                <div className="flex flex-col gap-1 max-w-[90%]">
                                    <div className="p-4 rounded-2xl rounded-tl-sm bg-card border border-border shadow-sm text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                                        <div className="text-[10px] uppercase font-bold text-cyan-500 mb-1 tracking-wide opacity-80">Initial Inquiry</div>
                                        {selectedTicket.message}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground px-1">{new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>

                                {selectedTicket.conversation?.map((msg, idx) => {
                                    const isAdmin = msg.sender === 'admin';
                                    return (
                                        <div key={idx} className={`flex flex-col gap-1 max-w-[85%] ${isAdmin ? 'self-end items-end' : 'self-start'}`}>
                                            <div className={`p-3 px-4 rounded-2xl text-sm shadow-sm leading-relaxed whitespace-pre-wrap border ${isAdmin
                                                ? 'bg-cyan-600 text-white border-cyan-500 rounded-tr-sm'
                                                : 'bg-card border-border text-foreground/90 rounded-tl-sm'
                                                }`}>
                                                {msg.message}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground px-1 opacity-70">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )
                                })}
                                <div ref={chatEndRef} className="h-2" />
                            </div>

                            {/* Input Area (Mobile Style) */}
                            <div className="p-3 bg-background border-t border-border shrink-0 pb-safe">
                                {selectedTicket.status === 'Closed' ? (
                                    <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-muted/50 border border-border text-muted-foreground text-xs font-medium">
                                        <CheckCircle size={16} />
                                        Ticket Closed. Reply to reopen.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {/* Quick Status Selector */}
                                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 mr-1">Status on reply:</span>
                                            {['Open', 'In Progress', 'Closed'].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setReplyStatus(s as any)}
                                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap ${replyStatus === s
                                                        ? s === 'Closed' ? 'bg-red-500 text-white border-red-600' : 'bg-foreground text-background border-foreground'
                                                        : 'bg-card border-border text-muted-foreground hover:border-foreground/30'
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Input Row */}
                                        <div className="flex items-end gap-2">
                                            <textarea
                                                value={replyMessage}
                                                onChange={(e) => setReplyMessage(e.target.value)}
                                                placeholder="Type message..."
                                                rows={1}
                                                className="flex-1 bg-muted/30 border border-input rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all min-h-[46px] max-h-32 resize-none"
                                                onInput={(e) => {
                                                    const target = e.target as HTMLTextAreaElement;
                                                    target.style.height = 'auto';
                                                    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                                                }}
                                            />
                                            <button
                                                onClick={handleSendMessage}
                                                disabled={sending || !replyMessage.trim()}
                                                className={`h-[46px] w-[46px] bg-cyan-500 hover:bg-cyan-400 text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-cyan-500/20 shrink-0 ${(sending || !replyMessage.trim()) ? 'opacity-50 scale-95 cursor-not-allowed' : 'active:scale-90 hover:scale-105'
                                                    }`}
                                            >
                                                {sending ? <RefreshCcw size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-muted-foreground">
                            <div className="w-24 h-24 rounded-full bg-muted/40 flex items-center justify-center mb-6 border border-white/5 animate-pulse">
                                <MessageSquare className="w-10 h-10 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Admin Support</h3>
                            <p className="text-sm opacity-60 mt-1">Select a ticket to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
