var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Rx = require("rx");
var rabbit = require("rabbit.js");
var RxNode = require("rx-node");
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
                .selectMany(function (val) { return Rx.Observable.throw(val); });
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
    /**
     * Create class, to coonect and subscribe to some queue events
     */
    var RabbitSub = (function (_super) {
        __extends(RabbitSub, _super);
        function RabbitSub(opts) {
            _super.call(this, opts);
        }
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
        RabbitSub.prototype.connect = function () {
            var stream = _super.prototype.connectContext.call(this)
                .map(function (socket) {
                socket.setEncoding("utf8");
                return Rx.Observable.return(null).concat(RxNode.fromReadableStream(socket));
            })
                .flatMap(function (val) { return val; })
                .map(function (val) { return val ? JSON.parse(val) : null; });
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
        /**
         * Connect to queue to publish messages.
         * Every time connect method invoked, new connection created,
         * stream field updated.
         * You should dispose pervious connections yourself.
         * @return
         * Disposable object to close connection.
         */
        RabbitPub.prototype.connect = function () {
            //each write to a single stream           
            var stream = _super.prototype.connectContext.call(this).replay(null, 1);
            var disposable = stream.connect();
            this.connectStream = stream;
            return disposable;
        };
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
        RabbitPub.prototype.write = function (data) {
            var _this = this;
            var observable = Rx.Observable.create(function (observer) {
                return _this.connectStream.subscribe(function (socket) {
                    observer.onNext(socket.write(JSON.stringify(data), "utf8"));
                    observer.onCompleted();
                });
            });
            observable.catch(function (err) {
                console.log("da-rabbitmq rx write error", err);
                return Rx.Observable.just(true);
            }).subscribe(function () {
            });
            return observable;
        };
        return RabbitPub;
    })(RabbitBase);
    rabbitRx.RabbitPub = RabbitPub;
})(rabbitRx || (rabbitRx = {}));
module.exports = rabbitRx;
