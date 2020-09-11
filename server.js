#!/usr/bin/env node --harmony

'use strict';

//CONSTANTES
const apiVersion = '0.0.1';
const httpsPort = 3080;
const httpPort = 3443;

const enableHttps = true;
const enableHttp = true;


//MONGO
const mongoDataAccessor = require('./mongoDataAccessor.js');
const mongo = mongoDataAccessor('mongodb://localhost:27017/ministerio');

//EXPRESS
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const crypto = require('crypto');

const dateFormat = require('dateformat');

app.use(bodyParser.json({limit:'20mb'}));

//HTTPS
//TO-DO: ¡Para el servidor de produccion cambiar las claves y el certificado actuales!
const https = require('https');
const fs = require('fs');
const options = {
  key: fs.readFileSync('./https/minetur-nodejs-server-key.pem'),
  cert: fs.readFileSync('./https/minetur-nodejs-server-cert.pem')
};

////////////////////////////// RUTAS /////////////////////////////////


//Peticion del token de seguridad, en un futuro cambiar por envio de sms
app.post('/token', function(req, res){
  console.log("Token required");
  console.log(req.body);
  if ((req.body.imei != null) && (req.body.imsi != null) && (req.body.msisdn != null)) {
    console.log("imsi: " + req.body.imsi + ", imei: " + req.body.imei + ", msisdn: " + req.body.msisdn);
    crypto.randomBytes(32, function(ex, buf) {
      var token = buf.toString('hex');
      console.log("token: "+ token);

      let find = {
        "imsi": req.body.imsi,
        "imei": req.body.imei,
        "msisdn": req.body.msisdn
      };

      let update = {
        "imsi": req.body.imsi,
        "imei": req.body.imei,
        "msisdn": req.body.msisdn,
        "token": token
      };
      mongo.openConnection(function(){
        mongo.update_or_insert('users',find , update, function(){
          console.log('Se ha realizado un insert en la base de datos.');
          mongo.closeConnection();
        });
      });
      res.send(update)
    });
  } else {
    console.log("Peticion de token incorrecta.");
  }
});


