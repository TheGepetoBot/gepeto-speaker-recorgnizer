/**
 *
 * @param {Buffer} profileBuffer
 */
export function parseProfileBuffer(profileBuffer) {
  return profileBuffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}
