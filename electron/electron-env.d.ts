/// <reference types="vite-plugin-electron/electron-env" />

declare global {
  interface Window {
    electronAPI: {
      minimize: () => void
      maximize: () => void
      close: () => void
      isMaximized: () => Promise<boolean>
      onMaximizeChange: (cb: (maximized: boolean) => void) => void
    }
    ipcRenderer: {
      on(channel: string, listener: (event: any, ...args: any[]) => void): void
      off(channel: string, listener: (...args: any[]) => void): void
      send(channel: string, ...args: any[]): void
      invoke(channel: string, ...args: any[]): Promise<any>
    }
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    VSCODE_DEBUG?: 'true'
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}
