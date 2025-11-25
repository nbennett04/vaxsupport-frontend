import React, { createContext, useEffect, useState } from "react";

import { axiosInstance } from "@/utils/axiosInstance";

export interface UserType {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface UserContextType {
  user: UserType | null;
  login: (userData: UserType) => void;
  logout: () => void;
}

const getSession = async () => {
  try {
    const response = await axiosInstance.get("/auth/check-session");

    if (response.status === 200) {
      return response.data.user;
    } else {
      return null;
    }
  } catch (e) {
    console.log(e);

    return null;
  }
};

// Create the context
export const UserContext = createContext<UserContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

// Create a provider component
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    getSession().then((res) => {
      setUser(res);
    });
  }, []);

  const login = (userData: UserType) => {
    setUser(userData); // Save user data (e.g., fetched from an API)
  };

  const logout = () => {
    try {
      axiosInstance.post("/auth/logout").then((res) => {
        setUser(null); // Clear user data
        window.location.href = "/";
      });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};
