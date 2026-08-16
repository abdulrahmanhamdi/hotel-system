#!/bin/sh
# wait-for-db.sh: Waits for PostgreSQL to become accessible before executing command

set -e

hostport="$1"
shift
cmd="$@"

host=$(echo "$hostport" | cut -d: -f1)
port=$(echo "$hostport" | cut -d: -f2)

echo "Waiting for database on $host:$port to be ready..."

while ! nc -z "$host" "$port"; do
  sleep 1
done

echo "Database is ready! Executing command: $cmd"
exec $cmd
