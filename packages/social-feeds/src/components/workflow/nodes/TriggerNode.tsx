import React, { memo } from 'react';
import { BaseNode } from './BaseNode';
import { Play, Calendar, Zap } from 'lucide-react';
import { Position, NodeProps } from '@xyflow/react';

const TriggerNode = ({ id, data, selected }: NodeProps) => {
    const type = data.period ? 'schedule' : 'manual'; // Simple heuristic or explicit type in data
    const isAutomatic = type === 'schedule';

    return (
        <BaseNode
            id={id}
            label={data.label as string || 'Trigger'}
            icon={isAutomatic ? Calendar : Play} // Zap for generic
            color="bg-emerald-500"
            selected={selected}
            handles={[{ type: 'source', position: Position.Bottom }]}
        >
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">Type: {isAutomatic ? 'Schedule' : 'Manual'}</span>
                {isAutomatic && <span className="font-mono text-[10px] bg-muted p-1 rounded">Every 1 hour</span>}
            </div>
        </BaseNode>
    );
};

export default memo(TriggerNode);
