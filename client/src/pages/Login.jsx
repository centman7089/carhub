import { useState } from "react";
import { login } from "../api/auth";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await login(form);
      localStorage.setItem("token", res.data.token);
      setMessage("Login successful");
    } catch (err) {
      setMessage(err.response.data.msg);
    }
  };

    return (
      <div>
              <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <button type="submit">Login</button>
      <p>{message}</p>
            </form>
            
            <div>
                <a href="http://localhost:500/api/auth/google" className="bg-white border text-gray-700 flex items-center justify-center gap-2 px-4 py-2 rounded shadow">
                    <img src="/google-icon.svg" alt="Google"  className="w-5 h-5" />
                    Continue with Google
                </a>
            </div>

      </div>
  
  );
}