"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typhon_lang_1 = require("typhon-lang");
/**
 * Determines whether the name or attribute should be considered to be a class.
 * This is a heuristic test based upon the JavaScript convention for class names.
 * In future we may be able to use type information.
 */
function isClassNameByConvention(name) {
    var id = name.id;
    if (id instanceof typhon_lang_1.RangeAnnotated && typeof id.value === 'string') {
        // console.lg(`name => ${JSON.stringify(name, null, 2)}`);
        var N = id.value.length;
        if (N > 0) {
            var firstChar = id.value[0];
            return firstChar.toUpperCase() === firstChar;
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
}
exports.isClassNameByConvention = isClassNameByConvention;
function isMethod(functionDef) {
    for (var i = 0; i < functionDef.args.args.length; i++) {
        if (i === 0) {
            var arg = functionDef.args.args[i];
            if (arg.id.value === 'self') {
                return true;
            }
        }
        else {
            return false;
        }
    }
    return false;
}
exports.isMethod = isMethod;
