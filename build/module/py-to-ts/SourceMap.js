import { Position } from 'code-writer';
var SourceMap = (function () {
    function SourceMap(sourceToTarget, targetToSource) {
        this.sourceToTarget = sourceToTarget;
        this.targetToSource = targetToSource;
        // Do nothing yet.
    }
    SourceMap.prototype.getTargetPosition = function (sourcePos) {
        var nodeL = this.sourceToTarget.glb(sourcePos);
        var nodeU = this.sourceToTarget.lub(sourcePos);
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
    };
    SourceMap.prototype.getSourcePosition = function (targetPos) {
        var nodeL = this.targetToSource.glb(targetPos);
        if (nodeL) {
            return interpolate(targetPos.line, targetPos.column, nodeL.key, nodeL.value);
        }
        else {
            return null;
        }
    };
    return SourceMap;
}());
export { SourceMap };
function interpolate(sourceLine, sourceColumn, sourceBegin, targetBegin) {
    var lineOffset = sourceLine - sourceBegin.line;
    var columnOffset = sourceColumn - sourceBegin.column;
    var targetLine = targetBegin.line + lineOffset;
    var targetColumn = targetBegin.column + columnOffset;
    return new Position(targetLine, targetColumn);
}
