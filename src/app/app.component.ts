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
export class AppComponent implements OnInit {
  title = 'universities';
  public countries!: any[];
  countryFC = new FormControl();
  filteredCountries!: Observable<any[]>;

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

  async getUniversitiesData(evt: any) {
    if (evt.source.selected) {
      let countryStrList = evt.source.value.replaceAll(',', '').split(' ');

      this.searchStr = countryStrList[this.searchStrIndex];
      for (this.searchStrIndex; this.searchStrIndex <= 4; ) {
        this.concatSerachStr(countryStrList);
        await this._dataService
          .getUniversitiesData(this.searchStr)
          .toPromise()
          .then((res) => {
            if (res[0]) {
              this.universities = res;
              this.searchStrIndex = 0;
              this.searchStr = '';
            } else {
              this.searchStrIndex++;
              console.error(
                `No Data Found, retrying request for ${
                  this.searchStrIndex + 1
                } time with different search string...`
              );
            }
          });
        if (this.searchStrIndex === 0) break;
      }
    } else {
      this.universities = [];
    }
  }
  private concatSerachStr(countryStrList: string) {
    if (
      this.searchStrIndex > 0 &&
      countryStrList[this.searchStrIndex] &&
      countryStrList[this.searchStrIndex][0] != '('
    ) {
      this.searchStr += '+' + countryStrList[this.searchStrIndex];
    }
  }
}
