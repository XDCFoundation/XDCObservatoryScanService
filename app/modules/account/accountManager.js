import Config from "../../../config";
import RabbitMqController from "../queue/index";
import {amqpConstants, httpConstants} from "../../common/constants";
import Utils from "../../utils";


export default class AccountManager {
    async syncAccount(tx) {

        try {
            if (!tx || !tx.from) return;
            const accounts = this.getAccountsFromTransaction(tx);
            let getAccountResponse;
            for (let index = 0; index < accounts.length; index++) {
                if (accounts[index] === "")
                    continue
                const balance = await this.getAccountBalance(accounts[index]);
                const accountType = await this.getAccountType(accounts[index]);
                Utils.lhtLog("syncAccount", "syncAccount requestObj "+accounts[index], {
                    balance,
                    accountType
                }, "Developer", httpConstants.LOG_LEVEL_TYPE.INFO);
                getAccountResponse = await this.getAccountDetails(accounts[index], balance, accountType, tx);
                Utils.lhtLog("syncAccount", "syncAccount getAccountResponse "+accounts[index], "", "Developer", httpConstants.LOG_LEVEL_TYPE.INFO);
                let rabbitMqController = new RabbitMqController();
                await rabbitMqController.insertInQueue(Config.SYNC_ACCOUNT_EXCHANGE, Config.SYNC_ACCOUNT_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(getAccountResponse));
            }
        } catch (error) {
            Utils.lhtLog("syncAccount", "syncAccount catch", "error:- " + error, "Developer", httpConstants.LOG_LEVEL_TYPE.ERROR)
        }
    }

    async getAccountBalance(address) {
        try {
            return await web3.eth.getBalance(address);
        } catch (error) {
            Utils.lhtLog("getAccountBalance", "getAccountBalance catch " + address, " error " + error, "Developer", httpConstants.LOG_LEVEL_TYPE.ERROR)
        }
    }

    async getAccountType(address) {
        try {
            let type = 0;
            const code = await web3.eth.getCode(address);
            if (code.length > 2) type = 1;
            return type;
        } catch (error) {
            Utils.lhtLog("getAccountBalance", "getAccountBalance getAccountType catch " + address, " error " + error, "Developer", httpConstants.LOG_LEVEL_TYPE.ERROR)
        }

    }

    async getAccountDetails(address, balance, accountType, tx) {
        try {
            return {
                address: address,
                accountType: accountType,
                balance: balance,
                timestamp: tx.timestamp,
                createdOn: Date.now(),
                modifiedOn: Date.now(),
                isDeleted: false,
                isActive: true,
            };
        } catch (error) {
            Utils.lhtLog("getAccountBalance", "getAccountDetails getAccountBalance catch ", error, "Developer", httpConstants.LOG_LEVEL_TYPE.ERROR)
        }

    }

    getAccountsFromTransaction(tx) {
        try {
            let accounts = [];
            accounts.push(tx.from);
            if (tx.to !== "") {
                accounts.push(tx.to);
            }

            if (tx.contractAddress !== "") {
                accounts.push(tx.contractAddress)
            }
            return accounts;
        } catch (error) {
            Utils.lhtLog("getAccountBalance", "getAccountBalance catch", "", "Developer", httpConstants.LOG_LEVEL_TYPE.ERROR)
        }

    }
}
