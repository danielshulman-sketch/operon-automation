"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useWorkflowStore } from "@/lib/store";

export default function DataSyncProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();
    const { setAccounts, setPersonas } = useWorkflowStore();

    useEffect(() => {
        if (session?.user) {
            // Fetch connections
            fetch('/api/connections')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        // Ensure data matches SocialAccount interface
                        setAccounts(data.map((item: any) => ({
                            id: item.id,
                            platform: item.platform,
                            name: item.name,
                            status: 'active', // Default to active for now
                            username: item.username,
                            accessToken: item.accessToken
                        })));
                    }
                })
                .catch(err => console.error("Failed to fetch connections", err));

            // Fetch personas
            fetch('/api/personas')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setPersonas(data);
                    }
                })
                .catch(err => console.error("Failed to fetch personas", err));
        }
    }, [session, setAccounts, setPersonas]);

    return <>{children}</>;
}
