import { ImageOverlay, TextOverlay } from "@/context/VideoEditorContext";
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
  textOverlays: TextOverlay[],
  imageOverlays: ImageOverlay[]
): string[] => {
  const inputType = getFileExtension(input);
  console.log("custom setting", imageOverlays);

  return getMP4toMP4Command(
    input,
    output,
    videoSettings,
    textOverlays,
    imageOverlays
  );
};

const getMP4toMP4Command = (
  input: string,
  output: string,
  videoSettings: VideoInputSettings,
  textOverlays: TextOverlay[],
  imageOverlays: ImageOverlay[]
) => {
  // let filterComplex = "";
  // let inputCount = 0;
  // let imageInputs: string[] = [];
  // // Process image overlays
  // if (imageOverlays.length > 0) {
  //   imageInputs = imageOverlays.map((overlay) => {
  //     const { id, src, position, size, startTime, endTime } = overlay;
  //     const inputLabel0 = `[${inputCount}:v]`;
  //     const inputLabel = `[${++inputCount}:v]`;
  //     const overlayLabel = `[img${inputCount}]`;
  //     filterComplex += `${inputLabel}scale=${size.width}:${size.height}${overlayLabel};`;
  //     filterComplex += `${inputLabel0}${overlayLabel}overlay=x=${position.x}:y=${position.y}:enable='between(t,${startTime},${endTime})';`;
  //     return `overlay${id}.png`;
  //   });
  //   filterComplex = `${filterComplex.slice(0, -1)},`;
  // }
  // // Process text overlays
  // textOverlays.forEach((overlay) => {
  //   const { text, fontSize, position, startTime, endTime } = overlay;
  //   filterComplex += `drawtext=fontfile=/arial.ttf:text='${text}':fontcolor=black:fontsize=${fontSize}:x=${position.x}:y=${position.y}:enable='between(t,${startTime},${endTime})';`;
  // });

  // Remove the trailing semicolon
  // filterComplex = `${filterComplex.slice(0, -1)}`;
  let filterComplex = "";
  let inputCount = 0;
  let imageInputs: string[] = [];

  // Process image overlays
  if (imageOverlays.length > 0) {
    imageInputs = imageOverlays.map((overlay, index) => {
      const { id, src, position, size, startTime, endTime } = overlay;
      const inputLabel = `[${++inputCount}:v]`;
      const overlayLabel = `[img${inputCount}]`;
      const previousLabel = index === 0 ? "[0:v]" : `[tmp${index}]`;
      const currentLabel = `[tmp${index + 1}]`;

      // Add scale for the current overlay image
      filterComplex += `${inputLabel}scale=${size.width}:${size.height}${overlayLabel};`;

      // Add overlay with proper chaining
      filterComplex +=
        index + 1 === imageOverlays.length
          ? `${previousLabel}${overlayLabel}overlay=x=${position.x}:y=${position.y}:enable='between(t,${startTime},${endTime})';`
          : `${previousLabel}${overlayLabel}overlay=x=${position.x}:y=${position.y}:enable='between(t,${startTime},${endTime})'${currentLabel};`;

      return `overlay${id}.png`; // Return the source of the overlay image
    });
    filterComplex = `${filterComplex.slice(0, -1)},`;
  }

  if (textOverlays.length > 1) {
    // Process text overlays
    if (imageOverlays.length > 0) {
      textOverlays.forEach((overlay, index) => {
        const previousLabel = `[tmp${index + imageOverlays.length}]`;
        const currentLabel = `[tmp${index + 1 + imageOverlays.length}]`;
        const { text, font, fontSize, color, position, startTime, endTime } =
          overlay;
        filterComplex +=
          index + 1 === textOverlays.length
            ? `${previousLabel}drawtext=fontfile=/${font}.ttf:text='${text}':fontcolor=${color}:fontsize=${fontSize}:x=${position.x}:y=${position.y}:enable='between(t,${startTime},${endTime})';`
            : `${previousLabel}drawtext=fontfile=/${font}.ttf:text='${text}':fontcolor=${color}:fontsize=${fontSize}:x=${position.x}:y=${position.y}:enable='between(t,${startTime},${endTime})'${currentLabel};`;
      });
    } else {
      textOverlays.forEach((overlay, index) => {
        const previousLabel = `[tmp${index}]`;
        const currentLabel = `[tmp${index + 1}]`;
        const { text, fontSize, font, position, color, startTime, endTime } =
          overlay;
        filterComplex +=
          index + 1 === textOverlays.length
            ? `${previousLabel}drawtext=fontfile=/${font}.ttf:text='${text}':fontcolor=${color}:fontsize=${fontSize}:x=${position.x}:y=${position.y}:enable='between(t,${startTime},${endTime})';`
            : index === 0
            ? `[0:v]drawtext=fontfile=/${font}.ttf:text='${text}':fontcolor=${color}:fontsize=${fontSize}:x=${position.x}:y=${position.y}:enable='between(t,${startTime},${endTime})'${currentLabel};`
            : `${previousLabel}drawtext=fontfile=/${font}.ttf:text='${text}':fontcolor=${color}:fontsize=${fontSize}:x=${position.x}:y=${position.y}:enable='between(t,${startTime},${endTime})'${currentLabel};`;
      });
      // filterComplex = `[0:v]${filterComplex}`;
    }
  } else {
    // Process text overlays
    textOverlays.forEach((overlay, index) => {
      const previousLabel = `[tmp${index}]`;
      const currentLabel = `[tmp${index + 1}]`;
      const { text, fontSize, position, font, color, startTime, endTime } =
        overlay;
      filterComplex += `drawtext=fontfile=/${font}.ttf:text='${text}':fontcolor=${color}:fontsize=${fontSize}:x=${position.x}:y=${position.y}:enable='between(t,${startTime},${endTime})';`;
    });
  }

  // Trim the trailing semicolon
  filterComplex = filterComplex.slice(0, -1);
  const ffmpegCommand =
    imageInputs?.length > 0
      ? [
          "-i",
          input,
          ...imageInputs.flatMap((src) => ["-i", src]),
          "-filter_complex",
          filterComplex,
          "-ss",
          videoSettings.customStartTime.toString(),
          "-to",
          videoSettings.customEndTime.toString(),
          // "-c:v",
          // "libx264",
          // "-crf",
          // "23",
          // "-preset",
          // "medium",
          // "-c:a",
          // "aac",
          // "-b:a",
          // "128k",
          output,
        ]
      : [
          "-i",
          input,
          "-filter_complex",
          filterComplex,
          "-ss",
          videoSettings.customStartTime.toString(),
          "-to",
          videoSettings.customEndTime.toString(),
          // "-c:v",
          // "libx264",
          // "-crf",
          // "23",
          // "-preset",
          // "medium",
          // "-c:a",
          // "aac",
          // "-b:a",
          // "128k",
          output,
        ];
  console.log(JSON.stringify(ffmpegCommand), filterComplex);
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
