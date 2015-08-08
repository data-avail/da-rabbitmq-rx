///<reference path="../typings/tsd.d.ts"/>
import Rx = require("rx");
var 
RxNode = require("rx-node");

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
                
    public connectContext(): Rx.Observable<rabbit.Socket> {

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

    public stream : Rx.Observable<any>;
    
    constructor(opts: IOpts) {
      super(opts);
    }
        
    connect(): Rx.IDisposable {
                 
      var stream = this.connectOnce<rabbit.SubSocket>()
      .flatMap(socket =>  
        RxNode.fromReadableStream(socket) 
      )
      .flatMap(JSON.parse)
      .publish();
      this.stream = stream;
      return stream.connect();
        
    }
  }
  
  export class RabbitPub extends RabbitBase {
             
    public stream : Rx.Observable<rabbit.PubSocket>;
                   
    constructor(opts: IOpts) {
      super(opts);
    }
    
    connect() : Rx.IDisposable {             
      var stream = this.connectOnce<rabbit.PubSocket>().replay(null, 1);
      var disposable = stream.connect();
      this.stream = stream;            
      return disposable;      
    }
    
    write(data: any) : Rx.Observable<boolean> {
      //https://github.com/squaremo/rabbit.js/issues/55
      var observable = Rx.Observable.create<boolean>(observer =>
        this.stream.subscribe(socket => { 
          observer.onNext(socket.write(JSON.stringify(data), "utf8"));
          observer.onCompleted();
        })
      );      
      
      //always subscribe, should do even no subscribers 
      var disposble = observable.subscribe(() => disposble.dispose());
      
      return observable;
    }        
  }
}

export = rabbitRx;
