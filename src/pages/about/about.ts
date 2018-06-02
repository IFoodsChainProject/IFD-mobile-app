///<reference path="../../js/jquery.d.ts"/>
///<reference path="../../js/buffer.d.ts"/>
///<reference path="../../js/transaction.d.ts"/>
///<reference path="../../js/sql.d.ts"/>
///<reference path="../../js/wallet.d.ts"/>

import { Component } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ToastController } from 'ionic-angular';
import { LoadingController } from "ionic-angular";
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/toPromise';
import { ModalController } from 'ionic-angular';
import { TransferConfirmModalPage} from "../transfer-confirm-modal/transfer-confirm-modal";
import { App } from "ionic-angular";
import { Device } from '@ionic-native/device';
import { NavController} from "ionic-angular";

/*import { FileChooser } from "@ionic-native/file-chooser";
import { SQLite,SQLiteObject } from '@ionic-native/sqlite';*/
/*import { IOSFilePicker } from '@ionic-native/file-picker';
import { File } from '@ionic-native/file';*/

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})

@Injectable()

export class AboutPage {
  constructor(private http:HttpClient,public toastCtrl: ToastController,public loadingCtrl: LoadingController,public modalCtrl: ModalController,public appCtrl: App,private device: Device,public navCtrl: NavController/*private filePicker: IOSFilePicker,private file: File*/   /*,private fileChooser: FileChooser,private sqlite: SQLite*/) {
      this.Device = this.device.platform;
      let version = this.device.version;
      console.log(this.Device);
      console.log(version);
  }
  Device:any;

  openWalletContainer = 'show'; //打开钱包模块
  WalletMainInfoBox = 'hide'; //转账信息模块
  showContentPw = 'hide'; //输入钱包密码模块
  unlock = 'hide'; //解密按钮
  transferAccountModal:any = 'hide'; //转账模块

  loading:any; //loading加载
  filePassword:any; //钱包密码
  accountsAddress:any; //账户地址
  myAssetBox:any; // 我的资产模块

  receiverAddress:any; // 接收方地址
  receiverAmount:any; // 发送数量

  txData:any;
  tx:any;

  walletApp:any = {
    'hostSelectIndex':0,
    'langSelectIndex':0,
    'hostInfo':[],
    'apiUrl':[],
    'txTypes':[],
    'version':'',
    'desktopVersion':'',
    'bbsUrl':'',
    'nodeHeight':'0',
    'coins':[],
    'accounts':[],
    'accountSelectIndex':0,
    'txType':'128',
    'walletType':'fileupload',
    'Transaction':{
      ToAddress: "",
      Amount: "",
      able:true
    },
    'txUnsignedData':'',
    'coinSelectIndex':0,
    'topWallet':'',
    'txModify':true
  };

  ionViewDidLoad(){
    var that = this;
    this.http.get('assets/conf/wallet-conf.json').subscribe(dataObject =>{
      console.log(dataObject);
      let data:any = dataObject;

      that.walletApp.hostInfo = data.host_info[0];

      that.walletApp.hostSelectIndex = Math.floor(Math.random() * (that.walletApp.hostInfo.length));

      that.walletApp.apiUrl = data.api_url;

      that.walletApp.txTypes = data.tx_types[that.walletApp.langSelectIndex];

      that.walletApp.projectName = data.project_name;
      that.walletApp.version = data.version;
      that.walletApp.desktopVersion = data.desktop_version;
      that.walletApp.domain = data.domain;
      that.walletApp.bbsUrl = data.bbs_url;

      that.walletApp.explorerUrl = data.explorer_url;
      that.walletApp.explorerSearchPath = data.explorer_search_path;

      // 连接服务器节点
      that.connectNode();
    },res=>{
      that.walletToast(res);
    })

    setInterval(function () {
      let account = that.walletApp.accounts[that.walletApp.accountSelectIndex];
      if (account) {
        if (account.address != "") {
          that.getUnspent(account.address);
        }
      }
    },10000)

  }

  ionViewDidEnter(){

  }

  showTransferModule(){
    this.WalletMainInfoBox = 'hide';
    this.transferAccountModal = 'show';
  }

  openFileDialog(){
    $("#updateFile").trigger("click");
  }

