import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        color: "#4a2c2a",
        fontFamily: "sans-serif",
        textAlign: "left",
        minHeight: "100vh",
      }}
    >
      <section style={{ maxWidth: "56ch", padding: "48px 0", marginLeft: 0 }}>
        <div style={{ fontFamily: "'Be Vietnam', sans-serif", color: "#f2a494", fontSize: "1.75rem", marginBottom: "0.4rem" }}>
          Write, send &
        </div>

        <h1 style={{ fontSize: "4rem", marginBottom: "0.75rem", fontWeight: "700", fontFamily: "'Pinyon Script', cursive", color: "#879386" }}>
          Let It Go
        </h1>

        <p style={{ fontSize: "1.125rem", marginBottom: "0.8rem", fontFamily: "'Be Vietnam', sans-serif", color: "#c45044", lineHeight: 1.7 }}>
          Putting your thoughts and feelings into words can be a powerful step toward healing. Sometimes, just seeing your thoughts on the page brings clarity, relief, and a sense of calm.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-start", marginTop: "0.5rem" }}>
          <Link href="/auth">
            <button
              style={{
                padding: "0.8rem 1.5rem",
                fontSize: "1rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#c9807b ",
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
            >
              Sign In / Sign Up
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}