import os
import requests
from dotenv import load_dotenv

load_dotenv()
TREFLE_TOKEN = os.getenv("TREFLE_TOKEN")

BASE_URL = "https://trefle.io/api/v1"

def search_plant(query):
    url = f"{BASE_URL}/plants/search"
    params = {
        'token': TREFLE_TOKEN,
        'q': query
    }

    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    return data['data']  # List of plants


def get_plant_details(plant_id):
    url = f"{BASE_URL}/plants/{plant_id}"
    params = {'token': TREFLE_TOKEN}
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()['data']


def get_species_details(slug):
    url = f"{BASE_URL}/species/{slug}"
    params = {'token': TREFLE_TOKEN}
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()['data']


# Example usage:
results = search_plant("snake plant")
if results:
    plant = results[0]
    print(f"\n🌿 Found: {plant['common_name']} ({plant['scientific_name']})")
    
    plant_details = get_plant_details(plant['id'])
    print("\n📘 Plant Details:")
    print(f"  Duration: {plant_details.get('duration')}")
    print(f"  Edible: {plant_details.get('edible')}")
    print(f"  Light: {plant_details.get('main_species', {}).get('growth', {}).get('light')}")

    species_info = get_species_details(plant['slug'])
    print("\n📗 Species Info:")
    print(f"  Growth Form: {species_info.get('main_species', {}).get('specifications', {}).get('growth_form')}")
    print(f"  Growth Rate: {species_info.get('main_species', {}).get('growth', {}).get('growth_rate')}")

