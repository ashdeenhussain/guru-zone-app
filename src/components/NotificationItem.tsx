import { Check, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface Notification {
    _id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    createdAt: string;
}

export type NotificationVariant = 'dark' | 'adaptive';

interface NotificationItemProps {
    notification: Notification;
    onClick: (notification: Notification) => void;
    variant?: NotificationVariant;
}

export function NotificationItem({ notification, onClick, variant = 'adaptive' }: NotificationItemProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <Check size={16} className="text-green-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
            case 'error': return <AlertCircle size={16} className="text-red-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    const isDark = variant === 'dark';

    return (
        <button
            onClick={() => onClick(notification)}
            className={`flex gap-3 p-4 text-left transition-colors border-b last:border-0 relative w-full
                ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-border hover:bg-muted/50'}
                ${!notification.isRead ? (isDark ? 'bg-primary/5' : 'bg-primary/5') : ''}
            `}
        >
            <div className={`mt-1 p-2 rounded-full h-fit flex-shrink-0 ${isDark ? 'bg-white/5' : 'bg-muted'}`}>
                {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <p className={`text-sm font-semibold truncate 
                        ${!notification.isRead 
                            ? (isDark ? 'text-white' : 'text-foreground') 
                            : (isDark ? 'text-gray-400' : 'text-muted-foreground')
                        }
                    `}>
                        {notification.title}
                    </p>
                    {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                </div>
                <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
                    {notification.message}
                </p>
                <p className={`text-[10px] mt-2 ${isDark ? 'text-gray-500' : 'text-muted-foreground/70'}`}>
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
            </div>
        </button>
    );
}
