import { useState } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);

  const login = async (username: string, password: string) => {
    // skeleton
    setUser({ username });
  };

  return { user, login };
};