  showContentT(onChangeEvent) {
    var that = this;

    var file = (onChangeEvent.srcElement || onChangeEvent.target).files[0];

    var reader = new FileReader();

    that.loading = this.loadingCtrl.create({
      content: 'Please wait...',
      spinner: 'ios'
    });

    if(typeof FileReader==="undefined"){
        that.walletToast("您的手机不支持文件读取");
    }else {
      reader.onloadstart = function () {
        that.loading.present();
      }

      reader.onloadend = function () {
        that.loading.dismiss();
      }

      reader.onload = function(onLoadEvent){

        var Uints = new Uint8Array(reader.result);

        var db:any = window;
        var ss = new db.SQL.Database(Uints)

        try{
          var res = ss.exec("SELECT * FROM Key");
        }
        catch(e){
          that.walletLoading('hide');
          that.walletToast("文件格式错误，请导入正确的钱包文件");
          return false;
        }

        var passwordHash = new Uint8Array(32);
        var iv = new Uint8Array(16);
        var masterKey = new Uint8Array(32);
        for (var i = 0; i < res[0].values.length; i++) {
          if (res[0].values[i][0] == 'PasswordHash') {
            passwordHash = res[0].values[i][1];
          } else if (res[0].values[i][0] == 'IV') {
            iv = res[0].values[i][1];
          } else if (res[0].values[i][0] == 'MasterKey') {
            masterKey = res[0].values[i][1];
          }
        }

        res = ss.exec("SELECT * FROM Account");
        var publicKeyHash = [];
        var privateKeyEncrypted = [];
        for (var x = 0; x < res[0].values.length; x++) {
          for (var j = 0; j < res[0].values[x].length; j++) {
            if (j == 0) {
              publicKeyHash[x] = res[0].values[x][j];
            }
            if (j == 1) {
              privateKeyEncrypted[x] = res[0].values[x][j];
            }
          }
        }

        var wallet = new Wallet(passwordHash, iv, masterKey, publicKeyHash, privateKeyEncrypted);

        console.log(wallet);

        that.walletApp.topWallet = wallet;
        that.showContentPw = 'show';
      }

      reader.onerror = function (e) {
        that.walletToast(e.message);
      }

      reader.readAsArrayBuffer(file);

    }

  }

  onFilePassChange =function (event) {
    this.filePassword = this.walletPassword;
    if(this.filePassword){
      this.unlock = 'show';
    }else {
      this.unlock = 'hide';
    }
  }

  decryptWallet(){
    var that = this;
    that.walletLoading('show');
    let ret:any = Wallet.decryptWallet( that.walletApp.topWallet, this.filePassword );
    console.log(ret);

    if (ret == -1) {
      that.walletLoading('hide');
      that.walletToast("密码验证失败");
    } else if (ret == -2) {
      that.walletLoading('hide');
      that.walletToast("账户验证失败");
    } else {
      that.walletLoading('hide');
      that.walletToast('成功解密您的钱包');
      that.walletApp.accounts = ret;

      /*$("#openWalletBox").hide();*/
      that.openWalletContainer = 'hide';

      /*$("#showWalletMainPaper").show();*/
      that.WalletMainInfoBox = 'show';

     /* $(".accountsAddress").text(that.walletApp.accounts[0].address);*/

      that.accountsAddress = that.walletApp.accounts[0].address;
      console.log(that.accountsAddress);

      // get unspent coins
      that.getUnspent(that.accountsAddress);
      console.log(that.walletApp.apiUrl);

    }
  }

  openTransferModal(){
    var that = this;
    console.log(that.receiverAmount);
    that.walletApp.Transaction.ToAddress = that.receiverAddress;
    that.walletApp.Transaction.Amount = that.receiverAmount;
    console.log(that.walletApp.Transaction);

    if (this.walletApp.txType == '128') {
      if (this.walletApp.walletType == 'externalsignature') {
        that.txData = this.walletApp.txUnsignedData;
      } else {
        /* 执行代码 */
        this.txData = this.transferTransactionUnsigned();

      }
      if (that.txData == false) return;

      that.tx = this.getTransferTxData(this.txData);
      console.log(that.tx);
      this.walletApp.AssetNumber =  this.ab2hexstring(this.reverseArray(that.tx.outputs[0].assetid));
    }else {
      return;
    }

    this.openWalletContainer = 'show';
    this.WalletMainInfoBox = 'hide';
    this.showContentPw = 'hide';
    this.unlock = 'hide';
    this.transferAccountModal = 'hide';

    this.appCtrl.getRootNav().push(TransferConfirmModalPage,{
      toAddress:that.receiverAddress,
      assetAmount:that.receiverAmount,
      assetName:that.walletApp.coins[0].AssetName.toLocaleUpperCase(),
      assetNumber:that.walletApp.AssetNumber,
      myAddress:that.accountsAddress,
      connectingNode:that.walletApp.hostInfo[that.walletApp.hostSelectIndex].hostName,
      hostProvider:that.walletApp.hostInfo[that.walletApp.hostSelectIndex].hostProvider,
      walletApp:that.walletApp,
      txData:that.txData
    })

  }

