let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const BlockSchema = new Schema({
  difficulty: { type: String, default: "" },
  extraData: { type: String, default: "" },
  gasLimit: { type: Number, default: 0 },
  gasUsed: { type: Number, default: 0 },
  hash: { type: String, default: "" },
  logsBloom: { type: String, default: "" },
  miner: { type: String, lowercase: true },
  mixHash: { type: String, default: "" },
  nonce: { type: String, default: "" },
  number: { type: Number, index: { unique: true } },
  parentHash: { type: String, default: "" },
  penalties: { type: String, default: "" },
  receiptRoot: { type: String, default: "" },
  sha3Uncles: { type: String, default: "" },
  size: { type: Number, default: 0 },
  stateRoot: { type: String, default: "" },
  timestamp: { type: Number, default: Date.now() },
  totalDifficulty: { type: String, default: "" },
  transactions: { type: Array, default: [] },
  transactionsRoot: { type: String, default: "" },
  uncles: { type: Array, default: [] },
  validator: { type: String, default: "" },
  validators: { type: String, default: "" },
  modifiedOn: { type: Number, default: Date.now() },
  createdOn: { type: Number, default: Date.now() },
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});
BlockSchema.method({
  saveData: async function () {
    return await this.save();
  },
});
BlockSchema.static({
  getBlock: function (findQuery) {
    return this.findOne(findQuery);
  },
  updateBlock: function (findObj, updateObj) {
    return this.findOneAndUpdate(findObj, updateObj, {
      returnNewDocument: true,
    });
  },
  updateManyBlocks: function (findObj, updateObj) {
    return this.updateMany(findObj, updateObj);
  },
  getBlockList: function (
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
module.exports = mongoose.model("xin-block", BlockSchema);
