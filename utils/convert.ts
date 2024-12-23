import { FFmpeg } from "@ffmpeg/ffmpeg";
import { FileActions, VideoInputSettings } from "./types";
import { fetchFile } from "@ffmpeg/util";
import {
  customVideoCompressionCommand,
  twitterCompressionCommand,
  whatsappStatusCompressionCommand,
} from "./ffmpegCommands";
import { TextOverlay } from "@/context/VideoEditorContext";

export function getFileExtension(fileName: string) {
  const regex = /(?:\.([^.]+))?$/;
  const match = regex.exec(fileName);
  if (match && match[1]) {
    return match[1];
  }

  return "";
}

function removeFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex !== -1) {
    return fileName.slice(0, lastDotIndex);
  }
  return fileName;
}

export default async function convertFile(
  ffmpeg: FFmpeg,
  actionFile: FileActions,
  videoSettings: VideoInputSettings,
  textOverlays: TextOverlay[]
): Promise<any> {
  const { file, fileName, fileType } = actionFile;
  const output =
    `${removeFileExtension(fileName)}1` + "." + videoSettings.videoType;
  console.log("out put file......", output);
  ffmpeg.writeFile(fileName, await fetchFile(file));
  ffmpeg.writeFile(
    "arial.ttf",
    await fetchFile(
      "https://raw.githubusercontent.com/ffmpegwasm/testdata/master/arial.ttf"
    )
  );
  console.log("Font file loaded");

  const command = customVideoCompressionCommand(
    fileName,
    output,
    videoSettings,
    textOverlays
  );

  console.log("command to execute", command.join(" "));
  await ffmpeg.exec(command);
  const data = await ffmpeg.readFile(output);
  const blob = new Blob([data], { type: fileType.split("/")[0] });
  const url = URL.createObjectURL(blob);
  return { url, output, outputBlob: blob };
}

export const formatTime = (seconds: number): string => {
  seconds = Math.round(seconds);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  let formattedTime = "";

  if (hours > 0) {
    formattedTime += hours + "hr";
    if (minutes > 0 || remainingSeconds > 0) {
      formattedTime += " ";
    }
  }

  if (minutes > 0) {
    formattedTime += `${minutes.toString()} min`;
    if (remainingSeconds > 0) {
      formattedTime += " ";
    }
  }

  if (remainingSeconds > 0 || formattedTime === "") {
    formattedTime += `${remainingSeconds} sec`;
  }

  return formattedTime;
};
