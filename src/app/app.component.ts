import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataService } from './services/data.service';
import { map, startWith } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'universities';
  public countries!: any[];
  countryFC = new FormControl();
  filteredCountries!: Observable<any[]>;
  uniSub = new Subscription();

  public universities!: any[];

  constructor(private _dataService: DataService) {
    this._dataService.countriesSubject.subscribe((countries) => {
      this.countries = countries;
    });
  }

  ngOnInit(): void {
    this.filteredCountries = this.countryFC.valueChanges.pipe(
      startWith(''),
      map((country) =>
        country ? this._filterCountries(country) : this.countries.slice()
      )
    );
  }

  private _filterCountries(name: string) {
    return this.countries.filter(
      (country) => country.name.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }

  private searchStrIndex = 0;
  private searchStr = '';

  getUniversitiesData(evt: any) {
    console.log('evt', evt);
    if (evt.source.selected) {
      let countryStrList = evt.source.value.replaceAll(',', '').split(' ');
      console.log('countryStr', countryStrList);

      this.searchStr = countryStrList[this.searchStrIndex];

      this.uniSub = this._dataService
        .getUniversitiesData(this.searchStr)
        .subscribe((res) => {
          if (res[0]) {
            this.universities = res;
            console.log('res', res);
            this.searchStrIndex = 0;
            this.searchStr = '';
          } else {
            console.error(
              'No Data Found, retrying request with different search string...'
            );
            this.searchStrIndex++;
            this.retry_getUniversitiesData(countryStrList);
          }
        });
    } else {
      this.universities = [];
    }
  }

  retry_getUniversitiesData(countryStrList: string) {
    if (
      countryStrList[this.searchStrIndex] &&
      countryStrList[this.searchStrIndex][0] != '('
    ) {
      this.searchStr += '+' + countryStrList[1];
    }
    console.log('this.searchStr', this.searchStr);

    this._dataService.getUniversitiesData(this.searchStr).subscribe((res) => {
      if (res[0]) {
        this.universities = res;
        console.log('res', res);
      } else {
        console.error(
          'No Data Found, retrying request with different search string...'
        );
      }
    });
  }
  ngOnDestroy(): void {
    this.uniSub.unsubscribe();
  }
}
