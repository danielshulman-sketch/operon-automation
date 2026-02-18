import React, { memo } from 'react';
import { BaseNode } from './BaseNode';
import { Sparkles, GitFork, ArrowRightLeft } from 'lucide-react';
import { Position, NodeProps } from '@xyflow/react';

const ProcessorNode = ({ id, data, selected }: NodeProps) => {
    const isRouter = (data.type as string)?.includes('router');

    return (
        <BaseNode
            id={id}
            label={data.label as string || (isRouter ? 'Router' : 'AI Processor')}
            icon={isRouter ? GitFork : Sparkles}
            color={isRouter ? 'bg-orange-500' : 'bg-purple-500'}
            selected={selected}
            handles={[
                { type: 'target', position: Position.Top },
                { type: 'source', position: Position.Bottom }
            ]}
        >
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">
                    {isRouter ? 'Split Execution' : 'Generate Content'}
                </span>
                {!isRouter && (
                    <div className="text-[10px] bg-muted p-1 rounded">
                        {(data.provider as string) || 'OpenAI'}
                    </div>
                )}
            </div>
        </BaseNode>
    );
};

export default memo(ProcessorNode);
