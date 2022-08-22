import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DataService } from './services/data.service';
import { map, startWith } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { Country, University } from './models';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public title = 'universities';
  @ViewChild('paginator') paginator!: MatPaginator;

  // Countries Variables
  public countries!: Country[];
  public countryFC = new FormControl();
  public filteredCountries!: Observable<Country[]>;
  public countrySelected = false;

  // Universities Variables
  public universities!: University[];
  public pagedFilteredUniversities!: University[];
  public filteredUniversities!: University[];
  public noUniversitiesFound!: boolean;
  public uniLength!: number;

  // Filters Variables
  public filterFC = new FormControl();
  public uniNameFC = new FormControl();
  public uniNameFCSub = new Subscription();
  public filters = ['Name', 'Contains Multiple Domains', 'Secure Website'];

  public dataLoaded!: boolean;
  private searchStrIndex = 0;
  public itemsPerPage = 10;
  public pageSizeOptions = [10, 25, 50, 100];

  constructor(private _dataService: DataService) {}

  ngOnInit(): void {
    this.getCountries();
    this.filteredCountries = this.dynamicallyFilterCountries();
  }

  /**
   *
   * @param evt onCountrySelection Event
   * Populating universites for a given country as requested.
   *
   * Due to dealing with 2 different APIs, countries names from 'countries API' are manipulated to get the correct data from 'y'
   *
   */
  async getUniversitiesData(evt: any) {
    this.filterFC.setValue('default');
    this.paginator.firstPage();
    this.countrySelected = true;
    this.dataLoaded = false;
    this.noUniversitiesFound = false;
    this.searchStrIndex = 0;
    let searchStr = '';
    if (evt.source.selected) {
      /**
       * Due to countries API, some of the records have "," or "("
       * Due to universities API, country name should have (+) instead of ( ) empty space.
       */
      let countryStrList = evt.source.value.replaceAll(',', '').split(' ');
      searchStr = countryStrList[this.searchStrIndex];
      /**
       * Looping to repeat request with a different search string to handle different cases of country names
       * case 1: search param requires 1 word (ie: Albania) => req returns with data and loop breaks
       * case 2: search param requires 2 words (ie: United+States) => 1st itiration returns no data, so retry till there's a data and break out of the loop
       * case 3: search param requires more than 2 words (ie: United+Arab+Emirates) => repeat 3 times till there's a data and break out of the loop
       *
       * @method concatSearchStr(countryStrList,searchStr)
       * This method concats a plus sign (+) and the next index's value of countryStrList to the searchStr and returns the updated searchStr to retry requesting data with new searchStr (countryName). If no data is returned, the method is called again and concats the next index's value of countryStrList
       *
       * @param countryStrList Country name as an array of strings, each string represents a word of the country name (ie: ['United', 'States', 'of', 'America'])
       * @param searchStr which is initially the first string in the array
       * @example given country: United Arab Emirates, countryStrList = ['United', 'Arab', 'Emirates']
       * 1) first itiration: searchStr= 'United' => no universities found with this country name, retry with a different searchStr
       * 2) second itiration: searchStr= 'United+Arab' => no universities found with this country name, retry with a different searchStr
       * 3) third itiration: searchStr= 'United+Arab+Emirates' => data found! break the loop!
       * @return updatedSearchStr
       *
       */
      for (this.searchStrIndex; this.searchStrIndex < 3; ) {
        searchStr = this.concatSerachStr(countryStrList, searchStr);
        await this._dataService
          .getUniversitiesData(searchStr)
          .toPromise()
          .then((res) => {
            if (res[0]) {
              this.universities = res;
              this.uniLength = this.universities.length;
              this.filteredUniversities = this.universities;
              this.pagedFilteredUniversities = this.universities.slice(
                0,
                this.itemsPerPage
              );
              this.searchStrIndex = 0;
              searchStr = '';
              this.dataLoaded = true;
              this.noUniversitiesFound = false;
            } else {
              this.searchStrIndex++;
              this.dataLoaded = false;
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
      this.pagedFilteredUniversities = [];
      this.dataLoaded = false;
    }
  }

  /**
   * A switch to handle different filtering cases
   * @param e onFilterChange event
   * @returns filterdUniversities[]
   */
  onFilterChange(e: any) {
    this.paginator.firstPage();

    switch (e.value) {
      case 'Name':
        this.uniNameFCSub = this.uniNameFC.valueChanges.subscribe((value) => {
          this.paginator.firstPage();
          this.filteredUniversities = this.universities.filter(
            (uni) => uni.name.toLowerCase().indexOf(value?.toLowerCase()) === 0
          );
          this.uniLength = this.filteredUniversities.length;
          this.pagedFilteredUniversities = this.filteredUniversities.slice(
            0,
            this.itemsPerPage
          );
        });
        break;

      case 'Contains Multiple Domains':
        this.uniNameFC.reset();
        this.filteredUniversities = this.universities.filter(
          (uni) => uni.domains.length > 1
        );
        this.uniLength = this.filteredUniversities.length;

        this.pagedFilteredUniversities = this.filteredUniversities.slice(
          0,
          this.itemsPerPage
        );
        break;

      case 'Secure Website':
        this.uniNameFC.reset();
        this.filteredUniversities = this.universities.filter(
          (uni) => uni.web_pages[0].match('https') != null
        );
        this.uniLength = this.filteredUniversities.length;

        this.pagedFilteredUniversities = this.filteredUniversities.slice(
          0,
          this.itemsPerPage
        );
        break;

      default:
        this.uniNameFC.reset();
        this.filteredUniversities = this.universities;
        this.pagedFilteredUniversities = this.universities.slice(
          0,
          this.itemsPerPage
        );
        this.uniLength = this.filteredUniversities.length;
        break;
    }

    if (this.pagedFilteredUniversities[0]) {
      this.dataLoaded = true;
      this.noUniversitiesFound = false;
    } else {
      this.dataLoaded = false;
      this.noUniversitiesFound = true;
    }
  }

  handlePageEvent(event: any) {
    this.countrySelected = true;
    this.dataLoaded = false;
    this.noUniversitiesFound = false;
    this.itemsPerPage = event.pageSize;

    setTimeout(() => {
      this.dataLoaded = true;
      this.pagedFilteredUniversities = this.filteredUniversities.slice(
        event.pageIndex * this.itemsPerPage,
        (event.pageIndex + 1) * this.itemsPerPage
      );
    }, 350);
  }

  //#region Private Helper Functions
  private getCountries() {
    this._dataService.countriesSubject.subscribe((countries) => {
      this.countries = countries;
    });
  }
  private dynamicallyFilterCountries() {
    return this.countryFC.valueChanges.pipe(
      startWith(''),
      map((countryName) => {
        return countryName
          ? this.countries.filter(
              (country) =>
                country.name
                  .toLowerCase()
                  .indexOf(countryName.toLowerCase()) === 0
            )
          : this.countries.slice();
      })
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

  ngOnDestroy(): void {
    this.uniNameFCSub.unsubscribe();
  }
}
