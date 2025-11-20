import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SubmitPinPage from "./pages/SubmitPinPage";
import MapPage from "./pages/MapPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/submit" element={<SubmitPinPage />} />
      <Route path="/map" element={<MapPage />} />
    </Routes>
  );
}
