import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

export interface ITestItem {
    name: string,
    lat: number,
    lng: number
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  votesFeed!: Observable<any[]>;
  placesFeed!: Observable<any[]>;
  usersFeed!: Observable<any[]>;

  constructor(public db: AngularFireDatabase) { }

  connectToDatabase() {
    this.votesFeed = this.db.list<any[]>('votes').valueChanges() as unknown as Observable<any[]>;
    this.placesFeed = this.db.list<any[]>('places').valueChanges() as unknown as Observable<any[]>;
    this.usersFeed = this.db.list<any[]>('users').valueChanges() as unknown as Observable<any[]>;
  }

  getFeedPlaces() {
    return this.placesFeed;
  }

  addPlaceItem(id: number, lat: number, lng: number, name: string, total_votes: number, current_no_votants: number) {
    let place = {
      id: id,
      lat: lat,
      lng: lng,
      name: name,
      total_votes: total_votes,
      current_no_votants: current_no_votants
    };
    this.placesFeed.subscribe((items: any[]) => {
      for (let item of items) {
        if (item.id === id) {
          return;
        }
      }
      this.db.list('places').push(place);
    });
   
  }

  addPointItem(lat: number, lng: number) {
      let item: ITestItem = {
          name: "test",
          lat: lat,
          lng: lng
      };
      this.db.list('list').push(item);
  }

  syncPointItem(lat: number, lng: number) {
      let item: ITestItem = {
          name: "test",
          lat: lat,
          lng: lng
      };
      this.db.object('obj').set([item]);
  }
}
