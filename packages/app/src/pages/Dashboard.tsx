import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
type SiteDraft = {
  businessName: string;
  headline: string;
  subheadline: string;
  seoTitle: string;
  seoDescription: string;
  pages: Array<{ slug: string; title: string; summary: string }>;
};

const mockDraft = (profileUrl: string): SiteDraft => {
  const parsed = new URL(profileUrl);
  const hostname = parsed.hostname.replace("www.", "");
  const seed = hostname.split(".")[0].replace(/[-_]/g, " ");
  const business = seed.replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    businessName: business || "Your Business",
    headline: `${business} now has a professional website.`,
    subheadline: "Generated from your Google Business Profile with local SEO structure included.",
    seoTitle: `${business} | Trusted Local Service`,
    seoDescription: `Visit ${business} for reliable local service. Hours, phone, and business profile details stay synced.`,
    pages: [
      { slug: "/", title: "Home", summary: "Core services, trust badges, and contact CTA." },
      { slug: "/services", title: "Services", summary: "Service list optimized for local intent searches." },
      { slug: "/about", title: "About", summary: "Owner story, values, and location credibility." },
      { slug: "/reviews", title: "Reviews", summary: "Social proof pulled from your profile ratings." },
      { slug: "/contact", title: "Contact", summary: "Phone, hours, map links, and lead form." },
    ],
  };
};

export const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const [profileUrl, setProfileUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [publishNote, setPublishNote] = useState("");
  const [siteDraft, setSiteDraft] = useState<SiteDraft | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const canGenerate = useMemo(() => {
    if (!profileUrl.trim()) return false;
    try {
      const parsed = new URL(profileUrl);
      return parsed.protocol.startsWith("http");
    } catch {
      return false;
    }
  }, [profileUrl]);

  const generateDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canGenerate || generating || !usingFallback) return;

    setGenerating(true);
    setError("");
    setPublishNote("");

    try {
      const response = await fetch("/.netlify/functions/generate-site-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileUrl }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Draft generation failed");
      if (!payload.siteDraft) throw new Error("Missing site draft in response");
      setSiteDraft(payload.siteDraft as SiteDraft);
    } catch (err) {
      setSiteDraft(mockDraft(profileUrl));
      setError(err instanceof Error ? `${err.message}. Loaded fallback draft.` : "Loaded fallback draft.");
    } finally {
      setGenerating(false);
    }
  };

  const requestPublish = async () => {
    if (publishing || !siteDraft) return;
    setPublishing(true);
    setError("");
    setPublishNote("");
    try {
      const response = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/?checkout=success`,
          cancelUrl: `${window.location.origin}/?checkout=cancelled`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Checkout failed");
      if (payload.url) {
        window.location.href = payload.url;
        return;
      }
      setPublishNote("Checkout created, but no URL returned.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">ProfileLauncher</p>
          <h1>Launch your business site</h1>
          <p className="muted">Sign in to import your Google Business Profile and generate a live website.</p>
          <p style={{ marginTop: "1rem" }}>
          <Link to="/login">Sign in</Link> to get started.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <header className="dash-header">
        <div>
          <p className="eyebrow">ProfileLauncher</p>
          <h1>Build and publish your website</h1>
        </div>
        <div>
          <span className="user-pill">{user.email}</span>
          <button onClick={signOut}>Logout</button>
        </div>
      </header>

      <section className="panel">
        <h2>Step 1: Connect Google Business Profile</h2>
        <p className="muted">
          Production mode should connect to Google Business Profile API with OAuth and fetch verified locations.
        </p>
        <p className="warning">
          Temporary fallback only: manual URL input is enabled below for internal testing while API connection is being wired.
        </p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={usingFallback}
            onChange={(event) => setUsingFallback(event.target.checked)}
          />
          Enable temporary URL fallback
        </label>
        <p className="muted">Fallback input example: <code>https://g.page/r/...</code> or public Maps profile URL.</p>
        <form onSubmit={generateDraft}>
          <input
            type="url"
            placeholder="https://g.page/r/your-business-profile"
            value={profileUrl}
            onChange={(event) => setProfileUrl(event.target.value)}
            disabled={generating || !usingFallback}
            required
          />
          <button type="submit" disabled={generating || !usingFallback}>
            {generating ? "Generating draft..." : "Generate site draft from fallback URL"}
          </button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}
      {publishNote && <p className="note">{publishNote}</p>}

      {siteDraft && (
        <section className="panel">
          <h2>Step 2: Review your generated site draft</h2>
          <div className="draft-grid">
            <article className="draft-card">
              <h3>{siteDraft.headline}</h3>
              <p>{siteDraft.subheadline}</p>
            </article>
            <article className="draft-card">
              <h3>SEO Preview</h3>
              <p><strong>{siteDraft.seoTitle}</strong></p>
              <p>{siteDraft.seoDescription}</p>
            </article>
          </div>
          <h3>Planned pages</h3>
          <ul className="page-list">
            {siteDraft.pages.map((page) => (
              <li key={page.slug}>
                <strong>{page.title}</strong> <code>{page.slug}</code>
                <p>{page.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {siteDraft && (
        <section className="panel">
          <h2>Website preview</h2>
          <p className="muted">This is a visual draft of what the generated site could look like before publish.</p>
          <article className="website-preview">
            <header className="preview-hero">
              <h3>{siteDraft.businessName}</h3>
              <h4>{siteDraft.headline}</h4>
              <p>{siteDraft.subheadline}</p>
            </header>
            <section className="preview-section">
              <h5>Services</h5>
              <p>{siteDraft.pages.find((p) => p.slug === "/services")?.summary}</p>
            </section>
            <section className="preview-section">
              <h5>Reviews</h5>
              <p>{siteDraft.pages.find((p) => p.slug === "/reviews")?.summary}</p>
            </section>
            <section className="preview-section">
              <h5>Contact</h5>
              <p>{siteDraft.pages.find((p) => p.slug === "/contact")?.summary}</p>
            </section>
          </article>
        </section>
      )}

      <section className="panel">
        <h2>Step 3: Publish</h2>
        <p className="muted">Publishing includes hosted deployment and ongoing sync of phone and hours.</p>
        <button onClick={requestPublish} disabled={!siteDraft || publishing}>
          {publishing ? "Opening checkout..." : "Publish website"}
        </button>
      </section>
    </main>
  );
};
