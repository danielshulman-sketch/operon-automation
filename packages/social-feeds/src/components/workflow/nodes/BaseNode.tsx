import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface BaseNodeProps {
    id: string;
    label: string;
    icon?: LucideIcon;
    color?: string;
    selected?: boolean;
    children?: React.ReactNode;
    handles?: { type: 'source' | 'target'; position: Position; id?: string }[];
    status?: 'idle' | 'running' | 'completed' | 'failed';
}

export const BaseNode = ({
    id,
    label,
    icon: Icon,
    color = "bg-stone-500",
    selected,
    children,
    handles = [],
    status
}: BaseNodeProps) => {
    return (
        <Card className={cn(
            "w-32 shadow-sm transition-all duration-200 border",
            selected ? "border-primary ring-1 ring-primary" : "border-border",
            "hover:border-primary/50"
        )}>
            {handles.map((handle, index) => (
                <Handle
                    key={`${handle.type}-${index}`}
                    type={handle.type}
                    position={handle.position}
                    id={handle.id}
                    className={cn(
                        "w-2 h-2 border border-background",
                        handle.type === 'source' ? "bg-primary" : "bg-muted-foreground"
                    )}
                />
            ))}
            <CardHeader className={cn("p-1.5 flex flex-row items-center space-y-0 gap-1.5", color, "text-primary-foreground rounded-t-sm")}>
                {Icon && <Icon className="w-3 h-3" />}
                <CardTitle className="text-[10px] font-semibold leading-none truncate flex-1">{label}</CardTitle>
                {status && (
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        status === 'running' && "bg-yellow-400 animate-pulse",
                        status === 'completed' && "bg-green-400",
                        status === 'failed' && "bg-red-400"
                    )} />
                )}
            </CardHeader>

            {children && (
                <CardContent className="p-1.5 text-[10px]">
                    {children}
                </CardContent>
            )}
        </Card>
    );
};
