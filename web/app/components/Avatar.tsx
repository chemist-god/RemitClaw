import Image from "next/image";

const GRADIENTS = [
  "linear-gradient(135deg,#9d7bff,#6c2bd9)",
  "linear-gradient(135deg,#c8f94f,#6c2bd9)",
  "linear-gradient(135deg,#ff9bd2,#7c4dff)",
  "linear-gradient(135deg,#7c4dff,#b594ff)",
  "linear-gradient(135deg,#5ad1ff,#7c4dff)",
  "linear-gradient(135deg,#ffb86b,#9d7bff)",
];

function hashIndex(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % GRADIENTS.length;
}

export function Avatar({
  name,
  src,
  size = 52,
  ring = false,
}: {
  name: string;
  src?: string;
  size?: number;
  ring?: boolean;
}) {
  const inner = src ? (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      unoptimized
      className="rounded-full object-cover bg-surface-lavender"
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
    />
  ) : (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        background: GRADIENTS[hashIndex(name)],
        fontSize: size * 0.36,
      }}
    >
      {name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );

  if (!ring) return inner;
  return (
    <span
      className="avatar-ring inline-flex shrink-0"
      style={{ width: size + 4, height: size + 4 }}
    >
      {inner}
    </span>
  );
}
