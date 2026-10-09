import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Donation from "./pages/Donation";

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
            </Routes>
        </BrowserRouter>
    );
}

export default App;
