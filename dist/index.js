var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="../typings/tsd.d.ts"/>
var Rx = require("rx");
var RxNode = require("rx-node");
var rabbit = require("rabbit.js");
var rabbitRx;
(function (rabbitRx) {
    (function (SocketType) {
        SocketType[SocketType["PUB"] = 0] = "PUB";
        SocketType[SocketType["SUB"] = 1] = "SUB";
    })(rabbitRx.SocketType || (rabbitRx.SocketType = {}));
    var SocketType = rabbitRx.SocketType;
    var RabbitBase = (function () {
        function RabbitBase(opts) {
            this.opts = opts;
        }
        RabbitBase.connectSocket = function (queue, socket) {
            return Rx.Observable.fromCallback(socket.connect)(queue)
                .map(function (val) {
                if (val && val.status == "error")
                    throw val;
                else
                    return socket;
            });
        };
        RabbitBase.prototype.connectContext = function () {
            var _this = this;
            var context = rabbit.createContext(this.opts.uri);
            var contextErrorStream = Rx.Observable.fromEvent(context, "error")
                .selectMany(Rx.Observable.throw);
            var contextReadyStream = Rx.Observable.fromEvent(context, "ready");
            var contextStream = contextErrorStream.merge(contextReadyStream);
            return contextStream.map(function () {
                return context.socket(SocketType[_this.opts.socketType]);
            })
                .flatMap(function (socket) {
                return RabbitBase.connectSocket(_this.opts.queue, socket);
            });
        };
        return RabbitBase;
    })();
    rabbitRx.RabbitBase = RabbitBase;
    var RabbitSub = (function (_super) {
        __extends(RabbitSub, _super);
        function RabbitSub(opts) {
            _super.call(this, opts);
        }
        RabbitSub.prototype.connect = function () {
            var stream = _super.prototype.connectContext.call(this)
                .map(function (socket) {
                socket.setEncoding("utf8");
                return RxNode.fromReadableStream(socket);
            })
                .flatMap(function (val) { return val; })
                .map(JSON.parse);
            this.stream = stream.publish();
            return this.stream.connect();
        };
        return RabbitSub;
    })(RabbitBase);
    rabbitRx.RabbitSub = RabbitSub;
    var RabbitPub = (function (_super) {
        __extends(RabbitPub, _super);
        function RabbitPub(opts) {
            _super.call(this, opts);
        }
        RabbitPub.prototype.connect = function () {
            var stream = _super.prototype.connectContext.call(this).replay(null, 1);
            var disposable = stream.connect();
            this.stream = stream;
            return disposable;
        };
        RabbitPub.prototype.write = function (data) {
            var _this = this;
            var observable = Rx.Observable.create(function (observer) {
                return _this.stream.subscribe(function (socket) {
                    observer.onNext(socket.write(JSON.stringify(data), "utf8"));
                    observer.onCompleted();
                });
            });
            var disposble = observable.subscribe(function () { disposble.dispose(); });
            return observable;
        };
        return RabbitPub;
    })(RabbitBase);
    rabbitRx.RabbitPub = RabbitPub;
})(rabbitRx || (rabbitRx = {}));
module.exports = rabbitRx;
