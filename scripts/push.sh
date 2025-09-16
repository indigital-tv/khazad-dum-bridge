#!/usr/bin/env bash
set -euo pipefail

if [ -n "${DEBUG:-}" ]; then set -x; fi

default_branch="main"
repo_url="${1:-}"

if [ -z "$repo_url" ]; then
  echo "Usage: scripts/push.sh <git-repo-url> [branch]" >&2
  exit 1
fi

branch="${2:-$default_branch}"

git init
git checkout -B "$branch"

# Ensure executable bit for this script
chmod +x scripts/push.sh || true

git add .
git commit -m "chore: initial push - mux signed demo"

git remote remove origin 2>/dev/null || true
git remote add origin "$repo_url"
git push -u origin "$branch"

echo "Pushed to $repo_url on branch $branch"


