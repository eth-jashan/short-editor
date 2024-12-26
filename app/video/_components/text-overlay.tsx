import { VideoInputSettings } from "@/utils/types";
import { motion } from "framer-motion";
import { VideoSlider } from "../../../components/ui/video-slider";
import { useEffect, useState } from "react";
import { calculateTimeInHoursMinutesSeconds } from "../../../utils/timeConverter";
import { TextOverlay, useVideoEditor } from "@/context/VideoEditorContext";
import { v4 as uuidv4 } from "uuid";
import * as SelectPrimitive from "@radix-ui/react-select";
import { TextField } from "@radix-ui/themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Cross1Icon, CrossCircledIcon } from "@radix-ui/react-icons";
import { GoogleFontSelect } from "./google-font-select";

type TextOverlayProps = {
  videoSettings: VideoInputSettings;
  onVideoSettingsChange: (value: VideoInputSettings) => void;
  disable: boolean;
};

export const TextOverlay = ({
  videoSettings,
  onVideoSettingsChange,
  disable,
}: TextOverlayProps) => {
  const { textOverlays, removeTextOverlay, setTextOverlays } = useVideoEditor();

  const { customStartTime, customEndTime } = videoSettings;
  const [videoEndTime, setVideoEndTime] = useState(0);
  const startTime = calculateTimeInHoursMinutesSeconds(0);
  const endTime = calculateTimeInHoursMinutesSeconds(customEndTime);

  const size: { label: string; value: string }[] = [
    { label: "18", value: "18" },
    { label: "24", value: "24" },
    { label: "32", value: "32" },
    { label: "44", value: "44" },
    { label: "64", value: "64" },
  ];
  const fonts: { label: string; value: string }[] = [
    { label: "arial", value: "arial" },
    { label: "opensans", value: "opensans" },
    { label: "roboto", value: "roboto" },
  ];
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

  const addTextOverlay = () => {
    setTextOverlays((prev: TextOverlay[]) => [
      ...prev,
      {
        id: uuidv4(), // Unique ID for each overlay
        text: "New Text",
        position: { x: 50, y: 50 },
        size: { width: 200, height: 50 },
        startTime: 0,
        endTime: customEndTime,
        fontSize: 24,
        color: "black",
        font: "arial",
      },
    ]);
  };
  const updateOverlay = (
    id: number,
    updates: Partial<(typeof textOverlays)[0]>
  ) => {
    setTextOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === id ? { ...overlay, ...updates } : overlay
      )
    );
  };
  console.log(videoSettings);
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
          <p>Text Overlays</p>
        </div>

        {textOverlays.map((item, index) => (
          <>
            <div className="mt-4 mb-6 flex flex-row justify-center align-middle items-center">
              <TextField.Root
                value={item.text}
                className="flex-1"
                onChange={({ target }) => {
                  updateOverlay(item.id, {
                    ...item,
                    text: target?.value,
                  });
                }}
                variant="soft"
                placeholder="Add text"
              />
              <CrossCircledIcon
                onClick={() => removeTextOverlay(item.id)}
                width={16} // Set custom width
                height={16}
                color="red" // Set custom height
              />
            </div>
            <div className="flex justify-between items-center border-b mb-2 pb-2 flex-column">
              <VideoSlider
                disabled={disable}
                value={[item.startTime, item.endTime]}
                max={videoEndTime}
                step={1}
                className="w-full"
                onValueChange={(value: number[]) => {
                  console.log("here.....");
                  const [startTime, endTime] = value;
                  updateOverlay(item.id, { ...item, startTime, endTime });
                }}
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

            <div className="flex justify-between items-center border-b mb-2 pb-2 mt-4">
              <p>Font</p>
              <GoogleFontSelect
                disabled={disable}
                value={item.font}
                onValueChange={(value: string) => {
                  updateOverlay(item.id, {
                    ...item,
                    font: value,
                  });
                }}
              />
            </div>
            <div className="flex justify-between items-center border-b mb-2 pb-2 mt-4">
              <p>Color</p>
              <TextField.Root
                value={item.color}
                className="mt-4"
                onChange={({ target }) => {
                  updateOverlay(item.id, {
                    ...item,
                    color: target?.value,
                  });
                }}
                variant="soft"
                placeholder="Enter color"
              />
            </div>
            <div className="flex justify-between items-center border-b mb-2 pb-2 mt-4">
              <p>Size</p>
              <Select
                disabled={disable}
                value={item.fontSize?.toString()}
                onValueChange={(value: string) => {
                  console.log(value);
                  updateOverlay(item.id, {
                    ...item,
                    fontSize: parseInt(value),
                  });
                  // const videoType = value as VideoFormats;
                  // onVideoSettingsChange({ ...videoSettings, videoType });
                }}
              >
                <SelectTrigger className="w-[150px] text-sm">
                  <SelectValue placeholder="Select Format" />
                </SelectTrigger>
                <SelectContent>
                  {size.map(({ label, value }) => (
                    <SelectItem value={value} key={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* <div className="flex justify-between items-center border-b mb-2 pb-2 mt-4">
              <p>Size</p> */}
            {/* <Select
                disabled={disable}
                value={item.fontSize?.toString()}
                onValueChange={(value: string) => {
                  console.log(value);
                  updateOverlay(item.id, {
                    ...item,
                    fontSize: parseInt(value),
                  });
                  // const videoType = value as VideoFormats;
                  // onVideoSettingsChange({ ...videoSettings, videoType });
                }}
              >
                <SelectTrigger className="w-[150px] text-sm">
                  <SelectValue placeholder="Select Format" />
                </SelectTrigger>
                <SelectContent>
                  {size.map(({ label, value }) => (
                    <SelectItem value={value} key={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select> */}
            {/* <GoogleFontSelect
                disabled={disable}
                value={item.font}
                onValueChange={(value: string) => {
                  updateOverlay(item.id, {
                    ...item,
                    font: value,
                  });
                }}
              /> */}
            {/* </div> */}
          </>
        ))}
        <button
          onClick={addTextOverlay}
          type="button"
          className="bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-zinc-700 via-zinc-950 to-zinc-950 rounded-lg text-white/90 relative px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-500 focus:ring-zinc-950 flex-shrink-0 mt-2"
        >
          Add Text
        </button>
      </div>
    </motion.div>
  );
};
