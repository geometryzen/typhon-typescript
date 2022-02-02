import { RBTree, RBNode } from 'generic-rbtree';
import { Position } from 'code-writer';

function safeNodeEqual(a: RBNode<Position, Position>, b: RBNode<Position, Position>): boolean {
    if (a && b) {
        if (a.key.line === b.key.line && a.key.column === b.key.column) {
            return true
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function valueIfEqual(a: RBNode<Position, Position>, b: RBNode<Position, Position>): Position {
    if (safeNodeEqual(a, b)) {
        return a.value;
    }
    else {
        return null;
    }
}

export class SourceMap {
    constructor(private sourceToTarget: RBTree<Position, Position>, private targetToSource: RBTree<Position, Position>) {
        // Do nothing yet.
    }
    getTargetPosition(sourcePos: Position): Position | null {
        const nodeL = this.sourceToTarget.glb(sourcePos);
        const nodeU = this.sourceToTarget.lub(sourcePos);
        return valueIfEqual(nodeL, nodeU);
    }
    getSourcePosition(targetPos: Position): Position {
        const nodeL = this.targetToSource.glb(targetPos);
        const nodeU = this.targetToSource.lub(targetPos);
        return valueIfEqual(nodeL, nodeU);
    }
}
