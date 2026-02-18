import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Facebook, Linkedin, Instagram, AtSign, Globe, PenSquare } from 'lucide-react';
import { useWorkflowStore } from '@/lib/store';

export default memo(({ data, type }: NodeProps) => {
    const iconMap: Record<string, React.ReactNode> = {
        'facebook-publisher': <Facebook className="w-3.5 h-3.5 text-blue-600" />,
        'linkedin-publisher': <Linkedin className="w-3.5 h-3.5 text-blue-700" />,
        'instagram-publisher': <Instagram className="w-3.5 h-3.5 text-pink-600" />,
        'threads-publisher': <AtSign className="w-3.5 h-3.5 text-gray-700" />,
        'wordpress-publisher': <PenSquare className="w-3.5 h-3.5 text-indigo-600" />,
        'wix-publisher': <Globe className="w-3.5 h-3.5 text-purple-600" />,
        'squarespace-publisher': <Globe className="w-3.5 h-3.5 text-zinc-700" />,
    };

    const labelMap: Record<string, string> = {
        'facebook-publisher': 'Facebook',
        'linkedin-publisher': 'LinkedIn',
        'instagram-publisher': 'Instagram',
        'threads-publisher': 'Threads',
        'wordpress-publisher': 'WordPress',
        'wix-publisher': 'Wix',
        'squarespace-publisher': 'Squarespace',
    };

    const account = useWorkflowStore(state => state.accounts.find(a => a.id === data.accountId));

    return (
        <div className="px-1.5 py-1 shadow-sm rounded-sm bg-white border border-stone-300 min-w-[100px] max-w-[130px]">
            <Handle type="target" position={Position.Left} className="w-16 !bg-stone-400" />

            <div className="flex items-center gap-1.5">
                <div className="rounded-full w-5 h-5 flex items-center justify-center bg-stone-100 shrink-0">
                    {iconMap[type] || <div />}
                </div>
                <div className="overflow-hidden">
                    <div className="text-[10px] font-bold truncate">{labelMap[type] || 'Publisher'}</div>
                    {account && <div className="text-[9px] font-semibold text-blue-600 truncate">{account.name}</div>}
                    {!account && <div className="text-[9px] text-gray-400 truncate">Not configured</div>}
                </div>
            </div>
        </div>
    );
});
