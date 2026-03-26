/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginView from "./views/LoginView";
import CittadinoView from "./views/CittadinoView";
import PoliziaView from "./views/PoliziaView";
import AdminView from "./views/AdminView";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginView />} />
        <Route path="/mobile-cittadino" element={<CittadinoView />} />
        <Route path="/dashboard-polizia" element={<PoliziaView />} />
        <Route path="/dashboard-amministrazione" element={<AdminView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
