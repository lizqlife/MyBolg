/**
 * Created by lizq on 2017/3/28.
 */
var settings=require('../setting');

var DB=require('mongodb').db;

var Connection=require('mongodb').connection;

var Server=require('mongodb').server;

module.exports=new DB(settings.db,new Server(settings.host,Connection.DEFAULT_PORT,{}));
