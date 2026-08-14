export { proxyAuth as proxy } from "@/auth.config";

export const config = {
  matcher: ["/admin/:path*", "/coordinator/:path*"],
};
