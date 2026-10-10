import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Donation from "./pages/Donation";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
//+$/,
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
return ( <BrowserRouter> <Routes>
<Route path="/" element={<Home />} />
<Route path="/donation/" element={<Donation />} />
<Route path="/joyaladmin/*" element={<AdminRedirect />} /> </Routes> </BrowserRouter>
);
}

export default App;
