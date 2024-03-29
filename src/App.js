import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Amplify } from "aws-amplify";
import config from "./aws-exports";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserProfile from "./pages/admin/UserProfile";
import Header from "./layout/Header";
import Footer from "./layout/Footer";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import { Login } from "./components/Login";
import { RequireAuth } from "./components/RequireAuth";
import ProtectedAdmin from "./layout/ProtectedAdmin";
import Projects from "./pages/admin/Projects";
import ProjectUsers from "./pages/admin/ProjectUsers";
import ProjectItems from "./pages/admin/ProjectItems";
import ApiDocumentation from "./pages/ApiDocumentation";

Amplify.configure(config);

function App() {
  return (
    <Router>
      <Authenticator.Provider>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/docs" element={<ApiDocumentation />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <ProtectedAdmin />
              </RequireAuth>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="projects" element={<Projects />} />
            {/* <Route path="data" element={<UserData />} /> */}
            <Route path="users" element={<ProjectUsers />} />
            <Route path="items" element={<ProjectItems />} />
            {/* <Route path="token-manager" element={<UserTokenManager />} /> */}
          </Route>
        </Routes>
        <Footer />
      </Authenticator.Provider>
    </Router>
  );
}

export default App;
