import Link from "next/link";

export default function EvidenceNotFound() {
  return (
    <section className="panel not-found-panel">
      <p className="eyebrow">Evidence</p>
      <h1>Evidence layer not found</h1>
      <p className="section-copy">
        This route is not part of the current approved research evidence snapshot.
      </p>
      <Link className="primary-link" href="/evidence">
        Return to evidence
      </Link>
    </section>
  );
}
