import APP from "express";
import DBConnection from "./config/dbConnection";
import Utils from "./app/utils";
import Config from "./config";
import routes from "./routes";
import {httpConstants} from "./app/common/constants";
import QueueController from "./app/modules/queue";
import AMQP from "./library";

const app = new APP();
require("./config/express")(app);
import BlockController from "./app/modules/block";
import WebSocketService from "./app/service/WebsocketService";

const IOSocket = require('socket.io');
global.lhtWebLog = Utils.lhtLog;
process.on('unhandledRejection', error => {
    // Will print "unhandledRejection err is not defined"
    console.log('unhandledRejection', error.message);
});

class Server {
    static listen() {
        Promise.all([DBConnection.connect(), AMQP.conn(Config.AMQP_HOST_URL, true)])
            .then(async () => {
                let server = app.listen(Config.PORT);
                let socketIO = IOSocket(server, {
                    cors: {
                        origin: Config.ORIGIN_URL,
                        methods: ["GET", "POST"],
                        allowedHeaders: ["*"],
                        credentials: true
                    }
                });
                Utils.lhtLog("listen", `Server Started on port ${Config.PORT}`, {}, "Developer", httpConstants.LOG_LEVEL_TYPE.INFO);
                routes(app);
                global.web3 = await WebSocketService.webSocketConnection(Config.WS_URL);
                require("./config/jobInitializer");
                new QueueController().initializeRabbitMQListener();
                socketIO.on('connection', (socket) => {
                    socket.on('Connected', () => {
                        Utils.lhtLog("listen", `socket connected`, {}, "Developer", httpConstants.LOG_LEVEL_TYPE.INFO);
                    })
                });
                if (Config.IS_LATEST_SYNC_ENABLE) {
                    BlockController.syncBlocks();
                    BlockController.listenBlocks(socketIO);
                }
                if (Config.IS_LAST_SYNC_ENABLE)
                    BlockController.syncMissingBlocks();
            })
            .catch((error) => {
                global.web3 = WebSocketService.webSocketConnection(Config.WS_URL);
                Utils.lhtLog("listen", "failed to connect", {err: error}, "Developer", httpConstants.LOG_LEVEL_TYPE.ERROR)
            });
    }
}

Server.listen();
