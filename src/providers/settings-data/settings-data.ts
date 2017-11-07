import { Injectable } from '@angular/core';
import { StorageProvider } from '@providers/storage/storage';

import { Observable, BehaviorSubject, Subject } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeUntil';

import lodash from 'lodash';
import { UserSettings } from '@models/settings';
import * as constants from '@app/app.constants';

@Injectable()
export class SettingsDataProvider {

  public onUpdate$: Subject<UserSettings> = new Subject();

  private _settings: UserSettings;

  public AVALIABLE_OPTIONS = {
    languages: {
      "en": "English",
      "pt-br": "Portuguese - Brazil",
    },
    currencies: {
      "usd": "Dolar",
      "btc": "Bitcoin",
      "brl": "Real",
    },
  }

  constructor(private _storageProvider: StorageProvider) {
    this.load().subscribe((data) => {
      this._settings = data;
      this.save();
    });
  }

  public get settings() {
    if (lodash.isEmpty(this._settings)) {
      return this.load();
    } else {
      return Observable.of(this._settings);
    }
  }

  public getDefaults(): UserSettings {
    return UserSettings.defaults();
  }

  public save(options: UserSettings = this._settings): Observable<any> {
    if (!lodash.isObject(options)) return;

    for (let prop in options) {
      this._settings[prop] = options[prop];
    }

    return this._storageProvider.set(constants.STORAGE_SETTINGS, this._settings);
  }

  public clearData(): void {
    this._storageProvider.clear();
  }

  private load(): Observable<UserSettings> {
    return Observable.create((observer) => {
      this._storageProvider.getObject(constants.STORAGE_SETTINGS).subscribe((response) => {
        let data = response;

        if (lodash.isEmpty(data)) {
          data = this.getDefaults();
        }

        observer.next(data);
      });
    });
  }

}