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
  // Public Variables
  public title = 'universities';
  public countries!: any[];
  public countryFC = new FormControl();
  public filteredCountries!: Observable<any[]>;
  public universities!: any[];

  // Private Variables
  private searchStrIndex = 0;

  /**
   * @param _dataService Data Service
   */
  constructor(private _dataService: DataService) {}

  ngOnInit(): void {
    this._dataService.countriesSubject.subscribe((countries) => {
      this.countries = countries;
    });
    this.filteredCountries = this.countryFC.valueChanges.pipe(
      startWith(''),
      map((country) =>
        country ? this._filterCountries(country) : this.countries.slice()
      )
    );
  }

  async getUniversitiesData(evt: any) {
    this.searchStrIndex = 0;
    let searchStr = '';
    if (evt.source.selected) {
      let countryStrList = evt.source.value.replaceAll(',', '').split(' ');
      searchStr = countryStrList[this.searchStrIndex];

      for (this.searchStrIndex; this.searchStrIndex < 3; ) {
        searchStr = this.concatSerachStr(countryStrList, searchStr);
        await this._dataService
          .getUniversitiesData(searchStr)
          .toPromise()
          .then((res) => {
            if (res[0]) {
              this.universities = res;
              this.searchStrIndex = 0;
              searchStr = '';
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

  //#region Private Helper Functions
  private _filterCountries(name: string) {
    return this.countries.filter(
      (country) => country.name.toLowerCase().indexOf(name.toLowerCase()) === 0
    );
  }
  private concatSerachStr(countryStrList: string, searchStr: string) {
    if (
      this.searchStrIndex > 0 &&
      countryStrList[this.searchStrIndex] &&
      countryStrList[this.searchStrIndex][0] != '('
    ) {
      return searchStr + '+' + countryStrList[this.searchStrIndex];
    }
    return searchStr;
  }
  //#endregion
}
