import { SourceMap } from './SourceMap';
export declare function transpileModule(sourceText: string, trace?: boolean): {
    code: string;
    sourceMap: SourceMap;
};
