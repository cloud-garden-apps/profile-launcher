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
      <div>
        <h1>Check your email</h1>
        <p>We sent a login link to <strong>{email}</strong></p>
        <p style={{ marginTop: "1rem", color: "#666" }}>
          Click the link in the email to sign in.
        </p>
        <button onClick={() => setEmailSent(false)} style={{ marginTop: "1rem" }}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Sign in</h1>

      <button onClick={handleGoogle} style={{ width: "100%", marginBottom: "1rem" }}>
        Continue with Google
      </button>

      <div style={{ textAlign: "center", margin: "1rem 0", color: "#666" }}>or</div>

      <form onSubmit={handleMagicLink}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Sending..." : "Send magic link"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};