  getTransferTxData($txData){
    var ba = new Buffer($txData, "hex");
    var tx = new Transaction();
    var k = 2;

    // Transfer Type
    if (ba[0] != 0x80) return;
    tx.type = ba[0];

    // Version
    tx.version = ba[1];

    // Attributes
    if (ba[k] !== 0) {
      k = k + 2 + ba[k + 2];
    }

    // Inputs Length
    k = k + 1;
    let len = ba[k];
    if (ba[k] < 253) {
      len = ba[k];
    } else if (ba[k] === 253) {
      len = WalletMath.hexToNumToStr(this.ab2hexstring(this.reverseArray(ba.slice(k + 1, k + 3))));
      k += 2;
    } else if (ba[k] === 254) {
      len = WalletMath.hexToNumToStr(this.ab2hexstring(this.reverseArray(ba.slice(k + 1, k + 5))));
      k += 4;
    } else { // 255
      len = WalletMath.hexToNumToStr(this.ab2hexstring(this.reverseArray(ba.slice(k + 1, k + 9))));
      k += 8;
    }

    // Inputs
    for (let i = 0; i < len; i++) {
      tx.inputs.push({
        txid: ba.slice(k + 1, k + 33),
        index: ba.slice(k + 33, k + 35)
      });
      k = k + 34;
    }

    // Outputs
    k = k + 1;
    len = ba[k];

    for (let i = 0; i < len; i++) {
      tx.outputs.push({
        assetid: ba.slice(k + 1, k + 33),
        value: ba.slice(k + 33, k + 41),
        scripthash: ba.slice(k + 41, k + 61),
        lockTime : ba.slice(k + 61, k + 65)
      });
      k = k + 64;
    }

    return tx;
  }

  transferTransactionUnsigned(){
    var that = this;
    var reg = /^[0-9]{1,19}([.][0-9]{0,8}){0,1}$/;
    var r = that.walletApp.Transaction.Amount.match(reg);
    if (r == null) {
      console.log("数额格式检查失败");
      /*  $scope.notifier.warning($translate.instant('NOTIFIER_AMOUNT_FORMAT_CHECK_FAILED')); */
      return false;
    }

    if (that.walletApp.Transaction.Amount <= 0) {
      console.log("数额必须大于零");
      /* $scope.notifier.warning($translate.instant('NOTIFIER_AMOUNT_MUST_GREATER_ZERO')); */
      return false;
    }

    if (parseFloat(that.walletApp.coins[that.walletApp.coinSelectIndex].balance) < parseFloat(that.walletApp.Transaction.Amount)) {
      /* $scope.notifier.danger($translate.instant('NOTIFIER_NOT_ENOUGH_VALUE') + ", " + $translate.instant('ASSET') + ": " + walletApp.coins[walletApp.coinSelectIndex].AssetName + ", " + $translate.instant('BALANCE') + ": <b>" + walletApp.coins[walletApp.coinSelectIndex].balance + "</b>, " + $translate.instant('NOTIFIER_SEND_AMOUNT') + ": <b>" + walletApp.Transaction.Amount + "</b>"); */

      console.log("没有足够的余额进行转账");
      return false;
    }

    var publicKeyEncoded = that.walletApp.accounts[that.walletApp.accountSelectIndex].publickeyEncoded;
    var txData = Wallet.makeTransferTransaction(that.walletApp.coins[that.walletApp.coinSelectIndex], publicKeyEncoded, that.walletApp.Transaction.ToAddress, that.walletApp.Transaction.Amount);
    if (txData == -1) {
      /* $scope.notifier.danger($translate.instant('NOTIFIER_ADDRESS_VERIFY_FAILED')); */
      console.log("地址验证失败");
      return false;
    }

    that.walletApp.txUnsignedData = txData;
    return txData;
  }

