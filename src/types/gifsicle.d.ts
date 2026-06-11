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
  }

  interface GifsicleResult extends Array<File> {}

  const gifsicle: {
    run: (options: GifsicleOptions) => Promise<GifsicleResult>;
  };

  export default gifsicle;
}