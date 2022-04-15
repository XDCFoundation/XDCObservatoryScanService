import BLManager from './manager'
import { httpConstants } from '../../common/constants'

export default class JobController {
  static async monitorMeter () {
    await BLManager.monitorMeters().catch((err) =>
      lhtWebLog('monitorMeter', 'Job Failed', err, 'developer', httpConstants.LOG_LEVEL_TYPE.ERROR)
    )
  }
}
