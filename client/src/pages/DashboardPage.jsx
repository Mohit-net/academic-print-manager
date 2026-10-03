import { useAuth } from "../context/AuthContext";

const adminCards = [["Academic structure", "Organize semesters, subjects, and experiments.", "◌"], ["Student accounts", "Create and manage access for your students.", "◉"], ["Workspace ready", "Your administration dashboard is ready for the next phase.", "✦"]];
const studentCards = [["Browse experiments", "Explore experiments assigned to your academic structure.", "⌁"], ["My documents", "Your uploaded experiment documents will appear here.", "▤"], ["Stay organized", "Keep your coursework prepared in one workspace.", "✦"]];

export default function DashboardPage({ role }) {
  const { user } = useAuth();
  const cards = role === "admin" ? adminCards : studentCards;
  return <div className="dashboard-page">
    <section className="page-heading"><div><span className="eyebrow">{role === "admin" ? "Admin dashboard" : "Student dashboard"}</span><h1>{role === "admin" ? "Administration overview" : "Your academic workspace"}</h1><p>Welcome back, {user.name}. Here is your starting point for today.</p></div><div className="date-card"><span>Workspace status</span><strong><i /> Online</strong></div></section>
    <section className="welcome-card"><div><span className="eyebrow">Phase 1</span><h2>Your dashboard foundation is ready.</h2><p>Navigation, secure sign-in, and role-aware access are now in place.</p></div><span className="welcome-symbol">AP</span></section>
    <section className="dashboard-grid">{cards.map(([title, description, icon]) => <article className="dashboard-card" key={title}><span className="card-icon">{icon}</span><h3>{title}</h3><p>{description}</p><span className="card-status">Coming in a later phase</span></article>)}</section>
  </div>;
}
