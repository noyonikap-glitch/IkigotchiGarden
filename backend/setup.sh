#!/bin/bash

# Setup script for IkigotchiGarden Backend

echo "Setting up IkigotchiGarden Backend..."

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

echo "Setup complete!"
echo "To start the server:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Run the server: python main.py"
echo "3. Or run with uvicorn: uvicorn main:app --host 0.0.0.0 --port 3001 --reload"