"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CustomDropZone } from "./custom-dropzone";
import { acceptedVideoFiles } from "@/utils/formats";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileActions,
  QualityType,
  VideoFormats,
  VideoInputSettings,
} from "@/utils/types";
import { VideoDisplay } from "./video-display";
import { VideoInputDetails } from "./video-input-details";
import { VideoTrim } from "./video-trim";
import { VideoInputControl } from "./video-input-control";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { toast } from "sonner";
import convertFile from "@/utils/convert";
import { VideoCondenseProgress } from "./video-condense-progress";
import { VideoOutputDetails } from "./video-output-details";
import { TextOverlay } from "./text-overlay";
import {
  VideoEditorProvider,
  useVideoEditor,
} from "@/context/VideoEditorContext";
import { ImageOverlay } from "./image-overlay";
import ReactPlayer from "react-player";

const CondenseVideo = () => {
  const {
    textOverlays,
    setTextOverlays,
    videoFile,
    setVideoFile,
    handleVideoFile,
    progress,
    setProgess,
    imageOverlays,
    setFfmpegRef,
    setThumbnails,
    resetState,
  } = useVideoEditor();
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [time, setTime] = useState<{
    startTime?: Date;
    elapsedSeconds?: number;
  }>({ elapsedSeconds: 0 });

  const [status, setStatus] = useState<
    "notStarted" | "converted" | "processing"
  >("notStarted");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoSettings, setVideoSettings] = useState<VideoInputSettings>({
    quality: QualityType.High,
    videoType: VideoFormats.MP4,
    customEndTime: 0,
    customStartTime: 0,
    removeAudio: false,
    twitterCompressionCommand: false,
    whatsappStatusCompressionCommand: false,
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handleUpload = (file: File) => {
    handleVideoFile({
      fileName: file.name,
      fileSize: file.size,
      from: file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2),
      fileType: file.type,
      file,
      isError: false,
    });
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (time?.startTime) {
      timer = setInterval(() => {
        const endTime = new Date();
        const timeDifference = endTime.getTime() - time.startTime!.getTime();
        setTime({ ...time, elapsedSeconds: timeDifference });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [time]);

  const ffmpegRef = useRef(new FFmpeg());

  const disableDuringCompression = status === "processing";

  const load = async () => {
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.load({
      coreURL: await toBlobURL(
        `https://vide-editor-beta.vercel.app/download/ffmpeg-core.js`,
        "text/javascript"
      ),
      wasmURL: await toBlobURL(
        `https://vide-editor-beta.vercel.app/download/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    setFfmpegRef(ffmpegRef);
  };
  const loadWithVideoPersist = async () => {
    if (videoFile?.file && ffmpegRef.current) {
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `https://vide-editor-beta.vercel.app/download/ffmpeg-core.js`,
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          `https://vide-editor-beta.vercel.app/download/ffmpeg-core.wasm`,
          "application/wasm"
        ),
      });
      await generateThumbnails(ffmpeg, videoFile?.file);
    }
  };
  const loadWithToast = () => {
    toast.promise(load, {
      loading: "Downloading necessary packages from FFmpeg for offline use.",
      success: () => {
        return "All necessary file downloaded";
      },
      error: "Error loading FFmpeg packages",
    });
  };

  useEffect(() => {
    loadWithToast();
  }, []);
  useEffect(() => {
    loadWithVideoPersist();
  }, [videoFile]);
  const condense = async () => {
    if (!videoFile) return;
    try {
      setTime({ ...time, startTime: new Date() });
      setStatus("processing");
      ffmpegRef.current.on("progress", ({ progress: completion, time }) => {
        const percentage = completion * 100;
        setProgess(percentage);
      });
      ffmpegRef.current.on("log", ({ message }) => {
        console.log(message);
      });

      const { url, output, outputBlob } = await convertFile(
        ffmpegRef.current,
        videoFile,
        videoSettings,
        textOverlays,
        imageOverlays
      );
      handleVideoFile({
        ...videoFile,
        url,
        output,
        outputBlob,
      });
      setTime((oldTime) => ({ ...oldTime, startTime: undefined }));
      setStatus("converted");
      setProgess(0);
    } catch (err) {
      console.log(err);
      setStatus("notStarted");
      setProgess(0);
      setTime({ elapsedSeconds: 0, startTime: undefined });
      toast.error("Error condensing video");
    }
  };

  const generateThumbnails = useCallback(async (ffmpeg: FFmpeg, file: File) => {
    // setLoading(true);
    setThumbnails([]);

    const inputVideoName = "input.mp4";
    const thumbnailPattern = "thumbnail-%03d.png";
    // loadFFmpeg();
    if (!ffmpeg) return;
    // const ffmpeg = ffmpegRef.current;
    // await ffmpegRef.current?.load();
    await ffmpeg?.writeFile(inputVideoName, await fetchFile(file));

    await ffmpeg.exec(["-i", inputVideoName, "-vf", "fps=1", thumbnailPattern]);

    const generatedThumbnails: string[] = [];
    for (let i = 1; ; i++) {
      const fileName = `thumbnail-${i.toString().padStart(3, "0")}.png`;
      try {
        const data = await ffmpeg?.readFile(fileName);
        const url = URL.createObjectURL(
          new Blob([data.buffer], { type: "image/png" })
        );
        generatedThumbnails.push(url);
      } catch (error) {
        break;
      }
    }
    setThumbnails(generatedThumbnails);
  }, []);
  return (
    <>
      <motion.div
        layout
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        key={"drag"}
        transition={{ type: "tween" }}
        className="border rounded-3xl col-span-5 flex w-full md:h-full bg-gray-50/35"
      >
        {videoFile ? (
          <VideoDisplay
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            videoRef={videoRef}
            videoUrl={URL.createObjectURL(videoFile.file)}
            videoSettings={videoSettings}
          />
        ) : (
          <CustomDropZone
            handleUpload={handleUpload}
            acceptedFiles={acceptedVideoFiles}
          />
        )}
      </motion.div>
      <AnimatePresence mode="popLayout">
        <motion.div className="border rounded-3xl col-span-3 flex w-full md:h-full bg-gray-50/35 p-4 relative">
          <div className="flex flex-col gap-4 w-full">
            {videoFile && (
              <>
                <VideoInputDetails
                  videoFile={videoFile}
                  onClear={() => resetState()}
                />
                <VideoTrim
                  currentTime={currentTime}
                  videoRef={videoRef}
                  disable={disableDuringCompression}
                  onVideoSettingsChange={setVideoSettings}
                  videoSettings={videoSettings}
                />
                <TextOverlay
                  disable={disableDuringCompression}
                  onVideoSettingsChange={setVideoSettings}
                  videoSettings={videoSettings}
                />
                <ImageOverlay
                  disable={disableDuringCompression}
                  onVideoSettingsChange={setVideoSettings}
                  videoSettings={videoSettings}
                />
              </>
            )}
            <VideoInputControl
              disable={disableDuringCompression}
              onVideoSettingsChange={setVideoSettings}
              videoSettings={videoSettings}
            />

            <motion.div
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              key={"button"}
              transition={{ type: "tween" }}
              className="bg-gray-100 border-gray-200 rounded-2xl p-3 h-fit"
            >
              {status === "processing" && (
                <VideoCondenseProgress
                  progress={progress}
                  seconds={time.elapsedSeconds!}
                />
              )}

              {(status === "notStarted" || status === "converted") && (
                <button
                  onClick={condense}
                  type="button"
                  className="bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-zinc-700 via-zinc-950 to-zinc-950 rounded-lg text-white/90 relative px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-500 focus:ring-zinc-950 flex-shrink-0"
                >
                  Process Video
                </button>
              )}
            </motion.div>
            {status === "converted" && videoFile && (
              <VideoOutputDetails
                timeTaken={time.elapsedSeconds}
                videoFile={videoFile!}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default CondenseVideo;
