import DashboardSidebar from '../components/DashboardSidebar';

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <DashboardSidebar />
            <div className="lg:ml-64">
                <main className="min-h-screen px-6 lg:px-10 py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
