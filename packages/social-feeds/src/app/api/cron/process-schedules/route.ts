import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeWorkflow } from "@/lib/executeWorkflow";
import { createHmac } from "crypto";

export async function GET(req: Request) {
    // Vercel Cron authorization check
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET) {
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', {
                status: 401,
            });
        }
    } else {
        console.warn("No CRON_SECRET configured.");
    }

    try {
        // Find all active workflows that might have schedule triggers
        const workflows = await prisma.workflow.findMany({
            where: { isActive: true },
        });

        // Get current day of week (0 = Sunday, 1 = Monday, etc.) and time in HH:mm
        // Note: Vercel Cron runs in UTC. If users configure schedules in local time, we would need to handle timezone conversions.
        // Assuming schedules are configured in UTC for simplicity or that the timezone is uniform.
        // Let's use UTC time matching for now as we don't have timezone config per user.
        const now = new Date();
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const currentDay = days[now.getUTCDay()];

        // Truncate to current minute
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;

        console.log(`Cron executing for Day: ${currentDay}, Time: ${currentTime}`);
        let triggeredCount = 0;

        for (const workflow of workflows) {
            if (!workflow.definition) continue;

            try {
                const definition = JSON.parse(workflow.definition);
                const nodes = definition.nodes || [];
                const scheduleNodes = nodes.filter((n: any) => n.type === 'schedule-trigger');

                for (const node of scheduleNodes) {
                    const schedules = node.data?.schedules || [];

                    const shouldRun = schedules.some((s: any) => {
                        return s.day === currentDay && s.time === currentTime;
                    });

                    if (shouldRun) {
                        console.log(`Triggering workflow ${workflow.id} for user ${workflow.userId}`);
                        // Execute workflow asynchronously so we don't block the cron job
                        executeWorkflow(workflow.id, workflow.userId, "schedule").catch(e => {
                            console.error(`Scheduled execution failed for workflow ${workflow.id}:`, e);
                        });
                        triggeredCount++;
                        break; // Only trigger once per workflow per check
                    }
                }
            } catch (err) {
                console.error(`Failed to parse definition for workflow ${workflow.id}`, err);
            }
        }

        return NextResponse.json({ success: true, triggered: triggeredCount });

    } catch (error) {
        console.error("Cron Schedule check failed:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
