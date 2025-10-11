export function getDemoPrice(productName?: string): string {
  if (productName) {
    let hash = 0;
    for (let i = 0; i < productName.length; i++) {
      hash = (hash << 5) - hash + productName.charCodeAt(i);
      hash |= 0;
    }
    const base = Math.abs(hash) % 900 + 100; // range 100–999
    return base.toFixed(0);
  }
  return Math.floor(Math.random() * 900 + 100).toFixed(0);
}
