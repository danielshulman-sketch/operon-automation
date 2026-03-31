import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeWorkflow } from "@/lib/executeWorkflow";

const normalizeDay = (value: unknown) =>
    typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizeTime = (value: unknown) =>
    typeof value === "string" ? value.trim().slice(0, 5) : "";

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET) {
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 });
        }
    } else {
        console.warn("No CRON_SECRET configured.");
    }

    try {
        const workflows = await prisma.workflow.findMany({
            where: { isActive: true },
        });

        const now = new Date();
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const currentDay = days[now.getUTCDay()];
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;

        console.log(`Cron running. Day: ${currentDay}, Time: ${currentTime} UTC`);

        let triggeredCount = 0;
        const results: { workflowId: string; status: string; error?: string }[] = [];
        const scheduleDebug: any[] = [];

        for (const workflow of workflows) {
            if (!workflow.definition) continue;

            try {
                const definition = JSON.parse(workflow.definition);
                const nodes = definition.nodes || [];
                const scheduleNodes = nodes.filter((n: any) => n.type === 'schedule-trigger');

                let shouldTrigger = false;
                for (const node of scheduleNodes) {
                    const schedules = node.data?.schedules || [];
                    scheduleDebug.push({ workflowId: workflow.id, schedules });
                    const match = schedules.some((s: any) => {
                        const day = normalizeDay(s?.day);
                        const time = normalizeTime(s?.time);
                        console.log(`Workflow ${workflow.id} schedule check: stored="${day} ${time}" vs current="${currentDay} ${currentTime}"`);
                        return day === currentDay && time === currentTime;
                    });
                    if (match) {
                        shouldTrigger = true;
                        break;
                    }
                }

                if (shouldTrigger) {
                    console.log(`Triggering workflow ${workflow.id}`);
                    try {
                        await executeWorkflow(workflow.id, workflow.userId, "schedule", req.url);
                        results.push({ workflowId: workflow.id, status: "success" });
                        triggeredCount++;
                    } catch (execErr: any) {
                        console.error(`Workflow ${workflow.id} failed:`, execErr);
                        results.push({ workflowId: workflow.id, status: "failed", error: execErr?.message });
                    }
                }
            } catch (err) {
                console.error(`Failed to parse workflow ${workflow.id}`, err);
            }
        }

        return NextResponse.json({ success: true, triggered: triggeredCount, currentDay, currentTime, workflowCount: workflows.length, scheduleDebug, results });

    } catch (error) {
        console.error("Cron failed:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
