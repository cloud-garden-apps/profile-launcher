import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { API_ROUTES } from "../config/constants";
import { t } from "../i18n";

type SiteDraft = {
  businessName: string;
  headline: string;
  subheadline: string;
  seoTitle: string;
  seoDescription: string;
  pages: Array<{ slug: string; title: string; summary: string }>;
};

type GoogleBusiness = {
  id: string;
  name: string;
  accountName: string;
  websiteUri: string | null;
  phone: string | null;
  address: string | null;
};

const DEFAULT_TEST_FALLBACK_URL = "https://g.page/r/profilelauncher-test";

const mockDraft = (profileUrl: string): SiteDraft => {
  const parsed = new URL(profileUrl);
  const hostname = parsed.hostname.replace("www.", "");
  const seed = hostname.split(".")[0].replace(/[-_]/g, " ");
  const business = seed.replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    businessName: business || t("dashboard.mockBusinessName"),
    headline: t("dashboard.mockHeadline", { business: business || t("dashboard.mockBusinessName") }),
    subheadline: t("dashboard.mockSubheadline"),
    seoTitle: t("dashboard.mockSeoTitle", { business: business || t("dashboard.mockBusinessName") }),
    seoDescription: t("dashboard.mockSeoDescription", { business: business || t("dashboard.mockBusinessName") }),
    pages: [
      { slug: "/", title: t("dashboard.pageHomeTitle"), summary: t("dashboard.pageHomeSummary") },
      { slug: "/services", title: t("dashboard.pageServicesTitle"), summary: t("dashboard.pageServicesSummary") },
      { slug: "/about", title: t("dashboard.pageAboutTitle"), summary: t("dashboard.pageAboutSummary") },
      { slug: "/reviews", title: t("dashboard.pageReviewsTitle"), summary: t("dashboard.pageReviewsSummary") },
      { slug: "/contact", title: t("dashboard.pageContactTitle"), summary: t("dashboard.pageContactSummary") },
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
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [checkingGoogle, setCheckingGoogle] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [businesses, setBusinesses] = useState<GoogleBusiness[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [billingTier, setBillingTier] = useState("free");
  const [billingStatus, setBillingStatus] = useState("inactive");
  const [canPublishByPlan, setCanPublishByPlan] = useState(false);
  const [stripeMode, setStripeMode] = useState("unknown");
  const [stripeModeMismatch, setStripeModeMismatch] = useState(false);

  const canGenerateFromFallback = useMemo(() => {
    if (!profileUrl.trim()) return false;
    try {
      const parsed = new URL(profileUrl);
      return parsed.protocol.startsWith("http");
    } catch {
      return false;
    }
  }, [profileUrl]);

  const selectedBusiness = useMemo(
    () => businesses.find((business) => business.id === selectedBusinessId) || null,
    [businesses, selectedBusinessId]
  );

  const canGenerate = Boolean(selectedBusiness) || (usingFallback && canGenerateFromFallback);

  const enableFallbackForTesting = () => {
    setUsingFallback(true);
    setProfileUrl((current) => (current.trim() ? current : DEFAULT_TEST_FALLBACK_URL));
  };

  const getAccessToken = async (): Promise<string> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error(t("dashboard.errMissingSessionToken"));
    return token;
  };

  const loadGoogleBusinesses = async () => {
    if (!user) return;
    setLoadingBusinesses(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(API_ROUTES.googleBusinesses, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("dashboard.errGoogleBusinesses"));

      const nextBusinesses = Array.isArray(payload.businesses) ? (payload.businesses as GoogleBusiness[]) : [];
      setBusinesses(nextBusinesses);
      if (!nextBusinesses.length) {
        setSelectedBusinessId("");
        enableFallbackForTesting();
        setPublishNote(t("dashboard.noteFallbackAutoEnabled"));
        return;
      }

      setSelectedBusinessId((current) =>
        current && nextBusinesses.some((business) => business.id === current) ? current : nextBusinesses[0].id
      );
    } catch {
      setBusinesses([]);
      setSelectedBusinessId("");
      enableFallbackForTesting();
      setPublishNote(t("dashboard.noteFallbackAutoEnabled"));
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const loadGoogleConnectionStatus = async () => {
    if (!user) return;
    setCheckingGoogle(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(API_ROUTES.googleConnectionStatus, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("dashboard.errGoogleStatus"));
      setGoogleConnected(Boolean(payload.connected));
      setGoogleEmail(payload.email || null);
      if (payload.connected) {
        await loadGoogleBusinesses();
      } else {
        setBusinesses([]);
        setSelectedBusinessId("");
      }
    } catch {
      setGoogleConnected(false);
      setGoogleEmail(null);
      setBusinesses([]);
      setSelectedBusinessId("");
    } finally {
      setCheckingGoogle(false);
    }
  };

  const loadBillingStatus = async () => {
    if (!user) return;
    setLoadingBilling(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(API_ROUTES.billingStatus, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("dashboard.errBillingStatus"));
      setBillingTier(payload.tier || "free");
      setBillingStatus(payload.status || "inactive");
      setCanPublishByPlan(Boolean(payload.canPublish));
      setStripeMode(payload.stripeMode || "unknown");
      setStripeModeMismatch(Boolean(payload.stripeModeMismatch));
    } catch {
      setBillingTier("free");
      setBillingStatus("inactive");
      setCanPublishByPlan(false);
      setStripeMode("unknown");
      setStripeModeMismatch(false);
    } finally {
      setLoadingBilling(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadGoogleConnectionStatus().catch(() => undefined);
    loadBillingStatus().catch(() => undefined);
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleStatus = params.get("google");
    const checkoutStatus = params.get("checkout");

    if (googleStatus) {
      if (googleStatus === "connected") {
        setPublishNote(t("dashboard.noteGoogleConnected"));
        loadGoogleConnectionStatus().catch(() => undefined);
      } else {
        setError(`Google connection failed (${googleStatus}).`);
      }
    }

    if (checkoutStatus) {
      if (checkoutStatus === "success") {
        setPublishNote(t("dashboard.noteCheckoutSuccess"));
        loadBillingStatus().catch(() => undefined);
      } else if (checkoutStatus === "cancelled") {
        setPublishNote(t("dashboard.noteCheckoutCancelled"));
      }
    }

    params.delete("google");
    params.delete("checkout");
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  const connectGoogleBusiness = async () => {
    setError("");
    setPublishNote("");
    try {
      const token = await getAccessToken();
      const response = await fetch(API_ROUTES.googleConnect, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("dashboard.errGoogleConnect"));
      if (!payload.authUrl) throw new Error(t("dashboard.errGoogleConnect"));
      window.location.href = payload.authUrl as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.errGoogleConnect"));
    }
  };

  const generateDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canGenerate || generating) return;

    setGenerating(true);
    setError("");
    setPublishNote("");

    try {
      const payloadBody = selectedBusiness
        ? {
            businessName: selectedBusiness.name,
            profileUrl: selectedBusiness.websiteUri || "",
          }
        : {
            profileUrl,
          };

      const response = await fetch(API_ROUTES.generateSiteDraft, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("dashboard.errDraftGenerate"));
      if (!payload.siteDraft) throw new Error(t("dashboard.errDraftMissing"));
      setSiteDraft(payload.siteDraft as SiteDraft);
    } catch (err) {
      const fallbackSeed = selectedBusiness?.websiteUri || profileUrl;
      if (fallbackSeed) {
        setSiteDraft(mockDraft(fallbackSeed));
      }
      setError(
        err instanceof Error ? `${err.message}. ${t("dashboard.errDraftFallback")}` : t("dashboard.errDraftFallback")
      );
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
      const token = await getAccessToken();
      const response = await fetch(API_ROUTES.createCheckout, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/?checkout=success`,
          cancelUrl: `${window.location.origin}/?checkout=cancelled`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("dashboard.errCheckoutFailed"));
      if (payload.url) {
        window.location.href = payload.url;
        return;
      }
      setPublishNote(t("dashboard.noteCheckoutNoUrl"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.errCheckoutStart"));
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div>{t("common.loading")}</div>;

  if (!user) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">{t("common.appName")}</p>
          <h1>{t("dashboard.signedOutTitle")}</h1>
          <p className="muted">{t("dashboard.signedOutSubtitle")}</p>
          <p style={{ marginTop: "1rem" }}>
            <Link to="/login">{t("dashboard.signedOutCta")}</Link> {t("dashboard.signedOutCtaSuffix")}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <header className="dash-header">
        <div>
          <p className="eyebrow">{t("common.appName")}</p>
          <h1>{t("dashboard.title")}</h1>
        </div>
        <div>
          <span className="user-pill">{user.email}</span>
          <button onClick={signOut}>{t("common.logout")}</button>
        </div>
      </header>

      <section className="panel">
        <h2>{t("dashboard.connectStepTitle")}</h2>
        <p className="muted">{t("dashboard.connectStepBody")}</p>
        <div className="connection-row">
          <button onClick={connectGoogleBusiness} disabled={checkingGoogle}>
            {checkingGoogle
              ? t("common.checking")
              : googleConnected
                ? t("dashboard.reconnectButton")
                : t("dashboard.connectButton")}
          </button>
          <span className={googleConnected ? "status-chip ok" : "status-chip"}>
            {googleConnected
              ? `${t("dashboard.connectedStatus")}${googleEmail ? `: ${googleEmail}` : ""}`
              : t("dashboard.notConnectedStatus")}
          </span>
        </div>
        {googleConnected && (
          <>
            <label htmlFor="business-select">{t("dashboard.businessSelectLabel")}</label>
            <select
              id="business-select"
              value={selectedBusinessId}
              onChange={(event) => setSelectedBusinessId(event.target.value)}
              disabled={loadingBusinesses || businesses.length === 0}
            >
              {loadingBusinesses && <option value="">{t("dashboard.businessLoading")}</option>}
              {!loadingBusinesses && businesses.length === 0 && (
                <option value="">{t("dashboard.businessNoneFound")}</option>
              )}
              {!loadingBusinesses &&
                businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
            </select>
            {selectedBusiness?.address && <p className="muted">{selectedBusiness.address}</p>}
          </>
        )}
        <p className="warning">{t("dashboard.fallbackWarning")}</p>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={usingFallback}
            onChange={(event) => setUsingFallback(event.target.checked)}
          />
          {t("dashboard.fallbackEnable")}
        </label>
        <p className="muted">
          {t("dashboard.fallbackExample")} <code>https://g.page/r/...</code>
        </p>
        <form onSubmit={generateDraft}>
          <input
            type="url"
            placeholder={t("dashboard.fallbackPlaceholder")}
            value={profileUrl}
            onChange={(event) => setProfileUrl(event.target.value)}
            disabled={generating || !usingFallback}
            required={usingFallback}
          />
          <button type="submit" disabled={generating || !canGenerate}>
            {generating
              ? t("dashboard.generatingDraft")
              : selectedBusiness
                ? t("dashboard.generateDraftFromBusiness")
                : t("dashboard.generateDraft")}
          </button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}
      {publishNote && <p className="note">{publishNote}</p>}

      {siteDraft && (
        <section className="panel">
          <h2>{t("dashboard.draftStepTitle")}</h2>
          <div className="draft-grid">
            <article className="draft-card">
              <h3>{siteDraft.headline}</h3>
              <p>{siteDraft.subheadline}</p>
            </article>
            <article className="draft-card">
              <h3>{t("dashboard.seoPreviewTitle")}</h3>
              <p><strong>{siteDraft.seoTitle}</strong></p>
              <p>{siteDraft.seoDescription}</p>
            </article>
          </div>
          <h3>{t("dashboard.plannedPagesTitle")}</h3>
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
          <h2>{t("dashboard.previewStepTitle")}</h2>
          <p className="muted">{t("dashboard.previewBody")}</p>
          <article className="website-preview">
            <header className="preview-hero">
              <h3>{siteDraft.businessName}</h3>
              <h4>{siteDraft.headline}</h4>
              <p>{siteDraft.subheadline}</p>
            </header>
            <section className="preview-section">
              <h5>{t("dashboard.previewServices")}</h5>
              <p>{siteDraft.pages.find((p) => p.slug === "/services")?.summary}</p>
            </section>
            <section className="preview-section">
              <h5>{t("dashboard.previewReviews")}</h5>
              <p>{siteDraft.pages.find((p) => p.slug === "/reviews")?.summary}</p>
            </section>
            <section className="preview-section">
              <h5>{t("dashboard.previewContact")}</h5>
              <p>{siteDraft.pages.find((p) => p.slug === "/contact")?.summary}</p>
            </section>
          </article>
        </section>
      )}

      <section className="panel">
        <h2>{t("dashboard.publishStepTitle")}</h2>
        <p className="muted">{t("dashboard.publishBody")}</p>
        <p className="muted" style={{ marginBottom: "0.5rem" }}>
          {t("dashboard.stripeModeLabel", { mode: stripeMode.toUpperCase() })}
        </p>
        {stripeModeMismatch && (
          <p className="warning" style={{ marginTop: "0.8rem" }}>
            {t("dashboard.stripeModeMismatch")}
          </p>
        )}
        <p className="muted" style={{ marginBottom: "0.5rem" }}>
          {loadingBilling
            ? t("dashboard.billingChecking")
            : t("dashboard.billingState", { tier: billingTier, status: billingStatus })}
        </p>
        <button onClick={requestPublish} disabled={!siteDraft || publishing || !googleConnected || canPublishByPlan}>
          {publishing
            ? t("dashboard.openingCheckout")
            : canPublishByPlan
              ? t("dashboard.publishUnlocked")
              : t("dashboard.publishButton")}
        </button>
        {!googleConnected && (
          <p className="warning" style={{ marginTop: "0.8rem" }}>
            {t("dashboard.publishRequiresConnection")}
          </p>
        )}
        {!canPublishByPlan && (
          <p className="warning" style={{ marginTop: "0.8rem" }}>
            {t("dashboard.publishRequiresPlan")}
          </p>
        )}
      </section>
    </main>
  );
};
