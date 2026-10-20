import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop"; // 1. Import it here

import Home from "./pages/Home";
import Donation from "./pages/Donation";
import Connect from "./pages/Connect";
   import About from "./pages/About";
   import ActivityDetail from "./components/ActivityDetail";
   import Game from "./pages/Game";


const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
    /\/+$/,
    "",
);

function AdminRedirect() {
    if (!API_BASE_URL) {
        return <p>Set VITE_API_BASE_URL to your Django backend URL.</p>;
    }

    const adminPath = window.location.pathname;

    window.location.replace(
        `${API_BASE_URL}${adminPath}${window.location.search}${window.location.hash}`,
    );

    return <p>Opening church administration...</p>;
}

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop /> {/* 2. Place it here, right under BrowserRouter and outside Routes */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/donation/" element={<Donation />} />
                <Route path="/connect" element={<Connect />} />
                <Route path="/joyaladmin/*" element={<AdminRedirect />} />
                   <Route path="/about" element={<About />} />
                   <Route path="/activities/:id" element={<ActivityDetail />} />
                   <Route path="/game/" element={<Game />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;