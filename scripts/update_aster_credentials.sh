#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/update_aster_credentials.sh <ASTER_API_KEY> <ASTER_SECRET_KEY> [PROJECT_ID]

Adds new secret versions for ASTER_API_KEY and ASTER_SECRET_KEY in Google Secret Manager
and updates your local .env file for convenience. When PROJECT_ID is omitted, the
currently configured gcloud project will be used.
USAGE
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 2 ]]; then
  usage
  exit 1
fi

ASTER_API_KEY_VALUE=$1
ASTER_SECRET_KEY_VALUE=$2
PROJECT_ID=${3:-$(gcloud config get-value project 2>/dev/null || true)}

if [[ -z "${PROJECT_ID}" ]]; then
  echo "[!] PROJECT_ID was not supplied and no default gcloud project is set." >&2
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "[!] gcloud CLI is required but was not found in PATH." >&2
  exit 1
fi

echo "[*] Using project: ${PROJECT_ID}".

add_secret_version() {
  local secret_name=$1
  local secret_value=$2

  if gcloud secrets describe "${secret_name}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
    printf '%s' "${secret_value}" | gcloud secrets versions add "${secret_name}" \
      --project "${PROJECT_ID}" --data-file=- >/dev/null
    echo "    Updated existing secret ${secret_name}."
  else
    printf '%s' "${secret_value}" | gcloud secrets create "${secret_name}" \
      --project "${PROJECT_ID}" --data-file=- >/dev/null
    echo "    Created new secret ${secret_name}."
  fi
}

echo "[*] Publishing secrets to Google Secret Manager..."
add_secret_version ASTER_API_KEY "${ASTER_API_KEY_VALUE}"
add_secret_version ASTER_SECRET_KEY "${ASTER_SECRET_KEY_VALUE}"

update_local_env() {
  local env_file=$1
  local key=$2
  local value=$3

  if [[ -f "${env_file}" ]]; then
    if grep -q "^${key}=" "${env_file}"; then
      python - <<PYTHON
from pathlib import Path

env_file = Path("${env_file}")
lines = env_file.read_text().splitlines()
with env_file.open("w", encoding="utf-8") as f:
    for line in lines:
        if line.startswith("${key}="):
            f.write(f"${key}=${value}\n")
        else:
            f.write(line + "\n")
PYTHON
    else
      echo "${key}=${value}" >>"${env_file}"
    fi
  fi
}

echo "[*] Updating local environment files if they exist..."
update_local_env .env ASTER_API_KEY "${ASTER_API_KEY_VALUE}"
update_local_env .env ASTER_SECRET_KEY "${ASTER_SECRET_KEY_VALUE}"
update_local_env risk-orchestrator/.env ASTER_API_KEY "${ASTER_API_KEY_VALUE}"
update_local_env risk-orchestrator/.env ASTER_SECRET_KEY "${ASTER_SECRET_KEY_VALUE}"

echo "[*] Done. Redeploy Cloud Run services to pick up the new secret versions."

