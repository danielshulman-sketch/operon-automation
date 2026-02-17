import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
    auth: {
        user: process.env.EMAIL_SERVER_USER || "mock_user",
        pass: process.env.EMAIL_SERVER_PASSWORD || "mock_pass",
    },
});

export const sendWorkflowFailureEmail = async (email: string, workflowName: string, error: string) => {
    try {
        const info = await transporter.sendMail({
            from: '"Workflow Automator" <noreply@example.com>',
            to: email,
            subject: `Workflow Failed: ${workflowName}`,
            text: `Your workflow "${workflowName}" failed to execute.\n\nError: ${error}\n\nPlease check your workflow settings.`,
            html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #e11d48;">Workflow Execution Failed</h2>
          <p>Your workflow <strong>${workflowName}</strong> encountered an error.</p>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <code>${error}</code>
          </div>
          <p>Please log in to your dashboard to investigate.</p>
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; background: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
        </div>
      `,
        });

        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        // Don't throw, just log
    }
};
