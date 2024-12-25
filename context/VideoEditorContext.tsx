"use client";

import { FileActions } from "@/utils/types";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  MutableRefObject,
} from "react";
import { OnProgressProps } from "react-player/base";

export interface TextOverlay {
  id: number;
  text: string;
  fontSize: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  startTime: number;
  endTime: number;
  color: string;
  font: string;
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
  addImageOverlay: (imageFile: File, videoEndTime: number) => void;
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
  state: OnProgressProps;
  setState: (state: OnProgressProps) => void;
  ffmpegRef: MutableRefObject<FFmpeg>;
  setFfmpegRef: (ffmpeg: MutableRefObject<FFmpeg>) => void;
  resetState: () => Promise<void>;
  removeImageOverlay: (id: number) => Promise<void>;
  removeTextOverlay: (id: number) => void;
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
      data: file,
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

async function saveImageOverlayToDB(overlay: ImageOverlay, file: File) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("files", "readwrite");
    const store = transaction.objectStore("files");

    const fileData = {
      id: overlay.id,
      overlay: { ...overlay }, // Save all overlay properties
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        data: file, // The actual file blob
      },
    };

    const request = store.put(fileData);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getImageOverlaysFromDB(): Promise<ImageOverlay[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("files", "readonly");
    const store = transaction.objectStore("files");

    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result;
      const overlays = results
        .map((item: any) => (item?.overlay ? item : null))
        .filter((x) => x !== null);

      const newOverlays = overlays.map((x) => {
        console.log("image overlaysss....", x);
        const src = URL.createObjectURL(x.file.data);
        return { ...x.overlay, src };
      });

      console.log("image overlaysss....", newOverlays);
      resolve(newOverlays);
    };

    request.onerror = () => reject(request.error);
  });
}

async function clearImageOverlaysFromDB() {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("files", "readwrite");
    const store = transaction.objectStore("files");
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// VideoEditorProvider Component
export function VideoEditorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [trimStart, setTrimStart] = useState(0);
  const [state, setState] = useState<OnProgressProps>({
    played: 0,
    playedSeconds: 0,
    loaded: 0,
    loadedSeconds: 0,
  });
  const [trimEnd, setTrimEnd] = useState(0);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [imageOverlays, setImageOverlays] = useState<ImageOverlay[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoFile, setVideoFile] = useState<FileActions | null>(null);
  const [progress, setProgess] = useState<number>(0);
  const [ffmpegRef, setFfmpegRef] = useState<MutableRefObject<FFmpeg> | null>(
    null
  );

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
      const savedState = localStorage.getItem("VideoEditorState");
      const savedOverlays = await getImageOverlaysFromDB();
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        const newCopy = parsedState.imageOverlays.map((x, i) => {
          console.log({ ...x, src: savedOverlays[i].src });
          return { ...x, src: savedOverlays[i].src };
        });
        if (savedOverlays) {
          setImageOverlays(newCopy); // Load overlays with all properties
        }
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
  ]);

  const handleVideoFile = async (fileActions: FileActions | null) => {
    if (fileActions) {
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

  const addImageOverlay = async (imageFile: File, videoEndTime: number) => {
    const src = URL.createObjectURL(imageFile);
    const overlay: ImageOverlay = {
      id: Date.now(),
      src,
      position: { x: 50, y: 50 },
      size: { width: 150, height: 100 },
      startTime: 0,
      endTime: videoEndTime,
    };

    setImageOverlays((prev) => [...prev, overlay]);

    try {
      await saveImageOverlayToDB(overlay, imageFile); // Save complete overlay
    } catch (error) {
      console.error("Error saving image overlay to IndexedDB:", error);
    }
  };
  const removeTextOverlay = (id: number) => {
    setTextOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
  };

  // Function to remove an image overlay
  const removeImageOverlay = async (id: number) => {
    setImageOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
    const db = await openDatabase();
    const transaction = db.transaction("files", "readwrite");
    const store = transaction.objectStore("files");
    const request = store.delete(id);

    request.onerror = () => {
      console.error("Failed to delete image overlay from IndexedDB.");
    };
  };
  const resetState = async () => {
    setTrimStart(0);
    setTrimEnd(0);
    setTextOverlays([]);
    setImageOverlays([]);
    setVideoUrl(null);
    setDuration(0);
    setThumbnails([]);
    setVideoFile(null);
    setProgess(0);
    localStorage.removeItem("VideoEditorState");
    await deleteFileFromDB();
    await clearImageOverlaysFromDB();
  };

  return (
    <VideoEditorContext.Provider
      value={{
        setFfmpegRef,
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
        state,
        setState,
        ffmpegRef,
        resetState,
        removeTextOverlay,
        removeImageOverlay,
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
