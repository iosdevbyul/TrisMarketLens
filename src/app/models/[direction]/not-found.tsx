import Link from "next/link";

export default function ModelNotFound() {
  return (
    <section className="panel not-found-panel">
      <p className="eyebrow">Models</p>
      <h1>Model not found</h1>
      <p className="section-copy">
        Only the qualified Up and Down research models are available in this snapshot.
      </p>
      <Link className="primary-link" href="/models">
        Return to models
      </Link>
    </section>
  );
}
