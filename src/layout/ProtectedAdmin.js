import React from "react";
import { Outlet } from "react-router-dom";
import { withAuthenticator } from "@aws-amplify/ui-react";
import SideBar from "./admin/SideBar";

function ProtectedAdminBase() {
  return (
    <div className="d-flex">
      <SideBar />

      <div className="flex-grow-1 p-3">
        <Outlet />
      </div>
    </div>
  );
}

// Wrap the base component with the withAuthenticator HOC
const ProtectedAdmin = withAuthenticator(ProtectedAdminBase);

export default ProtectedAdmin;
