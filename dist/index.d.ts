/// <reference path="../typings/tsd.d.ts" />
import Rx = require("rx");
import rabbit = require("rabbit.js");
declare module rabbitRx {
    enum SocketType {
        PUB = 0,
        SUB = 1,
    }
    interface IOpts {
        uri: string;
        socketType: SocketType;
        queue: string;
    }
    class RabbitBase {
        private opts;
        constructor(opts: IOpts);
        private static connectSocket(queue, socket);
        protected connectContext(): Rx.Observable<rabbit.Socket>;
    }
    class RabbitSub extends RabbitBase {
        stream: Rx.Observable<any>;
        constructor(opts: IOpts);
        connect(): Rx.IDisposable;
    }
    class RabbitPub extends RabbitBase {
        stream: Rx.Observable<rabbit.PubSocket>;
        constructor(opts: IOpts);
        connect(): Rx.IDisposable;
        write(data: any): Rx.Observable<boolean>;
    }
}
export = rabbitRx;
