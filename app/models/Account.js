let mongoose = require("mongoose");
let Schema = mongoose.Schema;
const AccountSchema = new Schema({
  address: { type: String, default: "" },
  accountType: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  timestamp: { type: Number, default: 0 },
  createdOn: { type: Number, default: Date.now() },
  modifiedOn: { type: Number, default: Date.now() },
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});

AccountSchema.method({
  saveData: async function () {
    return await this.save();
  },
});
AccountSchema.static({
  getAccount: function (findQuery) {
    return this.findOne(findQuery);
  },
  updateAccount: function (findObj, updateObj) {
    return this.findOneAndUpdate(findObj, updateObj, {
      returnNewDocument: true,
    });
  },
  updateManyAccounts: function (findObj, updateObj) {
    return this.updateMany(findObj, updateObj);
  },
  getAccountList: function (
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
module.exports = mongoose.model("xin-account", AccountSchema);
