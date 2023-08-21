import { useAuthenticator } from "@aws-amplify/ui-react";
import { Link } from "react-router-dom";

function SideBar() {
  const { signOut } = useAuthenticator((context) => [context.user]);

  return (
    <div className="sidebar border border-right col-md-3 col-lg-2 p-0 bg-body-tertiary">
      <div
        className="offcanvas-md offcanvas-end bg-body-tertiary"
        tabIndex="-1"
        id="sidebarMenu"
        aria-labelledby="sidebarMenuLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="sidebarMenuLabel">
            Company name
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            data-bs-target="#sidebarMenu"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body d-md-flex flex-column p-0 pt-lg-3 overflow-y-auto">
          <ul className="nav flex-column">
            <li className="nav-item">
              <Link
                className="nav-link d-flex align-items-center gap-2 active"
                aria-current="page"
                to="#"
              >
                <i className="bi bi-house-fill"></i>
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-2" to="#">
                <i className="bi bi-file-earmark"></i>
                Orders
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-2" to="#">
                <i className="bi bi-cart"></i>
                Products
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-2" to="#">
                <i className="bi bi-people"></i>
                Customers
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-2" to="#">
                <i className="bi bi-graph-up"></i>
                Reports
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-2" to="#">
                <i className="bi bi-puzzle"></i>
                Integrations
              </Link>
            </li>
          </ul>

          <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-body-secondary text-uppercase">
            <span>Saved reports</span>
            <Link
              className="link-secondary"
              to="#"
              aria-label="Add a new report"
            >
              <i className="bi bi-plus-circle"></i>
            </Link>
          </h6>
          <ul className="nav flex-column mb-auto">
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-2" to="#">
                <i className="bi bi-file-earmark-text"></i>
                Current month
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-2" to="#">
                <i className="bi bi-file-earmark-text"></i>
                Last quarter
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-2" to="#">
                <i className="bi bi-file-earmark-text"></i>
                Social engagement
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-2" to="#">
                <i className="bi bi-file-earmark-text"></i>
                Year-end sale
              </Link>
            </li>
          </ul>

          <hr className="my-3" />

          <ul className="nav flex-column mb-auto">
            <li className="nav-item">
              <Link className="nav-link d-flex align-items-center gap-2" to="#">
                <i className="bi bi-gear-wide-connected"></i>
                Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link d-flex align-items-center gap-2"
                onClick={signOut}
              >
                <i className="bi bi-door-closed"></i>
                Sign out
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SideBar;
