import { BrowserRouter, Routes, Route } from "react-router-dom";

import Donation from "./pages/Donation";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/donation" element={<Donation />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;