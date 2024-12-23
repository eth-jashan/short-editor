import { TextOverlay, useVideoEditor } from "@/context/VideoEditorContext";
import { arialFont, openSansFont, robotoFont } from "@/lib/utils";
import { VideoInputSettings } from "@/utils/types";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";

export const VideoDisplay = ({
  videoUrl,
  videoRef,
  currentTime,
  setCurrentTime,
  videoSettings,
}: {
  videoUrl: string;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  videoSettings: VideoInputSettings;
  currentTime: number;
  setCurrentTime: (seconds: number) => void;
}) => {
  const { textOverlays, imageOverlays, setImageOverlays, setTextOverlays } =
    useVideoEditor();

  const updateOverlay = (id: string, newProps: Partial<TextOverlay>) => {
    setTextOverlays((overlays) =>
      overlays.map((overlay) =>
        overlay.id === id ? { ...overlay, ...newProps } : overlay
      )
    );
  };

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement) {
      const handleTimeUpdate = () => {
        setCurrentTime(videoElement.currentTime);
      };

      // Attach event listener
      videoElement.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        // Cleanup event listener on unmount
        videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, []);
  const handleDrag = (e: any, id: string) => {
    const { left, top } = e;
    updateOverlay(id, { position: { x: left, y: top } });
  };

  const handleResize = (e: any, id: string) => {
    const { width, height, drag } = e;
    updateOverlay(id, {
      size: { width, height },
      position: { x: drag.left, y: drag.top },
    });
  };
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
  const fontClassNameOnType = (fontType: string) => {
    switch (fontType) {
      case "arial":
        return arialFont.className;
      case "opensans":
        return openSansFont.className;
      case "roboto":
        return robotoFont.className;
    }
  };
  console.log(currentTime, currentTime, textOverlays);
  return (
    <div className="h-150" style={{ position: "relative", overflow: "hidden" }}>
      <video
        ref={videoRef}
        style={{ pointerEvents: "none" }}
        id="condense-video-player"
        controls
        className="max-h-150 w-full"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
      {imageOverlays.map((overlay) => (
        <Rnd
          key={overlay.id}
          style={
            currentTime <= overlay.endTime && currentTime >= overlay.startTime
              ? {
                  position: "absolute",
                }
              : { display: "none" }
          }
          size={overlay.size}
          position={overlay.position}
          onDragStop={(e, d) =>
            updateImageOverlay(overlay.id, {
              position: { x: d.x, y: d.y },
            })
          }
          onResizeStop={(e, direction, ref, delta, position) =>
            updateImageOverlay(overlay.id, {
              size: { width: ref.offsetWidth, height: ref.offsetHeight },
              position,
            })
          }
        >
          <img
            src={overlay.src}
            alt="Overlay"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              border: "1px solid #ccc",
            }}
          />
        </Rnd>
      ))}
      {textOverlays.map((overlay) => (
        <Rnd
          key={overlay.id}
          style={
            currentTime <= overlay.endTime && currentTime >= overlay.startTime
              ? {
                  position: "absolute",
                }
              : {
                  display: "none",
                }
          }
          size={overlay.size}
          position={overlay.position}
          onDragStop={(e, d) =>
            updateOverlay(overlay.id, { position: { x: d.x, y: d.y } })
          }
          onResizeStop={(e, direction, ref, delta, position) =>
            updateOverlay(overlay.id, {
              size: {
                width: ref.offsetWidth,
                height: ref.offsetHeight,
              },
              position,
            })
          }
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <input
              className={fontClassNameOnType(overlay.font)}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                textAlign: "center",
                fontSize: overlay.fontSize,
                color: overlay.color,
              }}
              value={overlay?.text}
              onChange={(e) =>
                updateOverlay(overlay.id, { text: e.target.value })
              }
            />
          </div>
        </Rnd>
      ))}
    </div>
  );
};
// export const VideoDisplay = ({
//   videoUrl,
//   videoRef,
//   videoSettings,
// }: {
//   videoUrl: string;
//   videoRef: MutableRefObject<HTMLVideoElement | null>;
//   videoSettings: VideoInputSettings;
// }) => {
//   const {
//     textOverlays,
//     trimStart,
//     trimEnd,
//     setTrimEnd,
//     imageOverlays,
//     setImageOverlays,
//     setTextOverlays,
//     setState,
//   } = useVideoEditor();
//   const videoContainerRef = useRef<HTMLDivElement>(null);
//   const [currentTime, setCurrentTime] = useState<number>(0);

