import type { SVGProps } from "react";

export type IconName = "arrow-left" | "bookmark" | "calendar" | "map" | "home" | "compass" | "user" | "sparkles" | "chevron-right" | "settings" | "sun" | "moon" | "contrast";

export default function Icon({ name, size = 20, strokeWidth = 1.9, ...props }: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<IconName, React.ReactNode> = {
    "arrow-left": <><path {...common} d="M19 12H5" /><path {...common} d="m12 19-7-7 7-7" /></>,
    bookmark: <path {...common} d="M7 4.5A2.5 2.5 0 0 1 9.5 2h5A2.5 2.5 0 0 1 17 4.5V21l-5-3.2L7 21V4.5Z" />,
    calendar: <><rect {...common} x="3" y="5" width="18" height="16" rx="2" /><path {...common} d="M8 3v4M16 3v4M3 10h18" /></>,
    map: <><path {...common} d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" /><path {...common} d="M9 3v15M15 6v15" /></>,
    home: <><path {...common} d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path {...common} d="M9 21v-6h6v6" /></>,
    compass: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
    user: <><circle {...common} cx="12" cy="8" r="3.5" /><path {...common} d="M4.5 21c.6-3.7 3.3-5.5 7.5-5.5s6.9 1.8 7.5 5.5" /></>,
    sparkles: <><path {...common} d="m12 3 1.2 4.1L17 8.3l-3.8 1.2L12 14l-1.2-4.5L7 8.3l3.8-1.2L12 3Z" /><path {...common} d="m19 15 .6 2.1L22 18l-2.4.9L19 21l-.7-2.1L16 18l2.3-.9L19 15Z" /><path {...common} d="m5 15 .5 1.6L7 17l-1.5.5L5 19l-.5-1.5L3 17l1.5-.4L5 15Z" /></>,
    "chevron-right": <path {...common} d="m9 18 6-6-6-6" />,
    settings: <><circle {...common} cx="12" cy="12" r="3" /><path {...common} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.2 2.2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3.2v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L6.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-3.2h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.2-2.2.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4h3.2v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.2 2.2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>,
    sun: <><circle {...common} cx="12" cy="12" r="4" /><path {...common} d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path {...common} d="M20 15.2A8.6 8.6 0 0 1 8.8 4 8.7 8.7 0 1 0 20 15.2Z" />,
    contrast: <><circle {...common} cx="12" cy="12" r="8.5" /><path {...common} d="M12 3.5v17" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
