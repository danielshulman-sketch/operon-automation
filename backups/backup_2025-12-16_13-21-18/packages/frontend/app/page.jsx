'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('auth_token');
        if (token) {
            router.push('/dashboard');
        } else {
            router.push('/account/signin');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center">
            <p className="text-black dark:text-white font-inter">Redirecting...</p>
        </div>
    );
}
