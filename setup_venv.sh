#!/bin/bash
# Comprehensive Virtual Environment Setup Script
# This script sets up the Python virtual environment and automatic activation

set -e

echo "🚀 Creating local virtual environment for Cloud Trader"
echo "====================================================="

VENV_DIR=.venv

if [ -d "$VENV_DIR" ]; then
    read -p "Virtual environment '$VENV_DIR' exists. Recreate? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$VENV_DIR"
    else
        echo "Using existing environment. Activate with: source $VENV_DIR/bin/activate"
        exit 0
    fi
fi

python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r requirements.txt

# Deactivate
deactivate

echo "✅ Virtual environment setup complete!"
echo "Activate with: source $VENV_DIR/bin/activate"
