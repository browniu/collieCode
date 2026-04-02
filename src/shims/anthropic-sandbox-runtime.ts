export class SandboxViolationStore {
  getViolations() { return [] }
  addViolation() {}
  clear() {}
}

export const SandboxRuntimeConfigSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true, data: v }),
}

export class SandboxManager {
  static isSupportedPlatform() { return false }
  static isSandboxingEnabled() { return false }
  static areUnsandboxedCommandsAllowed() { return true }
  static isAutoAllowBashIfSandboxedEnabled() { return false }
  static checkDependencies(_opts?: unknown) { return Promise.resolve({ supported: false }) }
  static wrapWithSandbox(cmd: string, _args?: unknown[]) { return cmd }
  static initialize(_config?: unknown, _cb?: unknown) { return Promise.resolve() }
  static updateConfig(_config?: unknown) {}
  static reset() { return Promise.resolve() }
  static getFsReadConfig() { return undefined }
  static getFsWriteConfig() { return undefined }
  static getNetworkRestrictionConfig() { return undefined }
  static getIgnoreViolations() { return false }
  static getAllowUnixSockets() { return undefined }
  static getAllowLocalBinding() { return undefined }
  static getEnableWeakerNestedSandbox() { return undefined }
  static getProxyPort() { return undefined }
  static getSocksProxyPort() { return undefined }
  static getLinuxHttpSocketPath() { return undefined }
  static getLinuxSocksSocketPath() { return undefined }
  static waitForNetworkInitialization() { return Promise.resolve(false) }
  static getSandboxViolationStore() { return new SandboxViolationStore() }
  static annotateStderrWithSandboxFailures(_command: string, stderr: string) { return stderr }
  static cleanupAfterCommand() {}
  static getLinuxGlobPatternWarnings() { return [] }
  static getExcludedCommands() { return [] }
  static refreshConfig() {}
  constructor() {}
}

export const BaseSandboxManager = SandboxManager
