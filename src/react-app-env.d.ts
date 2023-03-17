/// <reference types="react-scripts" />

interface Window {
  nostr: {
    getPublicKey(): Promise<string>;
    signEvent(event: any): Promise<any>;
  }
}
