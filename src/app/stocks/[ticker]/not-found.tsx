import Link from "next/link";

export default function StockNotFound() {
  return (
    <section className="panel not-found-panel">
      <p className="eyebrow">Stock explorer</p>
      <h1>Stock not found</h1>
      <p className="section-copy">
        This ticker is not part of the small mock explorer yet. The full approved
        universe will be available after the DonghakStockVision API is connected.
      </p>
      <Link className="primary-link" href="/stocks">
        Return to stocks
      </Link>
    </section>
  );
}
