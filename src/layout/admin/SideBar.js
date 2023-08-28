import { useAuthenticator } from "@aws-amplify/ui-react";
import { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProjectsContext } from "../../contexts/ProjectsContext";
import { Dropdown } from "react-bootstrap";

function SideBar() {
  const { signOut } = useAuthenticator((context) => [context.user]);
  const { projects, selectProject, selectedProject } =
    useContext(ProjectsContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!projects?.length) {
      navigate("/admin/projects/");
    }
  }, [projects, navigate]);

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
            CRUD Connect
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
              <Dropdown
                onSelect={(key) =>
                  selectProject(projects.find((proj) => proj.ID === key))
                }
              >
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                  {selectedProject?.Name || "Select Project"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {projects?.map((project) => (
                    <Dropdown.Item key={project.ID} eventKey={project.ID}>
                      {project.Name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link d-flex align-items-center gap-2 active"
                aria-current="page"
                to="/admin"
              >
                <i className="bi bi-house-fill"></i>
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link d-flex align-items-center gap-2"
                to="/admin/projects"
              >
                <i className="bi bi-kanban"></i>
                Projects
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link d-flex align-items-center gap-2"
                to="/admin/users"
              >
                <i className="bi bi-people"></i>
                Users
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link d-flex align-items-center gap-2"
                to="/admin/items"
              >
                <i className="bi bi-database-fill"></i>
                Items
              </Link>
            </li>
          </ul>

          <hr className="my-3" />

          <ul className="nav flex-column mb-auto">
            <li className="nav-item">
              <Link
                className="nav-link d-flex align-items-center gap-2"
                to="/admin/profile"
              >
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
