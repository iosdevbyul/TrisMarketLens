import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WakSectionHeader } from "./WakSectionHeader";
import { WakStatusBadge } from "./WakStatusBadge";

describe("WakStatusBadge", () => {
  it("uses the default readable state label", () => {
    const html = renderToStaticMarkup(<WakStatusBadge state="in_progress" />);
    expect(html).toContain('data-state="in_progress"');
    expect(html).toContain("In progress");
  });

  it("allows an explicit label without changing the state", () => {
    const html = renderToStaticMarkup(
      <WakStatusBadge state="blocked" label="Freeze blocked" />,
    );
    expect(html).toContain('data-state="blocked"');
    expect(html).toContain("Freeze blocked");
  });
});

describe("WakSectionHeader", () => {
  it("renders the heading, eyebrow and trailing content", () => {
    const html = renderToStaticMarkup(
      <WakSectionHeader
        eyebrow="Evidence"
        title="Research readiness"
        trailing={<span>3 checks</span>}
      />,
    );
    expect(html).toContain("Evidence");
    expect(html).toContain("<h2>Research readiness</h2>");
    expect(html).toContain("3 checks");
  });
});
