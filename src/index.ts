///<reference path="../typings/tsd.d.ts"/>
import Rx = require("rx");
var RxNode = require("rx-node");

import rabbit = require("rabbit.js");

/**
 * My library
 */
module rabbitRx {

  export enum SocketType {
    PUB, SUB
  }
  
  export interface IOpts {
    uri: string
    socketType: SocketType
    queue: string
  }
  
  export class RabbitBase {
    
    constructor(private opts: IOpts) {      
    }
       
    
    private static connectSocket(queue: string, socket : rabbit.Socket) : Rx.Observable<rabbit.Socket> {
        return Rx.Observable.fromCallback(socket.connect)(queue)
        .map((val: any) => {
          if (val && val.status == "error") 
            throw val;
          else 
            return socket; 
        });
    }
        
    connectContext(): Rx.Observable<rabbit.Socket> {

      var context = rabbit.createContext(this.opts.uri);

      var contextErrorStream = 
        Rx.Observable.fromEvent<any>(<any>context, "error")
        .selectMany(Rx.Observable.throw)
      var contextReadyStream = Rx.Observable.fromEvent<any>(<any>context, "ready");      
      var contextStream = contextErrorStream.merge(contextReadyStream);
        
      return contextStream.map(() =>         
        context.socket<rabbit.Socket>(SocketType[this.opts.socketType])        
      )
      .flatMap(socket =>
         RabbitBase.connectSocket(this.opts.queue, socket)
      );    
    }        
  }
        
	/**
	 * Subscribe to rabbit queue
	 */
  export class RabbitSub extends RabbitBase {

    
    constructor(opts: IOpts) {
      super(opts);
    }

    private connect(): Rx.Observable<rabbit.SubSocket> {
      return <Rx.Observable<rabbit.SubSocket>>this.connectContext() 
    }
    
    read(): Rx.Observable<any> {      
      return this.connect()
      .selectMany(socket =>  
        RxNode.fromReadableStream(socket) 
      )
      .flatMap(JSON.parse)
      .startWith(null);            
    }
  }
  
  export class RabbitPub extends RabbitBase {
     
    private socketStream: Rx.Observable<rabbit.PubSocket>;        
    constructor(opts: IOpts) {
      super(opts);
    }
            
    private connectOnce(): Rx.Observable<rabbit.PubSocket> {
      if (!this.socketStream) {
        this.socketStream = <Rx.Observable<rabbit.PubSocket>>this.connectContext() 
      }  
      return this.socketStream;
    }
    
    write(data: any) : Rx.Observable<any> {             
      return this.connectOnce()
      .map(socket => 
        Rx.Observable.fromNodeCallback(socket.write, socket)(JSON.stringify(data))
      );
    }    
  }
}

export = rabbitRx;
