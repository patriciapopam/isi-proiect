import { Component, Input, OnChanges, SimpleChanges, OnInit, DoCheck } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Observable, map } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { FirebaseService } from 'src/app/shared/services/database/firebase.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('numberAnimation', []),
  ],
})
export class DashboardComponent implements OnInit, DoCheck {
  
  /* Votes */
  totalVotes: number = 0;
  previousVotesValue: number = 0;
  displayVotesValue: number = 0;

  /* People */
  totalPeople: number = 0;
  previousPeopleValue: number = 0;
  displayPeopleValue: number = 0;

  /* Percentage */
  percentageVoted: number = 0;
  previousPercentageVoted: number = 0;
  displayPercentageVoted: number = 0;

  animationStateVotes: 'start' | 'end' = 'start';
  animationStatePeople: 'start' | 'end' = 'start';
  animationStatePercentage: 'start' | 'end' = 'start';

  constructor(
    public authService: AuthService,
    public fb: FirebaseService,
  ) { }

  ngOnInit(): void {
    this.displayPeopleValue = 0;
    this.displayVotesValue = 0;
    this.displayPercentageVoted = 0;
    this.totalVotes = 0;
    this.totalPeople = 0;
    this.percentageVoted = 0;
    this.previousPeopleValue = 0;
    this.previousVotesValue = 0;
    this.previousPercentageVoted = 0;

    this.fb.connectToDatabase();
    this.fb.getFeedPlaces().subscribe((places: any[]) => {
      this.previousVotesValue = this.totalVotes;
      this.totalVotes = this.calculateTotalVotes(places);
      console.log(this.previousVotesValue, this.totalVotes);
      this.displayVotesValue = this.previousVotesValue;

      this.previousPeopleValue = this.totalPeople;
      this.totalPeople = this.calculateTotalPeople(places);
      console.log(this.previousPeopleValue, this.totalPeople);
      this.displayPeopleValue = this.previousPeopleValue;

      this.previousPercentageVoted = this.percentageVoted;
      this.percentageVoted = this.calculatePercentageVoted();
      console.log(this.previousPercentageVoted, this.percentageVoted);
      this.displayPercentageVoted = this.previousPercentageVoted;
    });
    
  }

  ngDoCheck() {
    if (this.previousVotesValue !== this.totalVotes) {
      this.animateNumberChangeVotes();
      this.previousVotesValue = this.totalVotes;
    }

    if (this.previousPeopleValue !== this.totalPeople) {
      this.animateNumberChangePeople();
      this.animateNumberChangePercentage(); 
      this.previousPeopleValue = this.totalPeople;
      this.previousPercentageVoted = this.percentageVoted;
      this.percentageVoted = this.calculatePercentageVoted();
    }
  }

  calculateTotalVotes(places: any[]): number {
    return places.reduce((total, place) => total + place.total_votes, 0);
  }

  calculateTotalPeople(places: any[]): number {
    return places.reduce((total, place) => total + place.current_no_votants, 0);
  }

  calculatePercentageVoted(): number {
    return Number((this.totalVotes / 2000000 * 100).toFixed(2));
  }

  private animateNumberChangeVotes() {
    const startValue = this.previousVotesValue;
    const endValue = this.totalVotes;

    this.animationStateVotes = 'start';

    const frameCount = 10; // Adjust the number of frames as needed
    const frameDuration = 500 / frameCount; // Total duration divided by number of frames

    const increment = Math.round((endValue - startValue) / frameCount);

    let currentFrame = 0;

    const interval = setInterval(() => {
      currentFrame++;
      console.log(currentFrame);
      console.log(this.displayVotesValue);
      if (currentFrame === frameCount) {
        clearInterval(interval);
        this.displayVotesValue = endValue;
        this.animationStateVotes = 'end';
      } else {
        this.displayVotesValue = startValue + increment * currentFrame;
      }
    }, frameDuration);
    console.log(this.displayVotesValue, this.previousVotesValue, this.totalVotes);
    this.displayVotesValue = this.totalVotes;
    this.animationStateVotes = 'start';
  }

  private animateNumberChangePeople() {
    const startValue = this.previousPeopleValue;
    const endValue = this.totalPeople;

    this.animationStatePeople = 'start';

    const frameCount = 10; // Adjust the number of frames as needed
    const frameDuration = 500 / frameCount; // Total duration divided by number of frames

    const increment = Math.round((endValue - startValue) / frameCount);

    let currentFrame = 0;

    const interval = setInterval(() => {
      currentFrame++;
      console.log(currentFrame);
      console.log(this.displayPeopleValue);
      if (currentFrame === frameCount) {
        clearInterval(interval);
        this.displayPeopleValue = endValue;
        this.animationStatePeople = 'end';
      } else {
        this.displayPeopleValue = startValue + increment * currentFrame;
      }
    }, frameDuration);
    console.log(this.displayPeopleValue, this.previousPeopleValue, this.totalPeople);
    this.displayPeopleValue = this.totalPeople;
    this.animationStatePeople = 'start';
  }

  private animateNumberChangePercentage() {
    const startValue = this.previousPercentageVoted;
    const endValue = this.percentageVoted;

    this.animationStatePercentage = 'start';

    const frameCount = 10; // Adjust the number of frames as needed
    const frameDuration = 500 / frameCount; // Total duration divided by number of frames

    const increment = Number(((endValue - startValue) / frameCount).toFixed(2));
    console.log(increment);

    let currentFrame = 0;

    const interval = setInterval(() => {
      currentFrame++;
      console.log(currentFrame);
      console.log(this.displayPercentageVoted);
      if (currentFrame === frameCount) {
        clearInterval(interval);
        this.displayPercentageVoted = endValue;
        this.animationStatePercentage = 'end';
      } else {
        this.displayPercentageVoted = Number((startValue + increment * currentFrame).toFixed(2));
      }
    }, frameDuration);
    console.log(this.displayPercentageVoted, this.previousPercentageVoted, this.percentageVoted);
    this.displayPercentageVoted = this.percentageVoted;
    this.animationStatePercentage = 'start';
  }
}
