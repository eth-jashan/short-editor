import { VideoInputSettings } from "@/utils/types";
import { motion } from "framer-motion";
import { VideoSlider } from "../../../components/ui/video-slider";
import { MutableRefObject, useEffect, useState } from "react";
import { calculateTimeInHoursMinutesSeconds } from "../../../utils/timeConverter";
import { useVideoEditor } from "@/context/VideoEditorContext";
import { PauseIcon, PlayIcon, ResetIcon } from "@radix-ui/react-icons";

type VideoTrimProps = {
  videoSettings: VideoInputSettings;
  onVideoSettingsChange: (value: VideoInputSettings) => void;
  disable: boolean;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  currentTime: number;
};

export const VideoTrim = ({
  videoSettings,
  videoRef,
  onVideoSettingsChange,
  disable,
  currentTime,
}: VideoTrimProps) => {
  const [play, setPlay] = useState(false);
  const [videoEndTime, setVideoEndTime] = useState(0);
  const { thumbnails } = useVideoEditor();
  const { customStartTime, customEndTime } = videoSettings;
  const startTime = calculateTimeInHoursMinutesSeconds(customStartTime);
  const endTime = calculateTimeInHoursMinutesSeconds(customEndTime);

  useEffect(() => {
    const video = document.getElementById(
      "condense-video-player"
    ) as HTMLVideoElement;

    if (video) {
      const handleLoadedMetadata = () => {
        const durationInSeconds = video.duration;
        onVideoSettingsChange({
          ...videoSettings,
          customEndTime: durationInSeconds,
        });
        setVideoEndTime(durationInSeconds);
      };
      video.addEventListener("loadedmetadata", handleLoadedMetadata);

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }
  }, []);
  // console.log("play", videoSettings);
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      key={"drag"}
      transition={{ type: "tween" }}
      className="rounded-2xl px-4 py-3 h-fit bg-gray-100 border border-gray-200"
    >
      <div className="text-sm">
        <div className="flex justify-between items-center border-b mb-2 pb-2">
          <p>Trim Video</p>
        </div>
        <div className="flex items-center mb-2 pb-2">
          <ResetIcon
            onClick={() => {
              let time = 0;
              if (videoRef.current) {
                videoRef.current.currentTime = time;
                videoRef.current?.pause();
                setPlay(false);
              }
            }}
            width={24} // Set custom width
            height={24} // Set custom height
            style={{ cursor: "pointer" }} // Add custom styles if needed
          />
          {!play ? (
            <PlayIcon
              onClick={() => {
                videoRef.current?.play();
                setPlay(!play);
              }}
              width={24} // Set custom width
              height={24} // Set custom height
              style={{ cursor: "pointer" }} // Add custom styles if needed
            />
          ) : (
            <PauseIcon
              onClick={() => {
                videoRef.current?.pause();
                setPlay(!play);
              }}
              width={24} // Set custom width
              height={24} // Set custom height
              style={{ cursor: "pointer" }} // Add custom styles if needed
            />
          )}
          <p className="ml-4">
            {calculateTimeInHoursMinutesSeconds(currentTime ?? 0)}
          </p>
        </div>
        <div className="flex justify-between items-center border-b mb-2 pb-2">
          <VideoSlider
            disabled={disable}
            value={[customStartTime, customEndTime]}
            max={videoEndTime}
            step={1}
            className="w-full"
            onValueChange={(value: number[]) => {
              const [startTime, endTime] = value;
              onVideoSettingsChange({
                ...videoSettings,
                customEndTime: endTime,
                customStartTime: startTime,
              });
            }}
          />
        </div>
        <div className="flex justify-between">
          <div>
            <p className="text-gray-500">Start Time</p>
            <p className="font-medium">{startTime}</p>
          </div>
          <div>
            <p className="text-gray-500">End Time</p>
            <p className="font-medium">{endTime}</p>
          </div>
        </div>
        <div className="thumbnails flex overflow-x-auto mt-4 relative">
          {thumbnails
            ?.slice(
              videoSettings?.customStartTime,
              videoSettings?.customEndTime
            )
            .map((thumbnail, index) => (
              <img
                key={index}
                src={thumbnail}
                alt={`Thumbnail ${index}`}
                className="w-6 h-auto border border-gray-300"
                onClick={() => {
                  const time = index + 1; // Each thumbnail represents a second
                  if (videoRef.current) {
                    videoRef.current.currentTime = time + customStartTime;
                  }
                }}
              />
            ))}
        </div>
      </div>
    </motion.div>
  );
};
