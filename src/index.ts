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
    
    private socketStream: Rx.Observable<rabbit.Socket>;
    constructor(private opts: IOpts) {      
    }       
    
    private static connectSocket(queue: string, socket : rabbit.Socket) : Rx.Observable<rabbit.Socket>  {
        return Rx.Observable.fromCallback(socket.connect)(queue)
        .map((val: any) => {
          if (val && val.status == "error") 
            throw val;
          else 
            return socket; 
        });
    }
        
    private connectContext(): Rx.Observable<rabbit.Socket> {

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
    
    protected connectOnce<T>() : Rx.Observable<T>{
      if (!this.socketStream) {
        this.socketStream = this.connectContext(); 
      }
      return <any>this.socketStream;
    }
  }
        
	/**
	 * Subscribe to rabbit queue
	 */
  export class RabbitSub extends RabbitBase {

    
    constructor(opts: IOpts) {
      super(opts);
    }
    
    read(): Rx.Observable<any> {      
      return this.connectOnce<rabbit.SubSocket>()
      .selectMany(socket =>  
        RxNode.fromReadableStream(socket) 
      )
      .flatMap(JSON.parse)
      .startWith(null);            
    }
  }
  
  export class RabbitPub extends RabbitBase {
             
    constructor(opts: IOpts) {
      super(opts);
    }
                
    write(data: any) : Rx.Observable<any> {             
      return this.connectOnce<rabbit.PubSocket>()
      .map(socket => 
        Rx.Observable.fromNodeCallback(socket.write, socket)(JSON.stringify(data))
      );
    }
        
  }
}

export = rabbitRx;
