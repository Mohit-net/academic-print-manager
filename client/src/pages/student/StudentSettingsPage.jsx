import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { accountApi } from "../../api/client";
import AlertBanner from "../../components/common/AlertBanner";
import { requestNotificationPermission, getNotificationPermission } from "../../utils/notifications";

export default function StudentSettingsPage() {
  const { user, refreshUser } = useAuth();

  // Profile section
  const [name, setName] = useState(user?.name || "");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password section
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Notifications section
  const [browserNotifs, setBrowserNotifs] = useState(
    user?.notificationPreferences?.browserNotifications ?? true
  );
  const [notifMsg, setNotifMsg] = useState("");
  const [notifError, setNotifError] = useState("");
  const [isSavingNotif, setIsSavingNotif] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileError("");
    if (!name.trim()) {
      setProfileError("Name cannot be empty.");
      return;
    }
    setIsSavingProfile(true);
    try {
      await accountApi.updateProfile({ name: name.trim() });
      await refreshUser();
      setProfileMsg("Profile updated successfully.");
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    setIsSavingPassword(true);
    try {
      await accountApi.changePassword({ currentPassword, newPassword });
      setPasswordMsg("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleToggleNotif = async (checked) => {
    // If trying to enable but browser has blocked — tell the user
    if (checked && getNotificationPermission() === "denied") {
      setNotifError(
        "Notifications are blocked in your browser. Please enable them in your browser's site settings, then try again."
      );
      return;
    }

    setBrowserNotifs(checked);
    setNotifMsg("");
    setNotifError("");
    setIsSavingNotif(true);

    // Request permission when turning on and browser hasn't decided yet
    if (checked && getNotificationPermission() === "default") {
      const result = await requestNotificationPermission();
      if (result !== "granted") {
        setNotifError("Permission was not granted. Notifications remain off.");
        setBrowserNotifs(false);
        setIsSavingNotif(false);
        return;
      }
    }

    try {
      await accountApi.updatePreferences({ browserNotifications: checked });
      setNotifMsg(checked ? "Notifications enabled." : "Notifications disabled.");
    } catch (err) {
      setNotifError(err.response?.data?.message || "Failed to save preferences.");
      setBrowserNotifs(!checked);
    } finally {
      setIsSavingNotif(false);
    }
  };

  return (
    <div className="student-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Account</span>
          <h1>Settings</h1>
          <p>Manage your profile, password, and notification preferences.</p>
        </div>
      </section>

      <div className="section-panel">
        {/* ── Profile ── */}
        <div className="settings-section">
          <h3>Profile</h3>
          <AlertBanner message={profileError} type="error" onClose={() => setProfileError("")} />
          <AlertBanner message={profileMsg} type="success" onClose={() => setProfileMsg("")} />
          <form className="settings-form" onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label htmlFor="settings-name">Display Name</label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={user?.email || ""} disabled readOnly />
              <span className="form-help">Email address cannot be changed.</span>
            </div>
            <div>
              <button
                type="submit"
                className="primary-button-sm"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Change Password ── */}
        <div className="settings-section">
          <h3>Change Password</h3>
          <AlertBanner message={passwordError} type="error" onClose={() => setPasswordError("")} />
          <AlertBanner message={passwordMsg} type="success" onClose={() => setPasswordMsg("")} />
          <form className="settings-form" onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="settings-cur-pwd">Current Password</label>
              <input
                id="settings-cur-pwd"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="settings-new-pwd">New Password</label>
              <input
                id="settings-new-pwd"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <span className="form-help">Minimum 6 characters.</span>
            </div>
            <div className="form-group">
              <label htmlFor="settings-confirm-pwd">Confirm New Password</label>
              <input
                id="settings-confirm-pwd"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <button
                type="submit"
                className="primary-button-sm"
                disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {isSavingPassword ? "Saving…" : "Change Password"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Notifications ── */}
        <div className="settings-section">
          <h3>Notifications</h3>
          <AlertBanner message={notifError} type="error" onClose={() => setNotifError("")} />
          <AlertBanner message={notifMsg} type="success" onClose={() => setNotifMsg("")} />

          {/* Show browser permission state */}
          {getNotificationPermission() === "denied" && (
            <div className="alert-banner alert-error" style={{ marginBottom: 16 }}>
              <span className="alert-icon">⚠</span>
              <span className="alert-message">
                Notifications are <strong>blocked</strong> in your browser. To enable them,
                click the 🔒 lock icon in your browser address bar → Notifications → Allow.
              </span>
            </div>
          )}

          <div className="settings-row">
            <div className="settings-row-info">
              <strong>Browser Notifications</strong>
              <small>
                Get notified when uploads complete and when prints are logged.
                {getNotificationPermission() === "granted" && (
                  <span style={{ color: "#6ee7b7", marginLeft: 6 }}>● Allowed by browser</span>
                )}
                {getNotificationPermission() === "denied" && (
                  <span style={{ color: "#fca5a5", marginLeft: 6 }}>● Blocked by browser</span>
                )}
              </small>
            </div>
            <label
              className="toggle-switch"
              aria-label="Toggle browser notifications"
              title={getNotificationPermission() === "denied" ? "Unblock notifications in browser settings first" : ""}
            >
              <input
                type="checkbox"
                checked={browserNotifs && getNotificationPermission() === "granted"}
                disabled={isSavingNotif || getNotificationPermission() === "denied"}
                onChange={(e) => handleToggleNotif(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
