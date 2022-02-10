import { Add, And, BitAnd, BitOr, BitXor, Div, LShift, Lt, LtE, Mod, Mult, Operator, Pow, RShift, Sub } from "typhon-lang";

/**
 * 
 * @param lhs 
 * @param rhs 
 * @returns 
 */
export function compareOperators(lhs: Operator, rhs: Operator) {
    const lhp = precedence(lhs);
    const rhp = precedence(rhs);
    if (lhp > rhp) {
        return +1;
    }
    else if (lhp < rhp) {
        return -1;
    } else {
        return 0;
    }
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
 */
export function precedence(op: Operator): number {
    switch (op) {
        case Pow: {
            return 14;
        }
        case Mult:
        case Div:
        case Mod: {
            return 13;
        }
        case Add: {
            return 12;
        }
        case Sub: {
            return 12;
        }
        case LShift: {
            return 11;
        }
        case RShift: {
            return 11;
        }
        case Lt:
        case LtE: {
            return 10;
        }
        case BitAnd: {
            return 8;
        }
        case BitXor: {
            return 7;
        }
        case BitOr: {
            return 6;
        }
        case And: {
            return 5;
        }
        default: {
            throw new Error(`precedence(): Unexpected operator op=>${op}: ${typeof op}`);
        }
    }
}

/**
 * Associativity
 */
export function isLeftToRight(op: Operator): boolean {
    switch (op) {
        case BitAnd: {
            return true;
        }
        default: {
            throw new Error(`isLeftToRight(): Unexpected operator op=>${op}: ${typeof op}`);
        }
    }
}