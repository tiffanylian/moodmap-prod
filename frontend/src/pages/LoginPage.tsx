import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call backend login here
    console.log("Logging in with:", email);
    navigate("/submit");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">
          Enter your Penn email to continue.
        </p>

        <form onSubmit={handleLogin} className="auth-form">
          <div>
            <label className="auth-label">Penn email</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              placeholder="name@upenn.edu"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button">
            Continue
          </button>
        </form>

        <div className="auth-footer">
          MoodMap @ Penn · anonymous mood pins, one campus
        </div>
      </div>
    </div>
  );
}
