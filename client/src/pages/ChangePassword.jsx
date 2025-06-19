import { useState } from "react";
import { changePassword } from "../api/auth";

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (form.newPassword !== form.confirmNewPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await changePassword(form, token);
      setMessage(res.data.msg);
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      setError(err.response?.data?.msg || "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleChange}>
      <h2>Change Password</h2>

      <input
        type="password"
        placeholder="Current Password"
        value={form.currentPassword}
        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
        required
      />

      <input
        type="password"
        placeholder="New Password"
        value={form.newPassword}
        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        required
      />

      <input
        type="password"
        placeholder="Confirm New Password"
        value={form.confirmNewPassword}
        onChange={(e) => setForm({ ...form, confirmNewPassword: e.target.value })}
        required
      />

      <button type="submit">Change Password</button>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
