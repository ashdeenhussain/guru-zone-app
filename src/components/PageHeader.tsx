

import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
    title: string;
    description?: string;
    icon: LucideIcon;
    customElement?: React.ReactNode;
    className?: string;
}

export default function PageHeader({ title, description, icon: Icon, customElement, className }: PageHeaderProps) {
    return (
        <div className={`pt-2 pb-3 px-4 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-30 mb-6 ${className || ""}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-foreground leading-none">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {customElement}
            </div>
        </div>
    );
}
