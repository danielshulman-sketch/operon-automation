'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface FacebookSDKContextType {
    isLoaded: boolean;
    login: (appId: string) => Promise<any>;
}

const FacebookSDKContext = createContext<FacebookSDKContextType>({
    isLoaded: false,
    login: async () => ({})
});

export const useFacebookSDK = () => useContext(FacebookSDKContext);

export function FacebookSDKProvider({ children }: { children: React.ReactNode }) {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if ((window as any).FB) {
            setIsLoaded(true);
            return;
        }

        (window as any).fbAsyncInit = function () {
            setIsLoaded(true);
        };

        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s) as HTMLScriptElement; js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            if (fjs && fjs.parentNode) {
                fjs.parentNode.insertBefore(js, fjs);
            } else {
                d.head.appendChild(js);
            }
        }(document, 'script', 'facebook-jssdk'));
    }, []);

    const login = async (appId: string) => {
        return new Promise((resolve, reject) => {
            const FB = (window as any).FB;
            if (!FB) {
                reject(new Error("Facebook SDK not loaded yet. Check your connection or ad blocker."));
                return;
            }
            if (!appId) {
                reject(new Error("Facebook App ID is missing. Please save it first."));
                return;
            }

            try {
                FB.init({
                    appId: appId,
                    cookie: true,
                    xfbml: true,
                    version: 'v19.0'
                });
            } catch (e) {
                // Ignore multiple initialization error in dev mode
                console.warn(e);
            }

            FB.login((response: any) => {
                if (response.authResponse) {
                    resolve(response);
                } else {
                    reject(new Error("User cancelled login or did not fully authorize."));
                }
            }, {
                // To get advanced scopes like instagram_basic, the app needs to be reviewed by Facebook,
                // OR the Facebook App needs to be in Development mode and you must log in with the admin/tester account.
                // We are requesting standard scopes first to ensure the connection works.
                scope: 'public_profile,email'
            });
        });
    };

    return (
        <FacebookSDKContext.Provider value={{ isLoaded, login }}>
            {children}
        </FacebookSDKContext.Provider>
    );
}
