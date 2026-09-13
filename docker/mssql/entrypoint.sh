#!/usr/bin/env bash
set -euo pipefail

(
	for _ in $(seq 1 90); do
		if /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" >/dev/null 2>&1; then
			exec /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -i /init/create-database.sql
		fi
		sleep 2
	done
	echo "timed out waiting for sqlservr before create-database.sql" >&2
	exit 1
) &

exec /opt/mssql/bin/launch_sqlservr.sh /opt/mssql/bin/sqlservr
