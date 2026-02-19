import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bafnatoys.app",
  appName: "Bafna Toys",
  webDir: "dist",
  bundledWebRuntime: false,
  
  server: {
    hostname: "bafnatoys.com",
    androidScheme: "https"
  },
  
  // 👇 Ye naya code Android ki strict security ko bypass karega 👇
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;