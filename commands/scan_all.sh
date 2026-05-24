#!/bin/bash

echo "=== Scanning all command files ==="
for file in /home/runner/workspace/leen/commands/*.js; do
    if [ -f "$file" ]; then
        basename "$file"
    fi
done | sort