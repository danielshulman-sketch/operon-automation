'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Workflow,
    Radio,
    Settings,
    Activity,
    LogOut,
    Shield
} from 'lucide-react';

const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/', label: 'Workflows', icon: Workflow }, // Canvas is home for now, or move to /workflows
    { href: '/connections', label: 'Connections', icon: Radio },
    { href: '/activity', label: 'Activity Log', icon: Activity },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className="flex flex-col h-screen w-64 border-r bg-card text-card-foreground">
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold tracking-tight">Social Poster</h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon size={18} />
                            {item.label}
                        </Link>
                    );
                })}

                {session?.user?.role === 'admin' && (
                    <Link
                        href="/admin/users"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            pathname === "/admin/users"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Shield size={18} />
                        Admin Users
                    </Link>
                )}
                {session?.user?.role === 'admin' && (
                    <Link
                        href="/admin/users"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            pathname === "/admin/users"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Shield size={18} />
                        Admin Users
                    </Link>
                )}
            </nav>

            <div className="p-4 border-t space-y-4">
                {session?.user && (
                    <div className="flex items-center gap-3 px-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                            {session.user.name?.[0] || session.user.email?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{session.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                        </div>
                    </div>
                )}
                <Button
                    variant="ghost"
                    className="flex items-center gap-3 px-3 py-2 w-full justify-start text-muted-foreground hover:text-foreground"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                >
                    <LogOut size={18} />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
