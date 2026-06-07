import Image from "next/image";

export function TokenIcon({
  src,
  alt,
  size = 40,
}: {
  src: string;
  alt: string;
  size?: number;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized={src.endsWith(".svg")}
      className="token-icon shrink-0 rounded-full object-cover bg-surface-subtle"
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  );
}
