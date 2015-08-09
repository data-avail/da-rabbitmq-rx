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
  
  /**
   * Connection options
   */
  export interface IOpts {
    /**
     * Rabbit service URI
     */
    uri: string
    /**
     * Socket type
     */
    socketType: SocketType
    /**
     * Queue name
     */
    queue: string
  }
  
  export class RabbitBase {
    
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
                
    protected connectContext(): Rx.Observable<rabbit.Socket> {

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
	 * Create class, to coonect and subscribe to some queue events
	 */
  export class RabbitSub extends RabbitBase {
 
    /**
     * Hot observable, stream events from queue.
     */
    public stream : Rx.Observable<any>;
    
    constructor(opts: IOpts) {
      super(opts);
    }
        
    /**
     * Connect to queue and initailize stream field.
     * When connection sucessfully established, first onNext
     * invoked with null value, if you not interseted in time 
     * when connection esabilished, skip this first event.  
     * Every time connect method invoked, new connection created,
     * stream field updated.
     * You should dispose pervious connections yourself.
     * Connection won't be made until subscription on stream field.
     * @return
     * Disposable object to close connection.
     */        
    connect(): Rx.IDisposable {                 
      var stream = super.connectContext()
      .map((socket: rabbit.SubSocket) => {
        socket.setEncoding("utf8");         
        return Rx.Observable.return(null).concat( 
        RxNode.fromReadableStream(socket));
      })
      .flatMap(val => val)
      .map((val: string) => val ?  <any>JSON.parse(val) : null);     
      this.stream = stream.publish();            
      return (<any>this.stream).connect();      
    }
  }
  
  export class RabbitPub extends RabbitBase {
       
    /**
     * Hot observable, for all subscribers return 
     * onNext, when connection established, even when connection was made before
     * onSuccess - when completed and onError - when some error
     */             
    public connectStream : Rx.Observable<rabbit.PubSocket>;
                   
    constructor(opts: IOpts) {
      super(opts);
    }
    
    /**
     * Connect to queue to publish messages.
     * Every time connect method invoked, new connection created,
     * stream field updated.
     * You should dispose pervious connections yourself.
     * @return
     * Disposable object to close connection.   
     */
    connect() : Rx.IDisposable {  
      //each write to a single stream           
      var stream = super.connectContext().replay(null, 1);
      var disposable = stream.connect();
      this.connectStream = <any>stream;            
      return disposable;      
    }
    
    /**
     * Write data to connected queue.
     * @params
     * data
     * JSON object to write
     * @return
     * Suppose to return write status.
     * Once onNext with true then onComplete(), if success
     * onError when failed.
     * Now this is a stub, see
     * //https://github.com/squaremo/rabbit.js/issues/55 
     */
    write(data: any) : Rx.Observable<boolean> {      
      var observable = Rx.Observable.create<boolean>(observer =>
        this.connectStream.subscribe(socket => { 
          observer.onNext(socket.write(JSON.stringify(data), "utf8"));
          observer.onCompleted();
        })
      );      
      
      //always subscribe
      //write method should do work even without subscribers 
      var disposable = observable.subscribe(() => {disposable.dispose()});
      
                 
      return observable;
    }        
  }
}

export = rabbitRx;
