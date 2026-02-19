import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bafnatoys.app",
  appName: "Bafna Toys",
  webDir: "dist",
  bundledWebRuntime: false,
  
  // 👇 Ye CORS fix karne wala naya block hai 👇
  server: {
    hostname: "bafnatoys.com",
    androidScheme: "https"
  }
};

export default config;