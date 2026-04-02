'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Loader2, MessageSquare, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ChatReportModal from './ChatReportModal';

interface Message {
    _id: string;
    sender: string;
    senderName: string;
    content: string;
    isSystem: boolean;
    createdAt: string;
}

interface TournamentChatProps {
    tournamentId: string;
    isHost?: boolean;
    isParticipant?: boolean;
    isAdmin?: boolean;
    onNewMessage?: () => void;
}

export default function TournamentChat({ tournamentId, isHost, isParticipant, isAdmin }: TournamentChatProps) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportingMsg, setReportingMsg] = useState<{ id: string, userId: string, userName: string, text: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/tournaments/${tournamentId}/chat`);
            const data = await res.json();
            if (data.success) {
                const newMessages = data.data;
                
                // If there are new messages and a callback exists
                if (messages.length > 0 && newMessages.length > messages.length) {
                    const lastMsg = newMessages[newMessages.length - 1];
                    const isMe = lastMsg.sender === (session?.user as any)?.id;
                    
                    if (!isMe && onNewMessage) {
                        onNewMessage();
                    }
                }
                
                setMessages(newMessages);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load and Polling
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, [tournamentId]);

    // Scroll on new messages (simple version: always scroll on init, then user controls)
    useEffect(() => {
        if (messages.length > 0 && isLoading === false) {
            // Logic to only scroll if near bottom could be added here
            scrollToBottom();
        }
    }, [messages.length, isLoading]);


    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            const res = await fetch(`/api/tournaments/${tournamentId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage }),
            });
            const data = await res.json();

            if (data.success) {
                setNewMessage('');
                fetchMessages(); // Refresh immediately
            } else {
                toast.error(data.error || 'Failed to send');
            }
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 bg-muted/20 rounded-lg h-[400px]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] bg-card border border-border rounded-[2.5rem] shadow-xl shadow-black/5 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm">Lobby Chat</h3>
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live
                </span>
            </div>

            {/* Messages List */}
            <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                        <MessageSquare className="w-10 h-10 mb-2" />
                        <p className="text-sm">No messages yet.</p>
                        <p className="text-xs">Say hello to other players!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender === (session?.user as any)?.id;
                        return (
                            <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Message Bubble Container */}
                                    <div className="group/msg relative flex items-center gap-2">
                                        <div
                                            className={`px-4 py-2 rounded-2xl text-sm break-words
                                                ${isMe
                                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                    : 'bg-muted border border-border rounded-tl-none'
                                                }
                                            `}
                                        >
                                            {!isMe && (
                                                <div className="flex justify-between items-start gap-4 mb-1">
                                                    <span className="text-[10px] font-bold opacity-70 text-primary">
                                                        {msg.senderName || 'Unknown'}
                                                    </span>
                                                </div>
                                            )}
                                            {msg.content}
                                        </div>

                                        {!isMe && !msg.isSystem && (
                                            <button
                                                onClick={() => {
                                                    setReportingMsg({
                                                        id: msg._id,
                                                        userId: msg.sender,
                                                        userName: msg.senderName,
                                                        text: msg.content
                                                    });
                                                    setIsReportModalOpen(true);
                                                }}
                                                className="p-1.5 h-fit text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover/msg:opacity-100"
                                                title="Report Message"
                                            >
                                                <Flag size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground min-w-fit mb-1">
                                        {format(new Date(msg.createdAt), 'HH:mm')}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Report Modal */}
            <ChatReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                matchId={tournamentId}
                reportedUserId={reportingMsg?.userId || ''}
                reportedUserName={reportingMsg?.userName || ''}
                messageText={reportingMsg?.text || ''}
            />

            {/* Input Area - Only for Participants */}
            {
                (isParticipant || isAdmin || isHost) ? (
                    <form onSubmit={handleSend} className="p-3 border-t border-border bg-background flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                            disabled={isSending}
                        />
                        <button
                            type="submit"
                            disabled={isSending || !newMessage.trim()}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>
                ) : (
                    <div className="p-4 border-t border-border bg-muted/20 text-center">
                        <p className="text-xs text-muted-foreground">
                            Only joined participants can chat.
                        </p>
                    </div>
                )
            }
        </div >
    );
}
