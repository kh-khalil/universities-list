import { Component, OnInit } from '@angular/core';
import { DataService } from './services/data.service';
import { map, startWith } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';

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
  onSelect(evt: any) {
    if (evt.source.selected) {
      console.log(evt.source.value);
    }
  }
}
