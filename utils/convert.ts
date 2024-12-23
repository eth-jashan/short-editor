import { FFmpeg } from "@ffmpeg/ffmpeg";
import { FileActions, VideoInputSettings } from "./types";
import { fetchFile } from "@ffmpeg/util";
import {
  customVideoCompressionCommand,
  twitterCompressionCommand,
  whatsappStatusCompressionCommand,
} from "./ffmpegCommands";
import { ImageOverlay, TextOverlay } from "@/context/VideoEditorContext";

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
  textOverlays: TextOverlay[],
  imageOverlays: ImageOverlay[]
): Promise<any> {
  const { file, fileName, fileType } = actionFile;
  const output =
    `${removeFileExtension(fileName)}1` + "." + videoSettings.videoType;

  await ffmpeg.writeFile(fileName, await fetchFile(file));
  // Write each image overlay to the ffmpeg file system
  for (const overlay of imageOverlays) {
    try {
      await ffmpeg.writeFile(
        `overlay${overlay.id}.png`,
        await fetchFile(overlay.src)
      );
      console.log("File uploaded");
    } catch (error) {
      console.log(error);
    }
  }
  // [1:v]scale=397:449[overlay1];[base][overlay1]overlay=x=130:y=562:enable='between(t,0,15.9647)'[base];[base]drawtext=fontfile=/arial.ttf:text='New Texssss':fontcolor=black:fontsize=44:x=137:y=247:enable='between(t,0,15.9647)'[base]
  //Add font to FileSystem
  await ffmpeg.writeFile(
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
    textOverlays,
    imageOverlays
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
