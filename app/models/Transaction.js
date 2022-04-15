let mongoose = require("mongoose");
let Schema = mongoose.Schema;
const TransactionSchema = new Schema({
  blockHash: { type: String, default: "" },
  blockNumber: { type: Number, default: 0 },
  hash: { type: String, default: "" },
  from: { type: String, default: "" },
  to: { type: String, default: "" },
  gas: { type: Number, default: 0 },
  gasPrice: { type: String, default: "" },
  gasUsed: { type: Number, default: 0 },
  input: { type: String, default: "" },
  nonce: { type: Number, default: 0 },
  transactionIndex: { type: Number, default: 0 },
  value: { type: String, default: "" },
  r: { type: String, default: "" },
  s: { type: String, default: "" },
  v: { type: String, default: "" },
  contractAddress: { type: String, default: "" },
  cumulativeGasUsed: { type: Number, default: 0 },
  logs: { type: Array, default: [] },
  status: { type: Boolean, default: false },
  timestamp: { type: Number, default: 0 },
  modifiedOn: { type: Number, default: Date.now() },
  createdOn: { type: Number, default: Date.now() },
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});
TransactionSchema.method({
  saveData: async function () {
    return await this.save();
  },
});
TransactionSchema.static({
  getTransaction: function (findQuery) {
    return this.findOne(findQuery);
  },
  updateTransaction: function (findObj, updateObj) {
    return this.findOneAndUpdate(findObj, updateObj, {
      returnNewDocument: true,
    });
  },
  updateManyTransactions: function (findObj, updateObj) {
    return this.updateMany(findObj, updateObj);
  },
  getTransactionList: function (
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
module.exports = mongoose.model("xin-transaction", TransactionSchema);