//   useEffect(() => {
//     const videoElement = videoRef.current;

//     if (videoElement) {
//       const handleTimeUpdate = () => {
//         setCurrentTime(videoElement.currentTime);
//       };

//       // Attach event listener
//       videoElement.addEventListener("timeupdate", handleTimeUpdate);

//       return () => {
//         // Cleanup event listener on unmount
//         videoElement.removeEventListener("timeupdate", handleTimeUpdate);
//       };
//     }
//   }, []);

//   const updateOverlay = (id: string, newProps: Partial<TextOverlay>) => {
//     setTextOverlays((overlays) =>
//       overlays.map((overlay) =>
//         overlay.id === id ? { ...overlay, ...newProps } : overlay
//       )
//     );
//   };

//   const updateImageOverlay = (
//     id: number,
//     updates: Partial<(typeof imageOverlays)[0]>
//   ) => {
//     setImageOverlays((prev) =>
//       prev.map((overlay) =>
//         overlay.id === id ? { ...overlay, ...updates } : overlay
//       )
//     );
//   };

//   const fontClassNameOnType = (fontType: string) => {
//     switch (fontType) {
//       case "arial":
//         return arialFont.className;
//       case "opensans":
//         return openSansFont.className;
//       case "roboto":
//         return robotoFont.className;
//     }
//   };

//   return (
//     <div
//       ref={videoContainerRef}
//       className="relative w-full h-full"
//       style={{
//         position: "relative", // Ensure container has relative positioning
//         width: "100%",
//         overflow: "hidden", // Prevent any overflow caused by overlays
//       }}
//     >
//       {/* Video Player */}
//       <video
//         ref={videoRef}
//         style={{ pointerEvents: "none", zIndex: 1 }} // Ensure video stays behind overlays
//         id="condense-video-player"
//         controls
//         className="absolute top-0 left-0 w-full h-full"
//       >
//         <source src={videoUrl} type="video/mp4" />
//       </video>

//       {/* Image Overlays */}
//       {imageOverlays.map((overlay) => (
//         <Rnd
//           key={overlay.id}
//           style={
//             currentTime <= overlay.endTime && currentTime >= overlay.startTime
//               ? {
//                   position: "absolute",
//                   zIndex: 2, // Ensure it appears above the video
//                 }
//               : { display: "none" }
//           }
//           size={overlay.size}
//           position={overlay.position}
//           onDragStop={(e, d) =>
//             updateImageOverlay(overlay.id, {
//               position: { x: d.x, y: d.y },
//             })
//           }
//           onResizeStop={(e, direction, ref, delta, position) =>
//             updateImageOverlay(overlay.id, {
//               size: { width: ref.offsetWidth, height: ref.offsetHeight },
//               position,
//             })
//           }
//         >
//           <img
//             src={overlay.src}
//             alt="Overlay"
//             style={{
//               width: "100%",
//               height: "100%",
//               objectFit: "cover",
//               border: "1px solid #ccc",
//             }}
//           />
//         </Rnd>
//       ))}

//       {/* Text Overlays */}
//       {textOverlays.map((overlay) => (
//         <Rnd
//           key={overlay.id}
//           style={
//             currentTime <= overlay.endTime && currentTime >= overlay.startTime
//               ? {
//                   position: "absolute",
//                   zIndex: 3, // Ensure it appears above the video and images
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   fontSize: "16px",
//                   fontWeight: "bold",
//                 }
//               : {
//                   display: "none",
//                 }
//           }
//           size={overlay.size}
//           position={overlay.position}
//           onDragStop={(e, d) =>
//             updateOverlay(overlay.id, { position: { x: d.x, y: d.y } })
//           }
//           onResizeStop={(e, direction, ref, delta, position) =>
//             updateOverlay(overlay.id, {
//               size: {
//                 width: ref.offsetWidth,
//                 height: ref.offsetHeight,
//               },
//               position,
//             })
//           }
//         >
//           <div style={{ display: "flex", flexDirection: "column" }}>
//             <input
//               className={fontClassNameOnType(overlay.font || "arial")}
//               style={{
//                 width: "100%",
//                 border: "none",
//                 background: "transparent",
//                 textAlign: "center",
//                 fontSize: overlay.fontSize,
//                 color: overlay.color,
//               }}
//               value={overlay.text}
//               onChange={(e) =>
//                 updateOverlay(overlay.id, { text: e.target.value })
//               }
//             />
//           </div>
//         </Rnd>
//       ))}
//     </div>
//   );
// };
