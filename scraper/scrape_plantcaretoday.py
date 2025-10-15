import requests
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
import json
import os
import re

def search_plantcaretoday(plant_name):
    """Searches DuckDuckGo for the PlantCareToday article URL."""
    query = f"{plant_name} site:plantcaretoday.com"
    with DDGS() as ddgs:
        results = list(ddgs.text(query, max_results=1))
        if results:
            return results[0]["href"]
    return None

def clean_text(html):
    """Cleans and extracts paragraph text from the article."""
    soup = BeautifulSoup(html, "html.parser")
    content = soup.find("div", class_="entry-content")
    if not content:
        return ""

    paragraphs = content.find_all("p")
    return "\n\n".join(p.get_text(strip=True) for p in paragraphs)

def save_plant_data(plant_name, text):
    """Saves the cleaned article to a local JSON file."""
    os.makedirs("output", exist_ok=True)
    filename = f"output/{plant_name.lower().replace(' ', '_')}.json"
    data = {
        "plant": plant_name,
        "source": "plantcaretoday.com",
        "summary": text
    }
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)
    print(f"✅ Saved: {filename}")

def scrape_plantcaretoday(plant_name):
    url = search_plantcaretoday(plant_name)
    if not url:
        print("❌ No article found for:", plant_name)
        return

    print(f"🔍 Found URL: {url}")
    response = requests.get(url)
    if response.status_code == 200:
        text = clean_text(response.text)
        save_plant_data(plant_name, text)
    else:
        print("❌ Failed to fetch page content.")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python scrape_plantcaretoday.py 'snake plant'")
    else:
        plant_name = " ".join(sys.argv[1:])
        scrape_plantcaretoday(plant_name)
