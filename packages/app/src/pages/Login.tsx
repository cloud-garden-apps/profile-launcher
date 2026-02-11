import { useState } from "react";
import { useAuth } from "../lib/auth";
import { t } from "../i18n";

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
          <p className="eyebrow">{t("common.appName")}</p>
          <h1>{t("login.checkEmailTitle")}</h1>
          <p>{t("login.checkEmailBody", { email })}</p>
          <p className="muted">
            {t("login.checkEmailHint")}
          </p>
          <button onClick={() => setEmailSent(false)}>
            {t("login.useDifferentEmail")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">{t("common.appName")}</p>
        <h1>{t("login.title")}</h1>
        <p className="muted">{t("login.subtitle")}</p>

        <button onClick={handleGoogle} className="full">
          {t("login.continueWithGoogle")}
        </button>

        <div className="divider">{t("common.or")}</div>

        <form onSubmit={handleMagicLink}>
          <input
            type="email"
            placeholder={t("login.emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button type="submit" disabled={loading} className="full">
            {loading ? t("login.sendingMagicLink") : t("login.sendMagicLink")}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </main>
  );
};
