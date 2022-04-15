import Config from "../../../config";
import RabbitMqController from "../queue/index";
import { amqpConstants, httpConstants } from "../../common/constants";
import Utils from "../../utils";
import Transaction from "../transaction/index";
import Block from "../../models/Block";
import Transactions from "../../models/Transaction";
import WebSocketService from "../../service/WebsocketService";
const fs = require('fs');
let newBlocks;
export default class BlockManager {

    async findMissingBlocks(request) {
        let startBlock = request.startBlock;
        let endBlock = request.endBlock;
        let query = [
            {
                $match: {
                    number: {$gt: startBlock, $lte: endBlock}
                }
            },
            {
                $group: {
                    _id: null,
                    numbers: {$push: "$number"}
                }
            },
            {
                $addFields: {
                    allNumbers: {$range: [startBlock, endBlock + 1]}
                }
            },
            {
                $project: {
                    _id: 0,
                    missing: {$setIntersection: ["$allNumbers", "$numbers"]}
                }
            }
        ]
        let blockResult = await Block.aggregate(query);
        console.log("blockResult", blockResult[0].missing.length);
        let missings = this.findMissingNumber(startBlock, blockResult[0].missing, endBlock);
        console.log("missings", missings.length);
        for(let index=0;index<missings.length;index++){
            console.log("index", index);
            await this.getBlocksFromBlockChain(web3,missings[index],missings[index]);
        }
        return missings;
    }

    async collectMissingBlocks(request) {
        let startBlock = request.startBlock;
        let endBlock = request.endBlock;

        while(startBlock<=endBlock){
            let response = await this.getBlockDataFromBlockChain(web3, startBlock).catch((err) => {
            });
            let dbTransactionsCount=await Transactions.count({blockNumber:startBlock});
            if(response.transactions.length!==dbTransactionsCount) {
                console.log("mismatch transaction",startBlock);
                fs.appendFileSync(__dirname + '/missingTransactionBlock.txt', startBlock + ", ");
                await this.getBlocksFromBlockChain(web3,startBlock,startBlock);
            }
            console.log("startBlock",startBlock);
            startBlock++;
        }
    }

    async syncMissingBlock(blocks) {
        for(let index=0;index<blocks.length;index++){
            console.log("mismatch transaction",blocks[index],index);
            await this.getBlocksFromBlockChain(web3,blocks[index],blocks[index]);
        }
    }

    async findMissingTransactions(request) {
        let startBlock = request.startBlock;
        let endBlock = request.endBlock;
        let query = [
            {
                $match: {
                    blockNumber: {$gt: startBlock, $lte: endBlock}
                }
            },
            {
                $group: {
                    _id: null,
                    blockNumber: {$push: "$blockNumber"}
                }
            },
            {
                $addFields: {
                    allNumbers: {$range: [startBlock, endBlock + 1]}
                }
            },
            {
                $project: {
                    _id: 0,
                    missing: {$setIntersection: ["$allNumbers", "$blockNumber"]}
                }
            }
        ]
        console.log("query", query);

        let blockResult = await Transactions.aggregate(query);
        console.log("blockResult", blockResult);
        let missings = this.findMissingNumber(startBlock, blockResult[0].missing, endBlock);
        console.log("missings", missings.length);
        // for(let index=0;index<missings.length;index++){
        //     console.log("index", index);
        //     await this.getBlocksFromBlockChain(web3,missings[index],missings[index]);
        // }
        return missings;
    }

    findMissingNumber(startBlock, numbers, endBlock) {
        let missing = [];
        for (let i = startBlock; i <= endBlock; i++) {
            let returns = numbers.find((elements) => {
                return elements === i;
            });
            if (!returns){
                missing.push(i);
            }
        }
        return missing;
    }

