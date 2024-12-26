import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GOOGLE_FONTS_API_KEY = ""; // Replace with your Google Fonts API key
const GOOGLE_FONTS_API = `https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}`;

interface FontOption {
  family: string;
  files: {
    regular: string;
  };
  category: string;
}

export const GoogleFontSelect = ({
  value,
  onValueChange,
  disabled = false,
}: {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) => {
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const response = await fetch(GOOGLE_FONTS_API);
        const data = await response.json();
        // Get only the first 100 fonts to avoid performance issues
        const popularFonts = data.items
          .filter((font: FontOption) => font.files.regular)
          .slice(0, 100);
        setFonts(popularFonts);
      } catch (error) {
        console.error("Error fetching Google Fonts:", error);
      }
    };

    fetchFonts();
  }, []);

  // Load font when it's needed
  const loadFont = async (fontFamily: string) => {
    if (loadedFonts.has(fontFamily)) return;

    try {
      const font = fonts.find((f) => f.family === fontFamily);
      if (!font) return;

      const fontFace = new FontFace(fontFamily, `url(${font.files.regular})`);
      await fontFace.load();
      document.fonts.add(fontFace);
      setLoadedFonts((prev) => new Set(prev).add(fontFamily));
    } catch (error) {
      console.error("Error loading font:", error);
    }
  };

  // Load font when hovering over option
  const handleFontHover = (fontFamily: string) => {
    loadFont(fontFamily);
  };

  return (
    <Select disabled={disabled} value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[200px] text-sm">
        <SelectValue placeholder="Select Font" style={{ fontFamily: value }} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {fonts.map(({ family }) => (
          <SelectItem
            key={family}
            value={family}
            onMouseEnter={() => handleFontHover(family)}
            style={{ fontFamily: loadedFonts.has(family) ? family : "inherit" }}
          >
            {family}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
