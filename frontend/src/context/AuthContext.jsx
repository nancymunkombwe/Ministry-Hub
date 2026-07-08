import { createContext, useContext, useState } from "react";
import API from "../api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const savedUser = localStorage.getItem("ministryHubUser");
    const savedToken = localStorage.getItem("ministryHubToken");

    const [user, setUser] = useState(savedUser ? JSON.parse(savedUser) : null);
    const [token, setToken] = useState(savedToken || null);

    const login = async (email, password) => {
        const response = await API.post("/auth/login", {
            email,
            password
        });

        const loggedInUser = response.data.user;
        const authToken = response.data.token;

        localStorage.setItem("ministryHubUser", JSON.stringify(loggedInUser));
        localStorage.setItem("ministryHubToken", authToken);

        setUser(loggedInUser);
        setToken(authToken);

        return response.data;
    };

    const logout = () => {
        localStorage.removeItem("ministryHubUser");
        localStorage.removeItem("ministryHubToken");

        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};