//POST
app.post(/*'/api/' + apiVersion + */'/upload', function(req, res){
  console.log('Nueva peticion POST...');
  if ((req.body.imei != null) && (req.body.imsi != null) && (req.body.msisdn != null) && (req.body.token != null)) {
    mongo.openConnection(function() {
      let identifier = {
        "imei": req.body.imei,
        "imsi": req.body.imsi,
        "msisdn": req.body.msisdn        
      }
      mongo.find('users', identifier, function (results) {
        if (results.length == 0) {
          console.log("Intento de carga de un usuario no registrado");
        } else {
          let user = results[0];
          if (user.token != req.body.token) {
            console.log("Intento de carga con token erroneo")
          } else {
            if ((req.body.data != null) && (req.body.data instanceof Array)) {
              let inserts = [];
              let receive_timestamp = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l")
              for (let i = 0; i < req.body.data.length; i++) {
                let insert = {
                  "imei": user.imei,
                  "imsi": user.imsi,
                  "msisdn": user.msisdn,
                  "app_version": req.body.app_version,
                  "send_timestamp": req.body.timestamp,
                  "receive_timestamp": receive_timestamp,
                  "timestamp": req.body.data[i].TimeStamp,
                  "device_software_version": req.body.data[i].deviceSoftwareVersion,
                  "sim_serial_number": req.body.data[i].SIM_serial_number,
                  "network_technology": req.body.data[i].network_technology,
                  "cell_id": req.body.data[i].cell_id,
                  "bsc": req.body.data[i].BSC,
                  "rnc": req.body.data[i].RNC,
                  "e_node_b": req.body.data[i].eNodeB,
                  "area_code": req.body.data[i].area_code,
                  "psc": req.body.data[i].PSC,
                  "pci": req.body.data[i].PCI,
                  "gsm_rx_level": req.body.data[i].GSM_RxLevel,
                  "gsm_rx_quality": req.body.data[i].GSM_RxQuality,
                  "umts_rscp": req.body.data[i].UMTS_RSCP,
                  "umts_rssi": req.body.data[i].UMTS_RSSI,
                  "umts_ecio": req.body.data[i].UMTS_ECIO,
                  "lte_rssi": req.body.data[i].LTE_RSSI,
                  "lte_rsrp": req.body.data[i].LTE_RSRP,
                  "lte_rsrq": req.body.data[i].LTE_RSRQ,
                  "lte_snr": req.body.data[i].LTE_SNR,
                  "lte_cqi": req.body.data[i].LTE_CQI,
                  "plmn": req.body.data[i].PLMN,
                  "network_operator": req.body.data[i].network_operator,
                  "sim_plmn": req.body.data[i].SIM_PLMN,
                  "sim_operator": req.body.data[i].SIM_Operator,
                  "roaming_type": req.body.data[i].roaming_type,
                  "battery_level": req.body.data[i].battery_level,
                  "cpu_usage": req.body.data[i].cpu_usage,
                  "cpu_temp": req.body.data[i].cpu_temp,
                  "signal_level": req.body.data[i].level,
                  "signal_quality": req.body.data[i].quality,
                  "incoming_call_start": req.body.data[i].incoming_call_start,
                  "outgoing_call_start": req.body.data[i].outgoing_call_start,
                  "incoming_pickup_call": req.body.data[i].incoming_pickup_call,
                  "incoming_call_end": req.body.data[i].incoming_call_end,
                  "outgoing_call_end": req.body.data[i].outgoing_call_end,
                  "missed_call": req.body.data[i].missed_call,
                  "call_number": req.body.data[i].number,
                  "latitude": req.body.data[i].latitude,
                  "longitude": req.body.data[i].longitude
                }
                //TO-DO: HACER LAS COMPROBACIONES DE QUE EL FORMATO DEL CUERPO DE LA REQUEST ES CORRECTO
                //TO-DO: FILTRAR LOS DATOS RECIBIDOS Y ACEPTAR SOLO LOS CAMPOS QUE NOSOTROS QUEREMOS
                inserts.push(insert);

              }
              mongo.insert('measurements', inserts, function () {
                console.log('Se ha realizado un insert en la base de datos.');
                mongo.closeConnection();
                //res.json([{status: "200 OK"}]);
                res.sendStatus(200);
              });
            } else {
              console.log("Intento de carga con mal formato de los datos");
            }
          }
        }

      });
    });
  } else {
    console.log("Intento de carga sin credenciales de autentificacion");
  }



});

/*
//PRUEBAS GET
app.get('/api/' + apiVersion + '/upload', function(req, res){
  console.log("Nueva peticion GET...");
  //res.json(200, {'status': 'ok'});
  //res.json(200, { "hello": req.params.name });
  //res.html(200, 'ok');

  mongo.openConnection(function(){
    mongo.find('measurements', {}, function(docs){
      console.log("Resultado de la query: ");
      console.log(docs);
      //mongo.closeConnection();
      res.send('hello world');
    });

    mongo.insert('measurements', [{a: "Hola"}, {b: "Mundo"}], function(){
      mongo.update('measurements', {a: "Hola"}, {$set: {a: "Adios"}}, function(){
        mongo.remove('measurements', {b: "Mundo"}, function(){
          console.log("Terminado.");
          mongo.closeConnection();
        });
      });
    });

  });
});
*/

//SERVIDOR HTTP
if(enableHttp){
  app.listen(httpPort, function(){
    console.log('Servidor HTTP corriendo en el puerto ' + httpPort + '.');
  });
}

//SERVIDOR HTTPS
if(enableHttps){
  https.createServer(options, app).listen(httpsPort, function(){
    console.log('Servidor HTTPS corriendo en el puerto ' + httpsPort + '.');
  });
}
