declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
export {};
