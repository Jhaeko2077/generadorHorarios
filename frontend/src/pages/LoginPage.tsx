import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123456");
  const [error, setError] = useState("");
  return (
    <div className="authPage">
      <form
        className="authPanel"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            const user = await login({ email, password });
            navigate(user.role === "admin" ? "/" : "/my-schedule");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
          }
        }}
      >
        <h1>Academic Timetable Optimizer</h1>
        <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <div className="notice danger">{error}</div>}
        <button>Login</button>
        <Link to="/register">Teacher registration</Link>
      </form>
    </div>
  );
}
