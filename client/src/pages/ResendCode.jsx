import { useState } from "react";
import { resendCode } from "../api/auth";

export default function ResendCode() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleResend = async (e) => {
    e.preventDefault();
    try {
      const res = await resendCode({ email });
      setMessage(res.data.msg);
    } catch (err) {
      setMessage(err.response.data.msg);
    }
  };

  return (
    <form onSubmit={handleResend}>
      <h2>Resend Code</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Resend</button>
      <p>{message}</p>
    </form>
  );
}