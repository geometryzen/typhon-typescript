import { RBTree } from 'generic-rbtree';
import { Position } from 'code-writer';

declare class SourceMap {
    private sourceToTarget;
    private targetToSource;
    constructor(sourceToTarget: RBTree<Position, Position>, targetToSource: RBTree<Position, Position>);
    getTargetPosition(sourcePos: Position): Position | null;
    getSourcePosition(targetPos: Position): Position;
}

declare function transpileModule(sourceText: string, trace?: boolean): {
    code: string;
    sourceMap: SourceMap;
};

export { SourceMap, transpileModule };
