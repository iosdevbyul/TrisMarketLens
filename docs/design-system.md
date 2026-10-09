# WakTrainer Web Design System

This project reuses the visual language of [WakTrainerDesignSystem](https://github.com/iosdevbyul/WakTrainerDesignSystem) while keeping the iOS SwiftUI package untouched.

## Tokens

- `src/styles/wak-tokens.css`: the web mirror of SwiftUI color, typography, spacing, and corner-radius values.
- `src/styles/wak-controls.css`: shared button and labeled input presentation.
- `src/app/globals.css`: application-specific layouts and styles using those tokens.

Update the corresponding web tokens when changing the canonical SwiftUI design values. The two repositories do not yet have an automated synchronization pipeline.

## Components

- `WakPanel`: reusable panel surface with semantic element override.
- `WakMetricCard`: read-only metric summaries.
- `WakSectionHeader`: section title, eyebrow, and trailing content.
- `WakStatusBadge`: typed research-state badge with optional label.
- `WakButton`: native button with primary and secondary appearances.
- `WakTextInput`: labeled input with forwarded native props.

These components are in `src/components/design-system/`. Keep research logic, data loading, and domain-specific copy in their owning routes and features.

## Verification

Run `npm run check` to lint, type-check, test, and build.

After changing visual styles, manually inspect Overview, Stocks, Models, Evidence, and Backtesting at narrow phone, tablet, and desktop widths, including keyboard focus and reduced-motion settings. Automated CSS visual regression testing is not configured yet.

This is an in-repository web implementation, not a published standalone React package.
