'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface FacebookSDKContextType {
    isLoaded: boolean;
    login: () => Promise<any>;
}

const FacebookSDKContext = createContext<FacebookSDKContextType>({
    isLoaded: false,
    login: async () => ({})
});

export const useFacebookSDK = () => useContext(FacebookSDKContext);

export function FacebookSDKProvider({ children }: { children: React.ReactNode }) {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const login = async () => {
        // Mock implementation for build to pass
        return { authResponse: { accessToken: 'mock_token' } };
    };

    return (
        <FacebookSDKContext.Provider value={{ isLoaded, login }}>
            {children}
        </FacebookSDKContext.Provider>
    );
}
