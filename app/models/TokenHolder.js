let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const TokenHolderSchem = new Schema(
    {
        'address': { type: String, default: "" },
        'tokenContract': { type: String, default: "" },
        'tokenName': { type: String, default: "" },
        'symbol': { type: String, default: "" },
        'balance': { type: Number, default: 0 },
        'decimals': { type: Number, default: 0 },
        'totalSupply': { type: Number, default: 0 }
    }
);
TokenHolderSchem.index({ "address": 1, "tokenContract": 1 }, { unique: true });
TokenHolderSchem.index({ "address": 1 })
TokenHolderSchem.index({ "tokenContract": 1 })

TokenHolderSchem.method({
    saveData: async function () {
        return await this.save();
    },
});
TokenHolderSchem.static({
    getHolder: function (findQuery) {
        return this.findOne(findQuery);
    },
    updateHolder: function (findObj, updateObj) {
        return this.findOneAndUpdate(findObj, updateObj, {
            returnNewDocument: true,
        });
    },
    updateManyHolder: function (findObj, updateObj) {
        return this.updateMany(findObj, updateObj);
    },
    getHolderList: function (findObj, selectionKey = "", skip = 0, limit = 0, sort = 1) {
        return this.find(findObj, selectionKey).skip(skip).limit(limit).sort(sort);
    },
    bulkUpsert: function (bulkOps) {
        return this.bulkWrite(bulkOps);
    },
});
module.exports = mongoose.model("xin-tokenHolder", TokenHolderSchem);