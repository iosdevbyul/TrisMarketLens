import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WakSectionHeader } from "./WakSectionHeader";
import { WakStatusBadge } from "./WakStatusBadge";

describe("WakStatusBadge", () => {
  it("uses the default readable state label", () => {
    const html = renderToStaticMarkup(createElement(WakStatusBadge, { state: "in_progress" }));
    expect(html).toContain('data-state="in_progress"');
    expect(html).toContain("In progress");
  });

  it("allows an explicit label without changing the state", () => {
    const html = renderToStaticMarkup(
      createElement(WakStatusBadge, { state: "blocked", label: "Freeze blocked" }),
    );
    expect(html).toContain('data-state="blocked"');
    expect(html).toContain("Freeze blocked");
  });
});

describe("WakSectionHeader", () => {
  it("renders the heading, eyebrow and trailing content", () => {
    const html = renderToStaticMarkup(
      createElement(WakSectionHeader, {
        eyebrow: "Evidence",
        title: "Research readiness",
        trailing: createElement("span", null, "3 checks"),
      }),
    );
    expect(html).toContain("Evidence");
    expect(html).toContain("<h2>Research readiness</h2>");
    expect(html).toContain("3 checks");
  });
});
