import { Component, NgZone } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';

import { Observable, Subject } from 'rxjs';
import 'rxjs/add/operator/takeUntil';

import { ArkApiProvider } from '@providers/ark-api/ark-api';

import { Network, Peer, PeerResponse } from 'ark-ts';

import * as constants from '@app/app.constants';

@IonicPage()
@Component({
  selector: 'page-network-status',
  templateUrl: 'network-status.html',
})
export class NetworkStatusPage {

  public currentNetwork: Network;
  public currentPeer: Peer;

  private subscriber$: Observable<PeerResponse>;
  private unsubscriber$: Subject<void> = new Subject<void>();

  private refreshIntervalListener;
  private loader;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private arkApiProvider: ArkApiProvider,
    private loadingCtrl: LoadingController,
    private zone: NgZone,
  ) {
    this.currentNetwork = this.arkApiProvider.network;
    this.currentPeer = this.currentNetwork.activePeer;
  }

  getPeerUrl() {
    return `http://${this.currentPeer.ip}:${this.currentPeer.port}`;
  }

  changePeer() {
    this.loader = this.loadingCtrl.create({
      duration: 10000
    });
    this.arkApiProvider.findGoodPeer();
    this.loader.present();
  }

  private refreshData() {
    this.arkApiProvider.api.peer.get(this.currentPeer.ip, this.currentPeer.port)
    .takeUntil(this.unsubscriber$)
    .do((response) => {
      if (response.success) {
        this.zone.run(() => this.currentPeer = response.peer);
      }
    })
    .subscribe();
  }

  private onUpdatePeer() {
    this.arkApiProvider.onUpdatePeer$
      .takeUntil(this.unsubscriber$)
      .do((peer) => {
        if (this.loader) this.loader.dismiss();
        this.zone.run(() => this.currentPeer = peer);
      }).subscribe();
  }

  ionViewDidLoad() {
    this.onUpdatePeer();
    this.refreshData();

    this.refreshIntervalListener = setInterval(() => {
      this.refreshData();
    }, constants.WALLET_REFRESH_TRANSACTIONS_MILLISECONDS);
  }

  ngOnDestroy() {
    clearInterval(this.refreshIntervalListener);

    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

}