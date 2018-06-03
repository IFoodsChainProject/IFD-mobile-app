import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { WalletlistPage } from './walletlist';

@NgModule({
  declarations: [
    WalletlistPage,
  ],
  imports: [
    IonicPageModule.forChild(WalletlistPage),
  ],
})
export class WalletlistPageModule {}
