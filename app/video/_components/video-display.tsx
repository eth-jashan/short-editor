import { TextOverlay, useVideoEditor } from "@/context/VideoEditorContext";
import { useRef, useState } from "react";
import Moveable from "react-moveable";
import { Rnd } from "react-rnd";

export const VideoDisplay = ({ videoUrl }: { videoUrl: string }) => {
  const { textOverlays, imageOverlays, setImageOverlays, setTextOverlays } =
    useVideoEditor();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const updateOverlay = (id: string, newProps: Partial<TextOverlay>) => {
    setTextOverlays((overlays) =>
      overlays.map((overlay) =>
        overlay.id === id ? { ...overlay, ...newProps } : overlay
      )
    );
  };
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
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
  return (
    <div ref={videoContainerRef} className="relative h-full w-full rounded-3xl">
      <video
        id="condense-video-player"
        controls
        className="h-full w-full rounded-3xl"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
      {imageOverlays.map((overlay) => (
        <Rnd
          key={overlay.id}
          style={{
            position: "absolute",
          }}
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
          style={{
            position: "absolute",
            background: "rgba(255, 255, 255, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontWeight: "bold",
          }}
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
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                textAlign: "center",
                fontSize: overlay.fontSize,
              }}
              value={overlay.text}
              onChange={(e) =>
                updateOverlay(overlay.id, { text: e.target.value })
              }
            />
            {/* <button onClick={() => removeOverlay(overlay.id)}>Remove</button> */}
          </div>
        </Rnd>
      ))}
    </div>
  );
};
