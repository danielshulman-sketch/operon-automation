import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export function ConnectionGuide() {
    return (
        <Card className="mt-8">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <CardTitle>How to Connect & Setup</CardTitle>
                </div>
                <CardDescription>
                    Follow these instructions to connect your social accounts and configure your AI persona.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="social-platforms">
                        <AccordionTrigger>Connecting Social Platforms</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 text-sm text-muted-foreground">
                                <p>
                                    To post to social media, you need to provide an <strong>Access Token</strong> for each platform.
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Facebook/Instagram:</strong> Go to the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline text-primary">Graph API Explorer</a>. Select your App and "Get Page Access Token". Ensure you grant <code>pages_manage_posts</code> and <code>pages_read_engagement</code> permissions.
                                    </li>
                                    <li>
                                        <strong>LinkedIn:</strong> Create an app in the <a href="https://www.linkedin.com/developers/" target="_blank" rel="noopener noreferrer" className="underline text-primary">LinkedIn Developer Portal</a>. Generate an OAuth 2.0 access token with <code>w_member_social</code> scope.
                                    </li>
                                </ul>
                                <p>
                                    Click the <strong>"Connect New Account"</strong> button above, select the platform, and paste your token. Valid tokens will show a "Verified" status.
                                </p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="tone-persona">
                        <AccordionTrigger>Setting Tone & Persona</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 text-sm text-muted-foreground">
                                <p>
                                    You can control how the AI writes your posts by configuring a <strong>Persona</strong>.
                                </p>
                                <ol className="list-decimal pl-5 space-y-2">
                                    <li>
                                        Go to the <strong>Settings</strong> page (click the gear icon in the sidebar).
                                    </li>
                                    <li>
                                        Scroll to the <strong>Persona Library</strong> section.
                                    </li>
                                    <li>
                                        Create a new Persona (e.g., "Professional", "Funny", "Tech Expert").
                                    </li>
                                    <li>
                                        Define the <strong>Tone</strong> (e.g., "Casual and witty") and <strong>Instructions</strong> (e.g., "Use emojis, avoid jargon").
                                    </li>
                                    <li>
                                        Set a Default Persona, or select a specific one in your Workflow's <strong>AI Node</strong> configuration.
                                    </li>
                                </ol>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="google-sheets">
                        <AccordionTrigger>Using Google Sheets</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 text-sm text-muted-foreground">
                                <p>
                                    To fetch content from a Google Sheet:
                                </p>
                                <ol className="list-decimal pl-5 space-y-2">
                                    <li>
                                        Switch to the <strong>Google Sheets</strong> tab above.
                                    </li>
                                    <li>
                                        Enter your <strong>Spreadsheet ID</strong> (found in the URL: <code>docs.google.com/spreadsheets/d/<b>SPREADSHEET_ID</b>/edit</code>).
                                    </li>
                                    <li>
                                        Map the columns. Enter the column letter (e.g., <strong>A</strong>, <strong>B</strong>) that corresponds to the content.
                                        <ul className="list-disc pl-5 mt-1">
                                            <li><strong>Content Column:</strong> The main text for the post.</li>
                                            <li><strong>Image/URL Column:</strong> (Optional) A link to an image or article.</li>
                                        </ul>
                                    </li>
                                    <li>
                                        Ensure your sheet is accessible (e.g., "Anyone with the link" or share with the service account email if configured).
                                    </li>
                                </ol>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}
