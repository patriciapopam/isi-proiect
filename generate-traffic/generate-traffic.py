from time import sleep
import firebase_admin
from firebase_admin import credentials, db
from firebase_admin import firestore
from google.cloud.firestore import FieldFilter

import random

#random_number = random.randint(10, 100)

# Initialize Firebase with your service account key
cred = credentials.Certificate('../isi-proiect-test-4f0d683034d0.json')
firebase_admin.initialize_app(cred, {"databaseURL": "https://isi-proiect-test-default-rtdb.europe-west1.firebasedatabase.app"})

def get_data_from_database():
    # Reference to the root of your Firebase database
    root_ref = db.reference()

    # Reference to the "places" node in the database
    places_ref = root_ref.child("places")

    # Get all data under the "places" node
    all_places_data = places_ref.get()

    i = 0
    picked_place1 = random.randint(0, len(all_places_data) - 1)
    picked_place2 = random.randint(0, len(all_places_data) - 1)
    picked_place3 = random.randint(0, len(all_places_data) - 1)
    picked_place4 = random.randint(0, len(all_places_data) - 1)
    picked_place5 = random.randint(0, len(all_places_data) - 1)

    for place in all_places_data:
        if i == picked_place1 or i == picked_place2 or i == picked_place3 or i == picked_place4 or i == picked_place5:
            print("Picked place: " + place)
            print(all_places_data[place]['name'] + " " + str(all_places_data[place]['total_votes']) + " " + str(all_places_data[place]['current_no_votants']))
            all_places_data[place]['current_no_votants'] = random.randint(10, 100)
            all_places_data[place]['total_votes'] += random.randint(10, 100)
            places_ref.update({place: all_places_data[place]})
        i += 1
        
if __name__ == "__main__":
    # Call the function to get data from the database
    i = 0
    while i < 10:
        get_data_from_database()
        sleep(5)
        i += 1