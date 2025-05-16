import { WorldView } from "@shared/schema";
import { 
  BrainCircuit, // For Atheism
  HelpCircle, // For Agnosticism
  Cross, // For Christianity
  Moon, // For Islam
  Waves, // For Hinduism (Om symbol alternative)
  Flower2, // For Buddhism (lotus flower)
  Star, // For Judaism (Star of David alternative)
  CircleDot, // For Sikhism (Khanda alternative)
} from "lucide-react";

interface WorldViewIconProps {
  worldview: WorldView;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function WorldViewIcon({ worldview, size = 24, className = "", style = {} }: WorldViewIconProps) {
  const iconProps = {
    size,
    className: `${className}`,
    style,
  };

  switch (worldview) {
    case WorldView.ATHEISM:
      return <BrainCircuit {...iconProps} />;
    case WorldView.AGNOSTICISM:
      return <HelpCircle {...iconProps} />;
    case WorldView.CHRISTIANITY:
      return <Cross {...iconProps} />;
    case WorldView.ISLAM:
      return <Moon {...iconProps} />;
    case WorldView.HINDUISM:
      return <Waves {...iconProps} />;
    case WorldView.BUDDHISM:
      return <Flower2 {...iconProps} />;
    case WorldView.JUDAISM:
      return <Star {...iconProps} />;
    case WorldView.SIKHISM:
      return <CircleDot {...iconProps} />;
    default:
      return <HelpCircle {...iconProps} />;
  }
}

export function getWorldViewName(worldview: WorldView): string {
  // Capitalize first letter
  return worldview.charAt(0).toUpperCase() + worldview.slice(1);
}

export function getWorldViewColor(worldview: WorldView): string {
  switch (worldview) {
    case WorldView.ATHEISM:
      return "rgb(71, 85, 105)"; // slate-600
    case WorldView.AGNOSTICISM:
      return "rgb(71, 85, 105)"; // slate-600
    case WorldView.CHRISTIANITY:
      return "rgb(29, 78, 216)"; // blue-700
    case WorldView.ISLAM:
      return "rgb(16, 185, 129)"; // emerald-500
    case WorldView.HINDUISM:
      return "rgb(217, 70, 239)"; // fuchsia-500
    case WorldView.BUDDHISM:
      return "rgb(245, 158, 11)"; // amber-500
    case WorldView.JUDAISM:
      return "rgb(79, 70, 229)"; // indigo-600
    case WorldView.SIKHISM:
      return "rgb(234, 88, 12)"; // orange-600
    default:
      return "rgb(71, 85, 105)"; // slate-600
  }
}
