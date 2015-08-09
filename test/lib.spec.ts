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
		
	it.skip("connect to valid not existent uri, fail by timeout",  (done) => {
		var opts = {uri : "amqp://1.1.1.1", socketType: rabbitRx.SocketType.SUB, queue : "test"};
		var sub = new rabbitRx.RabbitSub(opts);
		var disposable = sub.connect();		
		sub.stream.subscribeOnError((err) => {
			expect(err).has.property("code");
			expect(err.code).to.eql("ETIMEDOUT");
			disposable.dispose();
			done();
		});																															
	})
	
	it("connect to valid, existent uri, check first message is null",  (done) => {
		var opts = {uri : RABBIT_URI, socketType: rabbitRx.SocketType.SUB, queue : "test"};
		var sub = new rabbitRx.RabbitSub(opts);
		var disposable = sub.connect();		
		sub.stream.subscribe((val) => {
			expect(val).is.null
			disposable.dispose();
			done();
		});																															
	})

	it("connect 2 subscribers to valid, existent uri, check first messages is null",  (done) => {
		var opts = {uri : RABBIT_URI, socketType: rabbitRx.SocketType.SUB, queue : "test"};
		var sub = new rabbitRx.RabbitSub(opts);
		var disposable = sub.connect();		
		var stream1 = sub.stream.map(val => val);
		var stream2 = sub.stream.map(val => val);
		stream1.zip(stream2, (val1, val2) => [val1, val2])
		.subscribe((val) => {
			expect(val).have.lengthOf(2);
			expect(val[0]).is.null;
			expect(val[1]).is.null;
			disposable.dispose();
			done();
		});																															
	})
			
	it("publish message",  (done) => {
		
		var optsPub = {uri : RABBIT_URI, socketType: rabbitRx.SocketType.PUB, queue : "test"};				
		var pub = new rabbitRx.RabbitPub(optsPub);
				
		var disposable = pub.connect();

		var writeDisposable = pub.connectStream.subscribeOnNext((val) => {		
			pub.write({test : false})
			.concat(pub.write({test : true}))		 
			.subscribeOnCompleted(() => {
				writeDisposable.dispose();			
				disposable.dispose();
				done();
			})						
		});																																																																						
	})

	it("publish message, don't wait till connection stream completed",  (done) => {
		
		var optsPub = {uri : RABBIT_URI, socketType: rabbitRx.SocketType.PUB, queue : "test"};				
		var pub = new rabbitRx.RabbitPub(optsPub);
				
		var disposable = pub.connect();
		
		pub.write({test : false})
		.concat(pub.write({test : true})) 
		.subscribeOnCompleted(() => {			
			disposable.dispose();
			done();
		})																																																																									
	})
	
	it("subscribe and publish message",  (done) => {
		
		var optsPub = {uri : RABBIT_URI, socketType: rabbitRx.SocketType.PUB, queue : "test"};				
		var optsSub = {uri : RABBIT_URI, socketType: rabbitRx.SocketType.SUB, queue : "test"};
		var pub = new rabbitRx.RabbitPub(optsPub);
		var sub = new rabbitRx.RabbitSub(optsSub);
				
		var disposablePub = pub.connect();
		var disposableSub = sub.connect();
		
		var disposable1 = sub.stream.skip(1).subscribe(val => {
			expect(val).eql({test : "ping"});
			disposable1.dispose();
			done();
		});
		
		var disposable2 = sub.stream.take(1).subscribe(val => {		 
			pub.write({test : "ping"});
			disposable2.dispose();
		});																																							
	})
	
		
}) 
