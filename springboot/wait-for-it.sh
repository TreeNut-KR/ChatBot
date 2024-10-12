#!/usr/bin/env bash

set -e

# Usage: wait-for-it.sh host:port [-- command args]
# The script will wait until the host:port is available, then it will run the command.

hostport="$1"
shift

host="${hostport%:*}"
port="${hostport#*:}"

# Default timeout is 60 seconds (1 minute)
timeout=60
start_time=$(date +%s)
printed_wait_message=false

# Check if the host is reachable
while true; do
    if nc -z "$host" "$port"; then
        echo "Connection to $host:$port succeeded!"
        break
    fi

    # Print "Waiting for..." message only once
    if [ "$printed_wait_message" = false ]; then
        echo "Waiting for $host:$port..."
        printed_wait_message=true
    fi

    # Check if we have reached the timeout
    current_time=$(date +%s)
    elapsed_time=$((current_time - start_time))
    if [ "$elapsed_time" -ge "$timeout" ]; then
        echo "Timeout occurred after waiting $timeout seconds for $host:$port"
        exit 1
    fi

    sleep 1
done

exec "$@"
