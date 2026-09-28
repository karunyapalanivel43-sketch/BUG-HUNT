---
name: BUG HUNT source recovery
description: Why the BUG HUNT implementation was reconstructed from the deployed reference rather than the linked export.
---

The linked public repository export was empty while the deployed BUG HUNT app remained available, so the deployed UI and client behavior were the reliable preservation reference.

**Why:** The user's requirement was to preserve the existing game rather than replace its working loop, but no editable source was present in the export.

**How to apply:** If future work refers to the original Lovable project, compare behavior against the deployed game before changing question flow, scoring, navigation, or level structure.