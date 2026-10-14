#!/usr/bin/env bash
set -euo pipefail

environment_name="${1:-}"
manifest_ref="${2:-}"
image="${3:-}"
release_sha="${4:-}"
release_version="${5:-}"

case "$environment_name" in
  staging|production) ;;
  *)
    echo "Environment must be staging or production" >&2
    exit 1
    ;;
esac

if [[ ! "$manifest_ref" =~ ^[a-f0-9]{40}$ ]] || [[ ! "$release_sha" =~ ^[a-f0-9]{40}$ ]]; then
  echo "Manifest ref and release SHA must be full Git commit SHAs" >&2
  exit 1
fi

if [[ ! "$release_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Release version must use the MAJOR.MINOR.PATCH format" >&2
  exit 1
fi

repository_root="$(git rev-parse --show-toplevel)"
deployment_branch="deploy/${environment_name}"
temporary_directory="$(mktemp -d)"

cleanup() {
  rm -rf "$temporary_directory"
}
trap cleanup EXIT

git archive "$manifest_ref" ".argo/${environment_name}" | tar -x -C "$temporary_directory"
node "$repository_root/src/scripts/render-deployment-manifest.mjs" \
  "$temporary_directory/.argo/${environment_name}/deployment.yaml" \
  "$image" \
  "$release_sha" \
  "$release_version"

git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git config user.name "github-actions[bot]"

if git fetch --no-tags origin "refs/heads/${deployment_branch}:refs/remotes/origin/${deployment_branch}"; then
  git switch --force-create "$deployment_branch" "origin/$deployment_branch"
else
  git switch --orphan "$deployment_branch"
fi

git rm -r --ignore-unmatch ".argo/${environment_name}"
mkdir -p .argo
cp -R "$temporary_directory/.argo/${environment_name}" ".argo/${environment_name}"
git add ".argo/${environment_name}"

if git diff --cached --quiet; then
  echo "Deployment branch already contains ${image}"
  git switch --detach "$manifest_ref"
  exit 0
fi

git commit -m "Deploy ${environment_name} ${release_sha}"
git push origin "HEAD:${deployment_branch}"
git switch --detach "$manifest_ref"
