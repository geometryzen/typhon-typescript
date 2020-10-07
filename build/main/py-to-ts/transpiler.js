"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var asserts_1 = require("./asserts");
var typhon_lang_1 = require("typhon-lang");
var typhon_lang_2 = require("typhon-lang");
var typhon_lang_3 = require("typhon-lang");
var typhon_lang_4 = require("typhon-lang");
var typhon_lang_5 = require("typhon-lang");
var typhon_lang_6 = require("typhon-lang");
var typhon_lang_7 = require("typhon-lang");
var typhon_lang_8 = require("typhon-lang");
var typhon_lang_9 = require("typhon-lang");
var toStringLiteralJS_1 = require("./toStringLiteralJS");
var typhon_lang_10 = require("typhon-lang");
var utils_1 = require("./utils");
var code_writer_1 = require("code-writer");
var code_writer_2 = require("code-writer");
var generic_rbtree_1 = require("generic-rbtree");
var SourceMap_1 = require("./SourceMap");
/**
 * Provides enhanced scope information beyond the SymbolTableScope.
 */
var PrinterUnit = /** @class */ (function () {
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
        asserts_1.assert(typeof name === 'string');
        asserts_1.assert(typeof ste === 'object');
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
var Printer = /** @class */ (function () {
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
        // this.flags = flags;
        // this.interactive = false;
        // this.nestlevel = 0;
        this.u = null;
        this.stack = [];
        this.result = [];
        // this.gensymcount = 0;
        this.allUnits = [];
        // this.source = sourceText ? sourceText.split("\n") : false;
        this.writer = new code_writer_1.CodeWriter(beginLine, beginColumn, {}, trace);
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
        // this.nestlevel++;
        return scopeName;
    };
    Printer.prototype.exitScope = function () {
        if (this.u) {
            this.u.deactivateScope();
        }
        // this.nestlevel--;
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
    Printer.prototype.forStatement = function (fs) {
        var body = fs.body;
        var range = fs.iter;
        var target = fs.target;
        this.writer.write("for", null);
        this.writer.openParen();
        if (range instanceof typhon_lang_3.Call) {
            this.writer.beginStatement();
            if (target instanceof typhon_lang_5.Name) {
                var flags = this.u.ste.symFlags[target.id.value];
                if (flags && typhon_lang_10.DEF_LOCAL) {
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
            this.writer.write("=", null);
            var secondArg = range.args[1];
            var thirdArg = range.args[2];
            if (range.args[3]) {
                throw new Error("Too many arguments");
            }
            // range() accepts 1 or 2 parameters, if 1 then first param is always 0
            if (secondArg) {
                var firstArg = range.args[0];
                firstArg.accept(this);
                this.writer.endStatement();
            }
            else {
                this.writer.write("0", null);
                this.writer.endStatement();
            }
            // writing second part of for statement
            this.writer.beginStatement();
            target.accept(this);
            this.writer.write("<", null);
            secondArg.accept(this);
            this.writer.endStatement();
            // writing third part of for statement
            if (thirdArg) {
                target.accept(this);
                this.writer.write("=", null);
                target.accept(this);
                this.writer.write("+", null);
                thirdArg.accept(this);
            }
            else {
                target.accept(this);
                this.writer.write("++", null);
            }
        }
        else if (range instanceof typhon_lang_5.Name) {
            // "for (" written so far
            var greedyIterator = range.id.value; // The list to iterate over
            this.writer.write("let ", null);
            if (target instanceof typhon_lang_5.Name) {
                var flags = this.u.ste.symFlags[target.id.value];
                if (flags && typhon_lang_10.DEF_LOCAL) {
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
            this.writer.write(" of", null);
            this.writer.write(" " + greedyIterator, null);
        }
        else {
            console.log(range);
            throw new Error("Invalid range... range is instance of " + range.constructor.name + ", not 'Call' or 'Name'");
        }
        this.writer.closeParen();
        this.writer.beginBlock();
        for (var _i = 0, body_1 = body; _i < body_1.length; _i++) {
            var stmt = body_1[_i];
            this.writer.beginStatement();
            stmt.accept(this);
            this.writer.endStatement();
        }
        this.writer.endBlock();
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
    Printer.prototype.annAssign = function (annassign) {
        this.writer.beginStatement();
        // TODO: Declaration.
        // TODO: How to deal with multiple target?
        /**
         * Decides whether to write let or not
         */
        var target = annassign.target;
        if (target instanceof typhon_lang_5.Name) {
            var flags = this.u.ste.symFlags[target.id.value];
            if (flags && typhon_lang_10.DEF_LOCAL) {
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
        if (annassign.value) {
            this.writer.write(":", null);
            annassign.value.accept(this);
        }
        this.writer.endStatement();
    };
    Printer.prototype.assign = function (assign) {
        this.writer.beginStatement();
        // TODO: Declaration.
        // TODO: How to deal with multiple target?
        /**
         * Decides whether to write let or not
         */
        for (var _i = 0, _a = assign.targets; _i < _a.length; _i++) {
            var target = _a[_i];
            if (target instanceof typhon_lang_5.Name) {
                var flags = this.u.ste.symFlags[target.id.value];
                if (flags && typhon_lang_10.DEF_LOCAL) {
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
            if (assign.type) {
                this.writer.write(":", null);
                assign.type.accept(this);
            }
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
            case typhon_lang_2.Add: {
                this.writer.binOp("+", opRange);
                break;
            }
            case typhon_lang_2.Sub: {
                this.writer.binOp("-", opRange);
                break;
            }
            case typhon_lang_2.Mult: {
                this.writer.binOp("*", opRange);
                break;
            }
            case typhon_lang_2.Div: {
                this.writer.binOp("/", opRange);
                break;
            }
            case typhon_lang_2.BitOr: {
                this.writer.binOp("|", opRange);
                break;
            }
            case typhon_lang_2.BitXor: {
                this.writer.binOp("^", opRange);
                break;
            }
            case typhon_lang_2.BitAnd: {
                this.writer.binOp("&", opRange);
                break;
            }
            case typhon_lang_2.LShift: {
                this.writer.binOp("<<", opRange);
                break;
            }
            case typhon_lang_2.RShift: {
                this.writer.binOp(">>", opRange);
                break;
            }
            case typhon_lang_2.Mod: {
                this.writer.binOp("%", opRange);
                break;
            }
            case typhon_lang_2.FloorDiv: {
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
        if (ce.func instanceof typhon_lang_5.Name) {
            if (utils_1.isClassNameByConvention(ce.func)) {
                this.writer.write("new ", null);
            }
        }
        else if (ce.func instanceof typhon_lang_1.Attribute) {
            if (utils_1.isClassNameByConvention(ce.func)) {
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
                case typhon_lang_4.Eq: {
                    this.writer.write("===", null);
                    break;
                }
                case typhon_lang_4.NotEq: {
                    this.writer.write("!==", null);
                    break;
                }
                case typhon_lang_4.Lt: {
                    this.writer.write("<", null);
                    break;
                }
                case typhon_lang_4.LtE: {
                    this.writer.write("<=", null);
                    break;
                }
                case typhon_lang_4.Gt: {
                    this.writer.write(">", null);
                    break;
                }
                case typhon_lang_4.GtE: {
                    this.writer.write(">=", null);
                    break;
                }
                case typhon_lang_4.Is: {
                    this.writer.write("===", null);
                    break;
                }
                case typhon_lang_4.IsNot: {
                    this.writer.write("!==", null);
                    break;
                }
                case typhon_lang_4.In: {
                    this.writer.write(" in ", null);
                    break;
                }
                case typhon_lang_4.NotIn: {
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
        var isClassMethod = utils_1.isMethod(functionDef);
        var sts = this.st.getStsForAst(functionDef);
        var parentScope = this.u.ste;
        for (var _i = 0, _a = parentScope.children; _i < _a.length; _i++) {
            var scope = _a[_i];
            if (sts === scope) {
                this.writer.write("export ", null);
            }
        }
        if (!isClassMethod) {
            this.writer.write("function ", null);
        }
        this.writer.name(functionDef.name.value, functionDef.name.range);
        this.writer.openParen();
        for (var i = 0; i < functionDef.args.args.length; i++) {
            var arg = functionDef.args.args[i];
            var argType = arg.type;
            if (i === 0) {
                if (arg.name.id.value === 'self') {
                    // Ignore.
                }
                else {
                    arg.name.accept(this);
                    if (argType) {
                        this.writer.write(":", null);
                        argType.accept(this);
                    }
                }
            }
            else {
                arg.name.accept(this);
                if (argType) {
                    this.writer.write(":", null);
                    argType.accept(this);
                }
            }
        }
        this.writer.closeParen();
        if (functionDef.returnType) {
            this.writer.write(":", null);
            functionDef.returnType.accept(this);
        }
        this.writer.beginBlock();
        for (var _b = 0, _c = functionDef.body; _b < _c.length; _b++) {
            var stmt = _c[_b];
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
        this.writer.str(toStringLiteralJS_1.toStringLiteralJS(importFrom.module.value), importFrom.module.range);
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
            case 'num': {
                this.writer.name('number', range);
                break;
            }
            case 'None': {
                this.writer.name('null', range);
                break;
            }
            /*
            case 'dict': {
                const testDict = "(function dict(...keys: dictVal[]):Dict {const dict1 = new Dict(keys); return dict1;})";
                this.writer.name(`${testDict}`, range);
                break;
            }
            */
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
        this.writer.str(toStringLiteralJS_1.toStringLiteralJS(s.value), s.range);
    };
    return Printer;
}());
function transpileModule(sourceText, trace) {
    if (trace === void 0) { trace = false; }
    var cst = typhon_lang_7.parse(sourceText, typhon_lang_7.SourceKind.File);
    if (typeof cst === 'object') {
        var stmts = typhon_lang_8.astFromParse(cst);
        var mod = new typhon_lang_6.Module(stmts);
        var symbolTable = typhon_lang_9.semanticsOfModule(mod);
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
exports.transpileModule = transpileModule;
var NIL_VALUE = new code_writer_2.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
var HI_KEY = new code_writer_2.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
var LO_KEY = new code_writer_2.Position(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
function mappingTreeToSourceMap(mappingTree, trace) {
    var sourceToTarget = new generic_rbtree_1.RBTree(LO_KEY, HI_KEY, NIL_VALUE, code_writer_2.positionComparator);
    var targetToSource = new generic_rbtree_1.RBTree(LO_KEY, HI_KEY, NIL_VALUE, code_writer_2.positionComparator);
    if (mappingTree) {
        for (var _i = 0, _a = mappingTree.mappings(); _i < _a.length; _i++) {
            var mapping = _a[_i];
            var source = mapping.source;
            var target = mapping.target;
            // Convert to immutable values for targets.
            var tBegin = new code_writer_2.Position(target.begin.line, target.begin.column);
            var tEnd = new code_writer_2.Position(target.end.line, target.end.column);
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
    return new SourceMap_1.SourceMap(sourceToTarget, targetToSource);
}
//# sourceMappingURL=transpiler.js.map