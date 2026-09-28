import { Disc3 } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type Props = {
  src: string | null;
  alt: string;
  size: number;
  className?: string;
  priority?: boolean;
};

export function AlbumCover({ src, alt, size, className, priority }: Props) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        style={{ width: size, height: size }}
        className={cn("flex shrink-0 items-center justify-center bg-muted text-muted-foreground", className)}
      >
        <Disc3 aria-hidden className="size-1/2" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 object-cover", className)}
    />
  );
}
