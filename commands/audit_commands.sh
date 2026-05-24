#!/bin/bash

# Audit script for Leen WhatsApp Bot commands
# Checks: message format (*↢ prefix), duplicates, permission checks, toggle usage

COMMANDS_DIR="/home/runner/workspace/leen/commands"
REPORT_FILE="$COMMANDS_DIR/audit_report.txt"
TEMP_FILE="$COMMANDS_DIR/temp_audit.txt"

echo "LEEN COMMANDS AUDIT REPORT" > "$REPORT_FILE"
echo "==========================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Audit started at: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Get all command files
cd "$COMMANDS_DIR"
ls *.js > /tmp/all_files.txt

# Function to check a single command file
check_command() {
    local file="$1"
    local filename=$(basename "$file")
    echo "Checking $filename..." >> "$REPORT_FILE"
    
    # Skip if empty
    if [ ! -s "$file" ]; then
        echo "  ⚠️  EMPTY FILE" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        return
    fi
    
    # Check for *↢ prefix in outgoing messages
    local has_down_arrow=$(grep -l "\\*↢" "$file" 2>/dev/null || echo "")
    if [ -z "$has_down_arrow" ]; then
        echo "  ❌ MISSING *↢ PREFIX in outgoing messages" >> "$REPORT_FILE"
    else
        echo "  ✅ Found *↢ prefix usage" >> "$REPORT_FILE"
    fi
    
    # Check for old emoji patterns (❌, ↫, etc that should be replaced)
    local bad_patterns=$(grep -n '[❌↫]' "$file" 2>/dev/null || echo "")
    if [ -n "$bad_patterns" ]; then
        echo "  ⚠️  FOUND OLD EMOJI PATTERNS (should use *↢):" >> "$REPORT_FILE"
        echo "$bad_patterns" | head -5 >> "$REPORT_FILE"
    fi
    
    # Check permission patterns
    local has_owner_check=$(grep -l "senderIsSudo\|isSudo\|fromMe" "$file" 2>/dev/null || echo "")
    local has_group_check=$(grep -l "endsWith.*@g\.us\|isGroup" "$file" 2>/dev/null || echo "")
    
    if [ -z "$has_owner_check" ] && [ -z "$has_group_check" ]; then
        # Some commands don't need permissions (like help, ping, etc) - this is OK
        echo "  ℹ️  No explicit permission checks (may be OK for public commands)" >> "$REPORT_FILE"
    else
        if [ -n "$has_owner_check" ]; then
            echo "  ✅ Has owner/sudo permission checks" >> "$REPORT_FILE"
        fi
        if [ -n "$has_group_check" ]; then
            echo "  ✅ Has group-only checks" >> "$REPORT_FILE"
        fi
    fi
    
    # Check for toggle dependencies
    local toggle_deps=$(grep -l "TOGGLE_TYPES\|getToggle\|isFeatureEnabled" "$file" 2>/dev/null || echo "")
    if [ -n "$toggle_deps" ]; then
        echo "  🔧 Has toggle dependencies:" >> "$REPORT_FILE"
        grep -n "TOGGLE_TYPES\|getToggle\|isFeatureEnabled" "$file" | head -3 >> "$REPORT_FILE"
    fi
    
    # Check for duplicate command names (we'd need to cross-reference main.js, but basic check)
    local func_name=$(basename "$file" .js)
    echo "  📄 File: $filename → Function expected: ${func_name}Command" >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
}

# Main auditing loop
echo "Starting individual file audits..." >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for file in *.js; do
    if [ "$file" != "scan_all.sh" ] && [ "$file != "final_scan.sh" ] && [ "$file" != "audit_report.txt" ] && [ "$file" != "temp_audit.txt" ]; then
        check_command "$file"
    fi
done

# Summary section
echo "" >> "$REPORT_FILE"
echo "AUDIT SUMMARY" >> "$REPORT_FILE"
echo "=============" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Count files
total_files=$(ls *.js 2>/dev/null | grep -vE "(scan_all|final_scan|audit_report|temp_audit)" | wc -l)
echo "Total command files audited: $total_files" >> "$REPORT_FILE"

# Check for menu5 specifically
if [ -f "menu5.js" ]; then
    echo "✅ menu5.js EXISTS" >> "$REPORT_FILE"
else
    echo "❌ menu5.js MISSING (but referenced in main.js)" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "Audit completed at: $(date)" >> "$REPORT_FILE"

echo ""
echo "Audit complete! Report saved to: $REPORT_FILE"
echo "To see issues: grep -n \"❌\\|⚠️\" $REPORT_FILE"