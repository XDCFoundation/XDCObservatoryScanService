import RabbitMqController from "../queue/index";
import Config from "../../../config";
import { amqpConstants, httpConstants } from "../../common/constants";
import TokenTransfer from "../../models/Transfer"
import Utils from "../../utils";
import ContractModel from "../../models/Contract";
let ERC20ABI = require("./jsonInterface").ERC20ABI;
let ERCvalue = 0

export default class contractManager {
    async getContract(txData, receipt, timestamp) {
        if (!txData || !txData.input || !txData.input.length > 2)
            return

        if (txData.to === null) {

            const contractAddress = await this.getContractAddress(txData, receipt);
            Utils.lhtLog("contractManager", "contractManager17", contractAddress, "", httpConstants.LOG_LEVEL_TYPE.INFO)
            const token = new web3.eth.Contract(ERC20ABI, contractAddress);

            const call = await web3.eth.call({to: contractAddress, data: web3.utils.sha3("totalSupply()")});

            const contractDB = {
                tokenName: "",
                symbol: "",
                decimals: 0,
                totalSupply: 0

            };
            let isTokenContract = true;
            let isERC721 = false;
            if (call === "0x") {
                try {
                    contractDB.tokenName = await token.methods.name().call();
                    contractDB.symbol = await token.methods.symbol().call();
                    contractDB.decimals = await token.methods.decimals().call();
                    contractDB.totalSupply = await token.methods.totalSupply().call();
                    isERC721 = true;
                } catch (error) {
                    isERC721 = false;
                    isTokenContract = false;
                }
            } else {

                try {
                    contractDB.tokenName = await token.methods.name().call();
                    contractDB.symbol = await token.methods.symbol().call();
                    contractDB.decimals = await token.methods.decimals().call();
                    contractDB.totalSupply = await token.methods.totalSupply().call();
                } catch (error) {
                    isTokenContract = false;
                }
            }

            const byteCode = await web3.eth.getCode(contractAddress);
            const ERC = await this.getERC(isTokenContract,isERC721);

            if (ERC) {
                const tokenData = await this.parseToken(contractAddress, byteCode, contractDB, ERC)
                let rabbitMqController = new RabbitMqController();
                await rabbitMqController.insertInQueue(Config.SYNC_TOKEN_EXCHANGE, Config.SYNC_TOKEN_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(tokenData));
            }

            const contractData = await this.parseContract(contractAddress, txData, byteCode, ERC, contractDB)

            let rabbitMqController = new RabbitMqController();
            await rabbitMqController.insertInQueue(Config.SYNC_CONTRACT_EXCHANGE, Config.SYNC_CONTRACT_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(contractData));

        } else {
            const ERC20_METHOD_DIC = {
                "0xa9059cbb": "transfer",
                "0xa978501e": "transferFrom",
            };
            const contractAddress = await this.getContractAddress(txData, receipt);

            const transfer = {
                hash: "",
                blockNumber: 0,
                from: "",
                to: "",
                contract: "",
                value: 0,
                timestamp: 0,
            };

            const methodCode = txData.input.substr(0, 10);
            let contractDetails = await ContractModel.getAccountList({address: contractAddress}, "", 0, 1, "");
            if (ERC20_METHOD_DIC[methodCode] === "transfer" || ERC20_METHOD_DIC[methodCode] === "transferFrom" || contractDetails.length > 0) {
                if (ERC20_METHOD_DIC[methodCode] === "transfer") {
                    // Token transfer transaction
                    transfer.from = txData.from.toLowerCase();
                    transfer.to = `xdc${txData.input.substring(34, 74).toLowerCase()}`;
                    transfer.value = Number(`0x${txData.input.substring(74)}`);
                } else {
                    // transferFrom
                    transfer.from = `xdc${txData.input.substring(34, 74).toLowerCase()}`;
                    transfer.to = `xdc${txData.input.substring(74, 114).toLowerCase()}`;
                    transfer.value = Number(`0x${txData.input.substring(114)}`);
                }
                transfer.method = ERC20_METHOD_DIC[methodCode];
                transfer.hash = txData.hash;
                transfer.blockNumber = txData.blockNumber;
                transfer.contract = txData.to.toLowerCase();
                transfer.timestamp = timestamp;
                let rabbitMqController = new RabbitMqController();
                await rabbitMqController.insertInQueue(Config.SYNC_TRANSFER_EXCHANGE, Config.SYNC_TRANSFER_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(transfer));


                const insertData = {
                    address: "",
                    tokenContract: "",
                    tokenName: "",
                    symbol: "",
                    balance: 0,
                    decimals: 0,
                    totalSupply: 0
                };

                const call = await web3.eth.call({to: contractAddress, data: web3.utils.sha3("totalSupply()")});
                const contract_object = new web3.eth.Contract(ERC20ABI, transfer.contract);

                let balanceFrom;
                let balanceTo;

                if (call !== '0x') {
                    try {
                        insertData.tokenName = await contract_object.methods.name().call();
                        insertData.symbol = await contract_object.methods.symbol().call();
                        insertData.decimals = await contract_object.methods.decimals().call();
                        insertData.totalSupply = await contract_object.methods.totalSupply().call();
                        balanceFrom = Number(await contract_object.methods.balanceOf(transfer.from).call());
                        balanceTo = Number(await contract_object.methods.balanceOf(transfer.to).call());
                    } catch (error) {
                        console.warn(`Contract ${transfer.contract} does not match with ERC-20 interface. { error: ${error} }`);
                        return;
                    }
                }


                insertData.address = transfer.from.toLowerCase()
                insertData.tokenContract = transfer.contract.toLowerCase()
                insertData.balance = balanceFrom
                insertData.timeStamp = Date.now()
                await rabbitMqController.insertInQueue(Config.SYNC_TOKEN_HOLDER_EXCHANGE, Config.SYNC_TOKEN_HOLDER_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(insertData));

                insertData.address = transfer.to.toLowerCase()
                insertData.tokenContract = transfer.contract.toLowerCase()
                insertData.balance = balanceTo
                insertData.timeStamp = Date.now()
                await rabbitMqController.insertInQueue(Config.SYNC_TOKEN_HOLDER_EXCHANGE, Config.SYNC_TOKEN_HOLDER_QUEUE, "", "", "", "", "", amqpConstants.exchangeType.FANOUT, amqpConstants.queueType.PUBLISHER_SUBSCRIBER_QUEUE, JSON.stringify(insertData));
            }
        }
    }

