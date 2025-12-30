import Link from "next/link";

export default function HomePage() {
  return (
    <main className="hero-main">
      <section className="hero">
        <div className="hero-subtitle">Write, send &</div>

        <h1 className="hero-title">Let It Go</h1>

        <p className="hero-p">
          Putting your thoughts and feelings into words can be a powerful step toward healing. Sometimes, just seeing your thoughts on the page brings clarity, relief, and a sense of calm.
        </p>

        <div className="hero-cta">
          <Link href="/auth">
            <button className="cta-button">Sign In / Sign Up</button>
          </Link>
        </div>
      </section>
    </main>
  );
}