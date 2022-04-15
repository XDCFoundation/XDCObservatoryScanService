let mongoose = require("mongoose");
let Schema = mongoose.Schema;
const TokenSchema = new Schema({
  address: { type: String, default: "" },
  byteCode: { type: String, default: "" },
  ERC: { type: Number, default: 0 },
  type: { type: String, default: "" },
  tokenName: { type: String, default: "" },
  tokenHolders: { type: Number, default: 0 },
  symbol: { type: String, default: "" },
  decimals: { type: Number, default: 0 },
  totalSupply: { type: Number, default: 0 },
  status: { type: String, default: "Unverified" },
  modifiedOn: { type: Number, default: Date.now() },
  createdOn: { type: Number, default: Date.now() },
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});

TokenSchema.method({
  saveData: async function () {
    return await this.save();
  },
});
TokenSchema.static({
  getToken: function (findQuery) {
    return this.findOne(findQuery);
  },
  updateToken: function (findObj, updateObj) {
    return this.findOneAndUpdate(findObj, updateObj, {
      returnNewDocument: true,
    });
  },
  updateManyTokens: function (findObj, updateObj) {
    return this.updateMany(findObj, updateObj);
  },
  getTokenList: function (
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
module.exports = mongoose.model("xin-token", TokenSchema);
