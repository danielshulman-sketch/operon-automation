import { AppSidebar } from "@/components/layout/AppSidebar";
import DataSyncProvider from "@/components/providers/DataSyncProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DataSyncProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </DataSyncProvider>
    );
}
