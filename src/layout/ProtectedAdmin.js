import React from "react";
import { Outlet } from "react-router-dom";
import { withAuthenticator } from "@aws-amplify/ui-react";
import SideBar from "./admin/SideBar";
import { ProjectsProvider } from "../contexts/ProjectsContext";

function ProtectedAdminBase() {
  return (
    <div className="d-flex">
      <ProjectsProvider>
        <SideBar />
        <div className="flex-grow-1 p-3">
          <Outlet />
        </div>
      </ProjectsProvider>
    </div>
  );
}

// Wrap the base component with the withAuthenticator HOC
const ProtectedAdmin = withAuthenticator(ProtectedAdminBase);

export default ProtectedAdmin;
