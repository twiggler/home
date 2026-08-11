#!/usr/bin/env sh
# Single source of truth for the test run, shared by the justfile (local, via the
# container) and the CI workflow (already inside the container). Extra args pass
# through to Playwright, e.g. `sh scripts/run-tests.sh --project=desktop-webkit`.
set -eu
npm ci --no-update-notifier
npx playwright test "$@"
