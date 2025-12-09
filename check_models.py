import os

import google.generativeai as genai

from cloud_trader.credentials import load_credentials

# Load creds to get the API key
creds = load_credentials()
if not creds.api_key:
    print("No API Key found!")
    exit(1)

genai.configure(api_key=creds.api_key)

print("Listing available models...")
try:
    for m in genai.list_models():
        if "gemini" in m.name:
            print(f"Name: {m.name}")
            print(f"Description: {m.description}")
            print("-" * 20)
except Exception as e:
    print(f"Error listing models: {e}")
