import TransactionManager from "./transactionManager";

export default class TransactionController {
  static async syncTransaction(transactions, timestamp,socket) {
    await new TransactionManager().syncTransaction(transactions, timestamp,socket);
  }
}
