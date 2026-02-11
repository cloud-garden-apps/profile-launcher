import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Thought, saveThought, getThoughts, deleteThought } from "../lib/thoughts";

export const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const [thought, setThought] = useState("");
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      getThoughts().then(setThoughts).catch(console.error);
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!thought.trim() || generating) return;

    setGenerating(true);
    setError("");

    try {
      const response = await fetch("/.netlify/functions/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thought }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const saved = await saveThought(thought, data.ideas);
      setThoughts([saved, ...thoughts]);
      setThought("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate ideas");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteThought(id);
    setThoughts(thoughts.filter((t) => t.id !== id));
  };

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return (
      <div>
        <h1>Spark</h1>
        <p>Turn thoughts into business ideas.</p>
        <p style={{ marginTop: "1rem" }}>
          <Link to="/login">Sign in</Link> to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Spark</h1>
        <div>
          <span style={{ marginRight: "1rem" }}>{user.email}</span>
          <button onClick={signOut} style={{ padding: "0.5rem 1rem" }}>Logout</button>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter a thought or idea..."
          value={thought}
          onChange={(event) => setThought(event.target.value)}
          disabled={generating}
        />
        <button type="submit" disabled={generating}>
          {generating ? "Generating..." : "Generate Ideas"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      {thoughts.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Your Thoughts</h2>
          {thoughts.map((item) => (
            <div key={item.id} style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{item.content}</strong>
                <button onClick={() => handleDelete(item.id)} style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}>Delete</button>
              </div>
              {item.ideas && (
                <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                  {item.ideas.map((idea, i) => (
                    <li key={i} style={{ marginBottom: "0.25rem" }}>{idea}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