    async getContractAddress(txData, receipt) {

        let contractAddress = "";
        if (txData.creates) {
            contractAddress = txData.creates;
        } else if (receipt.contractAddress) {
            contractAddress = receipt.contractAddress.toLowerCase();
        } else {
            contractAddress = txData.to.toLowerCase();
        }
        return contractAddress
    }


    async getERC(isTokenContract,isERC721) {
        ERCvalue = 0;
        if (isTokenContract) {
            ERCvalue = 2;
        }
        if (isERC721) {
            ERCvalue = 721;
        }
        return ERCvalue;
    }

    async parseToken(contractAddress, byteCode, contractDB, ERC, tokenHolders) {
        let type = ""
        if (ERC) {
            type = "XRC20"
        }

        return {
            address: contractAddress,
            byteCode: byteCode,
            ERC: ERC,
            type: type,
            tokenName: contractDB.tokenName,
            symbol: contractDB.symbol,
            decimals: contractDB.decimals,
            totalSupply: contractDB.totalSupply,
            status: "",
            createdOn: Date.now(),
            modifiedOn: Date.now(),
            isActive: true,
            isDeleted: false,
        }
    }

    async parseContract(contractAddress, txData, byteCode, ERC, contractDB) {

        return {
            address: contractAddress,
            blockNumber: txData.blockNumber,
            ERC: ERC,
            creationTransaction: txData.hash,
            tokenName: contractDB.tokenName,
            symbol: contractDB.symbol,
            owner: txData.from,
            decimals: contractDB.decimals,
            totalSupply: contractDB.totalSupply,
            byteCode: byteCode,
            createdOn: Date.now(),
            modifiedOn: Date.now(),
            isActive: true,
            isDeleted: false,
        }
    }
}