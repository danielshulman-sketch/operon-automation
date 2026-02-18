
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple security check using the existing NEXTAUTH_SECRET
    if (secret !== process.env.NEXTAUTH_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("Starting migration...");
        // Attempt to run the migration using the local node_modules binary
        // We use 'npx prisma' which should resolve to the local installation
        const { stdout, stderr } = await execAsync('npx prisma migrate deploy');

        console.log("Migration output:", stdout);
        if (stderr) console.error("Migration error:", stderr);

        return NextResponse.json({
            success: true,
            output: stdout,
            error: stderr
        });
    } catch (error: any) {
        console.error("Migration failed:", error);
        return NextResponse.json({
            success: false,
            message: "Migration command failed",
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
