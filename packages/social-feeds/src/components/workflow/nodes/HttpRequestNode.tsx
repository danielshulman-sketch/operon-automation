import React, { memo } from 'react';
import { BaseNode } from './BaseNode';
import { Globe } from 'lucide-react';
import { Position, NodeProps } from '@xyflow/react';

const HttpRequestNode = ({ id, data, selected }: NodeProps) => {
    const method = (data.method as string) || 'POST';

    return (
        <BaseNode
            id={id}
            label={data.label as string || 'HTTP Request'}
            icon={Globe}
            color="bg-teal-600"
            selected={selected}
            handles={[
                { type: 'target', position: Position.Top },
                { type: 'source', position: Position.Bottom }
            ]}
        >
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">Send HTTP Request</span>
                <div className="text-[10px] bg-muted p-1 rounded font-mono">
                    {method}
                </div>
            </div>
        </BaseNode>
    );
};

export default memo(HttpRequestNode);
