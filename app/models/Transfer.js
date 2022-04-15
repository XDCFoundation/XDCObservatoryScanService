let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const TokenTransferSchem = new Schema(
    {
        hash: { type: String, default: "" },
        blockNumber: { type: Number, default: "" },
        method: { type: String, default: "" },
        from: { type: String, default: "" },
        to: { type: String, default: "" },
        contract: { type: String, default: "" },
        value: { type: String, default: "" },
        timestamp: { type: Number, default: "" },
    }
);

TokenTransferSchem.method({
    saveData: async function () {
        return await this.save();
    },
});
TokenTransferSchem.static({
    getTransferToken: function (findQuery) {
        return this.findOne(findQuery);
    },
    updateTransferToken: function (findObj, updateObj) {
        return this.findOneAndUpdate(findObj, updateObj, {
            returnNewDocument: true,
        });
    },
    updateManyTransferTokens: function (findObj, updateObj) {
        return this.updateMany(findObj, updateObj);
    },
    getTransferTokenList: function (
        findObj,
        selectionKey = "",
        skip = 0,
        limit = 0,
        sort = 1
    ) {
        return this.find(findObj, selectionKey).skip(skip).limit(limit).sort(sort);
    },
    bulkUpsert: function (bulkOps) {
        return this.bulkWrite(bulkOps);
    },
});
module.exports = mongoose.model("xin-transfertoken", TokenTransferSchem);
