// Device-profile stub — real device metadata collection is an effectful
// browser probe (hardware/storage fingerprinting) that has no place in an
// editor preview. Import-time surface mirrors @forgerock/journey-client/device.
export class Device {
  async collect(): Promise<never> {
    throw new Error('Device.collect is not available in the editor preview (IAM-12011).');
  }

  async collectAndEncrypt(): Promise<never> {
    throw new Error('Device.collectAndEncrypt is not available in the editor preview (IAM-12011).');
  }
}
