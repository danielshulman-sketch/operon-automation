import React, { memo } from 'react';
import { BaseNode } from './BaseNode';
import { Image as ImageIcon } from 'lucide-react';
import { Position, NodeProps } from '@xyflow/react';

const ImageGenNode = ({ id, data, selected }: NodeProps) => {
    return (
        <BaseNode
            id={id}
            label={data.label as string || 'Generate Image'}
            icon={ImageIcon}
            color="bg-purple-600"
            selected={selected}
            handles={[
                { type: 'target', position: Position.Top },
                { type: 'source', position: Position.Bottom }
            ]}
        >
            <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">AI Image</span>
                <div className="text-xs bg-muted p-1 rounded truncate max-w-[150px]">
                    {(data.prompt as string) || 'Describe the image...'}
                </div>
            </div>
        </BaseNode>
    );
};

export default memo(ImageGenNode);
