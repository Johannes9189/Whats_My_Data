//Modules
const http = require("http")
const https = require('https')
const request = require('request');
const express = require('express')();
const path = require('path');
const cheerio = require("cheerio");
var fs = require('fs');
const { Console } = require("console");
const PageHtmlPath = path.join(__dirname, '/index.html')
//Vals
const options = {
    JSON: true
}
const port = 80

async function FetchData(Res2, Ip){
    var self = this;
    self.Response = false
    const promise = new Promise((resolve, reject) => {
        http.get("http://ip-api.com/json/" + Ip, res => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });

            res.on("end", () => {
                self.Data = data
                self.Response = true
                resolve(self.Data)
            });
        })
    })
    await promise;
    return self.Data
}
function GetIp(req){
    req.headers['x-forwarded-for']?.split(',').shift()
    let Ip = req.socket?.remoteAddress
    if (Ip == "::1"){
        Ip = ""
    }
    return Ip
}
express.listen(port, () => {
  console.log(`Server app listening on port ${port}`)
})
express.get('/', function(req, res) {
    //Get Client Info
    let ClientIP = GetIp(req)
    console.log(ClientIP + " Connected to site")
    FetchData(res, ClientIP).then(function(Client_Data_Str){
        let Client_Data_Json = JSON.parse(Client_Data_Str)
        //Prepare Html File
        let FilePath = path.join(__dirname,'/index.html')
        let IndexHtmlStr = fs.readFileSync(FilePath).toString()
        let $ = cheerio.load(IndexHtmlStr)
        //Map
        let Lat = Client_Data_Json.lat
        let Lon = Client_Data_Json.lon
        let RequestUrl = "https://cache.ip-api.com/" + Lon + ","+ Lat +",10"
        
        //Edit html 
        $('#Location_Map').text('background-image',RequestUrl);
        $('p.Client_Ip').text('IP: ' + Client_Data_Json.query)
        $('p.Client_Country').text('Country: ' + Client_Data_Json.country)
        $('p.Client_City').text('City: ' + Client_Data_Json.city)
        $('p.Client_Zip').text('Zip: ' + Client_Data_Json.zip)
        $('p.Client_Isp').text('Isp: ' + Client_Data_Json.isp)  
        $('p.Client_Org').text('Org: ' + Client_Data_Json.org)
        $('p.Client_As').text('As: ' + Client_Data_Json.as)
        //Send client html content
        res.send($.html());
    })
});