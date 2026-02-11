import { useState } from "react";
import { useAuth } from "../lib/auth";

export const Login = () => {
  const { signInWithMagicLink, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signInWithMagicLink(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setEmailSent(true);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  if (emailSent) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">ProfileLauncher</p>
          <h1>Check your email</h1>
          <p>We sent a login link to <strong>{email}</strong>.</p>
          <p className="muted">
          Click the link in the email to sign in.
          </p>
          <button onClick={() => setEmailSent(false)}>
            Use a different email
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">ProfileLauncher</p>
        <h1>Sign in</h1>
        <p className="muted">Turn your Google Business Profile into a website and publish today.</p>

        <button onClick={handleGoogle} className="full">
          Continue with Google
        </button>

        <div className="divider">or</div>

        <form onSubmit={handleMagicLink}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button type="submit" disabled={loading} className="full">
            {loading ? "Sending..." : "Send magic link"}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </main>
  );
};
