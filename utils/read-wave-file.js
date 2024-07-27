import WaveFile from "wavefile";
import fs from "fs/promises";

export async function readWaveFile(waveFilePath) {
  let waveBuffer = await fs.readFile(waveFilePath);
  return new WaveFile.WaveFile(waveBuffer);
}
