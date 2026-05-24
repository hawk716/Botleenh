#!/bin/bash

echo "=== LEEN COMMANDS FINAL SCAN ==="
echo ""
echo "Supported command files:"
ls -1 leen/commands/*.js 2>/dev/null | grep -v menu | grep -v .sh | while read f; do
    echo "  $(basename "$f")"
done
echo ""
echo "Menu files:"
ls -1 leen/commands/menu*.js 2>/dev/null
echo ""
echo "First 50 non-menu commands:"
ls -1 leen/commands/*.js 2>/dev/null | grep -v "^.*menu" | grep -v "^.*\.md$" | head -50