import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment as env } from 'src/environments/environment';
import { BehaviorSubject, Subscription, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService implements OnDestroy {
  public countriesSubject = new BehaviorSubject<any>('');
  private countriesSub = new Subscription();

  constructor(private http: HttpClient) {
    this.getCountries();
  }

  getCountries() {
    let countries;
    this.countriesSub = this.http
      .get<Observable<any[]>>(`${env.countriesUrl}/all`)
      .subscribe((res) => {
        countries = res;
        this.countriesSubject.next(res);
      });
    return countries;
  }

  ngOnDestroy(): void {
    this.countriesSubject.next(null);
    this.countriesSub.unsubscribe();
  }
}
