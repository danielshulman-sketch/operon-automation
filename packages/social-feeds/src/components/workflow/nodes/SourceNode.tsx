import React, { memo } from 'react';
import { BaseNode } from './BaseNode';
import { Rss, FileSpreadsheet } from 'lucide-react';
import { Position, NodeProps } from '@xyflow/react';

const SourceNode = ({ id, data, selected }: NodeProps) => {
    const isSheets = (data.type as string)?.includes('sheets');

    return (
        <BaseNode
            id={id}
            label={data.label as string || 'Source'}
            icon={isSheets ? FileSpreadsheet : Rss}
            color="bg-blue-500"
            selected={selected}
            handles={[
                { type: 'target', position: Position.Top },
                { type: 'source', position: Position.Bottom }
            ]}
        >
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">
                    {isSheets ? 'Google Sheet' : 'News URL'}
                </span>
                <div className="text-[10px] truncate max-w-[110px] opacity-75">
                    {data.url ? (data.url as string) : 'No source configured'}
                </div>
            </div>
        </BaseNode>
    );
};

export default memo(SourceNode);
