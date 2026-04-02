export const API_RESIZE_PARAMS = { width: 1280, height: 800 }
export function targetImageSize() { return API_RESIZE_PARAMS }
export function bindSessionContext() { return {} }
export function buildComputerUseTools() { return [] }
export function createComputerUseMcpServer() { return null }
export const DEFAULT_GRANT_FLAGS = {}
export type ComputerUseSessionContext = Record<string, unknown>
export type CuPermissionResponse = Record<string, unknown>
export type ScreenshotDims = { width: number; height: number }
export function getSentinelCategory() { return null }
