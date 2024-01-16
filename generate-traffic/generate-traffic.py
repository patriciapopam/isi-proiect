import firebase_admin
from firebase_admin import credentials, db
from firebase_admin import firestore
from google.cloud.firestore import FieldFilter

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

    for place in all_places_data:
        if all_places_data[place]['name'] == 'COLEGIUL NATIONAL "GHEORGHE LAZAR"':
            print("Found it!")
            print(all_places_data[place]['current_no_votants'])
            all_places_data[place]['current_no_votants'] = all_places_data[place]['current_no_votants'] + 1
            print(all_places_data[place]['current_no_votants'])
            places_ref.update({place: all_places_data[place]})
            print("Updated!")
    else:
        print("No data found in the 'places' node.")

if __name__ == "__main__":
    # Call the function to get data from the database
    get_data_from_database()