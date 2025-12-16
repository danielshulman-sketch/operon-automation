'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    CheckSquare,
    Mail,
    Workflow,
    Zap,
    MessageCircle,
    Settings,
    LogOut,
    Building2,
    Book,
} from 'lucide-react';

export default function DashboardSidebar() {
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperadmin, setIsSuperadmin] = useState(false);

    useEffect(() => {
        const fetchUserRoles = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) return;

                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    setIsAdmin(!!data.user?.isAdmin);
                    setIsSuperadmin(!!data.user?.isSuperadmin);
                }
            } catch (error) {
                // Ignore role fetch errors - sidebar still renders base nav
            }
        };

        fetchUserRoles();
    }, []);

    const navigationItems = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'Tasks', icon: CheckSquare, href: '/dashboard/tasks' },
        { name: 'Email Stream', icon: Mail, href: '/dashboard/email-stream' },
        { name: 'Automations', icon: Zap, href: '/dashboard/automations' },
        { name: 'AI Chat', icon: MessageCircle, href: '/dashboard/chat' },
    ];

    if (isAdmin || isSuperadmin) {
        navigationItems.push({
            name: 'Knowledge Base',
            icon: Book,
            href: '/dashboard/knowledge-base',
        });
        navigationItems.push({
            name: 'API Settings',
            icon: Settings,
            href: '/dashboard/api-settings',
        });
    }

    if (isSuperadmin) {
        navigationItems.push({
            name: 'Create Organizations',
            icon: Building2,
            href: '/dashboard/superadmin',
        });
    }

    return (
        <div className="w-64 h-screen bg-[#0b0b0b] border-r border-white/5 flex flex-col fixed left-0 top-0 shadow-[12px_0_50px_rgba(0,0,0,0.35)]">
            {/* Logo */}
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black font-bold text-sm shadow-md">
                        O
                    </div>
                    <span className="text-lg font-semibold text-white tracking-tight">
                        Operon
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4">
                <div className="space-y-1.5">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm border ${isActive
                                    ? 'bg-white/5 text-white border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)]'
                                    : 'text-white/60 border-transparent hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom Section */}
            <div className="p-3 space-y-1.5 border-t border-white/5">
                <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-white/60 hover:bg-white/5 hover:text-white transition-all text-sm"
                >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                </Link>
                <Link
                    href="/account/logout"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-red-400 hover:bg-red-500/10 transition-all text-sm"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                </Link>
            </div>
        </div>
    );
}
