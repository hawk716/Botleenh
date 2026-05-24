#!/bin/bash

# Simple audit script for Leen WhatsApp Bot commands

COMMANDS_DIR="/home/runner/workspace/leen/commands"
REPORT_FILE="$COMMANDS_DIR/audit_report.txt"

echo "LEEN COMMANDS AUDIT REPORT" > "$REPORT_FILE"
echo "==========================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Audit started at: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Get all command files excluding our scripts
cd "$COMMANDS_DIR"
ls *.js | grep -vE "(audit_commands|scan_all|final_scan)" > /tmp/files_to_audit.txt

echo "Files to audit:" >> "$REPORT_FILE"
cat /tmp/files_to_audit.txt >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Simple check for each file
for file in $(cat /tmp/files_to_audit.txt); do
    echo "=== Checking $file ===" >> "$REPORT_FILE"
    
    # Check for *↢ usage
    if grep -q "\\*↢" "$file"; then
        echo "✅ Uses *↢ prefix" >> "$REPORT_FILE"
    else
        echo "❌ Missing *↢ prefix" >> "$REPORT_FILE"
    fi
    
    # Check for bad emojis
    if grep -n '[❌↫]' "$file"; then
        echo "⚠️  Contains old emoji patterns (❌ or ↫)" >> "$REPORT_FILE"
    else
        echo "✅ No old emoji patterns" >> "$REPORT_FILE"
    fi
    
    # Check for permission patterns
    if grep -q "senderIsSudo\|isSudo\|fromMe" "$file"; then
        echo "✅ Has permission checks" >> "$REPORT_FILE"
    else
        echo "ℹ️  No explicit sudo/owner checks" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
done

echo "Audit completed at: $(date)" >> "$REPORT_FILE"
echo "Check $REPORT_FILE for details"