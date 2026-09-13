# Shared paths and defaults for verify-photostore helpers.
# shellcheck shell=bash

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
RUN_DIR="$SKILL_DIR/.run"
STATE_FILE="$RUN_DIR/state"
EVIDENCE_DIR="$SKILL_DIR/evidence"

COMPOSE_PROJECT="${COMPOSE_PROJECT:-photostore-verify}"
FRONTEND_PORT="${FRONTEND_PORT:-13000}"
APP_PORT="${APP_PORT:-18080}"
MSSQL_PORT="${MSSQL_PORT:-11433}"
API_URL="http://127.0.0.1:${APP_PORT}"
APP_URL="http://127.0.0.1:${FRONTEND_PORT}"

VERIFY_FOUNDER_EMAIL="${VERIFY_FOUNDER_EMAIL:-verify.founder@photostore.local}"
VERIFY_FOUNDER_PASSWORD="${VERIFY_FOUNDER_PASSWORD:-VerifyPass1!}"

load_state() {
	if [[ ! -f "$STATE_FILE" ]]; then
		return 1
	fi
	# shellcheck disable=SC1090
	source "$STATE_FILE"
	API_URL="http://127.0.0.1:${APP_PORT}"
	APP_URL="http://127.0.0.1:${FRONTEND_PORT}"
}

write_state() {
	mkdir -p "$RUN_DIR"
	cat >"$STATE_FILE" <<EOF
COMPOSE_PROJECT=$(printf '%q' "$COMPOSE_PROJECT")
FRONTEND_PORT=$(printf '%q' "$FRONTEND_PORT")
APP_PORT=$(printf '%q' "$APP_PORT")
MSSQL_PORT=$(printf '%q' "$MSSQL_PORT")
FRONTEND_PID=$(printf '%q' "${FRONTEND_PID:-}")
VERIFY_FOUNDER_EMAIL=$(printf '%q' "$VERIFY_FOUNDER_EMAIL")
VERIFY_FOUNDER_PASSWORD=$(printf '%q' "$VERIFY_FOUNDER_PASSWORD")
STARTED_AT=$(printf '%q' "$(date -Iseconds)")
EOF
}

require_repo_env() {
	if [[ ! -f "$REPO_ROOT/.env" ]]; then
		echo "doctor/launch: missing $REPO_ROOT/.env" >&2
		echo "Copy .env.example to .env and set DB_PASSWORD, JWT_SECRET, and PHOTO_STORE_MASTER_KEY." >&2
		return 1
	fi
}

compose() {
	docker compose -p "$COMPOSE_PROJECT" --project-directory "$REPO_ROOT" \
		-f "$REPO_ROOT/compose.dev.yaml" "$@"
}

port_pids() {
	local port="$1"
	ss -lntp 2>/dev/null | awk -v port=":$port" '
		$4 ~ port "$" {
			while (match($0, /pid=[0-9]+/)) {
				print substr($0, RSTART + 4, RLENGTH - 4)
				$0 = substr($0, RSTART + RLENGTH)
			}
		}
	' | sort -u
}

pid_in_tree() {
	local needle="$1"
	local pid="$2"
	while [[ -n "$pid" && "$pid" != "0" && "$pid" != "1" ]]; do
		if [[ "$pid" == "$needle" ]]; then
			return 0
		fi
		pid="$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ' || true)"
	done
	return 1
}

port_owned_by_tree() {
	local port="$1"
	local root_pid="$2"
	local owner
	local owners
	owners="$(port_pids "$port" || true)"
	if [[ -z "$owners" ]]; then
		return 1
	fi
	while read -r owner; do
		[[ -z "$owner" ]] && continue
		if pid_in_tree "$root_pid" "$owner"; then
			echo "$owner"
			return 0
		fi
	done <<<"$owners"
	return 1
}

http_code() {
	local url="$1"
	local timeout="${2:-5}"
	curl -sS -o /dev/null -w '%{http_code}' --max-time "$timeout" "$url" || true
}

http_ok() {
	case "$(http_code "$1" "${2:-5}")" in
	200 | 204 | 301 | 302 | 303 | 307 | 308) return 0 ;;
	*) return 1 ;;
	esac
}

founder_exists_body() {
	curl -sS --max-time 5 "$API_URL/api/v1/founder/exists-founder" || true
}
