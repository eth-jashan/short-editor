import { TextOverlay } from "@/context/VideoEditorContext";
import { getFileExtension } from "./convert";
import { VideoFormats, VideoInputSettings } from "./types";

export const whatsappStatusCompressionCommand = (
  input: string,
  output: string
) => [
  "-i",
  input,
  "-c:v",
  "libx264",
  "-preset",
  "veryfast",
  "-crf",
  "35",
  "-c:a",
  "aac",
  "-b:a",
  "64k",
  "-movflags",
  "faststart",
  "-maxrate",
  "1000k",
  "-bufsize",
  "1000k",
  "-fs",
  "9M",
  output,
];

export const twitterCompressionCommand = (input: string, output: string) => [
  "-i",
  input,
  "-c:v",
  "libx264",
  "-profile:v",
  "high",
  "-level:v",
  "4.2",
  "-pix_fmt",
  "yuv420p",
  "-r",
  "30",
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-movflags",
  "faststart",
  "-maxrate",
  "5000k",
  "-bufsize",
  "5000k",
  "-tune",
  "film",
  output,
];

export const customVideoCompressionCommand = (
  input: string,
  output: string,
  videoSettings: VideoInputSettings,
  textOverlays: TextOverlay[]
): string[] => {
  const inputType = getFileExtension(input);
  console.log("custom setting", inputType);
  // if (inputType === "mp4") {
  return getMP4toMP4Command(input, output, videoSettings, textOverlays);
  // } else {
  //   switch (videoSettings.videoType) {
  //     case VideoFormats.MP4:
  //       return getMP4Command(input, output, videoSettings);
  //     case VideoFormats.AVI:
  //       return getAVICommand(input, output, videoSettings);
  //     case VideoFormats.MKV:
  //       return getMKVCommand(input, output, videoSettings);
  //     case VideoFormats.MOV:
  //       return getMOVCommand(input, output, videoSettings);
  //     default:
  //       return ["-i", input, output];
  //   }
  // }
};

const getMP4toMP4Command = (
  input: string,
  output: string,
  videoSettings: VideoInputSettings,
  textOverlays: TextOverlay[]
) => {
  // Construct the drawtext filters for each text overlay
  const drawtextFilters = textOverlays.map((overlay) => {
    const { text, fontSize, position, startTime, endTime } = overlay;
    return `drawtext=/arial.ttf:text='${text}':fontcolor=black:fontsize=${fontSize}:x=${position.x}:y=${position.y}:enable='between(t,${startTime},${endTime})'`;
  });

  // Join all drawtext filters with commas
  const filterComplex = drawtextFilters.join(",");

  // Construct the ffmpeg command
  const ffmpegCommand = [
    "-i",
    input,
    "-vf",
    filterComplex,
    "-ss",
    videoSettings.customStartTime.toString(),
    "-to",
    videoSettings.customEndTime.toString(),
    "-c:v",
    "libx264",
    "-crf",
    "23",
    "-preset",
    "medium",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    output,
  ];

  return ffmpegCommand;
};

const getMP4Command = (
  input: string,
  output: string,
  videoSettings: VideoInputSettings
) => {
  const ffmpegCommand = [
    "-i",
    input,
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-level:v",
    "4.2",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "30",
    "-maxrate",
    "5000k",
    "-bufsize",
    "5000k",
    "-tune",
    "film",
    "-ss",
    videoSettings.customStartTime.toString(),
    "-to",
    videoSettings.customEndTime.toString(),
    "-q:v",
    videoSettings.quality,
    "-crf",
    "18",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-f",
    videoSettings.videoType,
  ];

  if (!videoSettings.removeAudio) {
    ffmpegCommand.push("-c:a", "aac", "-b:a", "192k", "-movflags", "faststart");
  } else {
    ffmpegCommand.push("-an");
  }
  ffmpegCommand.push(output);

  return ffmpegCommand;
};

const getMOVCommand = (
  input: string,
  output: string,
  videoSettings: VideoInputSettings
) => {
  const audioOptions = videoSettings.removeAudio ? [] : ["-c:a", "aac"];
  const ffmpegCommand = [
    "-i",
    input,
    "-c:v",
    "libx264",
    "-crf",
    videoSettings.quality,
    ...audioOptions,
    "-vf",
    `trim=start=${videoSettings.customStartTime}:end=${videoSettings.customEndTime}`,
    output,
  ];

  return ffmpegCommand;
};

const getMKVCommand = (
  input: string,
  output: string,
  videoSettings: VideoInputSettings
) => {
  const audioOptions = videoSettings.removeAudio ? [] : ["-c:a", "aac"];
  const ffmpegCommand = [
    "-i",
    input,
    "-c:v",
    "libx264",
    "-crf",
    videoSettings.quality,
    ...audioOptions,
    "-vf",
    `trim=start=${videoSettings.customStartTime}:end=${videoSettings.customEndTime}`,
    output,
  ];

  return ffmpegCommand;
};

const getAVICommand = (
  input: string,
  output: string,
  videoSettings: VideoInputSettings
) => {
  const audioOptions = videoSettings.removeAudio ? [] : ["-c:a", "aac"];
  const ffmpegCommand = [
    "-i",
    input,
    "-c:v",
    "libx264",
    "-crf",
    videoSettings.quality,
    ...audioOptions,
    "-vf",
    `trim=start=${videoSettings.customStartTime}:end=${videoSettings.customEndTime}`,
    output,
  ];

  return ffmpegCommand;
};

const getFLVCommand = (
  input: string,
  output: string,
  videoSettings: VideoInputSettings
) => {
  const audioOptions = videoSettings.removeAudio ? [] : ["-c:a", "aac"];
  const ffmpegCommand = [
    "-i",
    input,
    "-c:v",
    "libx264",
    "-crf",
    videoSettings.quality,
    ...audioOptions,
    "-vf",
    `trim=start=${videoSettings.customStartTime}:end=${videoSettings.customEndTime}`,
    output,
  ];

  return ffmpegCommand;
};
