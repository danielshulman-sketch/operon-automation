import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Facebook, Linkedin, Instagram } from 'lucide-react';
import { useWorkflowStore } from '@/lib/store';

export default memo(({ data, type }: NodeProps) => {
    const iconMap: Record<string, React.ReactNode> = {
        'facebook-publisher': <Facebook className="w-4 h-4 text-blue-600" />,
        'linkedin-publisher': <Linkedin className="w-4 h-4 text-blue-700" />,
        'instagram-publisher': <Instagram className="w-4 h-4 text-pink-600" />,
    };

    const labelMap: Record<string, string> = {
        'facebook-publisher': 'Facebook Page',
        'linkedin-publisher': 'LinkedIn',
        'instagram-publisher': 'Instagram',
    };

    const account = useWorkflowStore(state => state.accounts.find(a => a.id === data.accountId));

    return (
        <div className="px-1.5 py-1 shadow-sm rounded-sm bg-white border border-stone-300 min-w-[120px]">
            <Handle type="target" position={Position.Left} className="w-16 !bg-stone-400" />

            <div className="flex items-center">
                <div className="rounded-full w-6 h-6 flex items-center justify-center bg-stone-100">
                    {iconMap[type] || <div />}
                </div>
                <div className="ml-2 overflow-hidden">
                    <div className="text-[10px] font-bold truncate">{labelMap[type] || 'Publisher'}</div>
                    <div className="text-[9px] text-gray-500 truncate">{data.label as string}</div>
                    {account && <div className="text-[9px] font-semibold text-blue-600 truncate max-w-[90px]">{account.name}</div>}
                    {type === 'instagram-publisher' && data.postType && (
                        <div className="text-[8px] text-pink-500 uppercase font-bold">{data.postType as string}</div>
                    )}
                </div>
            </div>

            <div className="mt-1 space-y-0.5">
                {data.textSource && data.textSource !== 'none' && (
                    <div className="text-[8px] bg-slate-50 text-slate-600 p-0.5 rounded border border-slate-100 truncate">
                        Txt: {data.textSource as string}
                    </div>
                )}

                {data.imageSource && data.imageSource !== 'none' && (
                    <div className="text-[8px] bg-purple-50 text-purple-600 p-0.5 rounded border border-purple-100 truncate">
                        Img: {data.imageSource as string}
                    </div>
                )}
            </div>
        </div>
    );
});
