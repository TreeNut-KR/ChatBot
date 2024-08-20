#!/usr/bin/env bash

set -e

# Usage: wait-for-it.sh host:port [-t timeout] [-- command args]
# The script will wait until the host:port is available, then it will run the command.

hostport="$1"
timeout=15
shift

while [[ $# -gt 0 ]]; do
    case "$1" in
        -t)
            timeout="$2"
            shift 2
            ;;
        --)
            shift
            break
            ;;
        *)
            break
            ;;
    esac
done

host="${hostport%:*}"
port="${hostport#*:}"

# Check if the host is reachable
for i in $(seq "$timeout"); do
    if nc -z "$host" "$port"; then
        echo "Connection to $host:$port succeeded!"
        break
    fi
    echo "Waiting for $host:$port..."
    sleep 1
done

if ! nc -z "$host" "$port"; then
    echo "Timeout occurred after waiting $timeout seconds for $host:$port"
    exit 1
fi

exec "$@"
