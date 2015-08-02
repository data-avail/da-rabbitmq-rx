/// <reference path="../typings/tsd.d.ts" />
import Rx = require("rx");
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
        private socketStream;
        constructor(opts: IOpts);
        private static connectSocket(queue, socket);
        private connectContext();
        protected connectOnce<T>(): Rx.Observable<T>;
    }
    class RabbitSub extends RabbitBase {
        constructor(opts: IOpts);
        read(): Rx.Observable<any>;
    }
    class RabbitPub extends RabbitBase {
        constructor(opts: IOpts);
        write(data: any): Rx.Observable<any>;
    }
}
export = rabbitRx;
