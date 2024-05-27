import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { InSiteFormJSON, Info } from './interfaces';

declare function storeIdOper(event: any, token: string, errorCode: string, val: any): any;
declare function getInSiteFormJSON(insiteJSON: any): any;

export enum PaymentViewProcess {
  INIT= "INIT",
  CHALLENGE= "CHALLENGE",
  DONE="DONE"
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  viewProcess: PaymentViewProcess = PaymentViewProcess.INIT;
  paymentInsiteErrorText: string = "";
  idOper: string = "";
  order: string = "";
  threeDSMethodNotificationUrl: string = "";
  challengeNotificationUrl: string = "";

  @ViewChild('amount') amount!: ElementRef;

  constructor(
    private httpClient: HttpClient
  ){}

  async accept(){
    //TODO amount debe convertirse de valor 1.2345,67€ a 12345,67:
    //let initData: Info = await this.httpClient.post<Info>(environment.backUrl + "/info", {amount:this.amount.nativeElement.value}).toPromise();
    let initData: Info = await this.httpClient.get<Info>(environment.backUrl + "/info").toPromise();
    this.order = initData.Ds_Merchant_Order;
    const insiteJSON = <InSiteFormJSON>{
      id : "card-form",
      fuc : initData.Ds_Merchant_MerchantCode,
      terminal : initData.Ds_Merchant_Terminal,
      order : this.order,
      estiloInsite : "twoRows"
    };
    getInSiteFormJSON(insiteJSON);
    // getInSiteForm(
    //   'card-form', 
    //   'background-color:#d81e05; width:100%; border-top-left-radius:60px; border-top-right-radius:60px; border-bottom-left-radius:60px; border-bottom-right-radius:60px; height:50px; font-size:20px', 
    //   '', 
    //   '', 
    //   '', 
    //   'Pagar', 
    //   initData.Ds_Merchant_MerchantCode, 
    //   initData.Ds_Merchant_Terminal, 
    //   initData.Ds_Merchant_Order, 
    //   'ES', 
    //   true
    // );
  }

  //used by redsys iframe to show result
  @HostListener('window:message', ['$event'])
  async onMessage(event: any) {
    var _this = this;
    if (event.data && event.data === "merchantValidation") {
      _this.paymentInsiteErrorText = "";
      storeIdOper(event, "token", "errorCode", () => { return true; });
    } else if (event.data && event.data.idOper && event.data.idOper !== "-1" && event.data.idOper !== "Error") {
      this.idOper = event.data.idOper;
      await _this.startInsite();
    } else if (event.data && event.data.idOper && (event.data.idOper === "-1" || event.data.idOper === "Error")) {
      this.paymentInsiteErrorText = "idOper === -1 or Error";
    } else if (event.data && event.data.error) {
      this.paymentInsiteErrorText = event.data.error;
      //Not open custom error, error solved by used.
    }else if (event.data && event.data.redsysError){
      this.paymentInsiteErrorText = event.data.redsysError;
    }else if (event.data && event.data.redsysError && event.data.redsysError === null){
      //payment done
    }
  }

  async startInsite() {
    try {
      //TODO amount debe convertirse de valor 1.2345,67€ a 12345,67:
      let amount = this.amount.nativeElement.value;
      //preAuth
      let preAuth = await this.httpClient.post(environment.backUrl + "/preAuth",{order: this.order, amount: amount, idOper: this.idOper}).toPromise();
      console.log(preAuth);
    //   if (preAuth && preAuth.Ds_EMV3DS && preAuth.Ds_EMV3DS.threeDSMethodURL) {
    //     //3ds method required
    //     this.threeDSMethodData.nativeElement.value = btoa(JSON.stringify({
    //       threeDSServerTransID: preAuth.Ds_EMV3DS.threeDSServerTransID,
    //       threeDSMethodNotificationURL: this.threeDSMethodNotificationUrl
    //     }));
    //     this.threeDSMEthodForm.nativeElement.action = preAuth.Ds_EMV3DS.threeDSMethodURL;
    //     this.threeDSMEthodForm.nativeElement.submit();
    //     this.checkInsiteStatus();
    //   } else {
    //     await this.auth();
    //   }
    } catch (err: any) {
      if (err && err.error && err.error.errorCode != null){
        console.error("Error redsys en fase -preauth-: "+err.error.errorCode);
        alert("Error redsys en fase -preauth-: "+err.error.errorCode);
      }
    }
  }


}
