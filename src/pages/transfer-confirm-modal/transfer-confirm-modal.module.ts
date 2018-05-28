import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TransferConfirmModalPage } from './transfer-confirm-modal';

@NgModule({
  declarations: [
    TransferConfirmModalPage,
  ],
  imports: [
    IonicPageModule.forChild(TransferConfirmModalPage),
  ],
})
export class TransferConfirmModalPageModule {}
