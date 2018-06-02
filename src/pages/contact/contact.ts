///<reference path="../../js/buffer.d.ts"/>
///<reference path="../../js/transaction.d.ts"/>
///<reference path="../../js/sql.d.ts"/>
///<reference path="../../js/wallet.d.ts"/>

import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { NavParams } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { AboutPage } from "../about/about";

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactPage {

  toAddress:any;
  assetAmount:any;
  assetName:any;
  assetNumber:any;
  myAddress:any;
  connectingNodeName:any;
  hostProvider:any;
  txModify:any;
  walletApp:any;
  txData:any;
  successInfo:any;



  constructor(public navCtrl: NavController,params: NavParams,public toastCtrl: ToastController) {

      this.toAddress = params.get('toAddress');
      this.assetAmount = params.get('assetAmount');
      this.assetName = params.get('assetName');
      this.assetNumber = params.get('assetNumber');
      this.myAddress = params.get('myAddress');
      this.connectingNodeName = params.get('connectingNode');
      this.hostProvider = params.get('hostProvider');
      this.walletApp = params.get('walletApp');
      this.txData = params.get('txData');
      console.log(this.walletApp);
  }

  toTransferCoins(){
    this.walletApp.txModify = false;
    if (!this.walletApp.txModify) {

      if (this.walletApp.walletType == 'externalsignature') {
        /*this.MakeTxAndSend(this.walletApp.txData);*/
      } else {
        console.log("签名并发送");
        console.log(this.txData);
        this.SignTxAndSend(this.txData);
      }
    }
  }

  SignTxAndSend($txData) {
    var publicKeyEncoded = this.walletApp.accounts[this.walletApp.accountSelectIndex].publickeyEncoded;
    var privateKey = this.walletApp.accounts[this.walletApp.accountSelectIndex].privatekey;
    var sign = Wallet.signatureData($txData, privateKey);
    var txRawData = Wallet.AddContract($txData, sign, publicKeyEncoded);

    this.sendTransactionData(txRawData,0);
  };

  sendTransactionData($txData, $transactionType) {
    var that = this;
    var host = that.walletApp.hostInfo[that.walletApp.hostSelectIndex];

    Wallet.SendTransactionData( $txData, host, (function (res) {
      console.log(res);
      /* 原判断条件 res.status == 200 调试 改为 res.Desc == "SUCCESS" */
      if (res.Desc == "SUCCESS") {
        var txhash = that.reverseArray(that.hexstring2ab(Wallet.GetTxHash($txData.substring(0, $txData.length - 103 * 2))));

        /* 原判断条件 res.data.Error == 0 调试 改为 res.Error == 0 */
        if (res.Error == 0) {
          /*  var successInfo = $translate.instant('NOTIFIER_TRANSACTION_SUCCESS_TXHASH'); */
          var successInfo = "交易成功, TXID:";

          that.successInfo = successInfo + that.ab2hexstring(txhash);

          /*walletApp.successInfoTimerVal = 60;*/ //此行暂时无任何作用
          /*  $scope.notifier.success(successInfo); */
          console.log(that.successInfo);

          if (that.walletApp.txType === '128') {
            that.countDown();

            let toast = that.toastCtrl.create({
              message: that.successInfo,
              duration: 3000,
              position: 'top'
            });
            toast.present();

            setTimeout(function () {
              that.navCtrl.pop();
            },3000)
          }

        } else {
          /* $scope.notifier.danger($translate.instant('NOTIFIER_FAILURE') + res.data.Error + ': ' + res.data.Desc) */
          console.log("失败"+res.Error+':'+res.Desc);
        }

        that.walletApp.isDisplayAssetId = true;
        that.walletApp.newAssetId = that.ab2hexstring(txhash);
        if ($transactionType == 0) {
          that.walletApp.registerNewAssetId = that.walletApp.newAssetId;
        } else if ($transactionType == 1) {
          that.walletApp.issueNewAssetId = that.walletApp.newAssetId;
        }
      }
    }), (function (err) {
      that.catchProblem(err);
      return null;
    }));

  };

  countDown = function () {
    var that = this;
    that.walletApp.waitingSecond = true;
    that.walletApp.countdown = 10;
    that.walletApp.Transaction.ToAddress = '';
    that.walletApp.Transaction.Amount = '';
    that.walletApp.Transaction.able = false;
    var myTime = setInterval(function () {
        that.walletApp.countdown--;
        if (that.walletApp.countdown == 0) {
          that.walletApp.Transaction.able = true;
          that.walletApp.waitingSecond = false;
          clearInterval(myTime);
        }

        /*  $scope.$digest(); */
      },
      1000);

  };

  catchProblem = function ($err) {
    let toast = this.toastCtrl.create({
      message: $err,
      duration: 3000,
      position: 'top'
    });
    toast.present();
  };

  cancle(){
    this.navCtrl.push(AboutPage);
  }


  hexstring2ab(str) {
    var result = [];
    while (str.length >= 2) {
      result.push(parseInt(str.substring(0, 2), 16));
      str = str.substring(2, str.length);
    }

    return result;
  }

  ab2hexstring(arr) {
    var result = "";
    for (let i = 0; i < arr.length; i++) {
      var str = arr[i].toString(16);
      str = str.length == 0 ? "00": str.length == 1 ? "0" + str: str;
      result += str;
    }
    return result;
  }

  reverseArray(arr) {
    var result = new Uint8Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
      result[i] = arr[arr.length - 1 - i];
    }

    return result;
  }

}
