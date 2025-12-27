'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandMark from './BrandMark';
import {
    LayoutDashboard,
    CheckSquare,
    Mail,
    Zap,
    BarChart3,
    MessageCircle,
    Settings,
    LogOut,
    X,
    Building2,
    Book,
} from 'lucide-react';

export default function DashboardSidebar({ isOpen = false, onClose = () => { } }) {
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
        { name: 'Integration Stats', icon: BarChart3, href: '/dashboard/automations/stats' },
        { name: 'AI Chat', icon: MessageCircle, href: '/dashboard/chat' },
    ];

    if (isAdmin || isSuperadmin) {
        navigationItems.push({
            name: 'Knowledge Base',
            icon: Book,
            href: '/dashboard/knowledge-base',
        });
        navigationItems.push({
            name: 'Reporting',
            icon: BarChart3,
            href: '/dashboard/reporting',
        });
        navigationItems.push({
            name: 'AI Settings',
            icon: Settings,
            href: '/dashboard/api-settings',
        });
    }

    if (isSuperadmin) {
        navigationItems.push({
            name: 'Superadmin',
            icon: Building2,
            href: '/dashboard/superadmin',
        });
    }

    return (
        <div
            className={`w-64 h-screen bg-[#050c1b] text-white border-r border-white/10 flex flex-col fixed left-0 top-0 shadow-[12px_0_40px_rgba(5,12,27,0.9)] z-50 transform transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        >
            {/* Logo */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <BrandMark withWordmark className="text-white" priority />
                <button
                    type="button"
                    onClick={onClose}
                    className="lg:hidden text-white/60 hover:text-white"
                    aria-label="Close navigation"
                >
                    <X className="h-5 w-5" />
                </button>
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
                                    ? 'bg-white/10 text-white border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.4)]'
                                    : 'text-white/70 border-transparent hover:bg-white/5 hover:text-white'
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
            <div className="p-3 space-y-1.5 border-t border-white/10">
                <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all text-sm"
                >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                </Link>
                <Link
                    href="/account/logout"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-red-300 hover:bg-red-500/10 transition-all text-sm"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                </Link>
            </div>
        </div>
    );
}
