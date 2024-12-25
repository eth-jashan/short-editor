import { VideoInputSettings } from "@/utils/types";
import { motion } from "framer-motion";
import { VideoSlider } from "../../../components/ui/video-slider";
import { useEffect, useState } from "react";
import { calculateTimeInHoursMinutesSeconds } from "../../../utils/timeConverter";
import { useVideoEditor } from "@/context/VideoEditorContext";

import { TextField } from "@radix-ui/themes";
import { CrossCircledIcon } from "@radix-ui/react-icons";
type TextOverlayProps = {
  videoSettings: VideoInputSettings;
  onVideoSettingsChange: (value: VideoInputSettings) => void;
  disable: boolean;
};

export const ImageOverlay = ({
  videoSettings,
  onVideoSettingsChange,
  disable,
}: TextOverlayProps) => {
  const {
    imageOverlays,
    addImageOverlay,
    removeImageOverlay,
    setImageOverlays,
  } = useVideoEditor();
  const [videoEndTime, setVideoEndTime] = useState(0);
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
  const updateImageOverlay = (
    id: number,
    updates: Partial<(typeof imageOverlays)[0]>
  ) => {
    setImageOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === id ? { ...overlay, ...updates } : overlay
      )
    );
  };
  // const addImageOverlay = (imageFile: File) => {
  //   const src = URL.createObjectURL(imageFile);
  //   setImageOverlays((prev) => [
  //     ...prev,
  //     {
  //       id: Date.now(),
  //       src,
  //       position: { x: 50, y: 50 },
  //       size: { width: 150, height: 100 },
  //       startTime: 0,
  //       endTime: videoEndTime,
  //     },
  //   ]);
  // };

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
          <p>Image Overlays</p>
        </div>

        {imageOverlays.map((item, index) => (
          <>
            <div className="flex justify-between items-center border-b mb-2 pb-2 flex-column">
              <VideoSlider
                disabled={disable}
                value={[item.startTime, item.endTime]}
                max={videoEndTime}
                step={1}
                className="w-full flex-1"
                onValueChange={(value: number[]) => {
                  const [startTime, endTime] = value;
                  updateImageOverlay(item.id, { ...item, startTime, endTime });
                }}
              />
              <CrossCircledIcon
                onClick={async () => await removeImageOverlay(item.id)}
                width={16} // Set custom width
                height={16}
                color="red" // Set custom height
              />
            </div>
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500">Start Time</p>
                <p className="font-medium">
                  {calculateTimeInHoursMinutesSeconds(item.startTime)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">End Time</p>
                <p className="font-medium">
                  {calculateTimeInHoursMinutesSeconds(item.endTime)}
                </p>
              </div>
            </div>
          </>
        ))}
        <div className="w-100% flex-row justify-between">
          <button
            onClick={() => {
              document.getElementById("fileInput").click();
            }}
            type="button"
            className="bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-zinc-700 via-zinc-950 to-zinc-950 rounded-lg text-white/90 relative px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-500 focus:ring-zinc-950 flex-shrink-0 mt-2"
          >
            Add Image
            <input
              onChange={(event) => {
                if (event.target.files?.[0]) {
                  console.log("uploade file........");
                  addImageOverlay(event.target.files[0], customEndTime);
                }
              }}
              style={{ display: "none" }}
              id="fileInput"
              type="file"
              accept="image/*"
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
