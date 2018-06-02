import { Component } from '@angular/core';

/*import { AboutPage } from '../about/about';*/
/*import { ContactPage } from '../contact/contact';*/
import { MinePage} from "../mine/mine";
import { HomePage } from '../home/home';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = MinePage;
  /*tab3Root = ContactPage;*/

  constructor() {

  }
}
