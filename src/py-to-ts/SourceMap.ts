import { RBTree } from 'generic-rbtree';
import { Position } from 'code-writer';

export class SourceMap {
    constructor(private sourceToTarget: RBTree<Position, Position>, private targetToSource: RBTree<Position, Position>) {
        // Do nothing yet.
    }
    getTargetPosition(sourcePos: Position): Position | null {
        const nodeL = this.sourceToTarget.glb(sourcePos);
        const nodeU = this.sourceToTarget.lub(sourcePos);
        if (nodeL) {
            if (nodeU) {
                return interpolate(sourcePos.line, sourcePos.column, nodeL.key, nodeL.value);
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    }
    getSourcePosition(targetPos: Position): Position {
        const nodeL = this.targetToSource.glb(targetPos);
        if (nodeL) {
            return interpolate(targetPos.line, targetPos.column, nodeL.key, nodeL.value);
        }
        else {
            return null;
        }
    }
}

function interpolate(sourceLine: number, sourceColumn: number, sourceBegin: Position, targetBegin: Position): Position {
    const lineOffset = sourceLine - sourceBegin.line;
    const columnOffset = sourceColumn - sourceBegin.column;
    const targetLine = targetBegin.line + lineOffset;
    const targetColumn = targetBegin.column + columnOffset;
    return new Position(targetLine, targetColumn);
}
