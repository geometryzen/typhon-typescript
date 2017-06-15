import { assert } from './asserts';
import { Attribute } from 'typhon-lang';
import { Add, Sub, Mult, Div, BitOr, BitXor, BitAnd, LShift, RShift, FloorDiv, Mod } from 'typhon-lang';
import { Eq, NotEq, Gt, GtE, Lt, LtE, In, NotIn, Is, IsNot } from 'typhon-lang';
import { Name } from 'typhon-lang';
import { Module } from 'typhon-lang';
import { parse, SourceKind } from 'typhon-lang';
import { astFromParse } from 'typhon-lang';
import { semanticsOfModule } from 'typhon-lang';
import { toStringLiteralJS } from './toStringLiteralJS';
import { DEF_LOCAL } from 'typhon-lang';
import { isClassNameByConvention, isMethod } from './utils';
import { CodeWriter } from 'code-writer';
import { Position, positionComparator } from 'code-writer';
import { RBTree } from 'generic-rbtree';
import { SourceMap } from './SourceMap';
/**
 * Provides enhanced scope information beyond the SymbolTableScope.
 */
var PrinterUnit = (function () {
    /**
     * Stuff that changes on entry/exit of code blocks. must be saved and restored
     * when returning to a block.
     * Corresponds to the body of a module, class, or function.
     */
    function PrinterUnit(name, ste) {
        /**
         * Used to determine whether a local variable has been declared.
         */
        this.declared = {};
        assert(typeof name === 'string');
        assert(typeof ste === 'object');
        this.name = name;
        this.ste = ste;
        this.private_ = null;
        this.beginLine = 0;
        this.lineno = 0;
        this.linenoSet = false;
        this.localnames = [];
        this.blocknum = 0;
        this.blocks = [];
        this.curblock = 0;
        this.scopename = null;
        this.prefixCode = '';
        this.varDeclsCode = '';
        this.switchCode = '';
        this.suffixCode = '';
        // stack of where to go on a break
        this.breakBlocks = [];
        // stack of where to go on a continue
        this.continueBlocks = [];
        this.exceptBlocks = [];
        this.finallyBlocks = [];
    }
    PrinterUnit.prototype.activateScope = function () {
        // Do nothing yet.
    };
    PrinterUnit.prototype.deactivateScope = function () {
        // Do nothing yet.
    };
    return PrinterUnit;
}());
var Printer = (function () {
    /**
     *
     * @param st The symbol table obtained from semantic analysis.
     * @param flags Not being used yet. May become options.
     * @param sourceText The original source code, provided for annotating the generated code and source mapping.
     */
    function Printer(st, flags, sourceText, beginLine, beginColumn, trace) {
        this.beginLine = beginLine;
        this.beginColumn = beginColumn;
        /**
         * Used to provide a unique number for generated symbol names.
         */
        this.gensymCount = 0;
        // this.fileName = fileName;
        this.st = st;
        this.flags = flags;
        this.interactive = false;
        this.nestlevel = 0;
        this.u = null;
        this.stack = [];
        this.result = [];
        // this.gensymcount = 0;
        this.allUnits = [];
        this.source = sourceText ? sourceText.split("\n") : false;
        this.writer = new CodeWriter(beginLine, beginColumn, {}, trace);
    }
    /**
     * This is the entry point for this visitor.
     */
    Printer.prototype.transpileModule = function (module) {
        // Traversing the AST sends commands to the writer.
        this.enterScope("<module>", module, this.beginLine, this.beginColumn);
        this.module(module);
        this.exitScope();
        // Now return the captured events as a transpiled module.
        return this.writer.snapshot();
    };
    /**
     * Looks up the SymbolTableScope.
     * Pushes a new PrinterUnit onto the stack.
     * Returns a string identifying the scope.
     * @param name The name that will be assigned to the PrinterUnit.
     * @param key A scope object in the AST from sematic analysis. Provides the mapping to the SymbolTableScope.
     */
    Printer.prototype.enterScope = function (name, key, beginLine, beginColumn) {
        var u = new PrinterUnit(name, this.st.getStsForAst(key));
        u.beginLine = beginLine;
        u.beginColumn = beginColumn;
        if (this.u && this.u.private_) {
            u.private_ = this.u.private_;
        }
        this.stack.push(this.u);
        this.allUnits.push(u);
        var scopeName = this.gensym('scope');
        u.scopename = scopeName;
        this.u = u;
        this.u.activateScope();
        this.nestlevel++;
        return scopeName;
    };
    Printer.prototype.exitScope = function () {
        if (this.u) {
            this.u.deactivateScope();
        }
        this.nestlevel--;
        if (this.stack.length - 1 >= 0) {
            this.u = this.stack.pop();
        }
        else {
            this.u = null;
        }
        if (this.u) {
            this.u.activateScope();
        }
    };
    /**
     * Generates a unique symbol name for the provided namespace.
     */
    Printer.prototype.gensym = function (namespace) {
        var symbolName = namespace || '';
        symbolName = '$' + symbolName;
        symbolName += this.gensymCount++;
        return symbolName;
    };
    // Everything below here is an implementation of the Visitor
    Printer.prototype.assign = function (assign) {
        this.writer.beginStatement();
        // TODO: Declaration.
        // TODO: How to deal with multiple target?
        for (var _i = 0, _a = assign.targets; _i < _a.length; _i++) {
            var target = _a[_i];
            if (target instanceof Name) {
                var flags = this.u.ste.symFlags[target.id.value];
                if (flags && DEF_LOCAL) {
                    if (this.u.declared[target.id.value]) {
                        // The variable has already been declared.
                    }
                    else {
                        // We use let for now because we would need to look ahead for more assignments.
                        // The smenatic analysis could count the number of assignments in the current scope?
                        this.writer.write("let ", null);
                        this.u.declared[target.id.value] = true;
                    }
                }
            }
            target.accept(this);
        }
        this.writer.assign("=", assign.eqRange);
        assign.value.accept(this);
        this.writer.endStatement();
    };
    Printer.prototype.attribute = function (attribute) {
        attribute.value.accept(this);
        this.writer.write(".", null);
        this.writer.str(attribute.attr.value, attribute.attr.range);
    };
    Printer.prototype.binOp = function (be) {
        be.lhs.accept(this);
        var op = be.op;
        var opRange = be.opRange;
        switch (op) {
            case Add: {
                this.writer.binOp("+", opRange);
                break;
            }
            case Sub: {
                this.writer.binOp("-", opRange);
                break;
            }
            case Mult: {
                this.writer.binOp("*", opRange);
                break;
            }
            case Div: {
                this.writer.binOp("/", opRange);
                break;
            }
            case BitOr: {
                this.writer.binOp("|", opRange);
                break;
            }
            case BitXor: {
                this.writer.binOp("^", opRange);
                break;
            }
            case BitAnd: {
                this.writer.binOp("&", opRange);
                break;
            }
            case LShift: {
                this.writer.binOp("<<", opRange);
                break;
            }
            case RShift: {
                this.writer.binOp(">>", opRange);
                break;
            }
            case Mod: {
                this.writer.binOp("%", opRange);
                break;
            }
            case FloorDiv: {
                // TODO: What is the best way to handle FloorDiv.
                // This doesn't actually exist in TypeScript.
                this.writer.binOp("//", opRange);
                break;
            }
            default: {
                throw new Error("Unexpected binary operator " + op + ": " + typeof op);
            }
        }
        be.rhs.accept(this);
    };
    Printer.prototype.callExpression = function (ce) {
        if (ce.func instanceof Name) {
            if (isClassNameByConvention(ce.func)) {
                this.writer.write("new ", null);
            }
        }
        else if (ce.func instanceof Attribute) {
            if (isClassNameByConvention(ce.func)) {
                this.writer.write("new ", null);
            }
        }
        else {
            throw new Error("Call.func must be a Name " + ce.func);
        }
        ce.func.accept(this);
        this.writer.openParen();
        for (var i = 0; i < ce.args.length; i++) {
            if (i > 0) {
                this.writer.comma(null, null);
            }
            var arg = ce.args[i];
            arg.accept(this);
        }
        for (var i = 0; i < ce.keywords.length; ++i) {
            if (i > 0) {
                this.writer.comma(null, null);
            }
            ce.keywords[i].value.accept(this);
        }
        if (ce.starargs) {
            ce.starargs.accept(this);
        }
        if (ce.kwargs) {
            ce.kwargs.accept(this);
        }
        this.writer.closeParen();
    };
    Printer.prototype.classDef = function (cd) {
        this.writer.write("class", null);
        this.writer.space();
        this.writer.name(cd.name.value, cd.name.range);
        // this.writer.openParen();
        // this.writer.closeParen();
        this.writer.beginBlock();
        /*
        this.writer.write("constructor");
        this.writer.openParen();
        this.writer.closeParen();
        this.writer.beginBlock();
        this.writer.endBlock();
        */
        for (var _i = 0, _a = cd.body; _i < _a.length; _i++) {
            var stmt = _a[_i];
            stmt.accept(this);
        }
        this.writer.endBlock();
    };
    Printer.prototype.compareExpression = function (ce) {
        ce.left.accept(this);
        for (var _i = 0, _a = ce.ops; _i < _a.length; _i++) {
            var op = _a[_i];
            switch (op) {
                case Eq: {
                    this.writer.write("===", null);
                    break;
                }
                case NotEq: {
                    this.writer.write("!==", null);
                    break;
                }
                case Lt: {
                    this.writer.write("<", null);
                    break;
                }
                case LtE: {
                    this.writer.write("<=", null);
                    break;
                }
                case Gt: {
                    this.writer.write(">", null);
                    break;
                }
                case GtE: {
                    this.writer.write(">=", null);
                    break;
                }
                case Is: {
                    this.writer.write("===", null);
                    break;
                }
                case IsNot: {
                    this.writer.write("!==", null);
                    break;
                }
                case In: {
                    this.writer.write(" in ", null);
                    break;
                }
                case NotIn: {
                    this.writer.write(" not in ", null);
                    break;
                }
                default: {
                    throw new Error("Unexpected comparison expression operator: " + op);
                }
            }
        }
        for (var _b = 0, _c = ce.comparators; _b < _c.length; _b++) {
            var comparator = _c[_b];
            comparator.accept(this);
        }
    };
    Printer.prototype.dict = function (dict) {
        var keys = dict.keys;
        var values = dict.values;
        var N = keys.length;
        this.writer.beginObject();
        for (var i = 0; i < N; i++) {
            if (i > 0) {
                this.writer.comma(null, null);
            }
            keys[i].accept(this);
            this.writer.write(":", null);
            values[i].accept(this);
        }
        this.writer.endObject();
    };
    Printer.prototype.expressionStatement = function (s) {
        this.writer.beginStatement();
        s.value.accept(this);
        this.writer.endStatement();
    };
    Printer.prototype.functionDef = function (functionDef) {
        var isClassMethod = isMethod(functionDef);
        this.writer.write("export ", null);
        if (!isClassMethod) {
            this.writer.write("function ", null);
        }
        this.writer.name(functionDef.name.value, functionDef.name.range);
        this.writer.openParen();
        for (var i = 0; i < functionDef.args.args.length; i++) {
            var arg = functionDef.args.args[i];
            if (i === 0) {
                if (arg.id.value === 'self') {
                    // Ignore.
                }
                else {
                    arg.accept(this);
                }
            }
            else {
                arg.accept(this);
            }
        }
        this.writer.closeParen();
        if (functionDef.returnType) {
            this.writer.write(":", null);
            functionDef.returnType.accept(this);
        }
        this.writer.beginBlock();
        for (var _i = 0, _a = functionDef.body; _i < _a.length; _i++) {
            var stmt = _a[_i];
            stmt.accept(this);
        }
        this.writer.endBlock();
    };
    Printer.prototype.ifStatement = function (i) {
        this.writer.write("if", null);
        this.writer.openParen();
        i.test.accept(this);
        this.writer.closeParen();
        this.writer.beginBlock();
        for (var _i = 0, _a = i.consequent; _i < _a.length; _i++) {
            var con = _a[_i];
            con.accept(this);
        }
        this.writer.endBlock();
    };
    Printer.prototype.importFrom = function (importFrom) {
        this.writer.beginStatement();
        this.writer.write("import", null);
        this.writer.space();
        this.writer.beginBlock();
        for (var i = 0; i < importFrom.names.length; i++) {
            if (i > 0) {
                this.writer.comma(null, null);
            }
            var alias = importFrom.names[i];
            this.writer.name(alias.name.value, alias.name.range);
            if (alias.asname) {
                this.writer.space();
                this.writer.write("as", null);
                this.writer.space();
                this.writer.write(alias.asname, null);
            }
        }
        this.writer.endBlock();
        this.writer.space();
        this.writer.write("from", null);
        this.writer.space();
        this.writer.str(toStringLiteralJS(importFrom.module.value), importFrom.module.range);
        this.writer.endStatement();
    };
    Printer.prototype.list = function (list) {
        var elements = list.elts;
        var N = elements.length;
        this.writer.write('[', null);
        for (var i = 0; i < N; i++) {
            if (i > 0) {
                this.writer.comma(null, null);
            }
            elements[i].accept(this);
        }
        this.writer.write(']', null);
    };
    Printer.prototype.module = function (m) {
        for (var _i = 0, _a = m.body; _i < _a.length; _i++) {
            var stmt = _a[_i];
            stmt.accept(this);
        }
    };
    Printer.prototype.name = function (name) {
        // TODO: Since 'True' and 'False' are reserved words in Python,
        // syntactic analysis (parsing) should be sufficient to identify
        // this name as a boolean expression - avoiding this overhead.
        var value = name.id.value;
        var range = name.id.range;
        switch (value) {
            case 'True': {
                this.writer.name('true', range);
                break;
            }
            case 'False': {
                this.writer.name('false', range);
                break;
            }
            case 'str': {
                this.writer.name('string', range);
                break;
            }
            case 'bool': {
                this.writer.name('boolean', range);
                break;
            }
            default: {
                this.writer.name(value, range);
            }
        }
    };
    Printer.prototype.num = function (num) {
        var value = num.n.value;
        var range = num.n.range;
        this.writer.num(value.toString(), range);
    };
    Printer.prototype.print = function (print) {
        this.writer.name("console", null);
        this.writer.write(".", null);
        this.writer.name("log", null);
        this.writer.openParen();
        for (var _i = 0, _a = print.values; _i < _a.length; _i++) {
            var value = _a[_i];
            value.accept(this);
        }
        this.writer.closeParen();
    };
    Printer.prototype.returnStatement = function (rs) {
        this.writer.beginStatement();
        this.writer.write("return", null);
        this.writer.write(" ", null);
        rs.value.accept(this);
        this.writer.endStatement();
    };
    Printer.prototype.str = function (str) {
        var s = str.s;
        // const begin = str.begin;
        // const end = str.end;
        this.writer.str(toStringLiteralJS(s.value), s.range);
    };
    return Printer;
}());
export function transpileModule(sourceText, trace) {
    if (trace === void 0) { trace = false; }
    var cst = parse(sourceText, SourceKind.File);
    if (typeof cst === 'object') {
        var stmts = astFromParse(cst);
        var mod = new Module(stmts);
        var symbolTable = semanticsOfModule(mod);
        var printer = new Printer(symbolTable, 0, sourceText, 1, 0, trace);
        var textAndMappings = printer.transpileModule(mod);
        var code = textAndMappings.text;
        var sourceMap = mappingTreeToSourceMap(textAndMappings.tree, trace);
        return { code: code, sourceMap: sourceMap };
    }
    else {
        throw new Error("Error parsing source for file.");
    }
}
var NIL_VALUE = new Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
var HI_KEY = new Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
var LO_KEY = new Position(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
function mappingTreeToSourceMap(mappingTree, trace) {
    var sourceToTarget = new RBTree(LO_KEY, HI_KEY, NIL_VALUE, positionComparator);
    var targetToSource = new RBTree(LO_KEY, HI_KEY, NIL_VALUE, positionComparator);
    if (mappingTree) {
        for (var _i = 0, _a = mappingTree.mappings(); _i < _a.length; _i++) {
            var mapping = _a[_i];
            var source = mapping.source;
            var target = mapping.target;
            // Convert to immutable values for targets.
            var tBegin = new Position(target.begin.line, target.begin.column);
            var tEnd = new Position(target.end.line, target.end.column);
            if (trace) {
                console.log(source.begin + " => " + tBegin);
                console.log(source.end + " => " + tEnd);
            }
            sourceToTarget.insert(source.begin, tBegin);
            sourceToTarget.insert(source.end, tEnd);
            targetToSource.insert(tBegin, source.begin);
            targetToSource.insert(tEnd, source.end);
        }
    }
    return new SourceMap(sourceToTarget, targetToSource);
}
