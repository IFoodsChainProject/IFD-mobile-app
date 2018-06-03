import { Component  } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BLE} from "@ionic-native/ble";
import { ToastController } from 'ionic-angular';
import { LoadingController } from "ionic-angular";
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';
import { Device } from '@ionic-native/device';
import { ChangeDetectorRef } from '@angular/core';
import { HttpClient } from "@angular/common/http";

declare var $:any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {

  constructor(public navCtrl: NavController,private ble: BLE,public toastCtrl: ToastController,public loadingCtrl: LoadingController,private bluetoothSerial: BluetoothSerial,private device: Device,public cd: ChangeDetectorRef,private http:HttpClient) {
      this.deviceSys = this.device.platform;
      console.log(this.deviceSys);
      this.ble.isEnabled().then(res=>{
        this.bluetoothEnable = true;
        this.homeToastTop("蓝牙已开启");
      }).catch(error=>{
        this.bluetoothEnable = false;
        /*this.homeToastTop("蓝牙未开启");*/
      })
  }

  deviceSys:any;
  bluetoothEnable:any = false; //蓝牙是否启用
  electric:any = '0'; //导电度申明
  ph:any = '0'; //ph值申明
  meatQuality:any = "0%"; // 肉质测试数据
  connectBle:any = 'no'; //判断是否连接蓝牙
  loading:any; //页面加载loading
  walletApp:any = {};
  isConnect:boolean = false;

  devices:any = [];

  testWalletAccount:any = {
    address: "FFoD82FXu6FCRCr56fJUWT44M1DCx588J6",
    privatekey: "a45058d028b55df1a725fde070c019fa5dcc39cd83bd5414e80e99d54da9112a",
    programHash: "6d552658f94f0b60864d947db412d396c8bc4659",
    publickeyEncoded: "03ea970a23c91f0fac8c68be6bba55488aa7d7f96901d7f891f057153bfef4b2a3",
    publickeyHash: "b040de43821bee747479d36a7427e819ea19aeb3"
  }

  ionViewDidLoad(){
    var that = this;

    that.httpRandomNode();

    if(that.bluetoothEnable){
      that.connectBle = 'scaning';
      that.scanBleDevice();
    }else if(that.deviceSys == 'Android'){
      that.ble.enable().then(res=>{
          that.connectBle = 'scaning';
          that.homeToastTop("蓝牙开启成功");
          that.scanBleDevice();
        }
      ).catch(()=>{
          that.homeToastTop("请打开蓝牙，否则无法连接探针为您检测数据");
      })
    }else{
      var bleInterval = setInterval(function () {
        that.ble.isEnabled().then(res=>{
          that.bluetoothEnable = true;
          that.connectBle = 'scaning';
          that.scanBleDevice();
          that.homeToastTop("蓝牙已成功打开");
          clearInterval(bleInterval);
        }).catch(error=>{
          that.bluetoothEnable = false;
        })
      },2000)
    }
  }

  scanBleDevice(){
      var that = this;
      let deviceArray:any = [];
      this.ble.startScan([]).subscribe(
        data => {
          var adDatas = new Uint8Array(data.advertising);
          data.adData = adDatas;
          deviceArray.push(data);
          console.log(deviceArray);
          that.devices = deviceArray;
          that.cd.detectChanges();
        },
        error => {
            this.homeToastTop('很抱歉，蓝牙扫描失败，请尝试重启蓝牙再次扫描');
        }
      )
  }

  connectDevice(bleId,bleName){
      var that = this;
      that.ble.stopScan().then(function (stopScandata) {
        console.log("停止扫描成功");

        that.homeLoading('show');
        that.bluetoothSerial.connect(bleId).subscribe(
          connectBleId =>{
            console.log(connectBleId);
            that.homeLoading('hide');
            if(bleName){
              that.homeToastTop(bleName+'连接成功');
            }else{
              that.homeToastTop('设备连接成功');
            }

            that.connectBle = 'yes';
            that.isConnect = true;

            that.httpRandomNode();

            that.bluetoothSerial.subscribeRawData().subscribe(
              dataBuffer=>{
                console.log("收到数据")
                console.log(dataBuffer);
                let newBuffer = String.fromCharCode.apply(null, new Uint8Array(dataBuffer))
                that.ph = newBuffer;
                that.cd.detectChanges();
                that.listenCheckDataRefresh();

              },error=>{
                console.log("串行数据未收到");
              }
            )
          },
          error => {
            console.log(error);
            that.homeLoading('hide');
            that.homeToastTop('连接失败请重试');
            that.connectBle = 'scaning';
            that.isConnect = false;
          }
        )
      },function (error) {
        console.log("停止扫描失败");
        that.homeToastTop('连接失败请重试');
      })
  }

  transferDataShow(elec:number,phv:number){
    var that = this;

    var eleTimer = setInterval(function () {
      let step:number = parseFloat((elec/30).toFixed(1));

      if(that.electric<elec){
        that.electric = parseFloat((that.electric + step).toFixed(1));

      }else {
        that.electric = elec;
        clearInterval(eleTimer);
      }
    },30)

    var phTimer = setInterval( function () {
      let step:number = parseFloat((phv/30).toFixed(1));

      if(that.ph<phv){
        that.ph = parseFloat((that.ph + step).toFixed(1));

      }else {
        that.ph = phv;
        clearInterval(phTimer);
      }
    },30)

  }

  homeToastTop(res){
    let toast = this.toastCtrl.create({
      message: res,
      duration: 3000,
      position: 'top'
    });
    toast.present();
  }

  homeLoading(res){
    if(res == 'show'){
      this.loading = this.loadingCtrl.create({
        content: 'Please wait...',
        spinner: 'ios'
      });
      this.loading.present();
    }else if(res == 'hide'){
      this.loading.dismiss();
    }
  }

  httpRandomNode(){
    var that = this;
    this.http.get('assets/conf/wallet-conf.json').subscribe(dataObject =>{
      console.log(dataObject);
      let data:any = dataObject;

      that.walletApp.hostInfo = data.host_info[0];

      that.walletApp.hostSelectIndex = Math.floor(Math.random() * (that.walletApp.hostInfo.length));

    },eror=>{
      that.homeToastTop(eror);
    })
  }

  listenCheckDataRefresh(){
    this.meatQuality= parseFloat((Math.random()*(98-80)+80).toFixed(1)) + "%";
    this.electric = parseFloat((Math.random()*(13-1)+0.7).toFixed(1));

    $(".r_c").animate({
      height: this.meatQuality
    },500);
  }

  updateListenData(){
     let currentData:any ={};
     currentData["ver"] = '0.1';
     currentData["ph"] = this.ph;
     currentData["eCond"] = this.electric;
     currentData["res"] = this.meatQuality;

     this.homeLoading('show');
     this.SignRcdTxAndSend(currentData);
  }

  SignRcdTxAndSend(rcdData) {
    var that = this;
    var fromAddress = that.testWalletAccount.address;
    var privateKey = that.testWalletAccount.privatekey;
    var signOfrcdData = Wallet.signatureData(rcdData, privateKey);

    console.log("send record tx with signature from address..." + rcdData, privateKey, signOfrcdData, fromAddress);

    //应该还是要序列化，否则json的字符要多占空间
    //construct the record transaction data
    var jsonObj = {data:rcdData, fromAddress:fromAddress, signature:signOfrcdData};
    var jsonStr = JSON.stringify(jsonObj);

    that.sendRcdTransactionData(jsonStr);
  };

  sendRcdTransactionData($rcdTxData) {
    var that = this;
    var host = that.walletApp.hostInfo[that.walletApp.hostSelectIndex];

    Wallet.SendRcdTransactionData($rcdTxData, host, (function (res) {
      console.log(res);
      that.homeLoading("hide");

      if (res.Desc == "SUCCESS") {
        //var txhash = ab2hexstring(reverseArray(hexstring2ab(Wallet.GetTxHash($rcdTxData))));
        var errCode = res.Error;
        if(errCode == 0) {
          console.log("sendRcdTx success! tx hash is " + res.Result);
          that.homeToastTop("数据上传成功");
        } else {
          console.log("sendRcdTx failed! error code is " + errCode);
          that.homeToastTop("数据上传失败");
        }
      }else{
        that.homeToastTop("数据上传失败");
      }
    }), (function (err) {
      that.homeToastTop(err);
      return null;
    }));

  };

  WalletSendRcdTransactionData(){

  }

}
