# Stage-1 review checkpoint (not runtime integration)

Repository: flove-tree/csat-suite
Branch: fix/sync-stage1-revision-observation
Baseline commit: 584021e0d0a7fe0bf1b60d0f6e914c7d29aee0b9
Baseline sync-v2.js Git blob: c38b2bf72b24a0d84a30fa53b6aeda1d92f55f6c
Reproduced engine SHA256: 36d80b9108cf345e89486195d85e8b28ef2a869fc23277aade4f53311aca17e7

This commit stores an exact patch, a hash-guarded reproducer and focused tests.
It does NOT modify the tracked sync-v2.js, HTML, build pipeline or deployment.
No automatic hook runs the patch. A later engine integration commit needs separate approval.

From the repository root (Python 3, Git, Node.js 20; no package installs):

    python3 tools/sync-stage1/verify_and_apply.py
    node tools/sync-stage1/revision.test.cjs

Both commands leave the tracked engine unchanged. The tool builds in a temporary folder.
The 23 focused cases were run during preparation and passed. They do not replace the
previous 50-case checkpoint or claim actual browser/DOM/server verification.

An explicit --apply replaces only the LOCAL engine after baseline and target hash checks.
It does not commit, push, open a PR or deploy. It is not run by this commit or these tests.

Patch policy: validate a present revision as a nonnegative safe integer (not -0),
reject smaller late revisions, accept equal revisions, preserve legacy missing-revision handling.
Observation is session-local, not an applied revision or a local baseline counter.
No outbox, automatic replacement or new merge policy is introduced.

Live Apps Script schema, revision reset/restore rules and snapshot atomicity remain unverified.
Missing revisions and reloads do not provide a monotonicity guarantee. Multi-tab and real DOM
behavior remain unverified. Synthetic data and example.invalid are used in these focused tests.
No personal records, private recovery data, approval secrets or tokens are included.
