import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Donation from "./pages/Donation";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
    /\/+$/,
    "",
);

function AdminRedirect() {
    useEffect(() => {
        if (!API_BASE_URL) return;

        const adminPath =
            window.location.pathname === "/joyaladmin"
                ? "/joyaladmin/"
                : window.location.pathname;
        window.location.replace(
            `${API_BASE_URL}${adminPath}${window.location.search}${window.location.hash}`,
        );
    }, []);

    return (
        <main className="admin-redirect">
            <h1>Church administration</h1>
            <p>
                {API_BASE_URL
                    ? "Opening the secure administration site…"
                    : "Set VITE_API_BASE_URL to your Django backend to open the administration site."}
            </p>
            {API_BASE_URL && (
                <a href={`${API_BASE_URL}/joyaladmin/`}>
                    Continue to church administration
                </a>
            )}
        </main>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Navigate to="/donation/" replace />}
                />

                <Route
                    path="/donation/"
                    element={<Donation />}
                />
                <Route path="/joyaladmin/*" element={<AdminRedirect />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
