import Image from "next/image";

export default function RootLoading() {
  return (
    <div className="flex min-h-svh flex-1 items-center justify-center">
      <Image src="/brand/spark.png" alt="" width={36} height={38} className="animate-pulse opacity-70" />
    </div>
  );
}
