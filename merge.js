const fs = require('fs');

let page = fs.readFileSync('old_page2.txt', 'utf8');

// 1. Add Loader2 to lucide imports
page = page.replace('Save\n} from \'lucide-react\';', 'Save,\n    Loader2\n} from \'lucide-react\';');
if (!page.includes('Loader2')) {
    page = page.replace('Save } from', 'Save, Loader2 } from');
}

// 2. Add state and useEffect
const stateVars = `
    const [facebookAppId, setFacebookAppId] = useState('');
    const [facebookAppSecret, setFacebookAppSecret] = useState('');
    const [isSavingFacebook, setIsSavingFacebook] = useState(false);
    const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

    useEffect(() => {
        if (isAddAccountOpen && !hasLoadedSettings) {
            fetch('/api/user/settings')
                .then(res => res.json())
                .then(data => {
                    if (data.facebookAppId) setFacebookAppId(data.facebookAppId);
                    setHasLoadedSettings(true);
                })
                .catch(() => { });
        }
    }, [isAddAccountOpen, hasLoadedSettings]);
`;
page = page.replace('const [newAccountToken, setNewAccountToken] = useState(\'\');', 'const [newAccountToken, setNewAccountToken] = useState(\'\');\n' + stateVars);
if (!page.includes('setFacebookAppId')) {
    page = page.replace('const store = useWorkflowStore();', 'const store = useWorkflowStore();\n' + stateVars);
}

// 3. Update handleFacebookLogin
const oldHandleFacebookLogin = `    const handleFacebookLogin = async () => {
        try {
            const response = await fbLogin();`;

const newHandleFacebookLogin = `    const handleFacebookLogin = async () => {
        if (facebookAppId || facebookAppSecret) {
            setIsSavingFacebook(true);
            try {
                const updateData = {};
                if (facebookAppId) updateData.facebookAppId = facebookAppId;
                if (facebookAppSecret) updateData.facebookAppSecret = facebookAppSecret;

                await fetch('/api/user/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
                toast.success('Facebook App Configuration saved.');
            } catch (err) {
                console.error("Failed to save credentials", err);
                toast.error("Failed to save credentials");
            } finally {
                setIsSavingFacebook(false);
            }
        }

        try {
            const response = await fbLogin();`;
page = page.replace(oldHandleFacebookLogin, newHandleFacebookLogin);

// 4. Update the JSX for the facebook block
const oldJsx = `<div className="flex flex-col gap-3">
                                                <Button
                                                    onClick={handleFacebookLogin}
                                                    disabled={!fbLoaded}
                                                    className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white"
                                                >
                                                    <Facebook className="mr-2 h-4 w-4" />
                                                    Connect with Facebook
                                                </Button>`;

const newJsx = `<div className="flex flex-col gap-3">
                                                <div className="grid gap-2 border p-3 rounded-md bg-muted/20">
                                                    <p className="text-[11px] font-medium mb-1">Facebook App Credentials (Optional if in .env)</p>
                                                    <Input
                                                        placeholder="App ID"
                                                        value={facebookAppId}
                                                        onChange={(e) => setFacebookAppId(e.target.value)}
                                                    />
                                                    <Input
                                                        type="password"
                                                        placeholder="App Secret"
                                                        value={facebookAppSecret}
                                                        onChange={(e) => setFacebookAppSecret(e.target.value)}
                                                    />
                                                    <p className="text-[10px] text-muted-foreground m-0 leading-tight">
                                                        Find these in your <a href="https://developers.facebook.com/apps" target="_blank" className="underline" rel="noreferrer">Facebook Developer Dashboard</a>.
                                                    </p>
                                                </div>

                                                <Button
                                                    onClick={handleFacebookLogin}
                                                    disabled={!fbLoaded || isSavingFacebook}
                                                    className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white"
                                                >
                                                    {isSavingFacebook ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Facebook className="mr-2 h-4 w-4" />}
                                                    {isSavingFacebook ? "Saving..." : "Connect with Facebook"}
                                                </Button>`;
page = page.replace(oldJsx, newJsx);

fs.writeFileSync('packages/social-feeds/src/app/(dashboard)/connections/page.tsx', page);
console.log('Merge complete.');
