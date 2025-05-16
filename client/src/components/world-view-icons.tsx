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
      return "rgb(71, 85, 105)"; // slate-600 - cool gray for rational thinking
    case WorldView.AGNOSTICISM:
      return "rgb(113, 113, 122)"; // zinc-500 - neutral gray for uncertainty
    case WorldView.CHRISTIANITY:
      return "rgb(29, 78, 216)"; // blue-700 - deep blue for faith and divinity
    case WorldView.ISLAM:
      return "rgb(20, 184, 166)"; // teal-500 - serene teal for peace
    case WorldView.HINDUISM:
      return "rgb(147, 51, 234)"; // purple-600 - rich purple for spiritual enlightenment
    case WorldView.BUDDHISM:
      return "rgb(180, 83, 9)"; // amber-700 - warm amber for enlightenment
    case WorldView.JUDAISM:
      return "rgb(79, 70, 229)"; // indigo-600 - deep indigo for covenant and wisdom
    case WorldView.SIKHISM:
      return "rgb(159, 18, 57)"; // rose-800 - deep rose for devotion and service
    default:
      return "rgb(71, 85, 105)"; // slate-600
  }
}
