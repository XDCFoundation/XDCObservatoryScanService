import RabbitMqController from "../queue/index";
import Config from "../../../config";
import { amqpConstants, httpConstants } from "../../common/constants";
import Account from "../account/index";
import Contract from "../contract/index";
import Utils from "../../utils";


export default class TransactionManager {
    async syncTransaction(transactions, timestamp, socket) {

        if (!transactions || transactions.length <= 0)
            return;
        let getTransactionResponse = await this.getLastTransactions(transactions, timestamp, socket);
        let rabbitMqController = new RabbitMqController();
        await rabbitMqController.insertInQueue(Config.SYNC_TRANSACTION_EXCHANGE, Config.SYNC_TRANSACTION_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(getTransactionResponse));
    }

    async getLastTransactions(transactions, timestamp, socket) {
        let index;
        let allTransactionData = [];
        
        for (index in transactions) {
            const txData = transactions[index];
            const receipt = await web3.eth.getTransactionReceipt(txData.hash);


                const tx = await this.normalizeTX(txData, receipt, timestamp);
                let transactionFee = Number(tx.gasPrice) * tx.gasUsed
                let transactionSocketData = {
                    hash: tx.hash,
                    value: tx.value,
                    timestamp: tx.timestamp,
                    gasPrice: tx.gasPrice,
                    from: tx.from,
                    to: tx.to,
                    blockNumber: tx.blockNumber,
                    transactionFee: transactionFee,
                    gasUsed:tx.gasUsed
                };
                try {                    
                    if(typeof socket !== "undefined"){
                        socket.emit("transaction-socket", transactionSocketData);
                    }                    
                } catch (err) {
                    Utils.lhtLog("getLastTransactions", "transaction-socket catch ", err, "Developer", httpConstants.LOG_LEVEL_TYPE.ERROR)
                }
                allTransactionData.push(tx);
            try {
                Account.syncAccount(tx);
                Contract.getContract(txData, receipt, timestamp);
            } catch (err) {
                console.log(err)
                Utils.lhtLog("getLastTransactions", "getLastTransactions catch", err, "Developer", httpConstants.LOG_LEVEL_TYPE.ERROR)
            }
        }
        return allTransactionData;
    }

    async normalizeTX(txData, receipt, timestamp) {
        if (!txData || !receipt || !timestamp)
            return;

        let contractAddress = ""
        if (receipt && receipt.contractAddress !== null) {
            contractAddress = receipt.contractAddress.toLowerCase();
        }

        let cumulativeGasUsed = 0;
        if (receipt && receipt.cumulativeGasUsed)
            cumulativeGasUsed = receipt.cumulativeGasUsed;

        let logs = [];
        if (receipt && receipt.logs.length > 0)
            logs = receipt.logs;

        let status = true;
        if (receipt && receipt.status) {
            status = receipt.status;
        }

        const tx = {
            blockHash: txData.blockHash || "",
            blockNumber: txData.blockNumber || 0,
            hash: txData.hash.toLowerCase() || "",
            from: txData.from.toLowerCase() || "",
            to: txData.to || "",
            gas: txData.gas || "",
            gasPrice: String(txData.gasPrice) || "",
            gasUsed: receipt.gasUsed || 0,
            input: txData.input || "",
            nonce: txData.nonce || 0,
            transactionIndex: txData.transactionIndex || 0,
            value: txData.value || "",
            r: txData.r || "",
            s: txData.s || "",
            v: txData.v || "",
            contractAddress: contractAddress || "",
            cumulativeGasUsed: cumulativeGasUsed || 0,
            logs: logs || [],
            status: receipt.status,
            timestamp: timestamp || 0,
            modifiedOn: Date.now(),
            createdOn: Date.now(),
            isDeleted: false,
            isActive: true,
        };

        if (txData.to) {
            tx.to = txData.to.toLowerCase() || "";
            return tx;
        } else if (txData.creates) {
            tx.creates = txData.creates.toLowerCase() || "";
            return tx;
        } else {
            tx.creates = receipt.contractAddress.toLowerCase() || "";
            return tx;
        }
    }
}
