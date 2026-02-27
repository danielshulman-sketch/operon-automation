'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

declare global {
    interface Window {
        fbAsyncInit: () => void;
        FB: any;
    }
}

namespace fb {
    export interface StatusResponse {
        status: 'connected' | 'not_authorized' | 'unknown';
        authResponse: {
            accessToken: string;
            expiresIn: number;
            signedRequest: string;
            userID: string;
        };
    }
}

interface FacebookSDKContextType {
    isLoaded: boolean;
    login: () => Promise<fb.StatusResponse>;
    logout: () => Promise<void>;
}

const FacebookSDKContext = createContext<FacebookSDKContextType>({
    isLoaded: false,
    login: async () => { throw new Error("FB SDK not loaded"); },
    logout: async () => { }
});

export const useFacebookSDK = () => useContext(FacebookSDKContext);

export function FacebookSDKProvider({ children }: { children: React.ReactNode }) {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load SDK asynchronously
        const loadSdk = () => {
            if (document.getElementById('facebook-jssdk')) return;
            const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
            if (!appId) {
                // Facebook is optional; don't initialize SDK when app id is missing.
                setIsLoaded(false);
                return;
            }

            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            (window as any).fbAsyncInit = function () {
                try {
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    (window as any).FB.init({
                        appId,
                        cookie: true,
                        xfbml: true,
                        version: 'v19.0'
                    });
                    setIsLoaded(true);
                } catch (e) {
                    console.error("Facebook SDK init failed:", e);
                    setIsLoaded(false);
                }
            };

            const fjs = document.getElementsByTagName('script')[0];
            if (fjs && fjs.parentNode) {
                const js = document.createElement('script');
                js.id = 'facebook-jssdk';
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                js.onerror = () => {
                    console.error("Failed to load Facebook SDK script.");
                    setIsLoaded(false);
                };
                fjs.parentNode.insertBefore(js, fjs);
            }
        };

        loadSdk();
    }, []);

    const login = (): Promise<fb.StatusResponse> => {
        return new Promise((resolve, reject) => {
            if (!isLoaded || !(window as any).FB) {
                reject(new Error("Facebook SDK not loaded yet."));
                return;
            }

            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            (window as any).FB.login((response: fb.StatusResponse) => {
                if (response.authResponse) {
                    resolve(response);
                } else {
                    reject(new Error("User cancelled login or did not fully authorize."));
                }
            }, {
                scope: 'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,instagram_basic,instagram_content_publish'
            });
        });
    };

    const logout = (): Promise<void> => {
        return new Promise((resolve) => {
            if ((window as any).FB) {
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                (window as any).FB.logout(() => {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    };

    return (
        <FacebookSDKContext.Provider value={{ isLoaded, login, logout }}>
            {children}
        </FacebookSDKContext.Provider>
    );
}
