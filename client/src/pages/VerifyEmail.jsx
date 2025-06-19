import { useState } from "react";
import { verifyEmail } from "../api/auth";

export default function VerifyEmail() {
  const [form, setForm] = useState({ email: "", code: "" });
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await verifyEmail(form);
      setMessage(res.data.msg);
    } catch (err) {
      setMessage(err.response.data.msg);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Verify Email</h2>
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="text"
        placeholder="4-digit Code"
        value={form.code}
        onChange={(e) => setForm({ ...form, code: e.target.value })}
      />
      <button type="submit">Verify</button>
      <p>{message}</p>
    </form>
  );
}
