import "dotenv/config";
import fs from "fs/promises";
import {
  Eagle,
  EagleProfiler,
  EagleProfilerEnrollFeedback,
  checkWaveFile,
  getInt16Frames,
} from "@picovoice/eagle-node";
import path from "path";
import { parseProfileBuffer } from "./utils/parse-profile-buffer.js";
import { readWaveFile } from "./utils/read-wave-file.js";

const config = {
  profilesPath: path.resolve("profiles"),
  samplesPath: path.resolve("samples"),
  accessKey: process.env.PICOVOICE_ACCESS_KEY,
};

async function createProfile(sampleFileName, profileFileName) {
  const FEEDBACK_TO_DESCRIPTIVE_MSG = {
    [EagleProfilerEnrollFeedback.NONE]: "Good audio",
    [EagleProfilerEnrollFeedback.AUDIO_TOO_SHORT]: "Insufficient audio length",
    [EagleProfilerEnrollFeedback.UNKNOWN_SPEAKER]: "Different speaker in audio",
    [EagleProfilerEnrollFeedback.NO_VOICE_FOUND]: "No voice found in audio",
    [EagleProfilerEnrollFeedback.QUALITY_ISSUE]:
      "Low audio quality due to bad microphone or environment",
  };

  const eagleProfiler = new EagleProfiler(config.accessKey);

  const inputWaveFile = await readWaveFile(
    path.resolve(config.samplesPath, sampleFileName)
  );

  if (!checkWaveFile(inputWaveFile, eagleProfiler.sampleRate)) {
    console.log(
      "[error] Audio file did not meet requirements. Wave file must be 16KHz, 16-bit, linear PCM (mono)."
    );

    eagleProfiler.release();
    return;
  }

  let enrollPercentage = 0;
  let feedbackMessage = "";

  let audioData = [];
  const frames = getInt16Frames(inputWaveFile, eagleProfiler.frameLength);

  for (const frame of frames) {
    audioData.push(frame);

    if (
      audioData.length * eagleProfiler.frameLength >=
      eagleProfiler.minEnrollSamples
    ) {
      const enrollFrames = new Int16Array(
        audioData.length * eagleProfiler.frameLength
      );

      for (let i = 0; i < audioData.length; i++) {
        enrollFrames.set(audioData[i], i * eagleProfiler.frameLength);
      }
      audioData = [];

      const { percentage, feedback } = eagleProfiler.enroll(enrollFrames);
      feedbackMessage = FEEDBACK_TO_DESCRIPTIVE_MSG[feedback];
      enrollPercentage = percentage;
    }
  }

  console.log("[enroll result]", `${enrollPercentage}%`, feedbackMessage);

  if (enrollPercentage === 100) {
    const speakerProfile = eagleProfiler.export();
    await fs.writeFile(
      path.resolve(config.profilesPath, profileFileName),
      Buffer.from(speakerProfile)
    );
  }
}

async function detectProfile(sampleFilePath) {
  const profileFiles = await fs.readdir(config.profilesPath);
  const profiles = [];

  for (const profileFileName of profileFiles) {
    const buffer = await fs.readFile(
      path.resolve(config.profilesPath, profileFileName)
    );
    profiles.push(parseProfileBuffer(buffer));
  }

  const eagle = new Eagle(config.accessKey, profiles);

  const inputWaveFile = await readWaveFile(sampleFilePath);

  if (!checkWaveFile(inputWaveFile, eagle.sampleRate)) {
    console.log(
      "[error] Audio file did not meet requirements. Wave file must be 16KHz, 16-bit, linear PCM (mono)."
    );

    eagle.release();
    return;
  }

  const frames = getInt16Frames(inputWaveFile, eagle.frameLength);
  const finalScores = [];

  for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
    const frame = frames[frameIndex];
    const scores = eagle.process(frame);

    for (let x = 0; x < scores.length; x++) {
      finalScores[x] = (finalScores[x] || 0) + scores[x];

      if (frameIndex === frames.length - 1) {
        finalScores[x] /= frames.length;
      }
    }
  }

  for (let scoreIndex = 0; scoreIndex < finalScores.length; scoreIndex++) {
    console.log(
      "score of",
      `"${profileFiles[scoreIndex]}"`,
      finalScores[scoreIndex]
    );
  }
}

// Examples:
// createProfile("joyce_1.wav", "joyce");
// detectProfile("./noise.wav");
