import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigation = {
  admin: [["Dashboard", "/admin/dashboard", "◫"], ["Semesters", "/admin/semesters", "◌"], ["Subjects", "/admin/subjects", "▣"], ["Experiments", "/admin/experiments", "⌁"], ["Students", "/admin/students", "◉"], ["Statistics", "/admin/statistics", "◈"]],
  student: [["Dashboard", "/student/dashboard", "◫"], ["Browse Experiments", "/student/experiments", "⌁"], ["My Documents", "/student/documents", "▤"], ["Print History", "/student/print-history", "◷"], ["Statistics", "/student/statistics", "◈"]],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = () => setIsSidebarOpen(false);
  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  return <div className="app-shell">
    <button className={`sidebar-overlay ${isSidebarOpen ? "is-visible" : ""}`} onClick={closeSidebar} aria-label="Close navigation" />
    <aside className={`sidebar ${isSidebarOpen ? "is-open" : ""}`}>
      <div className="brand"><span className="brand-mark">AP</span><span>Academic<span>Print</span></span></div>
      <div className="sidebar-label">Workspace</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation[user.role].map(([label, path, icon]) => <NavLink key={path} to={path} onClick={closeSidebar}><span className="nav-icon">{icon}</span>{label}</NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <NavLink to={`/${user.role}/settings`} onClick={closeSidebar}><span className="nav-icon">⚙</span>Settings</NavLink>
        <button className="logout-button" onClick={handleLogout}><span className="nav-icon">↗</span>Logout</button>
      </div>
    </aside>
    <section className="content-shell">
      <header className="topbar"><button className="menu-button" onClick={() => setIsSidebarOpen((open) => !open)} aria-label="Toggle navigation">☰</button><div className="topbar-context"><span className="status-dot" />Academic workspace</div><div className="profile-chip"><span className="avatar">{user.name?.charAt(0).toUpperCase()}</span><span className="profile-copy"><strong>{user.name}</strong><small>{user.role}</small></span></div></header>
      <main className="main-content"><Outlet /></main>
    </section>
  </div>;
}