  getUnspent = function ($address) {
    var that = this;
    var host = that.walletApp.hostInfo[this.walletApp.hostSelectIndex];
    console.log(host);

    that.GetUnspent($address, host, that.GetUnspent_Callback, that.catchProblem);

  };

  GetUnspent($address, $host, $callback, $callbackDev){
    var url = $host.restapi_host + ':' + $host.restapi_port + '/api/v1/asset/utxos/' + $address;
    this.http.get(url).subscribe(data=>{
      console.log(data);
      this.GetUnspent_Callback(data);
    },error =>{
      console.log(error.message);
      this.catchProblem(error);
    })
  }

  GetUnspent_Callback = function (res) {
    var that = this;
    that.walletApp.coins = Wallet.analyzeCoins(res, that.walletApp.nodeHeight);
    console.log(that.walletApp.coins);

    if (that.walletApp.coins.length == 0) {
      that.myAssetBox = 'hide';
    } else if (that.walletApp.coins.length == 1) {
      that.myAssetBox = 'show';
      that.balanceViewFormatAvaliable = that.walletApp.coins[0].balanceViewFormat;
      that.AssetNameAvaliable = that.walletApp.coins[0].AssetName.toLocaleUpperCase();
    } else {
      that.myAssetBox = 'show';
    }

    if (that.walletApp.coins.length > 0) {
      if (that.walletApp.coins[0].balanceLockViewFormat === 0) {
        that.myAssetLockBox = 'hide';
      } else {
        that.myAssetLockBox = 'show';
        that.balanceViewFormatLock = that.walletApp.coins[0].balanceLockViewFormat;
        that.AssetNameLock = that.walletApp.coins[0].AssetName.toLocaleUpperCase();
      }
    }
  };

  catchProblem = function ($err) {
    this.walletToast($err);
  };

  walletLoading(res){
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

  walletToast(response){
    let toast = this.toastCtrl.create({
      message: response,
      duration: 3000,
      position: 'top'
    });
    toast.present();
  }

  connectNode = function () {
    var host = this.walletApp.hostInfo[this.walletApp.hostSelectIndex];
    this.walletApp.addressBrowseURL = host.webapi_host + ':' + host.webapi_port;
    console.log(host,this.walletApp.addressBrowseURL);

    this.GetNodeHeight(host,this.getNodeHeight_Callback, this.connectedNodeErr);
  };

  GetNodeHeight($host, $callback, $callbackDev){
    var url =  $host.restapi_host + ':' + $host.restapi_port + '/api/v1/block/height?auth_type=getblockheight';
    this.http.get(url).subscribe(data=>{
      console.log(data);
      let res:any = data;

      if (res.Desc == "SUCCESS") {
        if (res.Error == '0') {
          this.getNodeHeight_Callback(res);
        }
      }

    },error=>{
      this.connectedNodeErr(error);
    })
  }

  getNodeHeight_Callback(res){
    var that = this;
    that.walletApp.nodeHeight = res.Result;
    var curDate = new Date();
    that.walletApp.getNodeHeightLastTime= that.DateFormat(curDate,'yyyy-MM-dd hh:mm:ss');
    /*this.walletApp.getNodeHeightLastTime = (new Date()).Format('yyyy-MM-dd hh:mm:ss');*/

    var connectInfo = "节点连接成功，节点高度："+that.walletApp.nodeHeight+",节点连接时间："+that.walletApp.getNodeHeightLastTime;
    let toast = this.toastCtrl.create({
      message: connectInfo,
      duration: 5000,
      position: 'bottom'
    });
    toast.present();

    /*console.log("节点连接成功，节点高度："+walletApp.nodeHeight+",节点连接时间："+walletApp.getNodeHeightLastTime);*/
  }

  connectedNodeErr(error){
    this.walletToast(error);
  }

  // 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
  DateFormat(dates,fmt) { //author: meizz
    var o = {
      "M+": dates.getMonth() + 1, //月份
      "d+": dates.getDate(), //日
      "h+": dates.getHours(), //小时
      "m+": dates.getMinutes(), //分
      "s+": dates.getSeconds(), //秒
      "q+": Math.floor((dates.getMonth() + 3) / 3), //季度
      "S": dates.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (dates.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
      if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
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

  transferGoBack(){
     this.transferAccountModal = 'hide';
     this.WalletMainInfoBox = 'show';
  }


}
