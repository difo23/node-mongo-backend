'use strict';

//TO-DO: terminar de codificar el tratamiento de errores
/**
 * Crea un modulo de node.js con el que se puede acceder a la base de datos de Mongo DB.
 *
 * @param connectionURL
 * @returns {{openConnection: Function, closeConnection: Function, insert: Function, update: Function, remove: Function, find: Function}}
 */
module.exports = function(connectionURL){
  let MongoClient = require('mongodb').MongoClient;
  let url = connectionURL ? connectionURL : 'mongodb://localhost:27017/ministerio';
  let connection = null;

  return{
    /**
     * Abre una conexion a la base de datos.
     *
     * @param callback se ejecuta cuando se haya abierto la conexion.
     */
    openConnection: function(callback){
      MongoClient.connect(url, function(err, db) {
        console.log("Connected correctly to server.");
        connection = db;
        callback(db);
      });
    },

    //TO-DO: ¿¿¿incluir tambien un callback cuando cerramos la conexion???
    /**
     * Cierra la conexion a la base de datos
     */
    closeConnection: function(){
      if(connection){
        connection.close();
        console.log("Connection closed.");
      }
      else{
        console.log("No connection has been opened.");
      }
    },

    /**
     * Inserta registros en la base de datos.
     *
     * @param collection
     * @param data
     * @param callback
     */
    insert: function(collection, data, callback){
      connection.collection(collection).insert(data, function(err, result){
        console.log("Inserted data into collection " + collection + ".");
        if (err)
          throw Error(err);
        callback(result);
      });
    },

    /**
     * Actualiza el primer registro de una tabla que cumpla la condicion indicada.
     *
     * @param collection
     * @param where
     * @param data
     * @param callback
     */
    update: function(collection, where, data, callback){
      connection.collection(collection).update(where, data, function(err, result){
        console.log("Updated data in collection " + collection + ".");
        callback(result);
      });
    },

    /**
     * Actualiza todos registros de una tabla que cumplan la condicion indicada.
     *
     * @param collection
     * @param where
     * @param data
     * @param callback
     */
    updateAll: function(collection, where, data, callback){
      connection.collection(collection).update(where, data, {multi:true}, function(err, result){
        console.log("Updated data in collection " + collection + ".");
        callback(result);
      });
    },

    /**
     * Actualiza registros en la base de datos.
     *
     * @param collection
     * @param where
     * @param data
     * @param callback
     */
    update_or_insert: function(collection, where, data, callback){
      connection.collection(collection).update(where, data, {upsert:true}, function(err, result){
        console.log("Updated data in collection " + collection + ".");
        callback(result);
      });
    },

    /**
     * Elimina registros de la base de datos.
     *
     * @param collection
     * @param where
     * @param callback
     */
    remove: function(collection, where, callback){
      connection.collection(collection).remove(where, function(err, result){
        console.log("Removed data from collection " + collection + ".");
        callback(result);
      });
    },

    /**
     * Busca registros en la base de datos.
     *
     * @param collection
     * @param where
     * @param callback
     */
    find: function(collection, where, callback){
      connection.collection(collection).find(where).toArray(function(err, docs){
        console.log("Find performed on collection " + collection + ".");
        callback(docs);
      });
    }
  }
};
