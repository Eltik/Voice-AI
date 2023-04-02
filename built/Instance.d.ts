import { Options } from "./Core";
export default class Instance {
    private options;
    private core;
    constructor(options?: Options);
    start(): Promise<void>;
}
