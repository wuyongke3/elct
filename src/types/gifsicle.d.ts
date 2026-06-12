declare module 'gifsicle-wasm-browser' {
  interface GifsicleInput {
    file: File | Blob | ArrayBuffer | string;
    name: string;
  }

  interface GifsicleOptions {
    input: GifsicleInput[];
    command: string[];
    outputDir?: string;
    exitOnWarning?: boolean;
    isStrict?: boolean;
  }

  const gifsicle: {
    run: (options: GifsicleOptions) => Promise<File[]>;
  };

  export default gifsicle;
}
