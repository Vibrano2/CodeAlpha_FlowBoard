import { Navigate, Route, Routes } from "react-router-dom";
import { FoundationPage } from "./pages/foundation-page";

export const App = () => (
  <Routes>
    <Route path="/" element={<FoundationPage />} />
    <Route path="*" element={<Navigate replace to="/" />} />
  </Routes>
);
