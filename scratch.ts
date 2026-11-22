function summarizeLead(a: string): Promise<string> { return Promise.resolve(a); }
const funcs: Record<string, (...args: never[]) => Promise<unknown>> = { summarizeLead };
