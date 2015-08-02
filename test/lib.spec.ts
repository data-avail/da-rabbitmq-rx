/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="../dist/index.d.ts"/>
import chai = require('chai'); 
import rabbitRx = require('../dist/index');
var expect = chai.expect;

const RABBIT_URI = process.env.npm_config_RABBIT_URI || process.env.npm_package_config_RABBIT_URI;

describe("connect to rabbit and listen events",  () => {

	it("fail to connect with wrong url",  (done) => {
		var opts = {uri : null, socketType: rabbitRx.SocketType.SUB, queue : "test"};
		var sub = new rabbitRx.RabbitSub(opts);
		sub.read().subscribeOnError((err) => {
			expect(err).has.property("code");
			expect(err.code).to.eql("ECONNREFUSED");
			done();
		});																															
	})
	
	it("success to connect with valid url",  (done) => {
		var opts = {uri : RABBIT_URI, socketType: rabbitRx.SocketType.SUB, queue : "test"};
		var sub = new rabbitRx.RabbitSub(opts);
		sub.read().subscribe((val) => {
			expect(val, "first notification value is null, connection estabilished").to.be.null
			done();
		});																															
	})		
		
	it.skip("pub some message",  (done) => {
		
		var optsPub = {uri : RABBIT_URI, socketType: rabbitRx.SocketType.PUB, queue : "test"};
		var pub = new rabbitRx.RabbitPub(optsPub);
		pub.write({test : true});		
		pub.write({test : false});
		//.subscribe((val) => console.log(val), null, done);
		
		/*
		var optsSub = {uri : RABBIT_URI, socketType: rabbitRx.SocketType.SUB, queue : "test"};
		var optsPub = {uri : RABBIT_URI, socketType: rabbitRx.SocketType.PUB, queue : "test"};
		
		var sub = new rabbitRx.RabbitSub(optsSub);
		var pub = new rabbitRx.RabbitPub(optsPub);		
		
		var pubStream = pub.connect();
		var subStream = sub.connect();
		
		//pubStream.merge(<any>subStream).
		
		.
		.subscribe((val) => {
			console.log(val);
		}, null, done);
		
		pub.connect(optsPub);		
		pub.pub({test : "ok"});
		*/
																																	
	})
	
		
}) 
