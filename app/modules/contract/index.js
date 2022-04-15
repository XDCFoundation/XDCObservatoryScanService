import ContractManager from "./contractManager";


export default class ContractController {
    static async getContract(txData, receipt, timestamp) {
        // console.log(timestamp)
        await new ContractManager().getContract(txData, receipt, timestamp);
    }
}