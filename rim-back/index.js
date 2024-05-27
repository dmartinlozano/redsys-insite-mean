const express = require('express');
const app = express();
const cors = require('cors') 
const bodyParser = require('body-parser')

//TODO to be changed:
const port = 3000;
const CORS_FRONT_VALID = ['http://localhost:8080'];
const DS_MERCHANT_MERCHANTCODE = "999008881";
const DS_MERCHANT_TERMINAL = "001";
const DS_MERCHANT_MERCHANTURL = "http://www.prueba.com/urlNotificacion.php";
const DS_MERCHANT_ORDER = Array.from({ length: 20 }, () => Math.floor(Math.random() * 10)).join(''); //This parameter allways to be unique in PRO.
const REDSYS_PAY = "https://sis-t.redsys.es:25443/sis/realizarPago"; //https://sis.redsys.es/sis/realizarPago in PRO

const redsysService = require('./redsys-service');

app.use(cors({origin : CORS_FRONT_VALID}));
const jsonParser = bodyParser.json()
 
// create application/x-www-form-urlencoded parser
//var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.get('/info', (req, res) => {
  res.send({"Ds_Merchant_MerchantCode": DS_MERCHANT_MERCHANTCODE, "Ds_Merchant_Terminal": DS_MERCHANT_TERMINAL, "Ds_Merchant_Order": DS_MERCHANT_ORDER});
});

app.post('/preAuth', jsonParser, async (req, res) => {
  try{
    let base = {
      DS_MERCHANT_ORDER: req.body.order,
      DS_MERCHANT_AMOUNT: req.body.amount,
      DS_MERCHANT_CURRENCY: "978",
      DS_MERCHANT_MERCHANTCODE: DS_MERCHANT_MERCHANTCODE,
      DS_MERCHANT_TERMINAL: DS_MERCHANT_TERMINAL,
      DS_MERCHANT_TRANSACTIONTYPE: "0",
      DS_MERCHANT_IDOPER: req.body.idOper
    }
    let data = Object.assign({}, base, {DS_MERCHANT_EMV3DS:{threeDSInfo: "CardData"}});
    let preAuth = await redsysService.startPetition(data);
    if (preAuth && preAuth.Ds_Card_PSD2 && preAuth.Ds_Card_PSD2 === "Y"){  
      let data2 = Object.assign({}, base, {DS_MERCHANT_EMV3DS:{threeDSInfo: "CardData"}, DS_MERCHANT_EXCEP_SCA: "Y"});
      await redsysService.startPetition(data2);
      console.log("psd2 done");
    }
    console.log("preAuth done");
    res.send(preAuth);
  }catch(err){
    res.status(500);
    res.send(err);
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});