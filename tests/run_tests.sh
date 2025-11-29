#!/bin/bash
echo "Installing dependencies (if needed)..."
# Assuming playwright is installed in the env as per verify_game.py existence
# If not, we might need: pip install playwright && playwright install chromium

echo "Running Verification Script..."
python3 tests/verify_full.py
exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo "All tests passed successfully."
    exit 0
else
    echo "Tests failed."
    exit 1
fi
