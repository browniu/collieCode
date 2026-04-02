export const dlopen = () => {
  throw new Error('bun:ffi is not available in Node.js builds')
}
export const ptr = () => {
  throw new Error('bun:ffi is not available in Node.js builds')
}
export const CString = null
export const FFIType = {}
