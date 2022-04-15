import BlockManager from "./blockManager";
import Utils from "../../utils";
import {apiSuccessMessage, httpConstants} from "../../common/constants";


export default class BlockController {
    static async syncBlocks() {
        await new BlockManager().syncBlocks();
    }

    static async listenBlocks(socket) {
        await new BlockManager().listenBlocks(socket);
    }
    static async syncMissingBlocks() {
        await new BlockManager().syncMissingBlocks();
    }

    async findMissingBlocks(request,response) {
        let [error, latestAccountsResponse] = await Utils.parseResponse(new BlockManager().findMissingBlocks(request.body));
        if (error) {
            Utils.lhtLog("findMissingBlock", "findMissingBlocks err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, latestAccountsResponse, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }

    async findMissingTransactions(request,response) {
        let [error, latestAccountsResponse] = await Utils.parseResponse(new BlockManager().findMissingTransactions(request.body));
        if (error) {
            Utils.lhtLog("findMissingBlock", "findMissingBlocks err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, latestAccountsResponse, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }


    async collectMissingBlocks(request,response) {
        let [error, latestAccountsResponse] = await Utils.parseResponse(new BlockManager().collectMissingBlocks(request.body));
        if (error) {
            Utils.lhtLog("findMissingBlock", "findMissingBlocks err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, latestAccountsResponse, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }

    async syncMissingBlocks(request,response) {
        let [error, latestAccountsResponse] = await Utils.parseResponse(new BlockManager().syncMissingBlock(request.body.blocks));
        if (error) {
            Utils.lhtLog("findMissingBlock", "findMissingBlocks err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, latestAccountsResponse, apiSuccessMessage.FETCH_SUCCESS, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }
}
