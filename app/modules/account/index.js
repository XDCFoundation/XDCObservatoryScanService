import AccountManager from "./accountManager";
export default class AccountController {
  static async syncAccount(tx) {
    await new AccountManager().syncAccount(tx);
    // console.log(tx);
  }
}
