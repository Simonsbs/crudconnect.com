import Gravatar from "react-gravatar";
import { Link } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";

function Header() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  return (
    <header className="p-3 border-bottom">
      <div className="container">
        <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
          <Link
            to="./"
            className="d-flex align-items-center mb-2 mb-lg-0 link-body-emphasis text-decoration-none"
          >
            LOGO
          </Link>

          <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
            <li>
              <Link to="./about" className="nav-link px-2 link-secondary">
                About Us
              </Link>
            </li>
            <li>
              <Link to="./contact" className="nav-link px-2 link-body-emphasis">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="./admin" className="nav-link px-2 link-body-emphasis">
                Dashboard
              </Link>
            </li>
          </ul>

          {user ? (
            <div className="dropdown text-end">
              <Link
                to="./"
                className="d-block link-body-emphasis text-decoration-none dropdown-toggle"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <Gravatar
                  email={user.attributes.email}
                  width="32"
                  height="32"
                  className="rounded-circle"
                />
              </Link>
              <ul className="dropdown-menu text-small">
                <li>
                  <h6 className="dropdown-item">{user.attributes.email}</h6>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <Link className="dropdown-item" to="#">
                    New project...
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="#">
                    Settings
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="#">
                    Profile
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item" onClick={signOut}>
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <Link
              to="./login"
              type="button"
              className="btn btn-outline-primary me-2"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
