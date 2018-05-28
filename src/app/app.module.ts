import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { HttpClientModule} from "@angular/common/http";
import { MyApp } from './app.component';

import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { TransferConfirmModalPage } from '../pages/transfer-confirm-modal/transfer-confirm-modal';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { FileChooser} from "@ionic-native/file-chooser";
import { SQLite } from "@ionic-native/sqlite";

@NgModule({
  declarations: [
    MyApp,
    AboutPage,
    ContactPage,
    HomePage,
    TabsPage,
    TransferConfirmModalPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp,{
      tabsHideOnSubPages:'true', //隐藏全部子页面
      backButtonText:"关闭", //子页面头部返回文字
      swipeBackEnabled:'true', //是否启用ios轻扫返回功能
      tabsHighlight:'false' //选择时是否在选项卡下显示高光线
    }),
    HttpClientModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AboutPage,
    ContactPage,
    HomePage,
    TabsPage,
    TransferConfirmModalPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    FileChooser,
    SQLite,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
