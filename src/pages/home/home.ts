import { Component  } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BLE} from "@ionic-native/ble";
import { ToastController } from 'ionic-angular';
import { LoadingController } from "ionic-angular";
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';
import { Device } from '@ionic-native/device';
import { ChangeDetectorRef } from '@angular/core';

declare var $:any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {

  constructor(public navCtrl: NavController,private ble: BLE,public toastCtrl: ToastController,public loadingCtrl: LoadingController,private bluetoothSerial: BluetoothSerial,private device: Device,public cd: ChangeDetectorRef) {
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
  electric:number = 0; //导电度申明
  ph:any = '0'; //ph值申明
  meatQuality:any = '50%'; // 肉质测试数据
  connectBle:any = 'no'; //判断是否连接蓝牙
  loading:any; //页面加载loading

  devices:any = []; /*=[
    {
      'name': 'demo1',
      'id': '00:1A:7D:DA:71:13',
      'advertising': ArrayBuffer,
      'rssi': -37
    },
    {
      'name': 'demo2',
      'id': '00:1A:7D:DA:71:13',
      'advertising': ArrayBuffer,
      'rssi': -44
    },
    {
      'name': 'demo3333',
      'id': '00:1A:7D:DA:71:13',
      'advertising': ArrayBuffer,
      'rssi': -88
    },
    {
      'name': 'demo3333',
      'id': '00:1A:7D:DA:71:13',
      'advertising': ArrayBuffer,
      'rssi': -88
    },
    {
      'name': 'demo3333',
      'id': '00:1A:7D:DA:71:13',
      'advertising': ArrayBuffer,
      'rssi': -88
    },
    {
      'name': 'demo3333',
      'id': '00:1A:7D:DA:71:13',
      'advertising': ArrayBuffer,
      'rssi': -88
    }
  ]*/

  ionViewDidLoad(){
    var that = this;

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
        console.log(stopScandata);
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


            that.bluetoothSerial.subscribeRawData().subscribe(
              dataBuffer=>{
                console.log("收到数据")
                console.log(dataBuffer);
                let newBuffer = String.fromCharCode.apply(null, new Uint8Array(dataBuffer))
                console.log(newBuffer);

                $(".r_c").animate({
                  height: "50%"
                },1000);

                that.bluetoothSerial.read().then(reciveData=>{
                  console.log("ph值："+reciveData);
                  that.ph = reciveData;
                  that.cd.detectChanges();
                }).catch(error=>{
                  that.homeToastTop('ph读取失败');
                })
              },error=>{
                console.log("串行数据未收到");
              }
            )
          },
          error => {
            console.log(error);
            that.homeLoading('hide');
            that.homeToastTop('连接失败请重试');
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

}
