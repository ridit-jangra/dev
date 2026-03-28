export interface Context {
  cwd: string;
  files: ContextFile[];
  prompt?: string;
}

export interface ContextFile {
  name: string;
  path: string;
  content: string;
  prompt?: string;
}
