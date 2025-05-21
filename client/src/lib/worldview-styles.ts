/**
 * Religious Gurus - Comparative Worldview Explorer
 * Copyright (c) 2025 Religious Gurus Project
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { WorldView } from "@shared/schema";

// Worldview-specific styling - colors match the existing color scheme in the app
export const worldviewColors = {
  [WorldView.ATHEISM]: {
    primary: "#4B5563", // Gray
    secondary: "#9CA3AF", 
    background: "#F3F4F6",
    text: "#1F2937",
    accent: "#6B7280"
  },
  [WorldView.AGNOSTICISM]: {
    primary: "#6B7280", // Gray
    secondary: "#9CA3AF",
    background: "#F3F4F6",
    text: "#1F2937",
    accent: "#4B5563"
  },
  [WorldView.CHRISTIANITY]: {
    primary: "#3B82F6", // Blue
    secondary: "#60A5FA",
    background: "#EFF6FF",
    text: "#1E3A8A",
    accent: "#2563EB"
  },
  [WorldView.ISLAM]: {
    primary: "#10B981", // Emerald
    secondary: "#34D399",
    background: "#ECFDF5",
    text: "#065F46",
    accent: "#059669"
  },
  [WorldView.HINDUISM]: {
    primary: "#F59E0B", // Amber
    secondary: "#FBBF24",
    background: "#FFFBEB",
    text: "#92400E",
    accent: "#D97706"
  },
  [WorldView.BUDDHISM]: {
    primary: "#EC4899", // Pink
    secondary: "#F472B6",
    background: "#FCE7F3",
    text: "#831843",
    accent: "#DB2777"
  },
  [WorldView.JUDAISM]: {
    primary: "#6366F1", // Indigo
    secondary: "#818CF8",
    background: "#EEF2FF",
    text: "#312E81",
    accent: "#4F46E5"
  },
  [WorldView.SIKHISM]: {
    primary: "#F97316", // Orange
    secondary: "#FB923C",
    background: "#FFF7ED",
    text: "#9A3412",
    accent: "#EA580C"
  }
};

// Get a color for a specific worldview or return default
export function getWorldviewColor(worldview: WorldView, colorType: keyof typeof worldviewColors[WorldView.ATHEISM] = 'primary'): string {
  if (worldview in worldviewColors) {
    return worldviewColors[worldview as WorldView][colorType];
  }
  return "#64748B"; // Default slate color
}

// Get background color styles for a message from a specific worldview
export function getWorldviewMessageStyle(worldview: WorldView): {
  background: string;
  text: string;
  border?: string;
} {
  if (worldview in worldviewColors) {
    const colors = worldviewColors[worldview as WorldView];
    return {
      background: colors.background,
      text: colors.text,
      border: `1px solid ${colors.secondary}`
    };
  }
  
  // Default style
  return {
    background: "#F1F5F9",
    text: "#334155"
  };
}

// Get a name for a worldview that's properly formatted
export function getWorldviewDisplayName(worldview: WorldView): string {
  switch (worldview) {
    case WorldView.ATHEISM:
      return "Atheism";
    case WorldView.AGNOSTICISM:
      return "Agnosticism";
    case WorldView.CHRISTIANITY:
      return "Christianity";
    case WorldView.ISLAM:
      return "Islam";
    case WorldView.HINDUISM:
      return "Hinduism";
    case WorldView.BUDDHISM:
      return "Buddhism";
    case WorldView.JUDAISM:
      return "Judaism";
    case WorldView.SIKHISM:
      return "Sikhism";
    default:
      return worldview;
  }
}