import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registerFcmToken } from "../utils/notifications";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (user) return <Navigate to={`/${user.role}/dashboard`} replace />;

  const handleSubmit = async (event) => {
    event.preventDefault(); setError(""); setIsSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      const requestedPath = location.state?.from?.pathname;
      const roleHome = `/${loggedInUser.role}/dashboard`;
      navigate(requestedPath?.startsWith(`/${loggedInUser.role}/`) ? requestedPath : roleHome, { replace: true });
      // Register FCM token after navigation — fire-and-forget, never blocks login
      registerFcmToken(loggedInUser);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We could not sign you in. Check your connection and try again.");
    } finally { setIsSubmitting(false); }
  };

  return <div className="login-page">
    <section className="login-panel">
      <div className="login-brand"><span className="brand-mark">AP</span><span>Academic<span>Print</span></span></div>
      <div className="login-heading"><span className="eyebrow">Academic Print Manager</span><h1>Welcome back</h1><p>Sign in to manage your academic workspace.</p></div>
      <form className="login-form" onSubmit={handleSubmit}>
        <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required disabled={isSubmitting} /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" required disabled={isSubmitting} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in to workspace"}</button>
      </form>
    </section>
    <aside className="login-aside"><div className="glow glow-one" /><div className="glow glow-two" /><div className="login-aside-content"><span className="eyebrow">One place, clear progress</span><h2>Keep every academic document organized.</h2><p>Manage coursework structure, experiments, and documents from one focused workspace.</p><div className="feature-card"><span className="feature-icon">✦</span><div><strong>Built for academic teams</strong><span>Focused tools for students and administrators.</span></div></div></div></aside>
  </div>;
}
