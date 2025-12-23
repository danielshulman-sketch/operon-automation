import DashboardSidebar from '../components/DashboardSidebar';
import dynamic from 'next/dynamic';

const HelpCenterButton = dynamic(() => import('../components/HelpCenterButton'), {
    ssr: false,
});

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#050c1b] text-white">
            <DashboardSidebar />
            <div className="lg:ml-64">
                <main className="min-h-screen px-6 lg:px-10 py-8">
                    {children}
                </main>
                <HelpCenterButton />
            </div>
        </div>
    );
}
