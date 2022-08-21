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
  public filterFC = new FormControl();
  public nameFC = new FormControl();
  public filteredCountries!: Observable<any[]>;
  public universities!: any[];
  public filteredUniversities!: any[];
  public dataLoaded!: boolean;
  public countrySelected = false;
  public noUniversitiesFound!: boolean;
  public filters = ['Name', 'Contains Multiple Domains', 'Secure Website'];

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
    this.filterFC.setValue('default');
    this.countrySelected = true;
    this.dataLoaded = false;
    this.noUniversitiesFound = false;
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
              this.filteredUniversities = this.universities;
              this.searchStrIndex = 0;
              searchStr = '';
              this.dataLoaded = true;
              this.noUniversitiesFound = false;
            } else {
              this.searchStrIndex++;
              this.dataLoaded = false;
              // this.noUniversitiesFound = true;
              console.error(
                `No Data Found, retrying request for ${
                  this.searchStrIndex + 1
                } time with different search string...`
              );
            }
          });
        if (this.searchStrIndex === 0) break;
      }
      if (this.searchStrIndex === 3) this.noUniversitiesFound = true;
    } else {
      this.universities = [];
      this.filteredUniversities = [];
      this.dataLoaded = false;
    }
  }

  onFilterChange(e: any) {
    switch (e.value) {
      case 'Name':
        this.nameFC.valueChanges.subscribe((value) => {
          this.filteredUniversities = this.universities.filter(
            (uni) => uni.name.toLowerCase().indexOf(value.toLowerCase()) === 0
          );
          console.log('case Name:', this.filteredUniversities);
        });
        break;

      case 'Contains Multiple Domains':
        this.filteredUniversities = this.universities.filter(
          (uni) => uni.domains.length > 1
        );
        console.log('case Mulitple Domains:', this.filteredUniversities);
        break;

      case 'Secure Website':
        this.filteredUniversities = this.universities.filter(
          (uni) => uni.web_pages[0].match('https') != null
        );
        console.log('case secure website:', this.filteredUniversities);
        break;

      default:
        this.filteredUniversities = this.universities;
        console.log('case default:', this.filteredUniversities);
        break;
    }

    if (this.filteredUniversities[0]) {
      this.dataLoaded = true;
      this.noUniversitiesFound = false;
    } else {
      this.dataLoaded = false;
      this.noUniversitiesFound = true;
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
