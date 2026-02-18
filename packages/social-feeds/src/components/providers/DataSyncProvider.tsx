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
            const parseJsonResponse = async (res: Response) => {
                const contentType = res.headers.get("content-type") || "";
                const bodyText = await res.text();

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${bodyText.slice(0, 200)}`);
                }

                if (!contentType.includes("application/json")) {
                    throw new Error(`Expected JSON but got '${contentType || "unknown"}'`);
                }

                return bodyText ? JSON.parse(bodyText) : null;
            };

            // Fetch connections
            fetch('/api/connections')
                .then(parseJsonResponse)
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
                .then(parseJsonResponse)
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