    async syncMissingBlocks() {
        let FirstBlockFromDB;
        let latestBlockFromDB;
        let numOfSubSet = 0;
        let count = 0;
        let fileData = fs.readFileSync(__dirname + '/syncBlocknumber.txt').toString();
        Utils.lhtLog("syncMissingBlocks", `syncMissingBlocks started`, {}, "Developer", httpConstants.LOG_LEVEL_TYPE.INFO);
        if (fileData === "") {
            let FstBckDB = Config.RANGE_FIRST_BLOCK;
            let lstBckDB = Config.RANGE_LAST_BLOCK;     
            // let FstBckDB = 14032939;
            // let lstBckDB = 14032940;
            FirstBlockFromDB = parseInt(FstBckDB);
            latestBlockFromDB = parseInt(lstBckDB);
        } else {
            let latestBlockFmDB = Config.RANGE_LAST_BLOCK;
            let str = fileData.split(':');
            FirstBlockFromDB = parseInt(str[0]);
            latestBlockFromDB = parseInt(latestBlockFmDB);
        }
        let needSyncBlock = (latestBlockFromDB - FirstBlockFromDB);
        let subSetblock = 50000; // this is bucket or chunk size 
        if (needSyncBlock < subSetblock) {
            subSetblock = needSyncBlock;
        } else {
            numOfSubSet = needSyncBlock / subSetblock; // this is number of bucket or chunk
        }
        let tempneedSyncBlock = needSyncBlock; // temp letiable to hold all sync block size
        let numberBlock = FirstBlockFromDB; // storing the first block number
        let buckets = {} // blank container is used to store block number in key and value format where key is starting point and value is endpoint number of block
        // incremental for next number of block
        for (let i = 0; i < numOfSubSet; i++) { // looping based on number of bucket and chunk
            //
            if (FirstBlockFromDB > 0) {
                count = 1;
            } else {
                if (i === 1) count++;
            }
            buckets[numberBlock + count] = ((numberBlock + count) + subSetblock)
            tempneedSyncBlock = tempneedSyncBlock - subSetblock
            numberBlock = ((numberBlock + count) + subSetblock)
        }
        if (tempneedSyncBlock > 0) {
            buckets[numberBlock + 1] = numberBlock + tempneedSyncBlock
        }
        // for (const key in buckets) { // and finally calling a function to with start and end block number
        //     Utils.lhtLog("syncMissingBlocks", 'Operations started and start point is .' + key + ' and end point is' + buckets[key])
        //     Utils.lhtLog("syncMissingBlocks", `Operations started and start point is`, key, "", httpConstants.LOG_LEVEL_TYPE.INFO);
        //     // await this.updateMissingBlocksInDB(web3, key, buckets[key], latestBlockFromDB)
        // }

        let startPoint=Number(Config.RANGE_FIRST_BLOCK);
        let endPoint=Number(Config.RANGE_LAST_BLOCK);
        Utils.lhtLog("syncMissingBlocks", 'Operations started and start point is . ' + startPoint + '  and end point is' + endPoint)
        Utils.lhtLog("syncMissingBlocks", `Operations started and start point is`, startPoint, "", httpConstants.LOG_LEVEL_TYPE.INFO);
        await this.updateMissingBlocksInDB(web3, startPoint, endPoint, endPoint);
        console.log('All operations finished.')
    }
    async syncBlocks() {
        let latestBlockFromBlockChain = await this.getLatestBlockFromBlockChain(web3);
        let latestBlockFromDB = await this.getLatestBlockFromDB();
        Utils.lhtLog("syncBlocks", `syncBlocks latestBlockFromBlockChain`, latestBlockFromBlockChain, "", httpConstants.LOG_LEVEL_TYPE.INFO);
        Utils.lhtLog("syncBlocks", `syncBlocks latestBlockFromDB`, latestBlockFromDB, "", httpConstants.LOG_LEVEL_TYPE.INFO);
        let getBlockResponse = await this.getBlocksFromBlockChain(web3, latestBlockFromDB, latestBlockFromBlockChain);
        Utils.lhtLog("syncBlocks", `syncBlocks getBlockResponse`, "getBlockResponse", "", httpConstants.LOG_LEVEL_TYPE.INFO);
        return true;
    }
    async listenBlocks(socket) {
        try {
            newBlocks = web3.eth.subscribe("newBlockHeaders", (error, result) => {
                if (!error) {
                    return false;
                }
            });
            newBlocks.on("data", (blockHeader) => {
                web3.eth.getBlock(blockHeader.hash, true, async (error, blockData) => {
                    if (!blockData)
                        return;
                    Utils.lhtLog("listenBlocks", `listenBlocks getBlocksFromBlockChainNetwork `, blockData, "", httpConstants.LOG_LEVEL_TYPE.INFO);
                    let blockSocketData = {
                        totalDifficulty: blockData.totalDifficulty,
                        number: blockData.number,
                        transactions: blockData.transactions,
                        timestamp: blockData.timestamp,
                        hash: blockData.hash,
                        difficulty: blockData.difficulty,
                        gasUsed: blockData.gasUsed
                    };
                    try {
                        if (typeof socket !== "undefined") {
                            socket.emit("block-socket", blockSocketData);
                        }
                    } catch (err) {
                        Utils.lhtLog("listenBlocks", `listenBlocks block-socket catch `, err, "", httpConstants.LOG_LEVEL_TYPE.INFO);
                    }
                    let rabbitMqController = new RabbitMqController();
                    let amqpResponse = await rabbitMqController.insertInQueue(Config.SYNC_BLOCK_EXCHANGE, Config.SYNC_BLOCK_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(blockData));
                    Utils.lhtLog("listenBlocks", "Response ListenBlocks" + amqpResponse, "", "", httpConstants.LOG_LEVEL_TYPE.INFO);
                    if (!blockData.transactions || blockData.transactions.length <= 0)
                        return;
                    Transaction.syncTransaction(blockData.transactions, blockData.timestamp, socket);
                });
            });
            newBlocks.on("error", (error) => {
                console.log("subscription error", error);
                newBlocks = web3.eth.subscribe("newBlockHeaders", (error, result) => {
                    if (!error) {
                        return false;
                    }
                });
            });
        } catch (err) {
            console.log("subscription catch", error);
        }
    }
    async getLatestBlockFromBlockChain(web3) {
        return await web3.eth.getBlockNumber();
    }
    async FirstBlockFromDB() {
        let FrstBlockFromDB = await Block.getBlockList({}, { number: 1 }, 0, 1, {
            number: 1,
        });
        if (!FrstBlockFromDB) return 0;
        return FrstBlockFromDB;
    }
    async getLatestBlockFromDB() {
        let latestBlockFromDB = await Block.getBlockList({}, { number: 1 }, 0, 1, {
            number: -1,
        });
        if (!latestBlockFromDB) return 0;
        return latestBlockFromDB;
    }
    async getBlockFromDB(blocknumber) {
        let blockdata = await Block.findOne({ number: blocknumber }, { number: 1 });
        if (!blockdata) return 0;
        return blockdata;
    }
    async updateMissingBlocksInDB(web3, startBlock, endBlock, EndRangeBlock) {
        if (!web3 || !endBlock)
            return;
        let count;
        if (!endBlock || endBlock <= 0)
            count = 0;
        else
            count = endBlock;
        while (count >= startBlock) {
            Utils.lhtLog("updateMissingBlocksInDB", `count`, count, "", httpConstants.LOG_LEVEL_TYPE.INFO);
            let textToWrite;
            count--;
            if(Config.CHECK_BLOCK_IN_DB){
                let block = await this.getBlockFromDB(count).catch((err) => {
                    Utils.lhtLog("syncBlocks", `find block error in db ` + err, {}, "", httpConstants.LOG_LEVEL_TYPE.INFO);
                });

                if (block) {
                    Utils.lhtLog("updateMissingBlocksInDB", `blockNumber found in DB`, count, "", httpConstants.LOG_LEVEL_TYPE.INFO);
                    textToWrite = count + ':' + EndRangeBlock;
                    fs.writeFileSync(__dirname + '/syncBlocknumber.txt', textToWrite);
                    continue;
                }
            }
            textToWrite = count + ':' + EndRangeBlock;
            fs.writeFileSync(__dirname + '/syncBlocknumber.txt', textToWrite);
            // await delay(800);
            let response;
            try {
                Utils.lhtLog("syncBlocks", `getBlockDataFromBlockChain started  ` +  count, response, "", httpConstants.LOG_LEVEL_TYPE.INFO);
                response = await this.getBlockDataFromBlockChain(web3, count);
                Utils.lhtLog("syncBlocks", `getBlockDataFromBlockChain response  ` +  count, response, "", httpConstants.LOG_LEVEL_TYPE.INFO);
            } catch (err) {
                Utils.lhtLog("syncBlocks", `Fetching block error ` + err, {}, "", httpConstants.LOG_LEVEL_TYPE.INFO);
                continue;
            }

            Utils.lhtLog("syncBlocks", `syncBlocks getBlocksFromBlockChain count and response ` + count, response, "", httpConstants.LOG_LEVEL_TYPE.INFO);
            let rabbitMqController = new RabbitMqController();
            let amqResponse = await rabbitMqController.insertInQueue(Config.SYNC_BLOCK_EXCHANGE, Config.SYNC_BLOCK_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(response));
            try {
                if (!response.transactions || response.transactions.length <= 0 || !response.timestamp) continue;

                Transaction.syncTransaction(response.transactions, response.timestamp);
                textToWrite = count + ':' + EndRangeBlock;
                fs.writeFileSync(__dirname + '/syncBlocknumber.txt', textToWrite);
            } catch (err) {
                Utils.lhtLog("syncBlocks", `Fetching block error ` + err, {}, "", httpConstants.LOG_LEVEL_TYPE.INFO);
            }
        }
    }
    async getBlocksFromBlockChain(web3, startBlock, endBlock) {
        if (!web3 || !endBlock)
            return;
        let count;
        if (!startBlock || startBlock <= 0)
            count = 0;
        else
            count = startBlock;
        while (count <= endBlock) {
            console.log("***************COUNT**************** : " + count)
            let response = await this.getBlockDataFromBlockChain(web3, count).catch((err) => {
                console.log("syncBlocks err", err);
            });
            count++;
            if (!response)
                continue;
            Utils.lhtLog("syncBlocks", `syncBlocks getBlocksFromBlockChain count ` + count, response, "", httpConstants.LOG_LEVEL_TYPE.INFO);
            let rabbitMqController = new RabbitMqController();
            let amqResponse = await rabbitMqController.insertInQueue(Config.SYNC_BLOCK_EXCHANGE, Config.SYNC_BLOCK_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(response));
            if (!response.transactions || response.transactions.length <= 0)
                continue;
            Transaction.syncTransaction(response.transactions, response.timestamp);
        }
    }

    async getBlockDataFromBlockChain(web3, blockNumber) {
        if (!blockNumber) return;
        return new Promise((fullfill, reject) => {
            web3.eth.getBlock(blockNumber + "", true, async (err, blockData) => {
                if (err || blockData === null) {
                    console.log('error data====>', err)
                    global.web3 = await WebSocketService.webSocketConnection(Config.WS_URL);
                    reject(blockNumber + " Block number does not found.");
                }
                fullfill(blockData);
            });
        });
    }
}

const delay = ms => new Promise(res => setTimeout(res, ms));