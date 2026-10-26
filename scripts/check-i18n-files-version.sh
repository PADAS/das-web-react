#!/usr/bin/env bash

# Fails when a branch changes translation files without bumping
# I18N_FILES_VERSION. Both backends in src/i18n.js key their caches on that
# value, so an unbumped one leaves returning browsers on the stale bundle,
# rendering raw keys where the new strings go.
#
# Usage: scripts/check-i18n-files-version.sh [base-ref]

set -euo pipefail

BASE_REF="${1:-origin/develop}"
LOCALES_DIR='public/locales'
VERSION_FILE='src/i18n.js'
CACHE_NOTE='Browsers cache each namespace under this version for seven days, so returning users would keep serving the stale bundle.'

# Pathspecs resolve against the working directory, so anywhere but the root
# would match nothing and report a clean branch.
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "${REPO_ROOT}"

fail() {
  if [ -n "${GITHUB_ACTIONS:-}" ]; then
    local version_line
    version_line=$(grep -n -m1 'const I18N_FILES_VERSION' "${VERSION_FILE}" | cut -d: -f1) || version_line=1
    echo "::error file=${VERSION_FILE},line=${version_line}::$1"
  else
    echo "$1" >&2
  fi

  exit 1
}

extract_version() {
  sed -n "s/^const I18N_FILES_VERSION = '\(.*\)';$/\1/p"
}

git rev-parse --verify --quiet "${BASE_REF}" >/dev/null \
  || fail "${BASE_REF} is not a ref in this clone. Fetch it, or pass another base ref as the first argument."

# Detection runs against the merge base, so that locale commits the base
# branch picked up after this branch left it do not read as this branch's.
MERGE_BASE=$(git merge-base "${BASE_REF}" HEAD) \
  || fail "No merge base with ${BASE_REF}. Fetch it first; a shallow clone cannot reach one."

# Both halves compare against the working tree rather than HEAD, so that the
# check tells the truth when it runs before the commit.
if git diff --quiet "${MERGE_BASE}" -- "${LOCALES_DIR}" \
  && [ -z "$(git ls-files --others --exclude-standard -- "${LOCALES_DIR}")" ]; then
  echo "No ${LOCALES_DIR} changes on this branch."
  exit 0
fi

# The comparison, unlike the detection, runs against the base tip: two
# branches that both bump 1.52 to 1.53 merge cleanly, and the second would
# otherwise ship its strings under a version already deployed by the first.
BASE_VERSION=$(git show "${BASE_REF}:${VERSION_FILE}" 2>/dev/null | extract_version) || BASE_VERSION=''
HEAD_VERSION=$(extract_version < "${VERSION_FILE}") || HEAD_VERSION=''

if [ -z "${BASE_VERSION}" ] || [ -z "${HEAD_VERSION}" ]; then
  fail "Could not read I18N_FILES_VERSION. Its declaration changed shape, so this check needs updating too."
fi

if [ "${HEAD_VERSION}" = "${BASE_VERSION}" ]; then
  fail "This branch changes ${LOCALES_DIR} but leaves I18N_FILES_VERSION at ${BASE_VERSION}, the value ${BASE_REF} already carries. ${CACHE_NOTE} Bump it above ${BASE_VERSION}."
fi

# Version sort, not numeric: the series crossed 1.9 to 1.10 long ago.
OLDER=$(printf '%s\n%s\n' "${BASE_VERSION}" "${HEAD_VERSION}" | sort --version-sort | head -1)

if [ "${OLDER}" != "${BASE_VERSION}" ]; then
  fail "This branch changes ${LOCALES_DIR} and sets I18N_FILES_VERSION to ${HEAD_VERSION}, below ${BASE_REF}'s ${BASE_VERSION}. ${CACHE_NOTE} Bump it above ${BASE_VERSION}."
fi

echo "I18N_FILES_VERSION ${BASE_VERSION} -> ${HEAD_VERSION}."
