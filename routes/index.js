/**
 * Created by Developer on 18/05/10.
 */
import * as ValidationManger from "../middleware/validation";
import TestModule from "../app/modules/testModule";
import {stringConstants} from "../app/common/constants";
import BlockController from "../app/modules/block";

module.exports = (app) => {
    app.get('/', (req, res) => res.send(stringConstants.SERVICE_STATUS_HTML));

    /**
     * route definition
     */
    app.get("/test-route", ValidationManger.validateUserLogin, new TestModule().testRoute);
    app.post("/find-missing-blocks", new BlockController().findMissingBlocks);
    app.post("/find-missing-transactions", new BlockController().findMissingTransactions);
    app.post("/collect-missing-blocks", new BlockController().collectMissingBlocks);
    app.post("/sync-missing-blocks-transactions", new BlockController().syncMissingBlocks);
};
