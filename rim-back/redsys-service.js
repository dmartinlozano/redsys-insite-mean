'use strict';
const CryptoJS = require("crypto-js");
const axios = require('axios');

const REDSYS_KEY_COMMERCE = "sq7HjrUOBfKmC576ILgskD5srU870gJ7";
const REDSYS_INIT_URL = 'https://sis-t.redsys.es:25443/sis/rest/iniciaPeticionREST';
const REDSYS_REST_URL = 'https://sis-t.redsys.es:25443/sis/rest/trataPeticionREST';

const DS_SIGNATUREVERSION = "HMAC_SHA256_V1";

//https://es.stackoverflow.com/questions/80124/redsys-con-nodejs-y-cryptojs
module.exports.createMerchantSignature = function(ds_MerchantParameters){
    let merchantWordArray = CryptoJS.enc.Utf8.parse(JSON.stringify(ds_MerchantParameters));
    let merchantBase64 = merchantWordArray.toString(CryptoJS.enc.Base64);
    let keyWordArray = CryptoJS.enc.Base64.parse(REDSYS_KEY_COMMERCE);
    let iv = CryptoJS.enc.Hex.parse("0000000000000000");
    let cipher = CryptoJS.TripleDES.encrypt(ds_MerchantParameters.DS_MERCHANT_ORDER, keyWordArray, {
        iv:iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.ZeroPadding
    });
    let signature = CryptoJS.HmacSHA256(merchantBase64, cipher.ciphertext);
    let signatureBase64 = signature.toString(CryptoJS.enc.Base64);
    return signatureBase64;
}
module.exports.startPetition = function(ds_MerchantParameters){
    console.log("startPetition:");
    console.log(ds_MerchantParameters);
    return new Promise(async function(resolve, reject) {
        try{
            let body = {
                Ds_MerchantParameters: Buffer.from(JSON.stringify(ds_MerchantParameters)).toString('base64'), 
                Ds_SignatureVersion: DS_SIGNATUREVERSION, 
                Ds_Signature: module.exports.createMerchantSignature(ds_MerchantParameters)
            };
            console.log("body");
            console.log(body);
            let result = await post(REDSYS_INIT_URL, body);
            if (result && result.errorCode){
                reject({errorCode: result.errorCode});
            }else{
                if (result && result.Ds_MerchantParameters){
                    let merchant = JSON.parse(Buffer.from(result.Ds_MerchantParameters, 'base64').toString());
                    resolve(merchant);
                }else{
                    reject(result);
                }
            }
        }catch(err){
            reject(err);
        }
    });
}

function post (urlPost, body){
	return new Promise((resolve,reject)=>{
		axios.post(urlPost, body).then(function (response) {
			resolve(response.data);
		}).catch(function (error) {
			reject(error);
		});
	});
}