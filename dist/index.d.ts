/// <reference path="../typings/tsd.d.ts" />
import Rx = require("rx");
import rabbit = require("rabbit.js");
declare module rabbitRx {
    enum SocketType {
        PUB = 0,
        SUB = 1,
    }
    /**
     * Connection options
     */
    interface IOpts {
        /**
         * Rabbit service URI
         */
        uri: string;
        /**
         * Socket type
         */
        socketType: SocketType;
        /**
         * Queue name
         */
        queue: string;
    }
    class RabbitBase {
        private opts;
        constructor(opts: IOpts);
        private static connectSocket(queue, socket);
        protected connectContext(): Rx.Observable<rabbit.Socket>;
    }
    /**
     * Create class, to coonect and subscribe to some queue events
     */
    class RabbitSub extends RabbitBase {
        /**
         * Hot observable, stream events from queue.
         */
        stream: Rx.Observable<any>;
        constructor(opts: IOpts);
        /**
         * Conect to queue and initailize stream field.
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
        connect(): Rx.IDisposable;
    }
    class RabbitPub extends RabbitBase {
        /**
         * Hot observable, for all subscribers return
         * onNext, when connection established, even when connection was made before
         * onSuccess - when completed and onError - when some error
         */
        connectStream: Rx.Observable<rabbit.PubSocket>;
        constructor(opts: IOpts);
        /**
         * Connect to queue to publish messages.
         * Every time connect method invoked, new connection created,
         * stream field updated.
         * You should dispose pervious connections yourself.
         * @return
         * Disposable object to close connection.
         */
        connect(): Rx.IDisposable;
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
        write(data: any): Rx.Observable<boolean>;
    }
}
export = rabbitRx;
