/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="../dist/index.d.ts"/>
import chai = require('chai'); 
import rabbitRx = require('../dist/index');
var expect = chai.expect;

const RABBIT_URI = process.env.npm_config_RABBIT_URI || process.env.npm_package_config_RABBIT_URI;

describe("connect to rabbit and listen events",  () => {

	it("fail to read with wrong url",  (done) => {
		var opts = {uri : null, socketType: rabbitRx.SocketType.SUB, queue : "test"};
		var sub = new rabbitRx.RabbitSub(opts);
		var disposable = sub.connect();		
		sub.stream.subscribeOnError((err) => {
			expect(err).has.property("code");
			expect(err.code).to.eql("ECONNREFUSED");
			disposable.dispose();
			done();
		});																															
	})
	
	it("success to connect with valid url",  (done) => {
		var opts = {uri : RABBIT_URI, socketType: rabbitRx.SocketType.SUB, queue : "test"};
		var sub = new rabbitRx.RabbitSub(opts);
		var disposable = sub.connect();
		//on connection stream subscribe is nto invoked	
		/*	
		sub.stream.subscribe((val) => {
			expect(val, "first notification value is null, connection estabilished").to.be.null
			done();
		}, (err) => console.log(err), () => console.log("111"));
		*/																															
	})		
		
	it.only("pub message",  (done) => {
		
		var optsPub = {uri : RABBIT_URI, socketType: rabbitRx.SocketType.PUB, queue : "test"};				
		var pub = new rabbitRx.RabbitPub(optsPub);
				
		var disposable = pub.connect();

		pub.stream.subscribeOnNext((val) => {		
			pub.write({test : false})
			.concat(pub.write({test : true}))
			.delay(1000) //can't determine when write completed, https://github.com/squaremo/rabbit.js/issues/55 
			.subscribeOnCompleted(() => {			
				disposable.dispose();
				done();
			})						
		});																															
																																							
	})
	
	
		
}) 
