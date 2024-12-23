"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface TextOverlay {
  id: number;
  text: string;
  fontSize: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  startTime: number;
  endTime: number;
}
export interface ImageOverlay {
  id: number;
  src: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  startTime: number;
  endTime: number;
}

interface VideoEditorContextType {
  trimStart: number;
  trimEnd: number;
  textOverlays: TextOverlay[];
  imageOverlays: ImageOverlay[];
  setTrimStart: (start: number) => void;
  setTrimEnd: (end: number) => void;
  addTextOverlay: (overlay: TextOverlay) => void;
  addImageOverlay: (overlay: ImageOverlay) => void;
  videoUrl: string | null;
  setVideoUrl: (fileUrl: string) => void;
  duration: number;
  setDuration: (time: number) => void;
  thumbnails: string[];
  setThumbnails: (fileUrls: string[]) => void;
  setTextOverlays: (overlay: TextOverlay[]) => void;
  setImageOverlays: (overlay: ImageOverlay[]) => void;
}

const VideoEditorContext = createContext<VideoEditorContextType | undefined>(
  undefined
);

export function VideoEditorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [imageOverlays, setImageOverlays] = useState<ImageOverlay[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false); // New loading flag

  // Load state from localStorage when the component mounts

  useEffect(() => {
    const savedState = localStorage.getItem("VideoEditorState");
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      setTrimStart(parsedState.trimStart || 0);
      setTrimEnd(parsedState.trimEnd || 0);
      setTextOverlays(parsedState.textOverlays || []);
      setImageOverlays(parsedState.imageOverlays || []);
      setVideoUrl(parsedState.videoUrl || null);
      setDuration(parsedState.duration || 0);
      setThumbnails(parsedState.thumbnails || []);
    }
    setIsLoaded(true); // Mark as loaded after setting state
  }, []);

  // Persist state to localStorage only after loading completes
  // useEffect(() => {
  //   if (!isLoaded) return; // Prevent persistence until initial state is loaded

  //   const stateToSave = {
  //     trimStart,
  //     trimEnd,
  //     textOverlays,
  //     imageOverlays,
  //     videoUrl,
  //     duration,
  //     thumbnails,
  //   };

  //   console.log("Persisting state:", stateToSave);
  //   localStorage.setItem("VideoEditorState", JSON.stringify(stateToSave));
  // }, [
  //   isLoaded,
  //   trimStart,
  //   trimEnd,
  //   textOverlays,
  //   imageOverlays,
  //   videoUrl,
  //   duration,
  //   thumbnails,
  // ]);

  const addTextOverlay = (overlay: TextOverlay) => {
    setTextOverlays((prev) => [...prev, overlay]);
  };

  const addImageOverlay = (overlay: ImageOverlay) => {
    setImageOverlays((prev) => [...prev, overlay]);
  };

  return (
    <VideoEditorContext.Provider
      value={{
        trimStart,
        trimEnd,
        textOverlays,
        imageOverlays,
        setTrimStart,
        setTrimEnd,
        addTextOverlay,
        addImageOverlay,
        videoUrl,
        setVideoUrl,
        duration,
        setDuration,
        thumbnails,
        setThumbnails,
        setTextOverlays,
        setImageOverlays,
      }}
    >
      {children}
    </VideoEditorContext.Provider>
  );
}

export function useVideoEditor() {
  const context = useContext(VideoEditorContext);
  if (context === undefined) {
    throw new Error("useVideoEditor must be used within a VideoEditorProvider");
  }
  return context;
}
