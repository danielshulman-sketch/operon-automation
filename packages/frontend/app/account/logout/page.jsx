'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        // Clear auth token
        localStorage.removeItem('auth_token');

        // Redirect to sign in
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        } else {
            router.replace('/login');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center">
            <p className="text-black dark:text-white font-inter">Signing out...</p>
        </div>
    );
}
