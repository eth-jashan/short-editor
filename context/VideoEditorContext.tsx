"use client";

import {
  FileActions,
  QualityType,
  VideoFormats,
  VideoInputSettings,
} from "@/utils/types";
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
  videoFile: FileActions | null;
  setVideoFile: (file: FileActions | null) => void;
  progress: number;
  setProgess: (progress: number) => void;
  handleVideoFile: (file: FileActions | null) => Promise<void>;
}

const VideoEditorContext = createContext<VideoEditorContextType | undefined>(
  undefined
);

async function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("VideoEditorDB", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveFileToDB(file: File) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("files", "readwrite");
    const store = transaction.objectStore("files");

    const fileData = {
      id: "uploadedFile",
      name: file.name,
      type: file.type,
      size: file.size,
      data: file, // The actual file blob
    };

    const request = store.put(fileData);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getFileFromDB() {
  const db = await openDatabase();
  return new Promise<any>((resolve, reject) => {
    const transaction = db.transaction("files", "readonly");
    const store = transaction.objectStore("files");
    const request = store.get("uploadedFile");

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteFileFromDB() {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("files", "readwrite");
    const store = transaction.objectStore("files");
    const request = store.delete("uploadedFile");

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoFile, setVideoFile] = useState<FileActions | null>(null);
  const [progress, setProgess] = useState<number>(0);

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

    const loadFile = async () => {
      const savedFile = await getFileFromDB();
      if (savedFile) {
        const fileActions: FileActions = {
          file: savedFile.data,
          fileName: savedFile.name,
          fileSize: savedFile.size,
          fileType: savedFile.type,
          from: "local",
          url: URL.createObjectURL(savedFile.data),
        };
        handleVideoFile(fileActions);
      }
    };

    loadFile();
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const stateToSave = {
      trimStart,
      trimEnd,
      textOverlays,
      imageOverlays,
      videoUrl,
      duration,
      thumbnails,
    };

    localStorage.setItem("VideoEditorState", JSON.stringify(stateToSave));
  }, [
    isLoaded,
    trimStart,
    trimEnd,
    textOverlays,
    imageOverlays,
    videoUrl,
    duration,
    thumbnails,
  ]);

  const handleVideoFile = async (fileActions: FileActions | null) => {
    if (fileActions) {
      // const fileActions: FileActions = {
      //   file,
      //   fileName: file.name,
      //   fileSize: file.size,
      //   fileType: file.type,
      //   from: "local",
      //   url: URL.createObjectURL(file),
      // };

      try {
        await saveFileToDB(fileActions.file);
        setVideoFile(fileActions);
      } catch (error) {
        console.error("Error saving file to IndexedDB:", error);
      }
    } else {
      await deleteFileFromDB();
      setVideoFile(null);
    }
  };

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
        videoFile,
        setVideoFile,
        handleVideoFile,
        progress,
        setProgess,
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
