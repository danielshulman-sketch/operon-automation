import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, ExternalLink } from "lucide-react";

export function ConnectionGuide() {
    return (
        <Card className="mt-8 border-2 border-muted/50">
            <CardHeader className="bg-muted/10">
                <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <CardTitle>Step-by-Step Connection Guide</CardTitle>
                </div>
                <CardDescription>
                    Follow these detailed instructions to connect your accounts and configure the system.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">

                    {/* SOCIAL PLATFORMS */}
                    <AccordionItem value="social-platforms" className="px-6">
                        <AccordionTrigger className="text-base font-semibold">1. Connecting Social Platforms</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-6 text-sm text-foreground pb-4">
                                <p className="text-muted-foreground">
                                    To post content, you need to generate <strong>Access Tokens</strong> from the respective developer portals.
                                </p>

                                {/* FACEBOOK */}
                                <div className="space-y-3 border p-4 rounded-lg bg-card">
                                    <h4 className="font-bold flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-600" /> Facebook & Instagram
                                    </h4>
                                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md border border-blue-200 dark:border-blue-800 mb-4">
                                        <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Method A: Automatic (Recommended)</h5>
                                        <ol className="list-decimal pl-5 space-y-2 text-sm">
                                            <li>Ensure your <strong>App ID</strong> is set in the <code>.env</code> file.</li>
                                            <li>Click the blue <strong>"Connect with Facebook"</strong> button above.</li>
                                            <li>Approve the permissions in the popup window.</li>
                                            <li>Select your page from the list that appears.</li>
                                        </ol>
                                    </div>

                                    <h5 className="font-semibold text-muted-foreground mb-2">Method B: Manual Token (Advanced/Fallback)</h5>
                                    <ol className="list-decimal pl-5 space-y-2 text-muted-foreground text-xs">
                                        <li>
                                            Go to the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline text-primary inline-flex items-center gap-1">Graph API Explorer <ExternalLink className="h-3 w-3" /></a>.
                                        </li>
                                        <li>
                                            <strong>Create App:</strong> Create a new app. On the <strong>"Add use cases"</strong> screen, select <strong>"Authenticate and request data from users with Facebook Login"</strong>.
                                        </li>
                                        <li>
                                            <strong>User or Page:</strong> Select <strong>"User Token"</strong> from the dropdown.
                                        </li>
                                        <li>
                                            <strong>Permissions:</strong> Click "Add a Permission" and ensure these are listed:
                                            <div className="grid grid-cols-2 gap-1 mt-1 mb-1 font-mono text-[10px] bg-muted p-2 rounded">
                                                <span>pages_show_list</span>
                                                <span>pages_read_engagement</span>
                                                <span>pages_manage_posts</span>
                                                <span>pages_manage_metadata</span>
                                                <span>public_profile</span>
                                            </div>
                                        </li>
                                        <li>
                                            Click <span className="font-semibold text-foreground">"Generate Access Token"</span>. You may be asked to log in.
                                        </li>
                                        <li>
                                            <strong>Copy</strong> the long token string that appears.
                                        </li>
                                        <li>
                                            Paste the token into the "Or paste token" field above and click <strong>"Fetch"</strong>.
                                        </li>
                                    </ol>
                                </div>

                                {/* LINKEDIN */}
                                <div className="space-y-3 border p-4 rounded-lg bg-card">
                                    <h4 className="font-bold flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-700" /> LinkedIn
                                    </h4>
                                    <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                                        <li>
                                            Go to the <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener noreferrer" className="underline text-primary inline-flex items-center gap-1">LinkedIn Developer Portal <ExternalLink className="h-3 w-3" /></a> and create an App.
                                        </li>
                                        <li>
                                            <strong>Products:</strong> Go to the "Products" tab and Request Access for:
                                            <ul className="list-disc pl-5 mt-1 text-xs font-medium text-foreground">
                                                <li>Share on LinkedIn</li>
                                                <li>Sign In with LinkedIn using OpenID Connect</li>
                                            </ul>
                                        </li>
                                        <li>
                                            <strong>Auth:</strong> Go to the "Auth" tab. Under "OAuth 2.0 settings", note your Client ID/Secret (not needed for this manual token flow but good to have).
                                        </li>
                                        <li>
                                            Click the <strong>"OAuth 2.0 tools"</strong> link (usually on the right or in Tools menu).
                                        </li>
                                        <li>
                                            <strong>Create Token:</strong> Select your App and check these scopes:
                                            <div className="grid grid-cols-2 gap-1 mt-1 font-mono text-xs bg-muted p-2 rounded">
                                                <span>w_member_social</span>
                                                <span>r_liteprofile</span>
                                                <span>email</span>
                                                <span>openid</span>
                                            </div>
                                        </li>
                                        <li>
                                            Click <strong>"Request Access Token"</strong> and copy the result.
                                        </li>
                                        <li>
                                            Paste this token into the <strong>LinkedIn</strong> connection dialog in this app.
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* GOOGLE SHEETS */}
                    <AccordionItem value="google-sheets" className="px-6">
                        <AccordionTrigger className="text-base font-semibold">2. Integrating Google Sheets</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 text-sm text-foreground pb-4">
                                <p className="text-muted-foreground">
                                    Use a Google Sheet as a dynamic source for your posts.
                                </p>
                                <ol className="list-decimal pl-5 space-y-3 text-muted-foreground">
                                    <li>
                                        <strong>Create a Sheet:</strong> Make a new Google Sheet. Add headers in Row 1 (e.g., <code>Content</code>, <code>Image</code>, <code>Status</code>).
                                    </li>
                                    <li>
                                        <strong>Get ID:</strong> Look at your browser URL bar. Copy the long string between <code>/d/</code> and <code>/edit</code>.
                                        <div className="bg-muted p-2 rounded text-xs font-mono mt-1 break-all">
                                            docs.google.com/spreadsheets/d/<span className="bg-yellow-200/20 text-yellow-600 font-bold px-1">1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms</span>/edit
                                        </div>
                                    </li>
                                    <li>
                                        <strong>Permissions:</strong> Click the "Share" button in Google Sheets.
                                        <ul className="list-disc pl-5 mt-1">
                                            <li>Change access to <strong>"Anyone with the link"</strong> (Viewer is enough).</li>
                                            <li>Alternatively, if using a Service Account, share it with the service email.</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <strong>Configuration:</strong> Go to the <strong>Google Sheets</strong> tab in this app.
                                        <ul className="list-disc pl-5 mt-1">
                                            <li>Paste the <strong>Spreadsheet ID</strong>.</li>
                                            <li>Enter the <strong>Worksheet Name</strong> (usually "Sheet1").</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <strong>Map Columns:</strong> Enter the column letters (A, B, C...) corresponding to your data.
                                    </li>
                                </ol>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* AI PERSONA */}
                    <AccordionItem value="tone-persona" className="px-6 border-b-0">
                        <AccordionTrigger className="text-base font-semibold">3. Setting Tone & AI Persona</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 text-sm text-foreground pb-4">
                                <p className="text-muted-foreground">
                                    Customize how the AI writes your content by defining a Persona.
                                </p>
                                <ol className="list-decimal pl-5 space-y-3 text-muted-foreground">
                                    <li>
                                        Click the <span className="font-bold">Settings (Gear Icon)</span> in the sidebar.
                                    </li>
                                    <li>
                                        Scroll down to <strong>Persona Library</strong>.
                                    </li>
                                    <li>
                                        <strong>Create New:</strong> Give it a name (e.g., "Tech Influencer").
                                    </li>
                                    <li>
                                        <strong>Instructions:</strong> This is the most important part. Describe exactly how the AI should write.
                                        <div className="bg-muted p-3 rounded text-xs italic mt-1 border-l-2 border-primary">
                                            "You are a helpful and enthusiastic tech expert. Use emojis sparingly. Keep sentences short and punchy. Avoid using jargon without explanation. Always end with a question to engage the audience."
                                        </div>
                                    </li>
                                    <li>
                                        <strong>Default:</strong> You can set one persona as default, or select specific personas for each workflow in the <strong>AI Node</strong> settings.
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
