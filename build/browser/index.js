(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["typhon-typescript"] = {}));
})(this, (function (exports) { 'use strict';

    var MutablePosition = (function () {
        function MutablePosition(line, column) {
            this.line = line;
            this.column = column;
            // TODO
        }
        MutablePosition.prototype.offset = function (rows, cols) {
            this.line += rows;
            this.column += cols;
        };
        MutablePosition.prototype.toString = function () {
            return "[" + this.line + ", " + this.column + "]";
        };
        return MutablePosition;
    }());

    /**
     * We're looking for something that is truthy, not just true.
     */
    /**
     * We're looking for something that is truthy, not just true.
     */ function assert$2(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    var MutableRange = (function () {
        /**
         *
         */
        function MutableRange(begin, end) {
            this.begin = begin;
            this.end = end;
            assert$2(begin, "begin must be defined");
            assert$2(end, "end must be defined");
            this.begin = begin;
            this.end = end;
        }
        MutableRange.prototype.offset = function (rows, cols) {
            this.begin.offset(rows, cols);
            this.end.offset(rows, cols);
        };
        MutableRange.prototype.toString = function () {
            return this.begin + " to " + this.end;
        };
        return MutableRange;
    }());

    var Position$1 = (function () {
        /**
         *
         */
        function Position(line, column) {
            this.line = line;
            this.column = column;
        }
        Position.prototype.toString = function () {
            return "[" + this.line + ", " + this.column + "]";
        };
        return Position;
    }());
    function positionComparator(a, b) {
        if (a.line < b.line) {
            return -1;
        }
        else if (a.line > b.line) {
            return 1;
        }
        else {
            if (a.column < b.column) {
                return -1;
            }
            else if (a.column > b.column) {
                return 1;
            }
            else {
                return 0;
            }
        }
    }

    var Range$1 = (function () {
        /**
         *
         */
        function Range(begin, end) {
            assert$2(begin, "begin must be defined");
            assert$2(end, "end must be defined");
            this.begin = begin;
            this.end = end;
        }
        Range.prototype.toString = function () {
            return this.begin + " to " + this.end;
        };
        return Range;
    }());

    /**
     * A tree that enables ranges in the source document to be mapped to ranges in the target document.
     * The ordering of child nodes is not defined.
     * In many cases the children will be in target order owing to the writing process.
     * TODO: For more efficient searching, children should be sorted in source order.
     */
    var MappingTree = (function () {
        /**
         *
         * @param source
         * @param target
         * @param children
         */
        function MappingTree(source, target, children) {
            this.children = children;
            assert$2(source, "source must be defined");
            assert$2(target, "target must be defined");
            this.source = source;
            this.target = target;
        }
        MappingTree.prototype.offset = function (rows, cols) {
            if (this.target) {
                this.target.offset(rows, cols);
            }
            if (this.children) {
                for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    child.offset(rows, cols);
                }
            }
        };
        MappingTree.prototype.mappings = function () {
            if (this.children) {
                var maps = [];
                for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    for (var _b = 0, _c = child.mappings(); _b < _c.length; _b++) {
                        var map = _c[_b];
                        maps.push(map);
                    }
                }
                return maps;
            }
            else {
                return [{ source: this.source, target: this.target }];
            }
        };
        return MappingTree;
    }());

    var IndentStyle;
    (function (IndentStyle) {
        IndentStyle[IndentStyle["None"] = 0] = "None";
        IndentStyle[IndentStyle["Block"] = 1] = "Block";
        IndentStyle[IndentStyle["Smart"] = 2] = "Smart";
    })(IndentStyle || (IndentStyle = {}));
    var StackElement = (function () {
        function StackElement(bMark, eMark, targetBeginLine, targetBeginColumn, trace) {
            this.bMark = bMark;
            this.eMark = eMark;
            this.texts = [];
            this.trees = [];
            this.cursor = new MutablePosition(targetBeginLine, targetBeginColumn);
        }
        /**
         *
         */
        StackElement.prototype.write = function (text, tree) {
            assert$2(typeof text === 'string', "text must be a string");
            this.texts.push(text);
            this.trees.push(tree);
            var cursor = this.cursor;
            var beginLine = cursor.line;
            var beginColumn = cursor.column;
            var endLine = cursor.line;
            var endColumn = beginColumn + text.length;
            if (tree) {
                tree.target.begin.line = beginLine;
                tree.target.begin.column = beginColumn;
                tree.target.end.line = endLine;
                tree.target.end.column = endColumn;
            }
            cursor.line = endLine;
            cursor.column = endColumn;
        };
        StackElement.prototype.snapshot = function () {
            var texts = this.texts;
            var trees = this.trees;
            var N = texts.length;
            if (N === 0) {
                return this.package('', null);
            }
            else {
                var sBL = Number.MAX_SAFE_INTEGER;
                var sBC = Number.MAX_SAFE_INTEGER;
                var sEL = Number.MIN_SAFE_INTEGER;
                var sEC = Number.MIN_SAFE_INTEGER;
                var tBL = Number.MAX_SAFE_INTEGER;
                var tBC = Number.MAX_SAFE_INTEGER;
                var tEL = Number.MIN_SAFE_INTEGER;
                var tEC = Number.MIN_SAFE_INTEGER;
                var children = [];
                for (var i = 0; i < N; i++) {
                    var tree = trees[i];
                    if (tree) {
                        sBL = Math.min(sBL, tree.source.begin.line);
                        sBC = Math.min(sBC, tree.source.begin.column);
                        sEL = Math.max(sEL, tree.source.end.line);
                        sEC = Math.max(sEC, tree.source.end.column);
                        tBL = Math.min(tBL, tree.target.begin.line);
                        tBC = Math.min(tBC, tree.target.begin.column);
                        tEL = Math.max(tEL, tree.target.end.line);
                        tEC = Math.max(tEC, tree.target.end.column);
                        children.push(tree);
                    }
                }
                var text = texts.join("");
                if (children.length > 1) {
                    var source = new Range$1(new Position$1(sBL, sBC), new Position$1(sEL, sEC));
                    var target = new MutableRange(new MutablePosition(tBL, tBC), new MutablePosition(tEL, tEC));
                    return this.package(text, new MappingTree(source, target, children));
                }
                else if (children.length === 1) {
                    return this.package(text, children[0]);
                }
                else {
                    return this.package(text, null);
                }
            }
        };
        StackElement.prototype.package = function (text, tree) {
            return { text: text, tree: tree, targetEndLine: this.cursor.line, targetEndColumn: this.cursor.column };
        };
        StackElement.prototype.getLine = function () {
            return this.cursor.line;
        };
        StackElement.prototype.getColumn = function () {
            return this.cursor.column;
        };
        return StackElement;
    }());
    function IDXLAST$1(xs) {
        return xs.length - 1;
    }
    /**
     *
     */
    var Stack = (function () {
        function Stack(begin, end, targetLine, targetColumn, trace) {
            this.elements = [];
            this.elements.push(new StackElement(begin, end, targetLine, targetColumn, trace));
        }
        Object.defineProperty(Stack.prototype, "length", {
            get: function () {
                return this.elements.length;
            },
            enumerable: true,
            configurable: true
        });
        Stack.prototype.push = function (element) {
            this.elements.push(element);
        };
        Stack.prototype.pop = function () {
            return this.elements.pop();
        };
        Stack.prototype.write = function (text, tree) {
            this.elements[IDXLAST$1(this.elements)].write(text, tree);
        };
        Stack.prototype.dispose = function () {
            assert$2(this.elements.length === 1, "stack length should be 1");
            var textAndMappings = this.elements[IDXLAST$1(this.elements)].snapshot();
            this.pop();
            assert$2(this.elements.length === 0, "stack length should be 0");
            return textAndMappings;
        };
        Stack.prototype.getLine = function () {
            return this.elements[IDXLAST$1(this.elements)].getLine();
        };
        Stack.prototype.getColumn = function () {
            return this.elements[IDXLAST$1(this.elements)].getColumn();
        };
        return Stack;
    }());
    /**
     * A smart buffer for writing TypeScript code.
     */
    var CodeWriter = (function () {
        /**
         * Determines the indentation.
         */
        // private indentLevel = 0;
        /**
         * Constructs a CodeWriter instance using the specified options.
         */
        function CodeWriter(beginLine, beginColumn, options, trace) {
            if (options === void 0) { options = {}; }
            if (trace === void 0) { trace = false; }
            this.options = options;
            this.trace = trace;
            this.stack = new Stack('', '', beginLine, beginColumn, trace);
        }
        CodeWriter.prototype.assign = function (text, source) {
            var target = new MutableRange(new MutablePosition(-3, -3), new MutablePosition(-3, -3));
            var tree = new MappingTree(source, target, null);
            this.stack.write(text, tree);
        };
        /**
         * Writes a name (identifier).
         * @param id The identifier string to be written.
         * @param begin The position of the beginning of the name in the original source.
         * @param end The position of the end of the name in the original source.
         */
        CodeWriter.prototype.name = function (id, source) {
            if (source) {
                var target = new MutableRange(new MutablePosition(-2, -2), new MutablePosition(-2, -2));
                var tree = new MappingTree(source, target, null);
                this.stack.write(id, tree);
            }
            else {
                this.stack.write(id, null);
            }
        };
        CodeWriter.prototype.num = function (text, source) {
            if (source) {
                var target = new MutableRange(new MutablePosition(-3, -3), new MutablePosition(-3, -3));
                var tree = new MappingTree(source, target, null);
                this.stack.write(text, tree);
            }
            else {
                this.stack.write(text, null);
            }
        };
        /**
         * Currently defined to be for string literals in unparsed form.
         */
        CodeWriter.prototype.str = function (text, source) {
            if (source) {
                var target = new MutableRange(new MutablePosition(-23, -23), new MutablePosition(-23, -23));
                var tree = new MappingTree(source, target, null);
                this.stack.write(text, tree);
            }
            else {
                this.stack.write(text, null);
            }
        };
        CodeWriter.prototype.write = function (text, tree) {
            this.stack.write(text, tree);
        };
        CodeWriter.prototype.snapshot = function () {
            assert$2(this.stack.length === 1, "stack length is not zero");
            return this.stack.dispose();
        };
        CodeWriter.prototype.binOp = function (binOp, source) {
            var target = new MutableRange(new MutablePosition(-5, -5), new MutablePosition(-5, -5));
            var tree = new MappingTree(source, target, null);
            if (this.options.insertSpaceBeforeAndAfterBinaryOperators) {
                this.space();
                this.stack.write(binOp, tree);
                this.space();
            }
            else {
                this.stack.write(binOp, tree);
            }
        };
        CodeWriter.prototype.comma = function (begin, end) {
            if (begin && end) {
                var source = new Range$1(begin, end);
                var target = new MutableRange(new MutablePosition(-4, -4), new MutablePosition(-4, -4));
                var tree = new MappingTree(source, target, null);
                this.stack.write(',', tree);
            }
            else {
                this.stack.write(',', null);
            }
            if (this.options.insertSpaceAfterCommaDelimiter) {
                this.stack.write(' ', null);
            }
        };
        CodeWriter.prototype.space = function () {
            this.stack.write(' ', null);
        };
        CodeWriter.prototype.beginBlock = function () {
            this.prolog('{', '}');
        };
        CodeWriter.prototype.endBlock = function () {
            this.epilog(false);
        };
        CodeWriter.prototype.beginBracket = function () {
            this.prolog('[', ']');
        };
        CodeWriter.prototype.endBracket = function () {
            this.epilog(this.options.insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets);
        };
        CodeWriter.prototype.beginObject = function () {
            this.prolog('{', '}');
        };
        CodeWriter.prototype.endObject = function () {
            this.epilog(this.options.insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces);
        };
        CodeWriter.prototype.openParen = function () {
            this.prolog('(', ')');
        };
        CodeWriter.prototype.closeParen = function () {
            this.epilog(this.options.insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis);
        };
        CodeWriter.prototype.beginQuote = function () {
            this.prolog("'", "'");
        };
        CodeWriter.prototype.endQuote = function () {
            this.epilog(false);
        };
        CodeWriter.prototype.beginStatement = function () {
            this.prolog('', ';');
        };
        CodeWriter.prototype.endStatement = function () {
            this.epilog(false);
        };
        CodeWriter.prototype.prolog = function (bMark, eMark) {
            var line = this.stack.getLine();
            var column = this.stack.getColumn();
            this.stack.push(new StackElement(bMark, eMark, line, column, this.trace));
        };
        CodeWriter.prototype.epilog = function (insertSpaceAfterOpeningAndBeforeClosingNonempty) {
            var popped = this.stack.pop();
            var textAndMappings = popped.snapshot();
            var text = textAndMappings.text;
            var tree = textAndMappings.tree;
            // This is where we would be
            // const line = textAndMappings.targetEndLine;
            // const column = textAndMappings.targetEndColumn;
            if (text.length > 0 && insertSpaceAfterOpeningAndBeforeClosingNonempty) {
                this.write(popped.bMark, null);
                this.space();
                var rows = 0;
                var cols = popped.bMark.length + 1;
                if (tree) {
                    tree.offset(rows, cols);
                }
                this.write(text, tree);
                this.space();
                this.write(popped.eMark, null);
            }
            else {
                this.write(popped.bMark, null);
                var rows = 0;
                var cols = popped.bMark.length;
                if (tree) {
                    tree.offset(rows, cols);
                }
                this.write(text, tree);
                this.write(popped.eMark, null);
            }
        };
        return CodeWriter;
    }());

    /**
     *
     */
    var RBNode = (function () {
        /**
         * Constructs a red-black binary tree node.
         */
        function RBNode(key, value) {
            this.key = key;
            this.value = value;
            /**
             * The red (true) / black (false) flag.
             */
            this.flag = false;
            this.l = this;
            this.r = this;
            this.p = this;
        }
        /*
        get red(): boolean {
            return this.flag;
        }
        set red(red: boolean) {
            this.flag = red;
        }
        get black(): boolean {
            return !this.flag;
        }
        set black(black: boolean) {
            this.flag = !black;
        }
        */
        RBNode.prototype.toString = function () {
            return (this.flag ? 'red' : 'black') + " " + this.key;
        };
        return RBNode;
    }());

    var RBTree = (function () {
        /**
         * Initializes an RBTree.
         * It is important to define a key that is smaller than all expected keys
         * so that the first insert becomes the root (head.r).
         *
         * @param lowKey A key that is smaller than all expected keys.
         * @param highKey A key that is larger than all expected keys.
         * @param nilValue The value to return when a search is not successful.
         * @param comp The comparator used for comparing keys.
         */
        function RBTree(lowKey, highKey, nilValue, comp) {
            this.highKey = highKey;
            this.comp = comp;
            /**
             * The number of keys inserted.
             */
            this.N = 0;
            this.lowNode = new RBNode(lowKey, nilValue);
            this.highNode = new RBNode(highKey, nilValue);
            // Notice that z does not have a key because it has to be less than and greater than every other key.
            var z = new RBNode(null, nilValue);
            this.head = new RBNode(lowKey, nilValue);
            // Head left is never used or changed so we'll store the tail node there.
            this.head.l = z;
            // Head right refers the the actual tree root which is currently empty.
            this.head.r = z;
            this.head.p = this.head;
        }
        Object.defineProperty(RBTree.prototype, "root", {
            get: function () {
                return this.head.r;
            },
            set: function (root) {
                this.head.r = root;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RBTree.prototype, "z", {
            /**
             * The "tail" node.
             * This allows our subtrees never to be undefined or null.
             * All searches will result in a node, but misses will return the tail node.
             */
            get: function () {
                return this.head.l;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RBTree.prototype, "lowKey", {
            get: function () {
                return this.head.key;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Legal means that is greater than the key stored in the head node.
         * The key does not have to exist.
         */
        RBTree.prototype.assertLegalKey = function (key, comp) {
            if (comp(key, this.lowKey) <= 0) {
                throw new Error("key, " + key + ", must be greater than the low key, " + this.lowKey + ".");
            }
            if (comp(key, this.highKey) >= 0) {
                throw new Error("key, " + key + ", must be less than the high key, " + this.highKey + ".");
            }
        };
        /**
         *
         */
        RBTree.prototype.insert = function (key, value) {
            var comp = this.comp;
            this.assertLegalKey(key, comp);
            var n = new RBNode(key, value);
            rbInsert(this, n, comp);
            this.root.flag = false;
            // Update the count of nodes inserted.
            this.N += 1;
            return n;
        };
        /**
         * Greatest Lower Bound of a key.
         * Returns the node corresponding to the key if it exists, or the next lowest key.
         * Returns null if there is no smaller key in the tree.
         */
        RBTree.prototype.glb = function (key) {
            var comp = this.comp;
            this.assertLegalKey(key, comp);
            var low = this.lowNode;
            var node = glb(this, this.root, key, comp, low);
            if (node !== low) {
                return node;
            }
            else {
                return null;
            }
        };
        /**
         * Least Upper Bound of a key.
         * Returns the node corresponding to the key if it exists, or the next highest key.
         * Returns null if there is no greater key in the tree.
         */
        RBTree.prototype.lub = function (key) {
            var comp = this.comp;
            this.assertLegalKey(key, comp);
            var high = this.highNode;
            var node = lub(this, this.root, key, comp, high);
            if (node !== high) {
                return node;
            }
            else {
                return null;
            }
        };
        /**
         *
         */
        RBTree.prototype.search = function (key) {
            var comp = this.comp;
            this.assertLegalKey(key, comp);
            /**
             * The current node for the search.
             */
            var x = this.root;
            // The search will always be "successful" but may end with z.
            this.z.key = key;
            while (comp(key, x.key) !== 0) {
                x = comp(key, x.key) < 0 ? x.l : x.r;
            }
            return x.value;
        };
        /**
         *
         * @param key
         */
        RBTree.prototype.remove = function (key) {
            var comp = this.comp;
            this.assertLegalKey(key, comp);
            var head = this.head;
            var z = this.z;
            /**
             * The current node for the search, we begin at the root.
             */
            var x = this.root;
            /**
             * The parent of the current node.
             */
            var p = head;
            // The search will always be "successful" but may end with z.
            z.key = key;
            // Search in the normal way to get p and x.
            while (comp(key, x.key) !== 0) {
                p = x;
                x = comp(key, x.key) < 0 ? x.l : x.r;
            }
            // Our search has terminated and x is either the node to be removed or z.
            /**
             * A reference to the node that we will be removing.
             * This may point to z, but the following code also works in that case.
             */
            var t = x;
            // From now on we will be making x reference the node that replaces t.
            if (t.r === z) {
                // The node t has no right child.
                // The node that replaces t will be the left child of t.
                x = t.l;
            }
            else if (t.r.l === z) {
                // The node t has a right child with no left child.
                // This empty slot can be used to accept t.l
                x = t.r;
                x.l = t.l;
            }
            else {
                // The node with the next highest key must be in the r-l-l-l-l... path with a left child equal to z.
                // It can't be anywhere else of there would be an intervening key.
                // Note also that the previous tests have eliminated the case where
                // there is no highets key. This node with the next highest key must have
                // the property that it has an empty left child.
                var c = t.r;
                while (c.l.l !== z) {
                    c = c.l;
                }
                // We exit from the loop when c.l.l equals z, which means that c.l is the node that
                // we want to use to replace t.
                x = c.l;
                c.l = x.r;
                x.l = t.l;
                x.r = t.r;
            }
            // We can now free the t node (if we need to do so).
            // Finally, account for whether t was the left or right child of p.
            if (comp(key, p.key) < 0) {
                p.l = x;
            }
            else {
                p.r = x;
            }
        };
        Object.defineProperty(RBTree.prototype, "heightInvariant", {
            /**
             * Determines whether this tree satisfies the height invariant.
             * The height invariant is that the number of black nodes in every path to leaf nodes should be the same.
             * This property is for testing only; it traverses the tree and so affects performance.
             */
            get: function () {
                return heightInv(this.root, this.z);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RBTree.prototype, "colorInvariant", {
            /**
             * Determines whether this tree satisfies the color invarant.
             * The color invariant is that no two adjacent nodes should be colored red.
             * This property is for testing only; it traverses the treeand so affects performance.
             */
            get: function () {
                return colorInv(this.root, this.head.flag, this.z);
            },
            enumerable: true,
            configurable: true
        });
        return RBTree;
    }());
    function colorFlip(p, g, gg) {
        p.flag = false;
        g.flag = true;
        gg.flag = false;
        return g;
    }
    /**
     * z, x, y are in diamond-left formation.
     * z is the initial leader and is black.
     * x and y are initially red.
     *
     * z moves right and back.
     * y takes the lead.
     * children a,b of y are adopted by x and z.
     * x becomes black.
     *
     *    z          y
     * x    =>    x     z
     *    y        a   b
     *  a   b
     */
    function diamondLeftToVic(lead) {
        var m = lead.p;
        var z = lead;
        var x = z.l;
        var y = x.r;
        var a = y.l;
        var b = y.r;
        x.flag = false;
        y.l = x;
        x.p = y;
        y.r = z;
        z.p = y;
        x.r = a;
        a.p = x;
        z.l = b;
        b.p = z;
        if (m.r === lead) {
            m.r = y;
        }
        else {
            m.l = y;
        }
        y.p = m;
        return y;
    }
    /**
     * x, z, y are in diamond-right formation.
     * x is the initial leader and is black.
     * z and y are initially red.
     *
     * x moves left and back
     * y takes the lead.
     * z becomes black.
     *
     *    x          y
     *       z => x     z
     *    y        a   b
     *  a   b
     */
    function diamondRightToVic(lead) {
        var m = lead.p;
        var x = lead;
        var z = x.r;
        var y = z.l;
        var a = y.l;
        var b = y.r;
        z.flag = false;
        y.l = x;
        x.p = y;
        y.r = z;
        z.p = y;
        x.r = a;
        a.p = x;
        z.l = b;
        b.p = z;
        if (m.r === lead) {
            m.r = y;
        }
        else {
            m.l = y;
        }
        y.p = m;
        return y;
    }
    function echelonLeftToVic(lead) {
        var m = lead.p;
        var z = lead;
        var y = z.l;
        var a = y.r;
        y.l.flag = false;
        y.r = z;
        z.p = y;
        z.l = a;
        a.p = z;
        if (m.r === lead) {
            m.r = y;
        }
        else {
            m.l = y;
        }
        y.p = m;
        return y;
    }
    function echelonRightToVic(lead) {
        var m = lead.p;
        var x = lead;
        var y = x.r;
        var a = y.l;
        y.r.flag = false;
        y.l = x;
        x.p = y;
        x.r = a;
        a.p = x;
        if (m.r === lead) {
            m.r = y;
        }
        else {
            m.l = y;
        }
        y.p = m;
        return y;
    }
    function colorInv(node, redParent, z) {
        if (node === z) {
            return true;
        }
        else if (redParent && node.flag) {
            return false;
        }
        else {
            return colorInv(node.l, node.flag, z) && colorInv(node.r, node.flag, z);
        }
    }
    function heightInv(node, z) {
        return blackHeight(node, z) >= 0;
    }
    /**
     * Computes the number of black nodes (including z) on the path from x to leaf, not counting x.
     * The height does not include itself.
     * z nodes are black.
     */
    function blackHeight(x, z) {
        if (x === z) {
            return 0;
        }
        else {
            var hL = blackHeight(x.l, z);
            if (hL >= 0) {
                var hR = blackHeight(x.r, z);
                if (hR >= 0) {
                    if (hR === hR) {
                        return x.flag ? hL : hL + 1;
                    }
                }
            }
            return -1;
        }
    }
    function rbInsert(tree, n, comp) {
        var key = n.key;
        var z = tree.z;
        var x = tree.root;
        x.p = tree.head;
        while (x !== z) {
            x.l.p = x;
            x.r.p = x;
            x = comp(key, x.key) < 0 ? x.l : x.r;
        }
        n.p = x.p;
        if (x.p === tree.head) {
            tree.root = n;
        }
        else {
            if (comp(key, x.p.key) < 0) {
                x.p.l = n;
            }
            else {
                x.p.r = n;
            }
        }
        n.l = z;
        n.r = z;
        if (n.p.flag) {
            rbInsertFixup(tree, n);
        }
        else {
            n.flag = true;
        }
    }
    /**
     * In this algorithm we start with the node that has been inserted and make our way up the tree.
     * This requires carefully maintaining parent pointers.
     */
    function rbInsertFixup(tree, n) {
        // When inserting the node (at any place other than the root), we always color it red.
        // This is so that we don't violate the height invariant.
        // However, this may violate the color invariant, which we address by recursing back up the tree.
        n.flag = true;
        if (!n.p.flag) {
            throw new Error("n.p must be red.");
        }
        while (n.flag) {
            /**
             * The parent of n.
             */
            var p = n.p;
            if (n === tree.root) {
                tree.root.flag = false;
                return;
            }
            else if (p === tree.root) {
                tree.root.flag = false;
                return;
            }
            /**
             * The leader of the formation.
             */
            var lead = p.p;
            // Establish the n = red, p = red, g = black condition for a transformation.
            if (p.flag && !lead.flag) {
                if (p === lead.l) {
                    var aux = lead.r;
                    if (aux.flag) {
                        n = colorFlip(p, lead, aux);
                    }
                    else if (n === p.r) {
                        n = diamondLeftToVic(lead);
                    }
                    else {
                        n = echelonLeftToVic(lead);
                    }
                }
                else {
                    var aux = lead.l;
                    if (aux.flag) {
                        n = colorFlip(p, lead, aux);
                    }
                    else if (n === n.p.l) {
                        n = diamondRightToVic(lead);
                    }
                    else {
                        n = echelonRightToVic(lead);
                    }
                }
            }
            else {
                break;
            }
        }
        tree.root.flag = false;
    }
    /**
     * Recursive implementation to compute the Greatest Lower Bound.
     * The largest key such that glb <= key.
     */
    function glb(tree, node, key, comp, low) {
        if (node === tree.z) {
            return low;
        }
        else if (comp(key, node.key) >= 0) {
            // The node key is a valid lower bound, but may not be the greatest.
            // Take the right link in search of larger keys.
            return maxNode(node, glb(tree, node.r, key, comp, low), comp);
        }
        else {
            // Take the left link in search of smaller keys.
            return glb(tree, node.l, key, comp, low);
        }
    }
    /**
     * Recursive implementation to compute the Least Upper Bound.
     * The smallest key such that key <= lub.
     */
    function lub(tree, node, key, comp, high) {
        if (node === tree.z) {
            return high;
        }
        else if (comp(key, node.key) <= 0) {
            // The node key is a valid upper bound, but may not be the least.
            return minNode(node, lub(tree, node.l, key, comp, high), comp);
        }
        else {
            // Take the right link in search of bigger keys.
            return lub(tree, node.r, key, comp, high);
        }
    }
    function maxNode(a, b, comp) {
        if (comp(a.key, b.key) > 0) {
            return a;
        }
        else if (comp(a.key, b.key) < 0) {
            return b;
        }
        else {
            return a;
        }
    }
    function minNode(a, b, comp) {
        if (comp(a.key, b.key) < 0) {
            return a;
        }
        else if (comp(a.key, b.key) > 0) {
            return b;
        }
        else {
            return a;
        }
    }

    /**
     * Symbolic constants for various Python Language tokens.
     */
    var Tokens;
    (function (Tokens) {
        Tokens[Tokens["T_ENDMARKER"] = 0] = "T_ENDMARKER";
        Tokens[Tokens["T_NAME"] = 1] = "T_NAME";
        Tokens[Tokens["T_NUMBER"] = 2] = "T_NUMBER";
        Tokens[Tokens["T_STRING"] = 3] = "T_STRING";
        Tokens[Tokens["T_NEWLINE"] = 4] = "T_NEWLINE";
        Tokens[Tokens["T_INDENT"] = 5] = "T_INDENT";
        Tokens[Tokens["T_DEDENT"] = 6] = "T_DEDENT";
        Tokens[Tokens["T_LPAR"] = 7] = "T_LPAR";
        Tokens[Tokens["T_RPAR"] = 8] = "T_RPAR";
        Tokens[Tokens["T_LSQB"] = 9] = "T_LSQB";
        Tokens[Tokens["T_RSQB"] = 10] = "T_RSQB";
        Tokens[Tokens["T_COLON"] = 11] = "T_COLON";
        Tokens[Tokens["T_COMMA"] = 12] = "T_COMMA";
        Tokens[Tokens["T_SEMI"] = 13] = "T_SEMI";
        Tokens[Tokens["T_PLUS"] = 14] = "T_PLUS";
        Tokens[Tokens["T_MINUS"] = 15] = "T_MINUS";
        Tokens[Tokens["T_STAR"] = 16] = "T_STAR";
        Tokens[Tokens["T_SLASH"] = 17] = "T_SLASH";
        Tokens[Tokens["T_VBAR"] = 18] = "T_VBAR";
        Tokens[Tokens["T_AMPER"] = 19] = "T_AMPER";
        Tokens[Tokens["T_LESS"] = 20] = "T_LESS";
        Tokens[Tokens["T_GREATER"] = 21] = "T_GREATER";
        Tokens[Tokens["T_EQUAL"] = 22] = "T_EQUAL";
        Tokens[Tokens["T_DOT"] = 23] = "T_DOT";
        Tokens[Tokens["T_PERCENT"] = 24] = "T_PERCENT";
        Tokens[Tokens["T_BACKQUOTE"] = 25] = "T_BACKQUOTE";
        Tokens[Tokens["T_LBRACE"] = 26] = "T_LBRACE";
        Tokens[Tokens["T_RBRACE"] = 27] = "T_RBRACE";
        Tokens[Tokens["T_EQEQUAL"] = 28] = "T_EQEQUAL";
        Tokens[Tokens["T_NOTEQUAL"] = 29] = "T_NOTEQUAL";
        Tokens[Tokens["T_LESSEQUAL"] = 30] = "T_LESSEQUAL";
        Tokens[Tokens["T_GREATEREQUAL"] = 31] = "T_GREATEREQUAL";
        Tokens[Tokens["T_TILDE"] = 32] = "T_TILDE";
        Tokens[Tokens["T_CIRCUMFLEX"] = 33] = "T_CIRCUMFLEX";
        Tokens[Tokens["T_LEFTSHIFT"] = 34] = "T_LEFTSHIFT";
        Tokens[Tokens["T_RIGHTSHIFT"] = 35] = "T_RIGHTSHIFT";
        Tokens[Tokens["T_DOUBLESTAR"] = 36] = "T_DOUBLESTAR";
        Tokens[Tokens["T_PLUSEQUAL"] = 37] = "T_PLUSEQUAL";
        Tokens[Tokens["T_MINEQUAL"] = 38] = "T_MINEQUAL";
        Tokens[Tokens["T_STAREQUAL"] = 39] = "T_STAREQUAL";
        Tokens[Tokens["T_SLASHEQUAL"] = 40] = "T_SLASHEQUAL";
        Tokens[Tokens["T_PERCENTEQUAL"] = 41] = "T_PERCENTEQUAL";
        Tokens[Tokens["T_AMPEREQUAL"] = 42] = "T_AMPEREQUAL";
        Tokens[Tokens["T_VBAREQUAL"] = 43] = "T_VBAREQUAL";
        Tokens[Tokens["T_CIRCUMFLEXEQUAL"] = 44] = "T_CIRCUMFLEXEQUAL";
        Tokens[Tokens["T_LEFTSHIFTEQUAL"] = 45] = "T_LEFTSHIFTEQUAL";
        Tokens[Tokens["T_RIGHTSHIFTEQUAL"] = 46] = "T_RIGHTSHIFTEQUAL";
        Tokens[Tokens["T_DOUBLESTAREQUAL"] = 47] = "T_DOUBLESTAREQUAL";
        Tokens[Tokens["T_DOUBLESLASH"] = 48] = "T_DOUBLESLASH";
        Tokens[Tokens["T_DOUBLESLASHEQUAL"] = 49] = "T_DOUBLESLASHEQUAL";
        Tokens[Tokens["T_AT"] = 50] = "T_AT";
        Tokens[Tokens["T_ATEQUAL"] = 51] = "T_ATEQUAL";
        Tokens[Tokens["T_OP"] = 52] = "T_OP";
        Tokens[Tokens["T_COMMENT"] = 53] = "T_COMMENT";
        Tokens[Tokens["T_NL"] = 54] = "T_NL";
        Tokens[Tokens["T_RARROW"] = 55] = "T_RARROW";
        Tokens[Tokens["T_AWAIT"] = 56] = "T_AWAIT";
        Tokens[Tokens["T_ASYNC"] = 57] = "T_ASYNC";
        Tokens[Tokens["T_ERRORTOKEN"] = 58] = "T_ERRORTOKEN";
        Tokens[Tokens["T_N_TOKENS"] = 59] = "T_N_TOKENS";
        Tokens[Tokens["T_NT_OFFSET"] = 256] = "T_NT_OFFSET";
    })(Tokens || (Tokens = {}));

    // DO NOT MODIFY. File automatically generated by pgen/parser/main.py
    /**
     * Mapping from operator textual symbols to token symbolic constants.
     */
    var OpMap = {
        "(": Tokens.T_LPAR,
        ")": Tokens.T_RPAR,
        "[": Tokens.T_LSQB,
        "]": Tokens.T_RSQB,
        ":": Tokens.T_COLON,
        ",": Tokens.T_COMMA,
        ";": Tokens.T_SEMI,
        "+": Tokens.T_PLUS,
        "-": Tokens.T_MINUS,
        "*": Tokens.T_STAR,
        "/": Tokens.T_SLASH,
        "|": Tokens.T_VBAR,
        "&": Tokens.T_AMPER,
        "<": Tokens.T_LESS,
        ">": Tokens.T_GREATER,
        "=": Tokens.T_EQUAL,
        ".": Tokens.T_DOT,
        "%": Tokens.T_PERCENT,
        "`": Tokens.T_BACKQUOTE,
        "{": Tokens.T_LBRACE,
        "}": Tokens.T_RBRACE,
        "@": Tokens.T_AT,
        "==": Tokens.T_EQEQUAL,
        "!=": Tokens.T_NOTEQUAL,
        "<>": Tokens.T_NOTEQUAL,
        "<=": Tokens.T_LESSEQUAL,
        ">=": Tokens.T_GREATEREQUAL,
        "~": Tokens.T_TILDE,
        "^": Tokens.T_CIRCUMFLEX,
        "<<": Tokens.T_LEFTSHIFT,
        ">>": Tokens.T_RIGHTSHIFT,
        "**": Tokens.T_DOUBLESTAR,
        "+=": Tokens.T_PLUSEQUAL,
        "-=": Tokens.T_MINEQUAL,
        "*=": Tokens.T_STAREQUAL,
        "/=": Tokens.T_SLASHEQUAL,
        "%=": Tokens.T_PERCENTEQUAL,
        "&=": Tokens.T_AMPEREQUAL,
        "|=": Tokens.T_VBAREQUAL,
        "^=": Tokens.T_CIRCUMFLEXEQUAL,
        "<<=": Tokens.T_LEFTSHIFTEQUAL,
        ">>=": Tokens.T_RIGHTSHIFTEQUAL,
        "**=": Tokens.T_DOUBLESTAREQUAL,
        "//": Tokens.T_DOUBLESLASH,
        "//=": Tokens.T_DOUBLESLASHEQUAL,
        "->": Tokens.T_RARROW
    };
    /**
     * An Arc is a pair, represented in an array, consisting a label and a to-state.
     */
    var ARC_SYMBOL_LABEL = 0;
    var ARC_TO_STATE = 1;
    /**
     *
     */
    var IDX_DFABT_DFA = 0;
    var IDX_DFABT_BEGIN_TOKENS = 1;
    /**
     *
     */
    var ParseTables = {
        sym: { AndExpr: 257,
            ArithmeticExpr: 258,
            AtomExpr: 259,
            BitwiseAndExpr: 260,
            BitwiseOrExpr: 261,
            BitwiseXorExpr: 262,
            ComparisonExpr: 263,
            ExprList: 264,
            ExprStmt: 265,
            GeometricExpr: 266,
            GlobalStmt: 267,
            IfExpr: 268,
            ImportList: 269,
            ImportSpecifier: 270,
            LambdaExpr: 271,
            ModuleSpecifier: 272,
            NonLocalStmt: 273,
            NotExpr: 274,
            OrExpr: 275,
            PowerExpr: 276,
            ShiftExpr: 277,
            UnaryExpr: 278,
            YieldExpr: 279,
            annasign: 280,
            arglist: 281,
            argument: 282,
            assert_stmt: 283,
            augassign: 284,
            break_stmt: 285,
            classdef: 286,
            comp_op: 287,
            compound_stmt: 288,
            continue_stmt: 289,
            decorated: 290,
            decorator: 291,
            decorators: 292,
            del_stmt: 293,
            dictmaker: 294,
            dotted_as_name: 295,
            dotted_as_names: 296,
            dotted_name: 297,
            encoding_decl: 298,
            eval_input: 299,
            except_clause: 300,
            exec_stmt: 301,
            file_input: 302,
            flow_stmt: 303,
            for_stmt: 304,
            fpdef: 305,
            fplist: 306,
            funcdef: 307,
            gen_for: 308,
            gen_if: 309,
            gen_iter: 310,
            if_stmt: 311,
            import_from: 312,
            import_name: 313,
            import_stmt: 314,
            list_for: 315,
            list_if: 316,
            list_iter: 317,
            listmaker: 318,
            old_LambdaExpr: 319,
            old_test: 320,
            parameters: 321,
            pass_stmt: 322,
            print_stmt: 323,
            raise_stmt: 324,
            return_stmt: 325,
            simple_stmt: 326,
            single_input: 256,
            sliceop: 327,
            small_stmt: 328,
            stmt: 329,
            subscript: 330,
            subscriptlist: 331,
            suite: 332,
            testlist: 333,
            testlist1: 334,
            testlist_gexp: 335,
            testlist_safe: 336,
            trailer: 337,
            try_stmt: 338,
            varargslist: 339,
            while_stmt: 340,
            with_stmt: 341,
            with_var: 342,
            yield_stmt: 343 },
        number2symbol: { 256: 'single_input',
            257: 'AndExpr',
            258: 'ArithmeticExpr',
            259: 'AtomExpr',
            260: 'BitwiseAndExpr',
            261: 'BitwiseOrExpr',
            262: 'BitwiseXorExpr',
            263: 'ComparisonExpr',
            264: 'ExprList',
            265: 'ExprStmt',
            266: 'GeometricExpr',
            267: 'GlobalStmt',
            268: 'IfExpr',
            269: 'ImportList',
            270: 'ImportSpecifier',
            271: 'LambdaExpr',
            272: 'ModuleSpecifier',
            273: 'NonLocalStmt',
            274: 'NotExpr',
            275: 'OrExpr',
            276: 'PowerExpr',
            277: 'ShiftExpr',
            278: 'UnaryExpr',
            279: 'YieldExpr',
            280: 'annasign',
            281: 'arglist',
            282: 'argument',
            283: 'assert_stmt',
            284: 'augassign',
            285: 'break_stmt',
            286: 'classdef',
            287: 'comp_op',
            288: 'compound_stmt',
            289: 'continue_stmt',
            290: 'decorated',
            291: 'decorator',
            292: 'decorators',
            293: 'del_stmt',
            294: 'dictmaker',
            295: 'dotted_as_name',
            296: 'dotted_as_names',
            297: 'dotted_name',
            298: 'encoding_decl',
            299: 'eval_input',
            300: 'except_clause',
            301: 'exec_stmt',
            302: 'file_input',
            303: 'flow_stmt',
            304: 'for_stmt',
            305: 'fpdef',
            306: 'fplist',
            307: 'funcdef',
            308: 'gen_for',
            309: 'gen_if',
            310: 'gen_iter',
            311: 'if_stmt',
            312: 'import_from',
            313: 'import_name',
            314: 'import_stmt',
            315: 'list_for',
            316: 'list_if',
            317: 'list_iter',
            318: 'listmaker',
            319: 'old_LambdaExpr',
            320: 'old_test',
            321: 'parameters',
            322: 'pass_stmt',
            323: 'print_stmt',
            324: 'raise_stmt',
            325: 'return_stmt',
            326: 'simple_stmt',
            327: 'sliceop',
            328: 'small_stmt',
            329: 'stmt',
            330: 'subscript',
            331: 'subscriptlist',
            332: 'suite',
            333: 'testlist',
            334: 'testlist1',
            335: 'testlist_gexp',
            336: 'testlist_safe',
            337: 'trailer',
            338: 'try_stmt',
            339: 'varargslist',
            340: 'while_stmt',
            341: 'with_stmt',
            342: 'with_var',
            343: 'yield_stmt' },
        dfas: { 256: [[[[1, 1], [2, 1], [3, 2]], [[0, 1]], [[2, 1]]],
                { 2: 1,
                    4: 1,
                    5: 1,
                    6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    10: 1,
                    11: 1,
                    12: 1,
                    13: 1,
                    14: 1,
                    15: 1,
                    16: 1,
                    17: 1,
                    18: 1,
                    19: 1,
                    20: 1,
                    21: 1,
                    22: 1,
                    23: 1,
                    24: 1,
                    25: 1,
                    26: 1,
                    27: 1,
                    28: 1,
                    29: 1,
                    30: 1,
                    31: 1,
                    32: 1,
                    33: 1,
                    34: 1,
                    35: 1,
                    36: 1,
                    37: 1 }],
            257: [[[[38, 1]], [[39, 0], [0, 1]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            258: [[[[40, 1]], [[25, 0], [37, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            259: [[[[18, 1], [8, 2], [32, 5], [29, 4], [9, 3], [14, 6], [21, 2]],
                    [[18, 1], [0, 1]],
                    [[0, 2]],
                    [[41, 7], [42, 2]],
                    [[43, 2], [44, 8], [45, 8]],
                    [[46, 9], [47, 2]],
                    [[48, 10]],
                    [[42, 2]],
                    [[43, 2]],
                    [[47, 2]],
                    [[14, 2]]],
                { 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 29: 1, 32: 1 }],
            260: [[[[49, 1]], [[50, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            261: [[[[51, 1]], [[52, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            262: [[[[53, 1]], [[54, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            263: [[[[55, 1]], [[56, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            264: [[[[55, 1]], [[57, 2], [0, 1]], [[55, 1], [0, 2]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            265: [[[[58, 1]],
                    [[59, 2], [60, 3], [61, 4], [0, 1]],
                    [[0, 2]],
                    [[58, 2], [45, 2]],
                    [[58, 5], [45, 5]],
                    [[61, 4], [0, 5]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            266: [[[[62, 1]], [[63, 0], [64, 0], [65, 0], [66, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            267: [[[[27, 1]], [[21, 2]], [[57, 1], [0, 2]]], { 27: 1 }],
            268: [[[[67, 1], [68, 2]],
                    [[0, 1]],
                    [[31, 3], [0, 2]],
                    [[68, 4]],
                    [[69, 5]],
                    [[70, 1]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            269: [[[[71, 1]], [[57, 2], [0, 1]], [[71, 1], [0, 2]]], { 21: 1 }],
            270: [[[[21, 1]], [[72, 2], [0, 1]], [[21, 3]], [[0, 3]]], { 21: 1 }],
            271: [[[[11, 1]], [[73, 2], [74, 3]], [[70, 4]], [[73, 2]], [[0, 4]]],
                { 11: 1 }],
            272: [[[[18, 1]], [[0, 1]]], { 18: 1 }],
            273: [[[[13, 1]], [[21, 2]], [[57, 1], [0, 2]]], { 13: 1 }],
            274: [[[[7, 1], [75, 2]], [[38, 2]], [[0, 2]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            275: [[[[76, 1]], [[77, 0], [0, 1]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            276: [[[[78, 1]], [[79, 1], [80, 2], [0, 1]], [[49, 3]], [[0, 3]]],
                { 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 29: 1, 32: 1 }],
            277: [[[[81, 1]], [[82, 0], [83, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            278: [[[[25, 1], [6, 1], [37, 1], [84, 2]], [[49, 2]], [[0, 2]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            279: [[[[26, 1]], [[58, 2], [0, 1]], [[0, 2]]], { 26: 1 }],
            280: [[[[73, 1]], [[70, 2]], [[61, 3], [0, 2]], [[70, 4]], [[0, 4]]],
                { 73: 1 }],
            281: [[[[64, 1], [85, 2], [80, 3]],
                    [[70, 4]],
                    [[57, 5], [0, 2]],
                    [[70, 6]],
                    [[57, 7], [0, 4]],
                    [[64, 1], [85, 2], [80, 3], [0, 5]],
                    [[0, 6]],
                    [[85, 4], [80, 3]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1,
                    64: 1,
                    80: 1 }],
            282: [[[[70, 1]], [[86, 2], [61, 3], [0, 1]], [[0, 2]], [[70, 2]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            283: [[[[20, 1]], [[70, 2]], [[57, 3], [0, 2]], [[70, 4]], [[0, 4]]],
                { 20: 1 }],
            284: [[[[87, 1],
                        [88, 1],
                        [89, 1],
                        [90, 1],
                        [91, 1],
                        [92, 1],
                        [93, 1],
                        [94, 1],
                        [95, 1],
                        [96, 1],
                        [97, 1],
                        [98, 1]],
                    [[0, 1]]],
                { 87: 1,
                    88: 1,
                    89: 1,
                    90: 1,
                    91: 1,
                    92: 1,
                    93: 1,
                    94: 1,
                    95: 1,
                    96: 1,
                    97: 1,
                    98: 1 }],
            285: [[[[33, 1]], [[0, 1]]], { 33: 1 }],
            286: [[[[10, 1]],
                    [[21, 2]],
                    [[73, 3], [29, 4]],
                    [[99, 5]],
                    [[43, 6], [58, 7]],
                    [[0, 5]],
                    [[73, 3]],
                    [[43, 6]]],
                { 10: 1 }],
            287: [[[[100, 1],
                        [101, 1],
                        [7, 2],
                        [102, 1],
                        [100, 1],
                        [103, 1],
                        [104, 1],
                        [105, 3],
                        [106, 1],
                        [107, 1]],
                    [[0, 1]],
                    [[103, 1]],
                    [[7, 1], [0, 3]]],
                { 7: 1, 100: 1, 101: 1, 102: 1, 103: 1, 104: 1, 105: 1, 106: 1, 107: 1 }],
            288: [[[[108, 1],
                        [109, 1],
                        [110, 1],
                        [111, 1],
                        [112, 1],
                        [113, 1],
                        [114, 1],
                        [115, 1]],
                    [[0, 1]]],
                { 4: 1, 10: 1, 15: 1, 17: 1, 28: 1, 31: 1, 35: 1, 36: 1 }],
            289: [[[[34, 1]], [[0, 1]]], { 34: 1 }],
            290: [[[[116, 1]], [[114, 2], [111, 2]], [[0, 2]]], { 35: 1 }],
            291: [[[[35, 1]],
                    [[117, 2]],
                    [[29, 4], [2, 3]],
                    [[0, 3]],
                    [[43, 5], [118, 6]],
                    [[2, 3]],
                    [[43, 5]]],
                { 35: 1 }],
            292: [[[[119, 1]], [[119, 1], [0, 1]]], { 35: 1 }],
            293: [[[[22, 1]], [[120, 2]], [[0, 2]]], { 22: 1 }],
            294: [[[[70, 1]],
                    [[73, 2]],
                    [[70, 3]],
                    [[57, 4], [0, 3]],
                    [[70, 1], [0, 4]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            295: [[[[117, 1]], [[72, 2], [0, 1]], [[21, 3]], [[0, 3]]], { 21: 1 }],
            296: [[[[121, 1]], [[57, 0], [0, 1]]], { 21: 1 }],
            297: [[[[21, 1]], [[122, 0], [0, 1]]], { 21: 1 }],
            298: [[[[21, 1]], [[0, 1]]], { 21: 1 }],
            299: [[[[58, 1]], [[2, 1], [123, 2]], [[0, 2]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            300: [[[[124, 1]],
                    [[70, 2], [0, 1]],
                    [[72, 3], [57, 3], [0, 2]],
                    [[70, 4]],
                    [[0, 4]]],
                { 124: 1 }],
            301: [[[[16, 1]],
                    [[55, 2]],
                    [[103, 3], [0, 2]],
                    [[70, 4]],
                    [[57, 5], [0, 4]],
                    [[70, 6]],
                    [[0, 6]]],
                { 16: 1 }],
            302: [[[[2, 0], [123, 1], [125, 0]], [[0, 1]]],
                { 2: 1,
                    4: 1,
                    5: 1,
                    6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    10: 1,
                    11: 1,
                    12: 1,
                    13: 1,
                    14: 1,
                    15: 1,
                    16: 1,
                    17: 1,
                    18: 1,
                    19: 1,
                    20: 1,
                    21: 1,
                    22: 1,
                    23: 1,
                    24: 1,
                    25: 1,
                    26: 1,
                    27: 1,
                    28: 1,
                    29: 1,
                    30: 1,
                    31: 1,
                    32: 1,
                    33: 1,
                    34: 1,
                    35: 1,
                    36: 1,
                    37: 1,
                    123: 1 }],
            303: [[[[126, 1], [127, 1], [128, 1], [129, 1], [130, 1]], [[0, 1]]],
                { 5: 1, 19: 1, 26: 1, 33: 1, 34: 1 }],
            304: [[[[28, 1]],
                    [[120, 2]],
                    [[103, 3]],
                    [[58, 4]],
                    [[73, 5]],
                    [[99, 6]],
                    [[69, 7], [0, 6]],
                    [[73, 8]],
                    [[99, 9]],
                    [[0, 9]]],
                { 28: 1 }],
            305: [[[[29, 1], [21, 2]],
                    [[131, 3]],
                    [[73, 4], [0, 2]],
                    [[43, 5]],
                    [[70, 5]],
                    [[0, 5]]],
                { 21: 1, 29: 1 }],
            306: [[[[132, 1]], [[57, 2], [0, 1]], [[132, 1], [0, 2]]], { 21: 1, 29: 1 }],
            307: [[[[4, 1]],
                    [[21, 2]],
                    [[133, 3]],
                    [[134, 4], [73, 5]],
                    [[70, 6]],
                    [[99, 7]],
                    [[73, 5]],
                    [[0, 7]]],
                { 4: 1 }],
            308: [[[[28, 1]],
                    [[120, 2]],
                    [[103, 3]],
                    [[68, 4]],
                    [[135, 5], [0, 4]],
                    [[0, 5]]],
                { 28: 1 }],
            309: [[[[31, 1]], [[136, 2]], [[135, 3], [0, 2]], [[0, 3]]], { 31: 1 }],
            310: [[[[86, 1], [137, 1]], [[0, 1]]], { 28: 1, 31: 1 }],
            311: [[[[31, 1]],
                    [[70, 2]],
                    [[73, 3]],
                    [[99, 4]],
                    [[69, 5], [138, 1], [0, 4]],
                    [[73, 6]],
                    [[99, 7]],
                    [[0, 7]]],
                { 31: 1 }],
            312: [[[[30, 1]],
                    [[139, 2]],
                    [[24, 3]],
                    [[140, 4], [29, 5], [64, 4]],
                    [[0, 4]],
                    [[140, 6]],
                    [[43, 4]]],
                { 30: 1 }],
            313: [[[[24, 1]], [[141, 2]], [[0, 2]]], { 24: 1 }],
            314: [[[[142, 1], [143, 1]], [[0, 1]]], { 24: 1, 30: 1 }],
            315: [[[[28, 1]],
                    [[120, 2]],
                    [[103, 3]],
                    [[144, 4]],
                    [[145, 5], [0, 4]],
                    [[0, 5]]],
                { 28: 1 }],
            316: [[[[31, 1]], [[136, 2]], [[145, 3], [0, 2]], [[0, 3]]], { 31: 1 }],
            317: [[[[146, 1], [147, 1]], [[0, 1]]], { 28: 1, 31: 1 }],
            318: [[[[70, 1]],
                    [[146, 2], [57, 3], [0, 1]],
                    [[0, 2]],
                    [[70, 4], [0, 3]],
                    [[57, 3], [0, 4]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            319: [[[[11, 1]], [[73, 2], [74, 3]], [[136, 4]], [[73, 2]], [[0, 4]]],
                { 11: 1 }],
            320: [[[[148, 1], [68, 1]], [[0, 1]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            321: [[[[29, 1]], [[43, 2], [74, 3]], [[0, 2]], [[43, 2]]], { 29: 1 }],
            322: [[[[23, 1]], [[0, 1]]], { 23: 1 }],
            323: [[[[12, 1]],
                    [[70, 2], [82, 3], [0, 1]],
                    [[57, 4], [0, 2]],
                    [[70, 5]],
                    [[70, 2], [0, 4]],
                    [[57, 6], [0, 5]],
                    [[70, 7]],
                    [[57, 8], [0, 7]],
                    [[70, 7], [0, 8]]],
                { 12: 1 }],
            324: [[[[5, 1]],
                    [[70, 2], [0, 1]],
                    [[57, 3], [0, 2]],
                    [[70, 4]],
                    [[57, 5], [0, 4]],
                    [[70, 6]],
                    [[0, 6]]],
                { 5: 1 }],
            325: [[[[19, 1]], [[58, 2], [0, 1]], [[0, 2]]], { 19: 1 }],
            326: [[[[149, 1]], [[2, 2], [150, 3]], [[0, 2]], [[149, 1], [2, 2]]],
                { 5: 1,
                    6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    12: 1,
                    13: 1,
                    14: 1,
                    16: 1,
                    18: 1,
                    19: 1,
                    20: 1,
                    21: 1,
                    22: 1,
                    23: 1,
                    24: 1,
                    25: 1,
                    26: 1,
                    27: 1,
                    29: 1,
                    30: 1,
                    32: 1,
                    33: 1,
                    34: 1,
                    37: 1 }],
            327: [[[[73, 1]], [[70, 2], [0, 1]], [[0, 2]]], { 73: 1 }],
            328: [[[[151, 1],
                        [152, 1],
                        [153, 1],
                        [154, 1],
                        [155, 1],
                        [156, 1],
                        [157, 1],
                        [158, 1],
                        [159, 1],
                        [160, 1]],
                    [[0, 1]]],
                { 5: 1,
                    6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    12: 1,
                    13: 1,
                    14: 1,
                    16: 1,
                    18: 1,
                    19: 1,
                    20: 1,
                    21: 1,
                    22: 1,
                    23: 1,
                    24: 1,
                    25: 1,
                    26: 1,
                    27: 1,
                    29: 1,
                    30: 1,
                    32: 1,
                    33: 1,
                    34: 1,
                    37: 1 }],
            329: [[[[1, 1], [3, 1]], [[0, 1]]],
                { 4: 1,
                    5: 1,
                    6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    10: 1,
                    11: 1,
                    12: 1,
                    13: 1,
                    14: 1,
                    15: 1,
                    16: 1,
                    17: 1,
                    18: 1,
                    19: 1,
                    20: 1,
                    21: 1,
                    22: 1,
                    23: 1,
                    24: 1,
                    25: 1,
                    26: 1,
                    27: 1,
                    28: 1,
                    29: 1,
                    30: 1,
                    31: 1,
                    32: 1,
                    33: 1,
                    34: 1,
                    35: 1,
                    36: 1,
                    37: 1 }],
            330: [[[[73, 1], [70, 2], [122, 3]],
                    [[161, 4], [70, 5], [0, 1]],
                    [[73, 1], [0, 2]],
                    [[122, 6]],
                    [[0, 4]],
                    [[161, 4], [0, 5]],
                    [[122, 4]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1,
                    73: 1,
                    122: 1 }],
            331: [[[[162, 1]], [[57, 2], [0, 1]], [[162, 1], [0, 2]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1,
                    73: 1,
                    122: 1 }],
            332: [[[[1, 1], [2, 2]],
                    [[0, 1]],
                    [[163, 3]],
                    [[125, 4]],
                    [[164, 1], [125, 4]]],
                { 2: 1,
                    5: 1,
                    6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    12: 1,
                    13: 1,
                    14: 1,
                    16: 1,
                    18: 1,
                    19: 1,
                    20: 1,
                    21: 1,
                    22: 1,
                    23: 1,
                    24: 1,
                    25: 1,
                    26: 1,
                    27: 1,
                    29: 1,
                    30: 1,
                    32: 1,
                    33: 1,
                    34: 1,
                    37: 1 }],
            333: [[[[70, 1]], [[57, 2], [0, 1]], [[70, 1], [0, 2]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            334: [[[[70, 1]], [[57, 0], [0, 1]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            335: [[[[70, 1]],
                    [[86, 2], [57, 3], [0, 1]],
                    [[0, 2]],
                    [[70, 4], [0, 3]],
                    [[57, 3], [0, 4]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            336: [[[[136, 1]],
                    [[57, 2], [0, 1]],
                    [[136, 3]],
                    [[57, 4], [0, 3]],
                    [[136, 3], [0, 4]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            337: [[[[29, 1], [122, 2], [32, 3]],
                    [[43, 4], [118, 5]],
                    [[21, 4]],
                    [[165, 6]],
                    [[0, 4]],
                    [[43, 4]],
                    [[47, 4]]],
                { 29: 1, 32: 1, 122: 1 }],
            338: [[[[15, 1]],
                    [[73, 2]],
                    [[99, 3]],
                    [[166, 4], [167, 5]],
                    [[73, 6]],
                    [[73, 7]],
                    [[99, 8]],
                    [[99, 9]],
                    [[166, 4], [69, 10], [167, 5], [0, 8]],
                    [[0, 9]],
                    [[73, 11]],
                    [[99, 12]],
                    [[167, 5], [0, 12]]],
                { 15: 1 }],
            339: [[[[64, 1], [132, 2], [80, 3]],
                    [[21, 4]],
                    [[61, 5], [57, 6], [0, 2]],
                    [[21, 7]],
                    [[57, 8], [0, 4]],
                    [[70, 9]],
                    [[64, 1], [132, 2], [80, 3], [0, 6]],
                    [[0, 7]],
                    [[80, 3]],
                    [[57, 6], [0, 9]]],
                { 21: 1, 29: 1, 64: 1, 80: 1 }],
            340: [[[[17, 1]],
                    [[70, 2]],
                    [[73, 3]],
                    [[99, 4]],
                    [[69, 5], [0, 4]],
                    [[73, 6]],
                    [[99, 7]],
                    [[0, 7]]],
                { 17: 1 }],
            341: [[[[36, 1]],
                    [[70, 2]],
                    [[73, 3], [168, 4]],
                    [[99, 5]],
                    [[73, 3]],
                    [[0, 5]]],
                { 36: 1 }],
            342: [[[[72, 1]], [[55, 2]], [[0, 2]]], { 72: 1 }],
            343: [[[[45, 1]], [[0, 1]]], { 26: 1 }] },
        states: [[[[1, 1], [2, 1], [3, 2]], [[0, 1]], [[2, 1]]],
            [[[38, 1]], [[39, 0], [0, 1]]],
            [[[40, 1]], [[25, 0], [37, 0], [0, 1]]],
            [[[18, 1], [8, 2], [32, 5], [29, 4], [9, 3], [14, 6], [21, 2]],
                [[18, 1], [0, 1]],
                [[0, 2]],
                [[41, 7], [42, 2]],
                [[43, 2], [44, 8], [45, 8]],
                [[46, 9], [47, 2]],
                [[48, 10]],
                [[42, 2]],
                [[43, 2]],
                [[47, 2]],
                [[14, 2]]],
            [[[49, 1]], [[50, 0], [0, 1]]],
            [[[51, 1]], [[52, 0], [0, 1]]],
            [[[53, 1]], [[54, 0], [0, 1]]],
            [[[55, 1]], [[56, 0], [0, 1]]],
            [[[55, 1]], [[57, 2], [0, 1]], [[55, 1], [0, 2]]],
            [[[58, 1]],
                [[59, 2], [60, 3], [61, 4], [0, 1]],
                [[0, 2]],
                [[58, 2], [45, 2]],
                [[58, 5], [45, 5]],
                [[61, 4], [0, 5]]],
            [[[62, 1]], [[63, 0], [64, 0], [65, 0], [66, 0], [0, 1]]],
            [[[27, 1]], [[21, 2]], [[57, 1], [0, 2]]],
            [[[67, 1], [68, 2]],
                [[0, 1]],
                [[31, 3], [0, 2]],
                [[68, 4]],
                [[69, 5]],
                [[70, 1]]],
            [[[71, 1]], [[57, 2], [0, 1]], [[71, 1], [0, 2]]],
            [[[21, 1]], [[72, 2], [0, 1]], [[21, 3]], [[0, 3]]],
            [[[11, 1]], [[73, 2], [74, 3]], [[70, 4]], [[73, 2]], [[0, 4]]],
            [[[18, 1]], [[0, 1]]],
            [[[13, 1]], [[21, 2]], [[57, 1], [0, 2]]],
            [[[7, 1], [75, 2]], [[38, 2]], [[0, 2]]],
            [[[76, 1]], [[77, 0], [0, 1]]],
            [[[78, 1]], [[79, 1], [80, 2], [0, 1]], [[49, 3]], [[0, 3]]],
            [[[81, 1]], [[82, 0], [83, 0], [0, 1]]],
            [[[25, 1], [6, 1], [37, 1], [84, 2]], [[49, 2]], [[0, 2]]],
            [[[26, 1]], [[58, 2], [0, 1]], [[0, 2]]],
            [[[73, 1]], [[70, 2]], [[61, 3], [0, 2]], [[70, 4]], [[0, 4]]],
            [[[64, 1], [85, 2], [80, 3]],
                [[70, 4]],
                [[57, 5], [0, 2]],
                [[70, 6]],
                [[57, 7], [0, 4]],
                [[64, 1], [85, 2], [80, 3], [0, 5]],
                [[0, 6]],
                [[85, 4], [80, 3]]],
            [[[70, 1]], [[86, 2], [61, 3], [0, 1]], [[0, 2]], [[70, 2]]],
            [[[20, 1]], [[70, 2]], [[57, 3], [0, 2]], [[70, 4]], [[0, 4]]],
            [[[87, 1],
                    [88, 1],
                    [89, 1],
                    [90, 1],
                    [91, 1],
                    [92, 1],
                    [93, 1],
                    [94, 1],
                    [95, 1],
                    [96, 1],
                    [97, 1],
                    [98, 1]],
                [[0, 1]]],
            [[[33, 1]], [[0, 1]]],
            [[[10, 1]],
                [[21, 2]],
                [[73, 3], [29, 4]],
                [[99, 5]],
                [[43, 6], [58, 7]],
                [[0, 5]],
                [[73, 3]],
                [[43, 6]]],
            [[[100, 1],
                    [101, 1],
                    [7, 2],
                    [102, 1],
                    [100, 1],
                    [103, 1],
                    [104, 1],
                    [105, 3],
                    [106, 1],
                    [107, 1]],
                [[0, 1]],
                [[103, 1]],
                [[7, 1], [0, 3]]],
            [[[108, 1],
                    [109, 1],
                    [110, 1],
                    [111, 1],
                    [112, 1],
                    [113, 1],
                    [114, 1],
                    [115, 1]],
                [[0, 1]]],
            [[[34, 1]], [[0, 1]]],
            [[[116, 1]], [[114, 2], [111, 2]], [[0, 2]]],
            [[[35, 1]],
                [[117, 2]],
                [[29, 4], [2, 3]],
                [[0, 3]],
                [[43, 5], [118, 6]],
                [[2, 3]],
                [[43, 5]]],
            [[[119, 1]], [[119, 1], [0, 1]]],
            [[[22, 1]], [[120, 2]], [[0, 2]]],
            [[[70, 1]], [[73, 2]], [[70, 3]], [[57, 4], [0, 3]], [[70, 1], [0, 4]]],
            [[[117, 1]], [[72, 2], [0, 1]], [[21, 3]], [[0, 3]]],
            [[[121, 1]], [[57, 0], [0, 1]]],
            [[[21, 1]], [[122, 0], [0, 1]]],
            [[[21, 1]], [[0, 1]]],
            [[[58, 1]], [[2, 1], [123, 2]], [[0, 2]]],
            [[[124, 1]],
                [[70, 2], [0, 1]],
                [[72, 3], [57, 3], [0, 2]],
                [[70, 4]],
                [[0, 4]]],
            [[[16, 1]],
                [[55, 2]],
                [[103, 3], [0, 2]],
                [[70, 4]],
                [[57, 5], [0, 4]],
                [[70, 6]],
                [[0, 6]]],
            [[[2, 0], [123, 1], [125, 0]], [[0, 1]]],
            [[[126, 1], [127, 1], [128, 1], [129, 1], [130, 1]], [[0, 1]]],
            [[[28, 1]],
                [[120, 2]],
                [[103, 3]],
                [[58, 4]],
                [[73, 5]],
                [[99, 6]],
                [[69, 7], [0, 6]],
                [[73, 8]],
                [[99, 9]],
                [[0, 9]]],
            [[[29, 1], [21, 2]],
                [[131, 3]],
                [[73, 4], [0, 2]],
                [[43, 5]],
                [[70, 5]],
                [[0, 5]]],
            [[[132, 1]], [[57, 2], [0, 1]], [[132, 1], [0, 2]]],
            [[[4, 1]],
                [[21, 2]],
                [[133, 3]],
                [[134, 4], [73, 5]],
                [[70, 6]],
                [[99, 7]],
                [[73, 5]],
                [[0, 7]]],
            [[[28, 1]], [[120, 2]], [[103, 3]], [[68, 4]], [[135, 5], [0, 4]], [[0, 5]]],
            [[[31, 1]], [[136, 2]], [[135, 3], [0, 2]], [[0, 3]]],
            [[[86, 1], [137, 1]], [[0, 1]]],
            [[[31, 1]],
                [[70, 2]],
                [[73, 3]],
                [[99, 4]],
                [[69, 5], [138, 1], [0, 4]],
                [[73, 6]],
                [[99, 7]],
                [[0, 7]]],
            [[[30, 1]],
                [[139, 2]],
                [[24, 3]],
                [[140, 4], [29, 5], [64, 4]],
                [[0, 4]],
                [[140, 6]],
                [[43, 4]]],
            [[[24, 1]], [[141, 2]], [[0, 2]]],
            [[[142, 1], [143, 1]], [[0, 1]]],
            [[[28, 1]], [[120, 2]], [[103, 3]], [[144, 4]], [[145, 5], [0, 4]], [[0, 5]]],
            [[[31, 1]], [[136, 2]], [[145, 3], [0, 2]], [[0, 3]]],
            [[[146, 1], [147, 1]], [[0, 1]]],
            [[[70, 1]],
                [[146, 2], [57, 3], [0, 1]],
                [[0, 2]],
                [[70, 4], [0, 3]],
                [[57, 3], [0, 4]]],
            [[[11, 1]], [[73, 2], [74, 3]], [[136, 4]], [[73, 2]], [[0, 4]]],
            [[[148, 1], [68, 1]], [[0, 1]]],
            [[[29, 1]], [[43, 2], [74, 3]], [[0, 2]], [[43, 2]]],
            [[[23, 1]], [[0, 1]]],
            [[[12, 1]],
                [[70, 2], [82, 3], [0, 1]],
                [[57, 4], [0, 2]],
                [[70, 5]],
                [[70, 2], [0, 4]],
                [[57, 6], [0, 5]],
                [[70, 7]],
                [[57, 8], [0, 7]],
                [[70, 7], [0, 8]]],
            [[[5, 1]],
                [[70, 2], [0, 1]],
                [[57, 3], [0, 2]],
                [[70, 4]],
                [[57, 5], [0, 4]],
                [[70, 6]],
                [[0, 6]]],
            [[[19, 1]], [[58, 2], [0, 1]], [[0, 2]]],
            [[[149, 1]], [[2, 2], [150, 3]], [[0, 2]], [[149, 1], [2, 2]]],
            [[[73, 1]], [[70, 2], [0, 1]], [[0, 2]]],
            [[[151, 1],
                    [152, 1],
                    [153, 1],
                    [154, 1],
                    [155, 1],
                    [156, 1],
                    [157, 1],
                    [158, 1],
                    [159, 1],
                    [160, 1]],
                [[0, 1]]],
            [[[1, 1], [3, 1]], [[0, 1]]],
            [[[73, 1], [70, 2], [122, 3]],
                [[161, 4], [70, 5], [0, 1]],
                [[73, 1], [0, 2]],
                [[122, 6]],
                [[0, 4]],
                [[161, 4], [0, 5]],
                [[122, 4]]],
            [[[162, 1]], [[57, 2], [0, 1]], [[162, 1], [0, 2]]],
            [[[1, 1], [2, 2]], [[0, 1]], [[163, 3]], [[125, 4]], [[164, 1], [125, 4]]],
            [[[70, 1]], [[57, 2], [0, 1]], [[70, 1], [0, 2]]],
            [[[70, 1]], [[57, 0], [0, 1]]],
            [[[70, 1]],
                [[86, 2], [57, 3], [0, 1]],
                [[0, 2]],
                [[70, 4], [0, 3]],
                [[57, 3], [0, 4]]],
            [[[136, 1]],
                [[57, 2], [0, 1]],
                [[136, 3]],
                [[57, 4], [0, 3]],
                [[136, 3], [0, 4]]],
            [[[29, 1], [122, 2], [32, 3]],
                [[43, 4], [118, 5]],
                [[21, 4]],
                [[165, 6]],
                [[0, 4]],
                [[43, 4]],
                [[47, 4]]],
            [[[15, 1]],
                [[73, 2]],
                [[99, 3]],
                [[166, 4], [167, 5]],
                [[73, 6]],
                [[73, 7]],
                [[99, 8]],
                [[99, 9]],
                [[166, 4], [69, 10], [167, 5], [0, 8]],
                [[0, 9]],
                [[73, 11]],
                [[99, 12]],
                [[167, 5], [0, 12]]],
            [[[64, 1], [132, 2], [80, 3]],
                [[21, 4]],
                [[61, 5], [57, 6], [0, 2]],
                [[21, 7]],
                [[57, 8], [0, 4]],
                [[70, 9]],
                [[64, 1], [132, 2], [80, 3], [0, 6]],
                [[0, 7]],
                [[80, 3]],
                [[57, 6], [0, 9]]],
            [[[17, 1]],
                [[70, 2]],
                [[73, 3]],
                [[99, 4]],
                [[69, 5], [0, 4]],
                [[73, 6]],
                [[99, 7]],
                [[0, 7]]],
            [[[36, 1]], [[70, 2]], [[73, 3], [168, 4]], [[99, 5]], [[73, 3]], [[0, 5]]],
            [[[72, 1]], [[55, 2]], [[0, 2]]],
            [[[45, 1]], [[0, 1]]]],
        labels: [[0, 'EMPTY'],
            [326, null],
            [4, null],
            [288, null],
            [1, 'def'],
            [1, 'raise'],
            [32, null],
            [1, 'not'],
            [2, null],
            [26, null],
            [1, 'class'],
            [1, 'lambda'],
            [1, 'print'],
            [1, 'nonlocal'],
            [25, null],
            [1, 'try'],
            [1, 'exec'],
            [1, 'while'],
            [3, null],
            [1, 'return'],
            [1, 'assert'],
            [1, null],
            [1, 'del'],
            [1, 'pass'],
            [1, 'import'],
            [15, null],
            [1, 'yield'],
            [1, 'global'],
            [1, 'for'],
            [7, null],
            [1, 'from'],
            [1, 'if'],
            [9, null],
            [1, 'break'],
            [1, 'continue'],
            [50, null],
            [1, 'with'],
            [14, null],
            [274, null],
            [1, 'and'],
            [266, null],
            [294, null],
            [27, null],
            [8, null],
            [335, null],
            [279, null],
            [318, null],
            [10, null],
            [334, null],
            [278, null],
            [19, null],
            [262, null],
            [18, null],
            [260, null],
            [33, null],
            [258, null],
            [287, null],
            [12, null],
            [333, null],
            [280, null],
            [284, null],
            [22, null],
            [277, null],
            [48, null],
            [16, null],
            [17, null],
            [24, null],
            [271, null],
            [275, null],
            [1, 'else'],
            [268, null],
            [270, null],
            [1, 'as'],
            [11, null],
            [339, null],
            [263, null],
            [257, null],
            [1, 'or'],
            [259, null],
            [337, null],
            [36, null],
            [261, null],
            [35, null],
            [34, null],
            [276, null],
            [282, null],
            [308, null],
            [46, null],
            [39, null],
            [41, null],
            [47, null],
            [42, null],
            [43, null],
            [37, null],
            [44, null],
            [49, null],
            [45, null],
            [38, null],
            [40, null],
            [332, null],
            [29, null],
            [21, null],
            [28, null],
            [1, 'in'],
            [30, null],
            [1, 'is'],
            [31, null],
            [20, null],
            [338, null],
            [311, null],
            [304, null],
            [286, null],
            [341, null],
            [340, null],
            [307, null],
            [290, null],
            [292, null],
            [297, null],
            [281, null],
            [291, null],
            [264, null],
            [295, null],
            [23, null],
            [0, null],
            [1, 'except'],
            [329, null],
            [285, null],
            [289, null],
            [324, null],
            [325, null],
            [343, null],
            [306, null],
            [305, null],
            [321, null],
            [55, null],
            [310, null],
            [320, null],
            [309, null],
            [1, 'elif'],
            [272, null],
            [269, null],
            [296, null],
            [313, null],
            [312, null],
            [336, null],
            [317, null],
            [315, null],
            [316, null],
            [319, null],
            [328, null],
            [13, null],
            [303, null],
            [267, null],
            [265, null],
            [322, null],
            [273, null],
            [323, null],
            [293, null],
            [301, null],
            [283, null],
            [314, null],
            [327, null],
            [330, null],
            [5, null],
            [6, null],
            [331, null],
            [300, null],
            [1, 'finally'],
            [342, null]],
        keywords: { 'and': 39,
            'as': 72,
            'assert': 20,
            'break': 33,
            'class': 10,
            'continue': 34,
            'def': 4,
            'del': 22,
            'elif': 138,
            'else': 69,
            'except': 124,
            'exec': 16,
            'finally': 167,
            'for': 28,
            'from': 30,
            'global': 27,
            'if': 31,
            'import': 24,
            'in': 103,
            'is': 105,
            'lambda': 11,
            'nonlocal': 13,
            'not': 7,
            'or': 77,
            'pass': 23,
            'print': 12,
            'raise': 5,
            'return': 19,
            'try': 15,
            'while': 17,
            'with': 36,
            'yield': 26 },
        tokens: { 0: 123,
            1: 21,
            2: 8,
            3: 18,
            4: 2,
            5: 163,
            6: 164,
            7: 29,
            8: 43,
            9: 32,
            10: 47,
            11: 73,
            12: 57,
            13: 150,
            14: 37,
            15: 25,
            16: 64,
            17: 65,
            18: 52,
            19: 50,
            20: 107,
            21: 101,
            22: 61,
            23: 122,
            24: 66,
            25: 14,
            26: 9,
            27: 42,
            28: 102,
            29: 100,
            30: 104,
            31: 106,
            32: 6,
            33: 54,
            34: 83,
            35: 82,
            36: 80,
            37: 93,
            38: 97,
            39: 88,
            40: 98,
            41: 89,
            42: 91,
            43: 92,
            44: 94,
            45: 96,
            46: 87,
            47: 90,
            48: 63,
            49: 95,
            50: 35,
            55: 134 },
        start: 256
    };
    // Nothing more to see here.

    /**
     * We're looking for something that is truthy, not just true.
     */
    function assert$1(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
    function fail(message) {
        assert$1(false, message);
    }

    /**
     * Null function used for default values of callbacks, etc.
     */
    /**
     * Returns true if the specified value is not undefined.
     * WARNING: Do not use this to test if an object has a property. Use the in
     * operator instead.  Additionally, this function assumes that the global
     * undefined variable has not been redefined.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is defined.
     */
    function isDef(val) {
        return val !== undefined;
    }
    /**
     * Returns true if the specified value is a string.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is a string.
     */
    function isString(val) {
        return typeof val === 'string';
    }
    /**
     * Returns true if the specified value is a number.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is a number.
     */
    function isNumber(val) {
        return typeof val === 'number';
    }

    /**
     *
     */
    var TokenError = (function () {
        function TokenError(message, lineNumber, columnNumber) {
            assert$1(isString(message), "message must be a string");
            assert$1(isNumber(lineNumber), "lineNumber must be a number");
            assert$1(isNumber(columnNumber), "columnNumber must be a number");
            this.name = "TokenError";
            this.message = message;
            this.lineNumber = lineNumber;
            this.columnNumber = columnNumber;
        }
        return TokenError;
    }());

    // Cache a few tokens for performance.
    var T_COMMENT$1 = Tokens.T_COMMENT;
    var T_DEDENT = Tokens.T_DEDENT;
    var T_ENDMARKER$1 = Tokens.T_ENDMARKER;
    var T_ERRORTOKEN = Tokens.T_ERRORTOKEN;
    var T_INDENT = Tokens.T_INDENT;
    var T_NAME$1 = Tokens.T_NAME;
    var T_NEWLINE = Tokens.T_NEWLINE;
    var T_NL$1 = Tokens.T_NL;
    var T_NUMBER = Tokens.T_NUMBER;
    var T_OP$1 = Tokens.T_OP;
    var T_STRING = Tokens.T_STRING;
    /* we have to use string and ctor to be able to build patterns up. + on /.../
        * does something strange. */
    // const Whitespace = "[ \\f\\t]*";
    var Comment_ = "#[^\\r\\n]*";
    var MultiComment_ = "'{3}[^]*'{3}";
    var Ident = "[a-zA-Z_]\\w*";
    var Binnumber = '0[bB][01]*';
    var Hexnumber = '0[xX][\\da-fA-F]*[lL]?';
    var Octnumber = '0[oO]?[0-7]*[lL]?';
    var Decnumber = '[1-9]\\d*[lL]?';
    var Intnumber = group(Binnumber, Hexnumber, Octnumber, Decnumber);
    var Exponent = "[eE][-+]?\\d+";
    var Pointfloat = group("\\d+\\.\\d*", "\\.\\d+") + maybe(Exponent);
    var Expfloat = '\\d+' + Exponent;
    var Floatnumber = group(Pointfloat, Expfloat);
    var Imagnumber = group("\\d+[jJ]", Floatnumber + "[jJ]");
    var Number_ = group(Imagnumber, Floatnumber, Intnumber);
    // tail end of ' string
    var Single = "^[^'\\\\]*(?:\\\\.[^'\\\\]*)*'";
    // tail end of " string
    var Double_ = '^[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
    // tail end of ''' string
    var Single3 = "[^'\\\\]*(?:(?:\\\\.|'(?!''))[^'\\\\]*)*'''";
    // tail end of """ string
    var Double3 = '[^"\\\\]*(?:(?:\\\\.|"(?!""))[^"\\\\]*)*"""';
    var Triple = group("[ubUB]?[rR]?'''", '[ubUB]?[rR]?"""');
    // const String_ = group("[uU]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'", '[uU]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*"');
    // Because of leftmost-then-longest match semantics, be sure to put the
    // longest operators first (e.g., if = came before ==, == would get
    // recognized as two instances of =).
    var Operator = group("\\*\\*=?", ">>=?", "<<=?", "<>", "!=", "//=?", "->", "[+\\-*/%&|^=<>]=?", "~");
    var Bracket = '[\\][(){}]';
    var Special = group('\\r?\\n', '[:;.,`@]');
    var Funny = group(Operator, Bracket, Special);
    var ContStr = group("[uUbB]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*" +
        group("'", '\\\\\\r?\\n'), '[uUbB]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*' +
        group('"', '\\\\\\r?\\n'));
    var PseudoExtras = group('\\\\\\r?\\n', Comment_, Triple, MultiComment_);
    // Need to prefix with "^" as we only want to match what's next
    var PseudoToken = "^" + group(PseudoExtras, Number_, Funny, ContStr, Ident);
    var pseudoprog = new RegExp(PseudoToken);
    var single3prog = new RegExp(Single3, "g");
    var double3prog = new RegExp(Double3, "g");
    var endprogs = {
        "'": new RegExp(Single, "g"), '"': new RegExp(Double_, "g"),
        "'''": single3prog, '"""': double3prog,
        "r'''": single3prog, 'r"""': double3prog,
        "u'''": single3prog, 'u"""': double3prog,
        "b'''": single3prog, 'b"""': double3prog,
        "ur'''": single3prog, 'ur"""': double3prog,
        "br'''": single3prog, 'br"""': double3prog,
        "R'''": single3prog, 'R"""': double3prog,
        "U'''": single3prog, 'U"""': double3prog,
        "B'''": single3prog, 'B"""': double3prog,
        "uR'''": single3prog, 'uR"""': double3prog,
        "Ur'''": single3prog, 'Ur"""': double3prog,
        "UR'''": single3prog, 'UR"""': double3prog,
        "bR'''": single3prog, 'bR"""': double3prog,
        "Br'''": single3prog, 'Br"""': double3prog,
        "BR'''": single3prog, 'BR"""': double3prog,
        'r': null, 'R': null,
        'u': null, 'U': null,
        'b': null, 'B': null
    };
    var triple_quoted = {
        "'''": true, '"""': true,
        "r'''": true, 'r"""': true, "R'''": true, 'R"""': true,
        "u'''": true, 'u"""': true, "U'''": true, 'U"""': true,
        "b'''": true, 'b"""': true, "B'''": true, 'B"""': true,
        "ur'''": true, 'ur"""': true, "Ur'''": true, 'Ur"""': true,
        "uR'''": true, 'uR"""': true, "UR'''": true, 'UR"""': true,
        "br'''": true, 'br"""': true, "Br'''": true, 'Br"""': true,
        "bR'''": true, 'bR"""': true, "BR'''": true, 'BR"""': true
    };
    var single_quoted = {
        "'": true, '"': true,
        "r'": true, 'r"': true, "R'": true, 'R"': true,
        "u'": true, 'u"': true, "U'": true, 'U"': true,
        "b'": true, 'b"': true, "B'": true, 'B"': true,
        "ur'": true, 'ur"': true, "Ur'": true, 'Ur"': true,
        "uR'": true, 'uR"': true, "UR'": true, 'UR"': true,
        "br'": true, 'br"': true, "Br'": true, 'Br"': true,
        "bR'": true, 'bR"': true, "BR'": true, 'BR"': true
    };
    var tabsize = 8;
    var NAMECHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    var NUMCHARS = '0123456789';
    /**
     * For performance, let V8 know the size of an array.
     * The first element is the line number.
     * The line number is 1-based. This is intuitive because it maps to the way we think about line numbers.
     * The second element is the column.
     * The column is 0-based. This works well because it is the standard index for accessing strings.
     */
    /**
     * The index of the line in the LineColumn array.
     */
    var LINE = 0;
    /**
     * The index of the column in the LineColumn array.
     */
    var COLUMN = 1;
    var Done = 'done';
    var Failed = 'failed';
    /**
     * This is a port of tokenize.py by Ka-Ping Yee.
     *
     * each call to readline should return one line of input as a string, or
     * undefined if it's finished.
     *
     * callback is called for each token with 5 args:
     * 1. the token type
     * 2. the token string
     * 3. [ start_row, start_col ]
     * 4. [ end_row, end_col ]
     * 5. logical line where the token was found, including continuation lines
     *
     * callback can return true to abort.
     */
    var Tokenizer = (function () {
        /**
         *
         */
        function Tokenizer(interactive, callback) {
            this.callback = callback;
            /**
             * Cache of the beginning of a token.
             * This will change by token so consumers must copy the values out.
             */
            this.begin = [-1, -1];
            /**
             * Cache of the end of a token.
             * This will change by token so consumers must copy the values out.
             */
            this.end = [-1, -1];
            /**
             * The line number. This must be copied into the begin[LINE] and end[LINE] properties.
             */
            this.lnum = 0;
            this.parenlev = 0;
            this.strstart = [-1, -1];
            this.callback = callback;
            this.continued = false;
            this.contstr = '';
            this.needcont = false;
            this.contline = undefined;
            this.indents = [0];
            this.endprog = /.*/;
            this.interactive = interactive;
            this.doneFunc = function doneOrFailed() {
                var begin = this.begin;
                var end = this.end;
                begin[LINE] = end[LINE] = this.lnum;
                begin[COLUMN] = end[COLUMN] = 0;
                var N = this.indents.length;
                for (var i = 1; i < N; ++i) {
                    if (callback(T_DEDENT, '', begin, end, '')) {
                        return Done;
                    }
                }
                if (callback(T_ENDMARKER$1, '', begin, end, '')) {
                    return Done;
                }
                return Failed;
            };
        }
        /**
         * @param line
         * @return 'done' or 'failed' or true?
         */
        Tokenizer.prototype.generateTokens = function (line) {
            var endmatch;
            var column;
            var endIndex;
            if (!line) {
                line = '';
            }
            this.lnum += 1;
            var pos = 0;
            var max = line.length;
            /**
             * Local variable for performance and brevity.
             */
            var callback = this.callback;
            var begin = this.begin;
            begin[LINE] = this.lnum;
            var end = this.end;
            end[LINE] = this.lnum;
            if (this.contstr.length > 0) {
                if (!line) {
                    throw new TokenError("EOF in multi-line string", this.strstart[LINE], this.strstart[COLUMN]);
                }
                this.endprog.lastIndex = 0;
                endmatch = this.endprog.test(line);
                if (endmatch) {
                    pos = endIndex = this.endprog.lastIndex;
                    end[COLUMN] = endIndex;
                    if (callback(T_STRING, this.contstr + line.substring(0, endIndex), this.strstart, end, this.contline + line)) {
                        return Done;
                    }
                    this.contstr = '';
                    this.needcont = false;
                    this.contline = undefined;
                }
                else if (this.needcont && line.substring(line.length - 2) !== "\\\n" && line.substring(line.length - 3) !== "\\\r\n") {
                    // Either contline is a string or the callback must allow undefined.
                    assert$1(typeof this.contline === 'string');
                    end[COLUMN] = line.length;
                    if (callback(T_ERRORTOKEN, this.contstr + line, this.strstart, end, this.contline)) {
                        return Done;
                    }
                    this.contstr = '';
                    this.contline = undefined;
                    return false;
                }
                else {
                    this.contstr += line;
                    this.contline = this.contline + line;
                    return false;
                }
            }
            else if (this.parenlev === 0 && !this.continued) {
                if (!line)
                    return this.doneFunc();
                column = 0;
                while (pos < max) {
                    var ch = line.charAt(pos);
                    if (ch === ' ') {
                        column += 1;
                    }
                    else if (ch === '\t') {
                        column = (column / tabsize + 1) * tabsize;
                    }
                    else if (ch === '\f') {
                        column = 0;
                    }
                    else {
                        break;
                    }
                    pos = pos + 1;
                }
                if (pos === max)
                    return this.doneFunc();
                if ("#\r\n".indexOf(line.charAt(pos)) !== -1) {
                    if (line.charAt(pos) === '#') {
                        var comment_token = rstrip(line.substring(pos), '\r\n');
                        var nl_pos = pos + comment_token.length;
                        begin[COLUMN] = pos;
                        end[COLUMN] = nl_pos;
                        if (callback(T_COMMENT$1, comment_token, begin, end, line)) {
                            return Done;
                        }
                        begin[COLUMN] = nl_pos;
                        end[COLUMN] = line.length;
                        if (callback(T_NL$1, line.substring(nl_pos), begin, end, line)) {
                            return Done;
                        }
                        return false;
                    }
                    else {
                        begin[COLUMN] = pos;
                        end[COLUMN] = line.length;
                        if (callback(T_NL$1, line.substring(pos), begin, end, line)) {
                            return Done;
                        }
                        if (!this.interactive)
                            return false;
                    }
                }
                if ("'''".indexOf(line.charAt(pos)) !== -1) {
                    if (line.charAt(pos) === "'") {
                        var comment_token = line.substring(pos);
                        var nl_pos = pos + comment_token.length;
                        begin[COLUMN] = pos;
                        end[COLUMN] = nl_pos;
                        if (callback(T_COMMENT$1, comment_token, begin, end, line)) {
                            return Done;
                        }
                        begin[COLUMN] = nl_pos;
                        end[COLUMN] = line.length;
                        if (callback(T_NL$1, line.substring(nl_pos), begin, end, line)) {
                            return Done;
                        }
                        return false;
                    }
                    else {
                        begin[COLUMN] = pos;
                        end[COLUMN] = line.length;
                        if (callback(T_NL$1, line.substring(pos), begin, end, line)) {
                            return Done;
                        }
                        if (!this.interactive)
                            return false;
                    }
                }
                if (column > this.indents[this.indents.length - 1]) {
                    this.indents.push(column);
                    begin[COLUMN] = 0;
                    end[COLUMN] = pos;
                    if (callback(T_INDENT, line.substring(0, pos), begin, end, line)) {
                        return Done;
                    }
                }
                while (column < this.indents[this.indents.length - 1]) {
                    if (!contains(this.indents, column)) {
                        begin[COLUMN] = 0;
                        end[COLUMN] = pos;
                        throw indentationError("unindent does not match any outer indentation level", begin, end);
                    }
                    this.indents.splice(this.indents.length - 1, 1);
                    begin[COLUMN] = pos;
                    end[COLUMN] = pos;
                    if (callback(T_DEDENT, '', begin, end, line)) {
                        return Done;
                    }
                }
            }
            else {
                if (!line) {
                    throw new TokenError("EOF in multi-line statement", this.lnum, 0);
                }
                this.continued = false;
            }
            while (pos < max) {
                // js regexes don't return any info about matches, other than the
                // content. we'd like to put a \w+ before pseudomatch, but then we
                // can't get any data
                var capos = line.charAt(pos);
                while (capos === ' ' || capos === '\f' || capos === '\t') {
                    pos += 1;
                    capos = line.charAt(pos);
                }
                pseudoprog.lastIndex = 0;
                var pseudomatch = pseudoprog.exec(line.substring(pos));
                if (pseudomatch) {
                    var startIndex = pos;
                    endIndex = startIndex + pseudomatch[1].length;
                    begin[COLUMN] = startIndex;
                    end[COLUMN] = endIndex;
                    pos = endIndex;
                    var token = line.substring(startIndex, endIndex);
                    var initial = line.charAt(startIndex);
                    if (NUMCHARS.indexOf(initial) !== -1 || (initial === '.' && token !== '.')) {
                        if (callback(T_NUMBER, token, begin, end, line)) {
                            return Done;
                        }
                    }
                    else if (initial === '\r' || initial === '\n') {
                        var newl = T_NEWLINE;
                        if (this.parenlev > 0)
                            newl = T_NL$1;
                        if (callback(newl, token, begin, end, line)) {
                            return Done;
                        }
                    }
                    else if (initial === '#' || initial === "'''") {
                        if (callback(T_COMMENT$1, token, begin, end, line)) {
                            return Done;
                        }
                    }
                    else if (triple_quoted.hasOwnProperty(token)) {
                        this.endprog = endprogs[token];
                        this.endprog.lastIndex = 0;
                        endmatch = this.endprog.test(line.substring(pos));
                        if (endmatch) {
                            pos = this.endprog.lastIndex + pos;
                            var token_1 = line.substring(startIndex, pos);
                            end[COLUMN] = pos;
                            if (callback(T_STRING, token_1, begin, end, line)) {
                                return Done;
                            }
                        }
                        else {
                            this.strstart[LINE] = this.lnum;
                            this.strstart[COLUMN] = startIndex;
                            this.contstr = line.substring(startIndex);
                            this.contline = line;
                            return false;
                        }
                    }
                    else if (single_quoted.hasOwnProperty(initial) ||
                        single_quoted.hasOwnProperty(token.substring(0, 2)) ||
                        single_quoted.hasOwnProperty(token.substring(0, 3))) {
                        if (token[token.length - 1] === '\n') {
                            this.endprog = endprogs[initial] || endprogs[token[1]] || endprogs[token[2]];
                            assert$1(this.endprog instanceof RegExp);
                            this.contstr = line.substring(startIndex);
                            this.needcont = true;
                            this.contline = line;
                            return false;
                        }
                        else {
                            if (callback(T_STRING, token, begin, end, line)) {
                                return Done;
                            }
                        }
                    }
                    else if (NAMECHARS.indexOf(initial) !== -1) {
                        if (callback(T_NAME$1, token, begin, end, line)) {
                            return Done;
                        }
                    }
                    else if (initial === '\\') {
                        end[COLUMN] = pos;
                        if (callback(T_NL$1, token, begin, end, line)) {
                            return Done;
                        }
                        this.continued = true;
                    }
                    else {
                        if ('([{'.indexOf(initial) !== -1) {
                            this.parenlev += 1;
                        }
                        else if (')]}'.indexOf(initial) !== -1) {
                            this.parenlev -= 1;
                        }
                        if (callback(T_OP$1, token, begin, end, line)) {
                            return Done;
                        }
                    }
                }
                else {
                    begin[COLUMN] = pos;
                    end[COLUMN] = pos + 1;
                    if (callback(T_ERRORTOKEN, line.charAt(pos), begin, end, line)) {
                        return Done;
                    }
                    pos += 1;
                }
            }
            return false;
        };
        return Tokenizer;
    }());
    function group(x, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        var args = Array.prototype.slice.call(arguments);
        return '(' + args.join('|') + ')';
    }
    function maybe(x) { return group.apply(null, arguments) + "?"; }
    function contains(a, obj) {
        var i = a.length;
        while (i--) {
            if (a[i] === obj) {
                return true;
            }
        }
        return false;
    }
    function rstrip(input, what) {
        var i;
        for (i = input.length; i > 0; --i) {
            if (what.indexOf(input.charAt(i - 1)) === -1)
                break;
        }
        return input.substring(0, i);
    }
    /**
     * @param message
     * @param begin
     * @param end
     * @param {string|undefined} text
     */
    function indentationError(message, begin, end, text) {
        assert$1(Array.isArray(begin), "begin must be an Array");
        assert$1(Array.isArray(end), "end must be an Array");
        var e = new SyntaxError(message /*, fileName*/);
        e.name = "IndentationError";
        if (begin) {
            e['lineNumber'] = begin[LINE];
            e['columnNumber'] = begin[COLUMN];
        }
        return e;
    }

    /**
     * Decodes of the tokens.
     * A mapping from the token number (symbol) to its human-readable name.
     */
    var tokenNames = {};
    tokenNames[Tokens.T_AMPER] = 'T_AMPER';
    tokenNames[Tokens.T_AMPEREQUAL] = 'T_AMPEREQUAL';
    tokenNames[Tokens.T_AT] = 'T_AT';
    tokenNames[Tokens.T_BACKQUOTE] = 'T_BACKQUOTE';
    tokenNames[Tokens.T_CIRCUMFLEX] = 'T_CIRCUMFLEX';
    tokenNames[Tokens.T_CIRCUMFLEXEQUAL] = 'T_CIRCUMFLEXEQUAL';
    tokenNames[Tokens.T_COLON] = 'T_COLON';
    tokenNames[Tokens.T_COMMA] = 'T_COMMA';
    tokenNames[Tokens.T_COMMENT] = 'T_COMMENT';
    tokenNames[Tokens.T_DEDENT] = 'T_DEDENT';
    tokenNames[Tokens.T_DOT] = 'T_DOT';
    tokenNames[Tokens.T_DOUBLESLASH] = 'T_DOUBLESLASH';
    tokenNames[Tokens.T_DOUBLESLASHEQUAL] = 'T_DOUBLESLASHEQUAL';
    tokenNames[Tokens.T_DOUBLESTAR] = 'T_DOUBLESTAR';
    tokenNames[Tokens.T_DOUBLESTAREQUAL] = 'T_DOUBLESTAREQUAL';
    tokenNames[Tokens.T_ENDMARKER] = 'T_ENDMARKER';
    tokenNames[Tokens.T_EQEQUAL] = 'T_EQEQUAL';
    tokenNames[Tokens.T_EQUAL] = 'T_EQUAL';
    tokenNames[Tokens.T_ERRORTOKEN] = 'T_ERRORTOKEN';
    tokenNames[Tokens.T_GREATER] = 'T_GREATER';
    tokenNames[Tokens.T_GREATEREQUAL] = 'T_GREATEREQUAL';
    tokenNames[Tokens.T_INDENT] = 'T_INDENT';
    tokenNames[Tokens.T_LBRACE] = 'T_LBRACE';
    tokenNames[Tokens.T_LEFTSHIFT] = 'T_LEFTSHIFT';
    tokenNames[Tokens.T_LEFTSHIFTEQUAL] = 'T_LEFTSHIFTEQUAL';
    tokenNames[Tokens.T_LESS] = 'T_LESS';
    tokenNames[Tokens.T_LESSEQUAL] = 'T_LESSEQUAL';
    tokenNames[Tokens.T_LPAR] = 'T_LPAR';
    tokenNames[Tokens.T_LSQB] = 'T_LSQB';
    tokenNames[Tokens.T_MINEQUAL] = 'T_MINEQUAL';
    tokenNames[Tokens.T_MINUS] = 'T_MINUS';
    tokenNames[Tokens.T_N_TOKENS] = 'T_N_TOKENS';
    tokenNames[Tokens.T_NAME] = 'T_NAME';
    tokenNames[Tokens.T_NEWLINE] = 'T_NEWLINE';
    tokenNames[Tokens.T_NL] = 'T_NL';
    tokenNames[Tokens.T_NOTEQUAL] = 'T_NOTEQUAL';
    tokenNames[Tokens.T_NT_OFFSET] = 'T_NT_OFFSET';
    tokenNames[Tokens.T_NUMBER] = 'T_NUMBER';
    tokenNames[Tokens.T_OP] = 'T_OP';
    tokenNames[Tokens.T_PERCENT] = 'T_PERCENT';
    tokenNames[Tokens.T_PERCENTEQUAL] = 'T_PERCENTEQUAL';
    tokenNames[Tokens.T_PLUS] = 'T_PLUS';
    tokenNames[Tokens.T_PLUSEQUAL] = 'T_PLUSEQUAL';
    tokenNames[Tokens.T_RARROW] = 'T_RARROW';
    tokenNames[Tokens.T_RBRACE] = 'T_RBRACE';
    tokenNames[Tokens.T_RIGHTSHIFT] = 'T_RIGHTSHIFT';
    tokenNames[Tokens.T_RPAR] = 'T_RPAR';
    tokenNames[Tokens.T_RSQB] = 'T_RSQB';
    tokenNames[Tokens.T_SEMI] = 'T_SEMI';
    tokenNames[Tokens.T_SLASH] = 'T_SLASH';
    tokenNames[Tokens.T_SLASHEQUAL] = 'T_SLASHEQUAL';
    tokenNames[Tokens.T_STAR] = 'T_STAR';
    tokenNames[Tokens.T_STAREQUAL] = 'T_STAREQUAL';
    tokenNames[Tokens.T_STRING] = 'T_STRING';
    tokenNames[Tokens.T_TILDE] = 'T_TILDE';
    tokenNames[Tokens.T_VBAR] = 'T_VBAR';
    tokenNames[Tokens.T_VBAREQUAL] = 'T_VBAREQUAL';

    function grammarName(type) {
        var tokenName = tokenNames[type];
        if (tokenName) {
            return tokenName;
        }
        else {
            return ParseTables.number2symbol[type];
        }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    /**
     * @param message
     * @param lineNumber
     */
    function syntaxError$1(message, range) {
        assert$1(isString(message), "message must be a string");
        if (isDef(range)) {
            assert$1(isNumber(range.begin.line), "lineNumber must be a number");
        }
        var e = new SyntaxError(message /*, fileName*/);
        if (range) {
            assert$1(isNumber(range.begin.line), "lineNumber must be a number");
            if (typeof range.begin.line === 'number') {
                e['lineNumber'] = range.begin.line;
            }
        }
        return e;
    }
    var ParseError = (function (_super) {
        __extends(ParseError, _super);
        function ParseError(message) {
            var _this = _super.call(this, message) || this;
            _this.name = 'ParseError';
            return _this;
        }
        return ParseError;
    }(SyntaxError));
    /**
     * @param message
     * @param begin
     * @param end
     */
    function parseError(message, begin, end) {
        var e = new ParseError(message);
        // Copying from begin and end is important because they change for each token.
        // Notice that the Line is 1-based, but that row is 0-based.
        // Both column and Column are 0-based.
        if (Array.isArray(begin)) {
            e.begin = { row: begin[0] - 1, column: begin[1] };
        }
        if (Array.isArray(end)) {
            e.end = { row: end[0] - 1, column: end[1] };
        }
        return e;
    }

    var Position = (function () {
        /**
         *
         */
        function Position(line, column) {
            this.line = line;
            this.column = column;
        }
        Position.prototype.toString = function () {
            return "[" + this.line + ", " + this.column + "]";
        };
        return Position;
    }());

    var Range = (function () {
        /**
         *
         */
        function Range(begin, end) {
            assert$1(begin, "begin must be defined");
            assert$1(end, "end must be defined");
            this.begin = begin;
            this.end = end;
        }
        Range.prototype.toString = function () {
            return this.begin + " to " + this.end;
        };
        return Range;
    }());

    /**
     * Returns the number of children in the specified node.
     * Returns n.children.length
     */
    function NCH(n) {
        assert$1(n !== undefined);
        if (Array.isArray(n.children)) {
            return n.children.length;
        }
        else {
            return 0;
        }
    }
    function CHILD(n, i) {
        assert$1(i !== undefined && i >= 0);
        return CHILDREN(n)[i];
    }
    function FIND(n, type) {
        assert$1(type !== undefined);
        var children = CHILDREN(n);
        var N = children.length;
        for (var i = 0; i < N; i++) {
            var child = children[i];
            if (child.type === type) {
                return i;
            }
        }
        return -1;
    }
    function CHILDREN(n) {
        assert$1(n !== undefined);
        if (n.children) {
            return n.children;
        }
        else {
            throw new Error("node does not have any children");
        }
    }
    function IDXLAST(xs) {
        return xs.length - 1;
    }

    /**
     * Prepare the source text into lines to feed to the `generateTokens` method of the tokenizer.
     */
    function splitSourceTextIntoLines(sourceText) {
        var lines = [];
        // Why do we normalize the sourceText in this manner?
        if (sourceText.substr(IDXLAST(sourceText), 1) !== "\n") {
            sourceText += "\n";
        }
        // Splitting this way will create a final line that is the zero-length string.
        var pieces = sourceText.split("\n");
        var N = pieces.length;
        for (var i = 0; i < N; ++i) {
            // We're adding back newline characters for all but the last line.
            var line = pieces[i] + ((i === IDXLAST(pieces)) ? "" : "\n");
            lines.push(line);
        }
        return lines;
    }

    // Dereference certain tokens for performance.
    var T_COMMENT = Tokens.T_COMMENT;
    var T_ENDMARKER = Tokens.T_ENDMARKER;
    var T_NAME = Tokens.T_NAME;
    var T_NL = Tokens.T_NL;
    var T_NT_OFFSET = Tokens.T_NT_OFFSET;
    var T_OP = Tokens.T_OP;
    // low level parser to a concrete syntax tree, derived from cpython's lib2to3
    // TODO: The parser does not report whitespace nodes.
    // It would be nice if there were an ignoreWhitespace option.
    var Parser = (function () {
        /**
         *
         */
        function Parser(grammar) {
            this.stack = [];
            this.used_names = {};
            this.grammar = grammar;
        }
        Parser.prototype.setup = function (start) {
            start = start || this.grammar.start;
            var newnode = {
                type: start,
                range: null,
                value: null,
                children: []
            };
            var stackentry = {
                dfa: this.grammar.dfas[start][IDX_DFABT_DFA],
                beginTokens: this.grammar.dfas[start][IDX_DFABT_BEGIN_TOKENS],
                stateId: 0,
                node: newnode
            };
            this.stack.push(stackentry);
        };
        /**
         * Add a token; return true if we're done.
         * @param type
         * @param value
         * @param context [start, end, line]
         */
        Parser.prototype.addtoken = function (type, value, begin, end, line) {
            /**
             * The symbol for the token being added.
             */
            var tokenSymbol = this.classify(type, value, begin, end, line);
            /**
             * Local variable for performance.
             */
            var stack = this.stack;
            // More local variables for performance.
            var g = this.grammar;
            var dfas = g.dfas;
            var labels = g.labels;
            // This code is very performance sensitive.
            OUTERWHILE: while (true) {
                var stackTop = stack[stack.length - 1];
                var dfa = stackTop.dfa;
                // This is not being used. Why?
                // let first = tp.dfa[DFA_SECOND];
                var arcs = dfa[stackTop.stateId];
                // look for a to-state with this label
                for (var _i = 0, arcs_1 = arcs; _i < arcs_1.length; _i++) {
                    var arc = arcs_1[_i];
                    var arcSymbol = arc[ARC_SYMBOL_LABEL];
                    var newState = arc[ARC_TO_STATE];
                    var t = labels[arcSymbol][0];
                    // const v = labels[arcSymbol][1];
                    // console.lg(`t => ${t}, v => ${v}`);
                    if (tokenSymbol === arcSymbol) {
                        this.shiftToken(type, value, newState, begin, end, line);
                        // pop while we are in an accept-only state
                        var stateId = newState;
                        /**
                         * Temporary variable to save a few CPU cycles.
                         */
                        var statesOfState = dfa[stateId];
                        while (statesOfState.length === 1 && statesOfState[0][ARC_SYMBOL_LABEL] === 0 && statesOfState[0][ARC_TO_STATE] === stateId) {
                            this.popNonTerminal();
                            // Much of the time we won't be done so cache the stack length.
                            var stackLength = stack.length;
                            if (stackLength === 0) {
                                // done!
                                return true;
                            }
                            else {
                                stackTop = stack[stackLength - 1];
                                stateId = stackTop.stateId;
                                dfa = stackTop.dfa;
                                // first = stackTop.beginTokens;
                                // first = top.dfa[1];
                                statesOfState = dfa[stateId];
                            }
                        }
                        // done with this token
                        return false;
                    }
                    else if (isNonTerminal(t)) {
                        var dfabt = dfas[t];
                        var dfa_1 = dfabt[IDX_DFABT_DFA];
                        var beginTokens = dfabt[IDX_DFABT_BEGIN_TOKENS];
                        if (beginTokens.hasOwnProperty(tokenSymbol)) {
                            this.pushNonTerminal(t, dfa_1, beginTokens, newState, begin, end, line);
                            continue OUTERWHILE;
                        }
                    }
                }
                // We've exhaused all the arcs for the for the state.
                if (existsTransition(arcs, [T_ENDMARKER, stackTop.stateId])) {
                    // an accepting state, pop it and try something else
                    this.popNonTerminal();
                    if (stack.length === 0) {
                        throw parseError("too much input");
                    }
                }
                else {
                    var found = grammarName(stackTop.stateId);
                    // FIXME:
                    throw parseError("Unexpected " + found + " at " + JSON.stringify([begin[0], begin[1] + 1]), begin, end);
                }
            }
        };
        /**
         * Turn a token into a symbol (something that labels an arc in the DFA).
         * The context is only used for error reporting.
         * @param type
         * @param value
         * @param context [begin, end, line]
         */
        Parser.prototype.classify = function (type, value, begin, end, line) {
            // Assertion commented out for efficiency.
            assertTerminal(type);
            var g = this.grammar;
            if (type === T_NAME) {
                this.used_names[value] = true;
                var keywordToSymbol = g.keywords;
                if (keywordToSymbol.hasOwnProperty(value)) {
                    var ilabel_1 = keywordToSymbol[value];
                    // assert(typeof ilabel === 'number', "How can it not be?");
                    return ilabel_1;
                }
            }
            var tokenToSymbol = g.tokens;
            var ilabel;
            if (tokenToSymbol.hasOwnProperty(type)) {
                ilabel = tokenToSymbol[type];
            }
            if (!ilabel) {
                console.log("ilabel = " + ilabel + ", type = " + type + ", value = " + value + ", begin = " + JSON.stringify(begin) + ", end = " + JSON.stringify(end));
                throw parseError("bad token", begin, end);
            }
            return ilabel;
        };
        /**
         * Shifting a token (terminal).
         * 1. A new node is created representing the token.
         * 2. The new node is added as a child to the topmost node on the stack.
         * 3. The state of the topmost element on the stack is updated to be the new state.
         */
        Parser.prototype.shiftToken = function (type, value, newState, begin, end, line) {
            // assertTerminal(type);
            // Local variable for efficiency.
            var stack = this.stack;
            /**
             * The topmost element in the stack is affected by shifting a token.
             */
            var stackTop = stack[stack.length - 1];
            var node = stackTop.node;
            var newnode = {
                type: type,
                value: value,
                range: new Range(new Position(begin[0], begin[1]), new Position(end[0], end[1])),
                children: null
            };
            if (newnode && node.children) {
                node.children.push(newnode);
            }
            stackTop.stateId = newState;
        };
        /**
         * Push a non-terminal symbol onto the stack as a new node.
         * 1. Update the state of the topmost element on the stack to be newState.
         * 2. Push a new element onto the stack corresponding to the symbol.
         * The new stack elements uses the newDfa and has state 0.
         */
        Parser.prototype.pushNonTerminal = function (type, dfa, beginTokens, newState, begin, end, line) {
            // Based on how this function is called, there is really no need for this assertion.
            // Retain it for now while it is not the performance bottleneck.
            // assertNonTerminal(type);
            // Local variable for efficiency.
            var stack = this.stack;
            var stackTop = stack[stack.length - 1];
            stackTop.stateId = newState;
            var beginPos = begin ? new Position(begin[0], begin[1]) : null;
            var endPos = end ? new Position(end[0], end[1]) : null;
            var newnode = { type: type, value: null, range: new Range(beginPos, endPos), children: [] };
            // TODO: Is there a symbolic constant for the zero state?
            stack.push({ dfa: dfa, beginTokens: beginTokens, stateId: 0, node: newnode });
        };
        /**
         * Pop a nonterminal.
         * Popping an element from the stack causes the node to be added to the children of the new top element.
         * The exception is when the stack becomes empty, in which case the node becomes the root node.
         */
        Parser.prototype.popNonTerminal = function () {
            // Local variable for efficiency.
            var stack = this.stack;
            var poppedElement = stack.pop();
            if (poppedElement) {
                var poppedNode = poppedElement.node;
                // Remove this assertion only when it becomes a performance issue.
                // assertNonTerminal(poppedNode.type);
                if (poppedNode) {
                    /**
                     * The length of the stack following the pop operation.
                     */
                    var N = stack.length;
                    if (N !== 0) {
                        var node = stack[N - 1].node;
                        var children = node.children;
                        if (children) {
                            children.push(poppedNode);
                        }
                    }
                    else {
                        // If the length of the stack following the pop is zero then the popped element becomes the root node.
                        this.rootNode = poppedNode;
                        poppedNode.used_names = this.used_names;
                    }
                }
            }
        };
        return Parser;
    }());
    /**
     * FIXME: This is O(N). Can we do better?
     * Finds the specified
     * @param a An array of arrays where each element is an array of two integers.
     * @param obj An array containing two integers.
     */
    function existsTransition(arcs, obj) {
        var i = arcs.length;
        while (i--) {
            var arc = arcs[i];
            if (arc[ARC_SYMBOL_LABEL] === obj[ARC_SYMBOL_LABEL] && arc[ARC_TO_STATE] === obj[ARC_TO_STATE]) {
                return true;
            }
        }
        return false;
    }
    /**
     * parser for interactive input. returns a function that should be called with
     * lines of input as they are entered. the function will return false
     * until the input is complete, when it will return the rootnode of the parse.
     *
     * @param style root of parse tree (optional)
     */
    function makeParser(sourceKind) {
        if (sourceKind === undefined)
            sourceKind = SourceKind.File;
        // FIXME: Would be nice to get this typing locked down. Why does Grammar not match ParseTables?
        var p = new Parser(ParseTables);
        // TODO: Can we do this over the symbolic constants?
        switch (sourceKind) {
            case SourceKind.File: {
                p.setup(ParseTables.sym.file_input);
                break;
            }
            case SourceKind.Eval: {
                p.setup(ParseTables.sym.eval_input);
                break;
            }
            case SourceKind.Single: {
                p.setup(ParseTables.sym.single_input);
                break;
            }
            default: {
                throw new Error("SourceKind must be one of File, Eval, or Single.");
            }
        }
        var tokenizer = new Tokenizer(sourceKind === SourceKind.Single, function tokenizerCallback(type, value, start, end, line) {
            // var s_lineno = start[0];
            // var s_column = start[1];
            /*
            if (s_lineno !== lineno && s_column !== column)
            {
                // todo; update prefix and line/col
            }
            */
            if (type === T_COMMENT || type === T_NL) {
                if (value[value.length - 1] === "\n") ;
                return undefined;
            }
            if (type === T_OP) {
                type = OpMap[value];
            }
            // FIXME: We're creating an array object here for every token.
            if (p.addtoken(type, value, start, end, line)) {
                return true;
            }
            return undefined;
        });
        return function parseFunc(line) {
            var ret = tokenizer.generateTokens(line);
            if (ret) {
                if (ret !== "done") {
                    throw parseError("incomplete input");
                }
                return p.rootNode;
            }
            return false;
        };
    }
    /**
     * Determines the starting point in the grammar for parsing the source.
     */
    var SourceKind;
    (function (SourceKind) {
        /**
         * Suitable for a module.
         */
        SourceKind[SourceKind["File"] = 0] = "File";
        /**
         * Suitable for execution.
         */
        SourceKind[SourceKind["Eval"] = 1] = "Eval";
        /**
         * Suitable for a REPL.
         */
        SourceKind[SourceKind["Single"] = 2] = "Single";
    })(SourceKind || (SourceKind = {}));
    function parse(sourceText, sourceKind) {
        if (sourceKind === void 0) { sourceKind = SourceKind.File; }
        var parser = makeParser(sourceKind);
        var lines = splitSourceTextIntoLines(sourceText);
        // FIXME: Mixing the types this way is awkward for the consumer.
        var ret = false;
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            ret = parser(line);
        }
        return ret;
    }
    /**
     * Terminal symbols hsould be less than T_NT_OFFSET.
     * NT_OFFSET means non-terminal offset.
     */
    function assertTerminal(type) {
        assert$1(type < T_NT_OFFSET, "terminal symbols should be less than T_NT_OFFSET");
    }
    /*
    function assertNonTerminal(type: number): void {
        assert(isNonTerminal(type), "non terminal symbols should be greater than or equal to T_NT_OFFSET");
    }
    */
    function isNonTerminal(type) {
        return type >= T_NT_OFFSET;
    }

    var Load = (function () {
        function Load() {
        }
        return Load;
    }());
    var Store = (function () {
        function Store() {
        }
        return Store;
    }());
    var Del = (function () {
        function Del() {
        }
        return Del;
    }());
    var AugLoad = (function () {
        function AugLoad() {
        }
        return AugLoad;
    }());
    var AugStore = (function () {
        function AugStore() {
        }
        return AugStore;
    }());
    var Param = (function () {
        function Param() {
        }
        return Param;
    }());
    var And = (function () {
        function And() {
        }
        return And;
    }());
    var Or = (function () {
        function Or() {
        }
        return Or;
    }());
    var Add = (function () {
        function Add() {
        }
        return Add;
    }());
    var Sub = (function () {
        function Sub() {
        }
        return Sub;
    }());
    var Mult = (function () {
        function Mult() {
        }
        return Mult;
    }());
    var Div = (function () {
        function Div() {
        }
        return Div;
    }());
    var Mod = (function () {
        function Mod() {
        }
        return Mod;
    }());
    var Pow = (function () {
        function Pow() {
        }
        return Pow;
    }());
    var LShift = (function () {
        function LShift() {
        }
        return LShift;
    }());
    var RShift = (function () {
        function RShift() {
        }
        return RShift;
    }());
    var BitOr = (function () {
        function BitOr() {
        }
        return BitOr;
    }());
    var BitXor = (function () {
        function BitXor() {
        }
        return BitXor;
    }());
    var BitAnd = (function () {
        function BitAnd() {
        }
        return BitAnd;
    }());
    var FloorDiv = (function () {
        function FloorDiv() {
        }
        return FloorDiv;
    }());
    var Invert = (function () {
        function Invert() {
        }
        return Invert;
    }());
    var Not = (function () {
        function Not() {
        }
        return Not;
    }());
    var UAdd = (function () {
        function UAdd() {
        }
        return UAdd;
    }());
    var USub = (function () {
        function USub() {
        }
        return USub;
    }());
    var Eq = (function () {
        function Eq() {
        }
        return Eq;
    }());
    var NotEq = (function () {
        function NotEq() {
        }
        return NotEq;
    }());
    var Lt = (function () {
        function Lt() {
        }
        return Lt;
    }());
    var LtE = (function () {
        function LtE() {
        }
        return LtE;
    }());
    var Gt = (function () {
        function Gt() {
        }
        return Gt;
    }());
    var GtE = (function () {
        function GtE() {
        }
        return GtE;
    }());
    var Is = (function () {
        function Is() {
        }
        return Is;
    }());
    var IsNot = (function () {
        function IsNot() {
        }
        return IsNot;
    }());
    var In = (function () {
        function In() {
        }
        return In;
    }());
    var NotIn = (function () {
        function NotIn() {
        }
        return NotIn;
    }());
    var RangeAnnotated = (function () {
        function RangeAnnotated(value, range) {
            this.value = value;
            this.range = range;
            assert$1(typeof value !== 'undefined', "value must be defined.");
        }
        return RangeAnnotated;
    }());
    var Expression = (function () {
        function Expression() {
            // Do noting yet.
        }
        Expression.prototype.accept = function (visitor) {
            // accept must be implemented by derived classes.
            throw new Error("\"Expression.accept\" is not implemented.");
        };
        return Expression;
    }());
    var Statement = (function () {
        function Statement() {
        }
        Statement.prototype.accept = function (visitor) {
            // accept must be implemented by derived classes.
            throw new Error("\"Statement.accept\" is not implemented.");
        };
        return Statement;
    }());
    var IterationStatement = (function (_super) {
        __extends(IterationStatement, _super);
        function IterationStatement() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return IterationStatement;
    }(Statement));
    var Module = (function () {
        function Module(body) {
            this.body = body;
        }
        Module.prototype.accept = function (visitor) {
            visitor.module(this);
        };
        return Module;
    }());
    ((function (_super) {
        __extends(UnaryExpression, _super);
        function UnaryExpression() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return UnaryExpression;
    })(Expression));
    var FunctionDef = (function (_super) {
        __extends(FunctionDef, _super);
        function FunctionDef(name, args, body, returnType, decorator_list, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.name = name;
            _this.args = args;
            _this.body = body;
            _this.decorator_list = decorator_list;
            _this.returnType = returnType;
            return _this;
        }
        FunctionDef.prototype.accept = function (visitor) {
            visitor.functionDef(this);
        };
        return FunctionDef;
    }(Statement));
    var FunctionParamDef = (function () {
        function FunctionParamDef(name, type) {
            this.name = name;
            if (type) {
                this.type = type;
            }
            else {
                this.type = null;
            }
        }
        return FunctionParamDef;
    }());
    var ClassDef = (function (_super) {
        __extends(ClassDef, _super);
        function ClassDef(name, bases, body, decorator_list, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.name = name;
            _this.bases = bases;
            _this.body = body;
            _this.decorator_list = decorator_list;
            return _this;
        }
        ClassDef.prototype.accept = function (visitor) {
            visitor.classDef(this);
        };
        return ClassDef;
    }(Statement));
    var ReturnStatement = (function (_super) {
        __extends(ReturnStatement, _super);
        function ReturnStatement(value, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.value = value;
            return _this;
        }
        ReturnStatement.prototype.accept = function (visitor) {
            visitor.returnStatement(this);
        };
        return ReturnStatement;
    }(Statement));
    var DeleteStatement = (function (_super) {
        __extends(DeleteStatement, _super);
        function DeleteStatement(targets, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.targets = targets;
            return _this;
        }
        return DeleteStatement;
    }(Statement));
    var Assign = (function (_super) {
        __extends(Assign, _super);
        function Assign(targets, value, range, eqRange, type) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.eqRange = eqRange;
            _this.targets = targets;
            _this.value = value;
            if (type) {
                _this.type = type;
            }
            return _this;
        }
        Assign.prototype.accept = function (visitor) {
            visitor.assign(this);
        };
        return Assign;
    }(Statement));
    var AugAssign = (function (_super) {
        __extends(AugAssign, _super);
        function AugAssign(target, op, value, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.target = target;
            _this.op = op;
            _this.value = value;
            return _this;
        }
        return AugAssign;
    }(Statement));
    var AnnAssign = (function (_super) {
        __extends(AnnAssign, _super);
        function AnnAssign(type, target, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.value = type;
            _this.target = target;
            return _this;
        }
        AnnAssign.prototype.accept = function (visitor) {
            visitor.annAssign(this);
        };
        return AnnAssign;
    }(Statement));
    var Print = (function (_super) {
        __extends(Print, _super);
        function Print(dest, values, nl, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.dest = dest;
            _this.values = values;
            _this.nl = nl;
            return _this;
        }
        Print.prototype.accept = function (visitor) {
            visitor.print(this);
        };
        return Print;
    }(Statement));
    var ForStatement = (function (_super) {
        __extends(ForStatement, _super);
        function ForStatement(target, iter, body, orelse, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.target = target;
            _this.iter = iter;
            _this.body = body;
            _this.orelse = orelse;
            return _this;
        }
        ForStatement.prototype.accept = function (visitor) {
            visitor.forStatement(this);
        };
        return ForStatement;
    }(Statement));
    var WhileStatement = (function (_super) {
        __extends(WhileStatement, _super);
        function WhileStatement(test, body, orelse, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.test = test;
            _this.body = body;
            _this.orelse = orelse;
            return _this;
        }
        return WhileStatement;
    }(IterationStatement));
    var IfStatement = (function (_super) {
        __extends(IfStatement, _super);
        function IfStatement(test, consequent, alternate, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.test = test;
            _this.consequent = consequent;
            _this.alternate = alternate;
            return _this;
        }
        IfStatement.prototype.accept = function (visitor) {
            visitor.ifStatement(this);
        };
        return IfStatement;
    }(Statement));
    var WithStatement = (function (_super) {
        __extends(WithStatement, _super);
        function WithStatement(context_expr, optional_vars, body, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.context_expr = context_expr;
            _this.optional_vars = optional_vars;
            _this.body = body;
            return _this;
        }
        return WithStatement;
    }(Statement));
    var Raise = (function (_super) {
        __extends(Raise, _super);
        function Raise(type, inst, tback, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.type = type;
            _this.inst = inst;
            _this.tback = tback;
            return _this;
        }
        return Raise;
    }(Statement));
    var TryExcept = (function (_super) {
        __extends(TryExcept, _super);
        function TryExcept(body, handlers, orelse, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.body = body;
            _this.handlers = handlers;
            _this.orelse = orelse;
            return _this;
        }
        return TryExcept;
    }(Statement));
    var TryFinally = (function (_super) {
        __extends(TryFinally, _super);
        function TryFinally(body, finalbody, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.body = body;
            _this.finalbody = finalbody;
            return _this;
        }
        return TryFinally;
    }(Statement));
    var Assert = (function (_super) {
        __extends(Assert, _super);
        function Assert(test, msg, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.test = test;
            _this.msg = msg;
            return _this;
        }
        return Assert;
    }(Statement));
    var ImportStatement = (function (_super) {
        __extends(ImportStatement, _super);
        function ImportStatement(names, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.names = names;
            return _this;
        }
        return ImportStatement;
    }(Statement));
    var ImportFrom = (function (_super) {
        __extends(ImportFrom, _super);
        function ImportFrom(module, names, level, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            assert$1(typeof module.value === 'string', "module must be a string.");
            assert$1(Array.isArray(names), "names must be an Array.");
            _this.module = module;
            _this.names = names;
            _this.level = level;
            return _this;
        }
        ImportFrom.prototype.accept = function (visitor) {
            visitor.importFrom(this);
        };
        return ImportFrom;
    }(Statement));
    var Exec = (function (_super) {
        __extends(Exec, _super);
        function Exec(body, globals, locals, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.body = body;
            _this.globals = globals;
            _this.locals = locals;
            return _this;
        }
        return Exec;
    }(Statement));
    var Global = (function (_super) {
        __extends(Global, _super);
        function Global(names, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.names = names;
            return _this;
        }
        return Global;
    }(Statement));
    var NonLocal = (function (_super) {
        __extends(NonLocal, _super);
        function NonLocal(names, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.names = names;
            return _this;
        }
        return NonLocal;
    }(Statement));
    var ExpressionStatement = (function (_super) {
        __extends(ExpressionStatement, _super);
        function ExpressionStatement(value, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.value = value;
            return _this;
        }
        ExpressionStatement.prototype.accept = function (visitor) {
            visitor.expressionStatement(this);
        };
        return ExpressionStatement;
    }(Statement));
    var Pass = (function (_super) {
        __extends(Pass, _super);
        function Pass(range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            return _this;
        }
        return Pass;
    }(Statement));
    var BreakStatement = (function (_super) {
        __extends(BreakStatement, _super);
        function BreakStatement(range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            return _this;
        }
        return BreakStatement;
    }(Statement));
    var ContinueStatement = (function (_super) {
        __extends(ContinueStatement, _super);
        function ContinueStatement(range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            return _this;
        }
        return ContinueStatement;
    }(Statement));
    var BoolOp = (function (_super) {
        __extends(BoolOp, _super);
        function BoolOp(op, values, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.op = op;
            _this.values = values;
            return _this;
        }
        return BoolOp;
    }(Expression));
    var BinOp = (function (_super) {
        __extends(BinOp, _super);
        function BinOp(lhs, ops, rhs, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.lhs = lhs;
            _this.op = ops.op;
            _this.opRange = ops.range;
            _this.rhs = rhs;
            return _this;
        }
        BinOp.prototype.accept = function (visitor) {
            visitor.binOp(this);
        };
        return BinOp;
    }(Expression));
    var UnaryOp = (function (_super) {
        __extends(UnaryOp, _super);
        function UnaryOp(op, operand, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.op = op;
            _this.operand = operand;
            return _this;
        }
        return UnaryOp;
    }(Expression));
    var Lambda = (function (_super) {
        __extends(Lambda, _super);
        function Lambda(args, body, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.args = args;
            _this.body = body;
            return _this;
        }
        return Lambda;
    }(Expression));
    var IfExp = (function (_super) {
        __extends(IfExp, _super);
        function IfExp(test, body, orelse, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.test = test;
            _this.body = body;
            _this.orelse = orelse;
            return _this;
        }
        return IfExp;
    }(Expression));
    var Dict = (function (_super) {
        __extends(Dict, _super);
        function Dict(keys, values, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.keys = keys;
            _this.values = values;
            return _this;
        }
        Dict.prototype.accept = function (visitor) {
            visitor.dict(this);
        };
        return Dict;
    }(Expression));
    var ListComp = (function (_super) {
        __extends(ListComp, _super);
        function ListComp(elt, generators, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.elt = elt;
            _this.generators = generators;
            return _this;
        }
        return ListComp;
    }(Expression));
    var GeneratorExp = (function (_super) {
        __extends(GeneratorExp, _super);
        function GeneratorExp(elt, generators, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.elt = elt;
            _this.generators = generators;
            return _this;
        }
        return GeneratorExp;
    }(Expression));
    var Yield = (function (_super) {
        __extends(Yield, _super);
        function Yield(value, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.value = value;
            return _this;
        }
        return Yield;
    }(Expression));
    var Compare = (function (_super) {
        __extends(Compare, _super);
        function Compare(left, ops, comparators, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.left = left;
            for (var _i = 0, ops_1 = ops; _i < ops_1.length; _i++) {
                var op = ops_1[_i];
                switch (op) {
                    case Eq: {
                        break;
                    }
                    case NotEq: {
                        break;
                    }
                    case Gt: {
                        break;
                    }
                    case GtE: {
                        break;
                    }
                    case Lt: {
                        break;
                    }
                    case LtE: {
                        break;
                    }
                    case In: {
                        break;
                    }
                    case NotIn: {
                        break;
                    }
                    case Is: {
                        break;
                    }
                    case IsNot: {
                        break;
                    }
                    default: {
                        throw new Error("ops must only contain CompareOperator(s) but contains " + op);
                    }
                }
            }
            _this.ops = ops;
            _this.comparators = comparators;
            return _this;
        }
        Compare.prototype.accept = function (visitor) {
            visitor.compareExpression(this);
        };
        return Compare;
    }(Expression));
    var Call = (function (_super) {
        __extends(Call, _super);
        function Call(func, args, keywords, starargs, kwargs) {
            var _this = _super.call(this) || this;
            _this.func = func;
            _this.args = args;
            _this.keywords = keywords;
            _this.starargs = starargs;
            _this.kwargs = kwargs;
            return _this;
        }
        Call.prototype.accept = function (visitor) {
            visitor.callExpression(this);
        };
        return Call;
    }(Expression));
    var Num = (function (_super) {
        __extends(Num, _super);
        function Num(n) {
            var _this = _super.call(this) || this;
            _this.n = n;
            return _this;
        }
        Num.prototype.accept = function (visitor) {
            visitor.num(this);
        };
        return Num;
    }(Expression));
    var Str = (function (_super) {
        __extends(Str, _super);
        function Str(s) {
            var _this = _super.call(this) || this;
            _this.s = s;
            return _this;
        }
        Str.prototype.accept = function (visitor) {
            visitor.str(this);
        };
        return Str;
    }(Expression));
    var Attribute = (function (_super) {
        __extends(Attribute, _super);
        function Attribute(value, attr, ctx, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.value = value;
            _this.attr = attr;
            _this.ctx = ctx;
            return _this;
        }
        Attribute.prototype.accept = function (visitor) {
            visitor.attribute(this);
        };
        return Attribute;
    }(Expression));
    var Subscript = (function (_super) {
        __extends(Subscript, _super);
        function Subscript(value, slice, ctx, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.value = value;
            _this.slice = slice;
            _this.ctx = ctx;
            return _this;
        }
        return Subscript;
    }(Expression));
    var Name = (function (_super) {
        __extends(Name, _super);
        function Name(id, ctx) {
            var _this = _super.call(this) || this;
            _this.id = id;
            _this.ctx = ctx;
            return _this;
        }
        Name.prototype.accept = function (visitor) {
            visitor.name(this);
        };
        return Name;
    }(Expression));
    var List = (function (_super) {
        __extends(List, _super);
        function List(elts, ctx, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.elts = elts;
            _this.ctx = ctx;
            return _this;
        }
        List.prototype.accept = function (visitor) {
            visitor.list(this);
        };
        return List;
    }(Expression));
    var Tuple = (function (_super) {
        __extends(Tuple, _super);
        function Tuple(elts, ctx, range) {
            var _this = _super.call(this) || this;
            _this.range = range;
            _this.elts = elts;
            _this.ctx = ctx;
            return _this;
        }
        return Tuple;
    }(Expression));
    var Ellipsis = (function () {
        function Ellipsis() {
            // Do nothing yet.
        }
        return Ellipsis;
    }());
    var Slice = (function () {
        function Slice(lower, upper, step) {
            this.lower = lower;
            this.upper = upper;
            this.step = step;
        }
        return Slice;
    }());
    var ExtSlice = (function () {
        function ExtSlice(dims) {
            this.dims = dims;
        }
        return ExtSlice;
    }());
    var Index = (function () {
        function Index(value) {
            this.value = value;
        }
        return Index;
    }());
    var Comprehension = (function () {
        function Comprehension(target, iter, ifs, range) {
            this.range = range;
            this.target = target;
            this.iter = iter;
            this.ifs = ifs;
        }
        return Comprehension;
    }());
    var ExceptHandler = (function () {
        function ExceptHandler(type, name, body, range) {
            this.range = range;
            this.type = type;
            this.name = name;
            this.body = body;
        }
        return ExceptHandler;
    }());
    var Arguments = (function () {
        function Arguments(args, vararg, kwarg, defaults) {
            this.args = args;
            this.vararg = vararg;
            this.kwarg = kwarg;
            this.defaults = defaults;
        }
        return Arguments;
    }());
    var Keyword = (function () {
        function Keyword(arg, value) {
            this.arg = arg;
            this.value = value;
        }
        return Keyword;
    }());
    var Alias = (function () {
        function Alias(name, asname) {
            assert$1(typeof name.value === 'string');
            assert$1(typeof asname === 'string' || asname === null);
            this.name = name;
            this.asname = asname;
        }
        Alias.prototype.toString = function () {
            return this.name.value + " as " + this.asname;
        };
        return Alias;
    }());
    Module.prototype['_astname'] = 'Module';
    Module.prototype['_fields'] = [
        'body', function (n) { return n.body; }
    ];
    Expression.prototype['_astname'] = 'Expression';
    Expression.prototype['_fields'] = [
        'body', function (n) {
            // TOD: Expression is abstract so we should not be here?
            return void 0;
        }
    ];
    FunctionDef.prototype['_astname'] = 'FunctionDef';
    FunctionDef.prototype['_fields'] = [
        'name', function (n) { return n.name.value; },
        'args', function (n) { return n.args; },
        'body', function (n) { return n.body; },
        'returnType', function (n) { return n.returnType; },
        'decorator_list', function (n) { return n.decorator_list; }
    ];
    ClassDef.prototype['_astname'] = 'ClassDef';
    ClassDef.prototype['_fields'] = [
        'name', function (n) { return n.name.value; },
        'bases', function (n) { return n.bases; },
        'body', function (n) { return n.body; },
        'decorator_list', function (n) { return n.decorator_list; }
    ];
    ReturnStatement.prototype['_astname'] = 'ReturnStatement';
    ReturnStatement.prototype['_fields'] = [
        'value', function (n) { return n.value; }
    ];
    DeleteStatement.prototype['_astname'] = 'DeleteStatement';
    DeleteStatement.prototype['_fields'] = [
        'targets', function (n) { return n.targets; }
    ];
    Assign.prototype['_astname'] = 'Assign';
    Assign.prototype['_fields'] = [
        'targets', function (n) { return n.targets; },
        'value', function (n) { return n.value; }
    ];
    AugAssign.prototype['_astname'] = 'AugAssign';
    AugAssign.prototype['_fields'] = [
        'target', function (n) { return n.target; },
        'op', function (n) { return n.op; },
        'value', function (n) { return n.value; }
    ];
    AnnAssign.prototype['_astname'] = 'AnnAssign';
    AnnAssign.prototype['_fields'] = [
        'target', function (n) { return n.target; },
        'type', function (n) { return n.value; }
    ];
    Print.prototype['_astname'] = 'Print';
    Print.prototype['_fields'] = [
        'dest', function (n) { return n.dest; },
        'values', function (n) { return n.values; },
        'nl', function (n) { return n.nl; }
    ];
    ForStatement.prototype['_astname'] = 'ForStatement';
    ForStatement.prototype['_fields'] = [
        'target', function (n) { return n.target; },
        'iter', function (n) { return n.iter; },
        'body', function (n) { return n.body; },
        'orelse', function (n) { return n.orelse; }
    ];
    WhileStatement.prototype['_astname'] = 'WhileStatement';
    WhileStatement.prototype['_fields'] = [
        'test', function (n) { return n.test; },
        'body', function (n) { return n.body; },
        'orelse', function (n) { return n.orelse; }
    ];
    IfStatement.prototype['_astname'] = 'IfStatement';
    IfStatement.prototype['_fields'] = [
        'test', function (n) { return n.test; },
        'consequent', function (n) { return n.consequent; },
        'alternate', function (n) { return n.alternate; }
    ];
    WithStatement.prototype['_astname'] = 'WithStatement';
    WithStatement.prototype['_fields'] = [
        'context_expr', function (n) { return n.context_expr; },
        'optional_vars', function (n) { return n.optional_vars; },
        'body', function (n) { return n.body; }
    ];
    Raise.prototype['_astname'] = 'Raise';
    Raise.prototype['_fields'] = [
        'type', function (n) { return n.type; },
        'inst', function (n) { return n.inst; },
        'tback', function (n) { return n.tback; }
    ];
    TryExcept.prototype['_astname'] = 'TryExcept';
    TryExcept.prototype['_fields'] = [
        'body', function (n) { return n.body; },
        'handlers', function (n) { return n.handlers; },
        'orelse', function (n) { return n.orelse; }
    ];
    TryFinally.prototype['_astname'] = 'TryFinally';
    TryFinally.prototype['_fields'] = [
        'body', function (n) { return n.body; },
        'finalbody', function (n) { return n.finalbody; }
    ];
    Assert.prototype['_astname'] = 'Assert';
    Assert.prototype['_fields'] = [
        'test', function (n) { return n.test; },
        'msg', function (n) { return n.msg; }
    ];
    ImportStatement.prototype['_astname'] = 'Import';
    ImportStatement.prototype['_fields'] = [
        'names', function (n) { return n.names; }
    ];
    ImportFrom.prototype['_astname'] = 'ImportFrom';
    ImportFrom.prototype['_fields'] = [
        'module', function (n) { return n.module.value; },
        'names', function (n) { return n.names; },
        'level', function (n) { return n.level; }
    ];
    Exec.prototype['_astname'] = 'Exec';
    Exec.prototype['_fields'] = [
        'body', function (n) { return n.body; },
        'globals', function (n) { return n.globals; },
        'locals', function (n) { return n.locals; }
    ];
    Global.prototype['_astname'] = 'Global';
    Global.prototype['_fields'] = [
        'names', function (n) { return n.names; }
    ];
    NonLocal.prototype['_astname'] = 'NonLocal';
    NonLocal.prototype['_fields'] = [
        'names', function (n) { return n.names; }
    ];
    ExpressionStatement.prototype['_astname'] = 'ExpressionStatement';
    ExpressionStatement.prototype['_fields'] = [
        'value', function (n) { return n.value; }
    ];
    Pass.prototype['_astname'] = 'Pass';
    Pass.prototype['_fields'] = [];
    BreakStatement.prototype['_astname'] = 'BreakStatement';
    BreakStatement.prototype['_fields'] = [];
    ContinueStatement.prototype['_astname'] = 'ContinueStatement';
    ContinueStatement.prototype['_fields'] = [];
    BoolOp.prototype['_astname'] = 'BoolOp';
    BoolOp.prototype['_fields'] = [
        'op', function (n) { return n.op; },
        'values', function (n) { return n.values; }
    ];
    BinOp.prototype['_astname'] = 'BinOp';
    BinOp.prototype['_fields'] = [
        'lhs', function (n) { return n.lhs; },
        'op', function (n) { return n.op; },
        'rhs', function (n) { return n.rhs; }
    ];
    UnaryOp.prototype['_astname'] = 'UnaryOp';
    UnaryOp.prototype['_fields'] = [
        'op', function (n) { return n.op; },
        'operand', function (n) { return n.operand; }
    ];
    Lambda.prototype['_astname'] = 'Lambda';
    Lambda.prototype['_fields'] = [
        'args', function (n) { return n.args; },
        'body', function (n) { return n.body; }
    ];
    IfExp.prototype['_astname'] = 'IfExp';
    IfExp.prototype['_fields'] = [
        'test', function (n) { return n.test; },
        'body', function (n) { return n.body; },
        'orelse', function (n) { return n.orelse; }
    ];
    Dict.prototype['_astname'] = 'Dict';
    Dict.prototype['_fields'] = [
        'keys', function (n) { return n.keys; },
        'values', function (n) { return n.values; }
    ];
    ListComp.prototype['_astname'] = 'ListComp';
    ListComp.prototype['_fields'] = [
        'elt', function (n) { return n.elt; },
        'generators', function (n) { return n.generators; }
    ];
    GeneratorExp.prototype['_astname'] = 'GeneratorExp';
    GeneratorExp.prototype['_fields'] = [
        'elt', function (n) { return n.elt; },
        'generators', function (n) { return n.generators; }
    ];
    Yield.prototype['_astname'] = 'Yield';
    Yield.prototype['_fields'] = [
        'value', function (n) { return n.value; }
    ];
    Compare.prototype['_astname'] = 'Compare';
    Compare.prototype['_fields'] = [
        'left', function (n) { return n.left; },
        'ops', function (n) { return n.ops; },
        'comparators', function (n) { return n.comparators; }
    ];
    Call.prototype['_astname'] = 'Call';
    Call.prototype['_fields'] = [
        'func', function (n) { return n.func; },
        'args', function (n) { return n.args; },
        'keywords', function (n) { return n.keywords; },
        'starargs', function (n) { return n.starargs; },
        'kwargs', function (n) { return n.kwargs; }
    ];
    Num.prototype['_astname'] = 'Num';
    Num.prototype['_fields'] = [
        'n', function (n) { return n.n.value; }
    ];
    Str.prototype['_astname'] = 'Str';
    Str.prototype['_fields'] = [
        's', function (n) { return n.s.value; }
    ];
    Attribute.prototype['_astname'] = 'Attribute';
    Attribute.prototype['_fields'] = [
        'value', function (n) { return n.value; },
        'attr', function (n) { return n.attr.value; },
        'ctx', function (n) { return n.ctx; }
    ];
    Subscript.prototype['_astname'] = 'Subscript';
    Subscript.prototype['_fields'] = [
        'value', function (n) { return n.value; },
        'slice', function (n) { return n.slice; },
        'ctx', function (n) { return n.ctx; }
    ];
    Name.prototype['_astname'] = 'Name';
    Name.prototype['_fields'] = [
        'id', function (n) { return n.id.value; },
        'ctx', function (n) { return n.ctx; }
    ];
    List.prototype['_astname'] = 'List';
    List.prototype['_fields'] = [
        'elts', function (n) { return n.elts; },
        'ctx', function (n) { return n.ctx; }
    ];
    Tuple.prototype['_astname'] = 'Tuple';
    Tuple.prototype['_fields'] = [
        'elts', function (n) { return n.elts; },
        'ctx', function (n) { return n.ctx; }
    ];
    Load.prototype['_astname'] = 'Load';
    Load.prototype['_isenum'] = true;
    Store.prototype['_astname'] = 'Store';
    Store.prototype['_isenum'] = true;
    Del.prototype['_astname'] = 'Del';
    Del.prototype['_isenum'] = true;
    AugLoad.prototype['_astname'] = 'AugLoad';
    AugLoad.prototype['_isenum'] = true;
    AugStore.prototype['_astname'] = 'AugStore';
    AugStore.prototype['_isenum'] = true;
    Param.prototype['_astname'] = 'Param';
    Param.prototype['_isenum'] = true;
    Ellipsis.prototype['_astname'] = 'Ellipsis';
    Ellipsis.prototype['_fields'] = [];
    Slice.prototype['_astname'] = 'Slice';
    Slice.prototype['_fields'] = [
        'lower', function (n) { return n.lower; },
        'upper', function (n) { return n.upper; },
        'step', function (n) { return n.step; }
    ];
    ExtSlice.prototype['_astname'] = 'ExtSlice';
    ExtSlice.prototype['_fields'] = [
        'dims', function (n) { return n.dims; }
    ];
    Index.prototype['_astname'] = 'Index';
    Index.prototype['_fields'] = [
        'value', function (n) { return n.value; }
    ];
    And.prototype['_astname'] = 'And';
    And.prototype['_isenum'] = true;
    Or.prototype['_astname'] = 'Or';
    Or.prototype['_isenum'] = true;
    Add.prototype['_astname'] = 'Add';
    Add.prototype['_isenum'] = true;
    Sub.prototype['_astname'] = 'Sub';
    Sub.prototype['_isenum'] = true;
    Mult.prototype['_astname'] = 'Mult';
    Mult.prototype['_isenum'] = true;
    Div.prototype['_astname'] = 'Div';
    Div.prototype['_isenum'] = true;
    Mod.prototype['_astname'] = 'Mod';
    Mod.prototype['_isenum'] = true;
    Pow.prototype['_astname'] = 'Pow';
    Pow.prototype['_isenum'] = true;
    LShift.prototype['_astname'] = 'LShift';
    LShift.prototype['_isenum'] = true;
    RShift.prototype['_astname'] = 'RShift';
    RShift.prototype['_isenum'] = true;
    BitOr.prototype['_astname'] = 'BitOr';
    BitOr.prototype['_isenum'] = true;
    BitXor.prototype['_astname'] = 'BitXor';
    BitXor.prototype['_isenum'] = true;
    BitAnd.prototype['_astname'] = 'BitAnd';
    BitAnd.prototype['_isenum'] = true;
    FloorDiv.prototype['_astname'] = 'FloorDiv';
    FloorDiv.prototype['_isenum'] = true;
    Invert.prototype['_astname'] = 'Invert';
    Invert.prototype['_isenum'] = true;
    Not.prototype['_astname'] = 'Not';
    Not.prototype['_isenum'] = true;
    UAdd.prototype['_astname'] = 'UAdd';
    UAdd.prototype['_isenum'] = true;
    USub.prototype['_astname'] = 'USub';
    USub.prototype['_isenum'] = true;
    Eq.prototype['_astname'] = 'Eq';
    Eq.prototype['_isenum'] = true;
    NotEq.prototype['_astname'] = 'NotEq';
    NotEq.prototype['_isenum'] = true;
    Lt.prototype['_astname'] = 'Lt';
    Lt.prototype['_isenum'] = true;
    LtE.prototype['_astname'] = 'LtE';
    LtE.prototype['_isenum'] = true;
    Gt.prototype['_astname'] = 'Gt';
    Gt.prototype['_isenum'] = true;
    GtE.prototype['_astname'] = 'GtE';
    GtE.prototype['_isenum'] = true;
    Is.prototype['_astname'] = 'Is';
    Is.prototype['_isenum'] = true;
    IsNot.prototype['_astname'] = 'IsNot';
    IsNot.prototype['_isenum'] = true;
    In.prototype['_astname'] = 'In';
    In.prototype['_isenum'] = true;
    NotIn.prototype['_astname'] = 'NotIn';
    NotIn.prototype['_isenum'] = true;
    Comprehension.prototype['_astname'] = 'Comprehension';
    Comprehension.prototype['_fields'] = [
        'target', function (n) { return n.target; },
        'iter', function (n) { return n.iter; },
        'ifs', function (n) { return n.ifs; }
    ];
    ExceptHandler.prototype['_astname'] = 'ExceptHandler';
    ExceptHandler.prototype['_fields'] = [
        'type', function (n) { return n.type; },
        'name', function (n) { return n.name; },
        'body', function (n) { return n.body; }
    ];
    Arguments.prototype['_astname'] = 'Arguments';
    Arguments.prototype['_fields'] = [
        'args', function (n) { return n.args; },
        'vararg', function (n) { return n.vararg; },
        'kwarg', function (n) { return n.kwarg; },
        'defaults', function (n) { return n.defaults; }
    ];
    Keyword.prototype['_astname'] = 'Keyword';
    Keyword.prototype['_fields'] = [
        'arg', function (n) { return n.arg.value; },
        'value', function (n) { return n.value; }
    ];
    FunctionParamDef.prototype['_astname'] = 'FunctionParamDef';
    FunctionParamDef.prototype['_fields'] = [
        'name', function (n) { return n.name; },
        'type', function (n) { return n.type; }
    ];
    Alias.prototype['_astname'] = 'Alias';
    Alias.prototype['_fields'] = [
        'name', function (n) { return n.name.value; },
        'asname', function (n) { return n.asname; }
    ];

    /**
     * @param s
     */
    function floatAST(s) {
        var thing = {
            text: s,
            value: parseFloat(s),
            isFloat: function () { return true; },
            isInt: function () { return false; },
            isLong: function () { return false; },
            toString: function () { return s; }
        };
        return thing;
    }
    /**
     * @param n
     */
    function intAST(n) {
        var thing = {
            value: n,
            isFloat: function () { return false; },
            isInt: function () { return true; },
            isLong: function () { return false; },
            toString: function () { return '' + n; }
        };
        return thing;
    }
    /**
     * @param {string} s
     */
    function longAST(s, radix) {
        var thing = {
            text: s,
            radix: radix,
            isFloat: function () { return false; },
            isInt: function () { return false; },
            isLong: function () { return true; },
            toString: function () { return s; }
        };
        return thing;
    }

    //
    // This is pretty much a straight port of ast.c from CPython 2.6.5.
    //
    // The previous version was easier to work with and more JS-ish, but having a
    // somewhat different ast structure than cpython makes testing more difficult.
    //
    // This way, we can use a dump from the ast module on any arbitrary python
    // code and know that we're the same up to ast level, at least.
    //
    var SYM = ParseTables.sym;
    /**
     *
     */
    var LONG_THRESHOLD = Math.pow(2, 53);
    /**
     * FIXME: Consolidate with parseError in parser.
     */
    function syntaxError(message, range) {
        assert$1(isString(message), "message must be a string");
        assert$1(isNumber(range.begin.line), "lineNumber must be a number");
        var e = new SyntaxError(message /*, fileName*/);
        e['lineNumber'] = range.begin.line;
        return e;
    }
    var Compiling = (function () {
        function Compiling(encoding) {
            this.c_encoding = encoding;
        }
        return Compiling;
    }());
    /**
     * Asserts that the type of the node is that specified.
     */
    function REQ(n, type) {
        // Avoid the cost of building the message string when there is no issue.
        if (n.type !== type) {
            fail("node must have type " + type + " = " + grammarName(type) + ", but was " + n.type + " = " + grammarName(n.type) + ".");
        }
    }
    /**
     * Nothing more than assertion that the argument is a string.
     */
    function strobj(s) {
        // Avoid the cost of building the message string when there is no issue.
        if (typeof s !== 'string') {
            fail("expecting string, got " + (typeof s));
        }
        // This previously constructed the runtime representation.
        // That may have had an string intern side effect?
        return s;
    }
    function numStmts(n) {
        switch (n.type) {
            case SYM.single_input:
                if (CHILD(n, 0).type === Tokens.T_NEWLINE)
                    return 0;
                else
                    return numStmts(CHILD(n, 0));
            case SYM.file_input:
                var cnt = 0;
                for (var i = 0; i < NCH(n); ++i) {
                    var ch = CHILD(n, i);
                    if (ch.type === SYM.stmt) {
                        cnt += numStmts(ch);
                    }
                }
                return cnt;
            case SYM.stmt:
                return numStmts(CHILD(n, 0));
            case SYM.compound_stmt:
                return 1;
            case SYM.simple_stmt:
                return Math.floor(NCH(n) / 2); // div 2 is to remove count of ;s
            case SYM.suite:
                if (NCH(n) === 1)
                    return numStmts(CHILD(n, 0));
                else {
                    var cnt_1 = 0;
                    for (var i = 2; i < NCH(n) - 1; ++i) {
                        cnt_1 += numStmts(CHILD(n, i));
                    }
                    return cnt_1;
                }
            default: {
                throw new Error("Non-statement found");
            }
        }
    }
    function forbiddenCheck(c, n, x, range) {
        if (x === "None")
            throw syntaxError("assignment to None", range);
        if (x === "True" || x === "False")
            throw syntaxError("assignment to True or False is forbidden", range);
    }
    /**
     * Set the context ctx for e, recursively traversing e.
     *
     * Only sets context for expr kinds that can appear in assignment context as
     * per the asdl file.
     */
    function setContext(c, e, ctx, n) {
        assert$1(ctx !== AugStore && ctx !== AugLoad);
        var s = null;
        var exprName = null;
        if (e instanceof Attribute) {
            if (ctx === Store)
                forbiddenCheck(c, n, e.attr.value, n.range);
            e.ctx = ctx;
        }
        else if (e instanceof Name) {
            if (ctx === Store)
                forbiddenCheck(c, n, /*e.attr*/ void 0, n.range);
            e.ctx = ctx;
        }
        else if (e instanceof Subscript) {
            e.ctx = ctx;
        }
        else if (e instanceof List) {
            e.ctx = ctx;
            s = e.elts;
        }
        else if (e instanceof Tuple) {
            if (e.elts.length === 0) {
                throw syntaxError("can't assign to ()", n.range);
            }
            e.ctx = ctx;
            s = e.elts;
        }
        else if (e instanceof Lambda) {
            exprName = "lambda";
        }
        else if (e instanceof Call) {
            exprName = "function call";
        }
        else if (e instanceof BoolOp) {
            exprName = "operator";
        }
        else {
            switch (e.constructor) {
                case BoolOp:
                case BinOp:
                case UnaryOp:
                    exprName = "operator";
                    break;
                case GeneratorExp:
                    exprName = "generator expression";
                    break;
                case Yield:
                    exprName = "yield expression";
                    break;
                case ListComp:
                    exprName = "list comprehension";
                    break;
                case Dict:
                case Num:
                case Str:
                    exprName = "literal";
                    break;
                case Compare:
                    exprName = "comparison expression";
                    break;
                case IfExp:
                    exprName = "conditional expression";
                    break;
                default: {
                    throw new Error("unhandled expression in assignment");
                }
            }
        }
        if (exprName) {
            throw syntaxError("can't " + (ctx === Store ? "assign to" : "delete") + " " + exprName, n.range);
        }
        if (s) {
            for (var _i = 0, s_1 = s; _i < s_1.length; _i++) {
                var e_1 = s_1[_i];
                setContext(c, e_1, ctx, n);
            }
        }
    }
    var operatorMap = {};
    (function () {
        operatorMap[Tokens.T_VBAR] = BitOr;
        assert$1(operatorMap[Tokens.T_VBAR] !== undefined, "" + Tokens.T_VBAR);
        // assert(operatorMap[TOK.T_VBAR] === BitOr, `${TOK.T_VBAR}`);
        operatorMap[Tokens.T_VBAR] = BitOr;
        operatorMap[Tokens.T_CIRCUMFLEX] = BitXor;
        operatorMap[Tokens.T_AMPER] = BitAnd;
        operatorMap[Tokens.T_LEFTSHIFT] = LShift;
        operatorMap[Tokens.T_RIGHTSHIFT] = RShift;
        operatorMap[Tokens.T_PLUS] = Add;
        operatorMap[Tokens.T_MINUS] = Sub;
        operatorMap[Tokens.T_STAR] = Mult;
        operatorMap[Tokens.T_SLASH] = Div;
        operatorMap[Tokens.T_DOUBLESLASH] = FloorDiv;
        operatorMap[Tokens.T_PERCENT] = Mod;
    }());
    function getOperator(n) {
        assert$1(operatorMap[n.type] !== undefined, "" + n.type);
        return { op: operatorMap[n.type], range: n.range };
    }
    function astForCompOp(c, n) {
        // comp_op: '<'|'>'|'=='|'>='|'<='|'<>'|'!='|'in'|'not' 'in'|'is' |'is' 'not'
        REQ(n, SYM.comp_op);
        if (NCH(n) === 1) {
            n = CHILD(n, 0);
            switch (n.type) {
                case Tokens.T_LESS: return Lt;
                case Tokens.T_GREATER: return Gt;
                case Tokens.T_EQEQUAL: return Eq;
                case Tokens.T_LESSEQUAL: return LtE;
                case Tokens.T_GREATEREQUAL: return GtE;
                case Tokens.T_NOTEQUAL: return NotEq;
                case Tokens.T_NAME:
                    if (n.value === "in")
                        return In;
                    if (n.value === "is")
                        return Is;
            }
        }
        else if (NCH(n) === 2) {
            if (CHILD(n, 0).type === Tokens.T_NAME) {
                if (CHILD(n, 1).value === "in")
                    return NotIn;
                if (CHILD(n, 0).value === "is")
                    return IsNot;
            }
        }
        throw new Error("invalid comp_op");
    }
    function seqForTestlist(c, n) {
        /* testlist: test (',' test)* [','] */
        assert$1(n.type === SYM.testlist ||
            n.type === SYM.listmaker ||
            n.type === SYM.testlist_gexp ||
            n.type === SYM.testlist_safe ||
            n.type === SYM.testlist1);
        var seq = [];
        for (var i = 0; i < NCH(n); i += 2) {
            assert$1(CHILD(n, i).type === SYM.IfExpr || CHILD(n, i).type === SYM.old_test);
            seq[i / 2] = astForExpr(c, CHILD(n, i));
        }
        return seq;
    }
    function astForSuite(c, n) {
        /* suite: simple_stmt | NEWLINE INDENT stmt+ DEDENT */
        REQ(n, SYM.suite);
        var seq = [];
        var pos = 0;
        var ch;
        if (CHILD(n, 0).type === SYM.simple_stmt) {
            n = CHILD(n, 0);
            /* simple_stmt always ends with an NEWLINE and may have a trailing
                * SEMI. */
            var end = NCH(n) - 1;
            if (CHILD(n, end - 1).type === Tokens.T_SEMI) {
                end -= 1;
            }
            // by 2 to skip
            for (var i = 0; i < end; i += 2) {
                seq[pos++] = astForStmt(c, CHILD(n, i));
            }
        }
        else {
            for (var i = 2; i < NCH(n) - 1; ++i) {
                ch = CHILD(n, i);
                REQ(ch, SYM.stmt);
                var num = numStmts(ch);
                if (num === 1) {
                    // small_stmt or compound_stmt w/ only 1 child
                    seq[pos++] = astForStmt(c, ch);
                }
                else {
                    ch = CHILD(ch, 0);
                    REQ(ch, SYM.simple_stmt);
                    for (var j = 0; j < NCH(ch); j += 2) {
                        if (NCH(CHILD(ch, j)) === 0) {
                            assert$1(j + 1 === NCH(ch));
                            break;
                        }
                        seq[pos++] = astForStmt(c, CHILD(ch, j));
                    }
                }
            }
        }
        assert$1(pos === numStmts(n));
        return seq;
    }
    function astForExceptClause(c, exc, body) {
        /* except_clause: 'except' [test [(',' | 'as') test]] */
        REQ(exc, SYM.except_clause);
        REQ(body, SYM.suite);
        if (NCH(exc) === 1) {
            return new ExceptHandler(null, null, astForSuite(c, body), exc.range);
        }
        else if (NCH(exc) === 2)
            return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), null, astForSuite(c, body), exc.range);
        else if (NCH(exc) === 4) {
            var e = astForExpr(c, CHILD(exc, 3));
            setContext(c, e, Store, CHILD(exc, 3));
            return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), e, astForSuite(c, body), exc.range);
        }
        else {
            throw new Error("wrong number of children for except clause");
        }
    }
    function astForTryStmt(c, n) {
        var nc = NCH(n);
        var nexcept = (nc - 3) / 3;
        var orelse = [];
        var finally_ = null;
        REQ(n, SYM.try_stmt);
        var body = astForSuite(c, CHILD(n, 2));
        if (CHILD(n, nc - 3).type === Tokens.T_NAME) {
            if (CHILD(n, nc - 3).value === "finally") {
                if (nc >= 9 && CHILD(n, nc - 6).type === Tokens.T_NAME) {
                    /* we can assume it's an "else",
                        because nc >= 9 for try-else-finally and
                        it would otherwise have a type of except_clause */
                    orelse = astForSuite(c, CHILD(n, nc - 4));
                    nexcept--;
                }
                finally_ = astForSuite(c, CHILD(n, nc - 1));
                nexcept--;
            }
            else {
                /* we can assume it's an "else",
                    otherwise it would have a type of except_clause */
                orelse = astForSuite(c, CHILD(n, nc - 1));
                nexcept--;
            }
        }
        else if (CHILD(n, nc - 3).type !== SYM.except_clause) {
            throw syntaxError("malformed 'try' statement", n.range);
        }
        if (nexcept > 0) {
            var handlers = [];
            for (var i = 0; i < nexcept; ++i) {
                handlers[i] = astForExceptClause(c, CHILD(n, 3 + i * 3), CHILD(n, 5 + i * 3));
            }
            var exceptSt = new TryExcept(body, handlers, orelse, n.range);
            if (!finally_)
                return exceptSt;
            /* if a 'finally' is present too, we nest the TryExcept within a
                TryFinally to emulate try ... except ... finally */
            body = [exceptSt];
        }
        assert$1(finally_ !== null);
        return new TryFinally(body, finally_, n.range);
    }
    function astForDottedName(c, n) {
        REQ(n, SYM.dotted_name);
        var child = CHILD(n, 0);
        var id = new RangeAnnotated(child.value, child.range);
        var e = new Name(id, Load);
        for (var i = 2; i < NCH(n); i += 2) {
            var child_1 = CHILD(n, i);
            id = new RangeAnnotated(child_1.value, child_1.range);
            e = new Attribute(e, id, Load, n.range);
        }
        return e;
    }
    function astForDecorator(c, n) {
        /* decorator: '@' dotted_name [ '(' [arglist] ')' ] NEWLINE */
        REQ(n, SYM.decorator);
        REQ(CHILD(n, 0), Tokens.T_AT);
        REQ(CHILD(n, NCH(n) - 1), Tokens.T_NEWLINE);
        var nameExpr = astForDottedName(c, CHILD(n, 1));
        if (NCH(n) === 3)
            return nameExpr;
        else if (NCH(n) === 5)
            return new Call(nameExpr, [], [], null, null);
        else
            return astForCall(c, CHILD(n, 3), nameExpr);
    }
    function astForDecorators(c, n) {
        REQ(n, SYM.decorators);
        var decoratorSeq = [];
        for (var i = 0; i < NCH(n); ++i) {
            decoratorSeq[i] = astForDecorator(c, CHILD(n, i));
        }
        return decoratorSeq;
    }
    function astForDecorated(c, n) {
        REQ(n, SYM.decorated);
        var decoratorSeq = astForDecorators(c, CHILD(n, 0));
        assert$1(CHILD(n, 1).type === SYM.funcdef || CHILD(n, 1).type === SYM.classdef);
        var thing = null;
        if (CHILD(n, 1).type === SYM.funcdef) {
            thing = astForFuncdef(c, CHILD(n, 1), decoratorSeq);
        }
        else if (CHILD(n, 1).type === SYM.classdef) {
            thing = astForClassdef(c, CHILD(n, 1), decoratorSeq);
        }
        else {
            throw new Error("astForDecorated");
        }
        return thing;
    }
    function astForWithVar(c, n) {
        REQ(n, SYM.with_var);
        return astForExpr(c, CHILD(n, 1));
    }
    function astForWithStmt(c, n) {
        /* with_stmt: 'with' test [ with_var ] ':' suite */
        var suiteIndex = 3; // skip with, test, :
        assert$1(n.type === SYM.with_stmt);
        var contextExpr = astForExpr(c, CHILD(n, 1));
        var optionalVars;
        if (CHILD(n, 2).type === SYM.with_var) {
            optionalVars = astForWithVar(c, CHILD(n, 2));
            setContext(c, optionalVars, Store, n);
            suiteIndex = 4;
        }
        return new WithStatement(contextExpr, optionalVars, astForSuite(c, CHILD(n, suiteIndex)), n.range);
    }
    function astForExecStmt(c, n) {
        var globals = null;
        var locals = null;
        var nchildren = NCH(n);
        assert$1(nchildren === 2 || nchildren === 4 || nchildren === 6);
        /* exec_stmt: 'exec' expr ['in' test [',' test]] */
        REQ(n, SYM.exec_stmt);
        var expr1 = astForExpr(c, CHILD(n, 1));
        if (nchildren >= 4) {
            globals = astForExpr(c, CHILD(n, 3));
        }
        if (nchildren === 6) {
            locals = astForExpr(c, CHILD(n, 5));
        }
        return new Exec(expr1, globals, locals, n.range);
    }
    function astForIfStmt(c, n) {
        /* if_stmt: 'if' test ':' suite ('elif' test ':' suite)*
            ['else' ':' suite]
        */
        REQ(n, SYM.if_stmt);
        if (NCH(n) === 4)
            return new IfStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.range);
        var s = CHILD(n, 4).value;
        var decider = s.charAt(2); // elSe or elIf
        if (decider === 's') {
            return new IfStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.range);
        }
        else if (decider === 'i') {
            var nElif = NCH(n) - 4;
            var hasElse = false;
            var orelse = [];
            /* must reference the child nElif+1 since 'else' token is third, not
                * fourth child from the end. */
            if (CHILD(n, nElif + 1).type === Tokens.T_NAME && CHILD(n, nElif + 1).value.charAt(2) === 's') {
                hasElse = true;
                nElif -= 3;
            }
            nElif /= 4;
            if (hasElse) {
                orelse = [
                    new IfStatement(astForExpr(c, CHILD(n, NCH(n) - 6)), astForSuite(c, CHILD(n, NCH(n) - 4)), astForSuite(c, CHILD(n, NCH(n) - 1)), CHILD(n, NCH(n) - 6).range)
                ];
                nElif--;
            }
            for (var i = 0; i < nElif; ++i) {
                var off = 5 + (nElif - i - 1) * 4;
                orelse = [
                    new IfStatement(astForExpr(c, CHILD(n, off)), astForSuite(c, CHILD(n, off + 2)), orelse, CHILD(n, off).range)
                ];
            }
            return new IfStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), orelse, n.range);
        }
        throw new Error("unexpected token in 'if' statement");
    }
    function astForExprlist(c, n, context) {
        REQ(n, SYM.ExprList);
        var seq = [];
        for (var i = 0; i < NCH(n); i += 2) {
            var e = astForExpr(c, CHILD(n, i));
            seq[i / 2] = e;
            if (context)
                setContext(c, e, context, CHILD(n, i));
        }
        return seq;
    }
    function astForDelStmt(c, n) {
        REQ(n, SYM.del_stmt);
        return new DeleteStatement(astForExprlist(c, CHILD(n, 1), Del), n.range);
    }
    function astForGlobalStmt(c, n) {
        REQ(n, SYM.GlobalStmt);
        var s = [];
        for (var i = 1; i < NCH(n); i += 2) {
            s[(i - 1) / 2] = strobj(CHILD(n, i).value);
        }
        return new Global(s, n.range);
    }
    function astForNonLocalStmt(c, n) {
        REQ(n, SYM.NonLocalStmt);
        var s = [];
        for (var i = 1; i < NCH(n); i += 2) {
            s[(i - 1) / 2] = strobj(CHILD(n, i).value);
        }
        return new NonLocal(s, n.range);
    }
    function astForAssertStmt(c, n) {
        /* assert_stmt: 'assert' test [',' test] */
        REQ(n, SYM.assert_stmt);
        if (NCH(n) === 2) {
            return new Assert(astForExpr(c, CHILD(n, 1)), null, n.range);
        }
        else if (NCH(n) === 4) {
            return new Assert(astForExpr(c, CHILD(n, 1)), astForExpr(c, CHILD(n, 3)), n.range);
        }
        throw new Error("improper number of parts to assert stmt");
    }
    function aliasForImportName(c, n) {
        /*
            ImportSpecifier: NAME ['as' NAME]
            dotted_as_name: dotted_name ['as' NAME]
            dotted_name: NAME ('.' NAME)*
        */
        loop: while (true) {
            switch (n.type) {
                case SYM.ImportSpecifier: {
                    var str = null;
                    var nameNode = CHILD(n, 0);
                    var name_1 = strobj(nameNode.value);
                    var nameRange = nameNode.range;
                    if (NCH(n) === 3) {
                        str = CHILD(n, 2).value;
                    }
                    return new Alias(new RangeAnnotated(name_1, nameRange), str == null ? null : strobj(str));
                }
                case SYM.dotted_as_name:
                    if (NCH(n) === 1) {
                        n = CHILD(n, 0);
                        continue loop;
                    }
                    else {
                        var a = aliasForImportName(c, CHILD(n, 0));
                        assert$1(!a.asname);
                        a.asname = strobj(CHILD(n, 2).value);
                        return a;
                    }
                case SYM.dotted_name:
                    if (NCH(n) === 1) {
                        var nameNode = CHILD(n, 0);
                        var name_2 = strobj(nameNode.value);
                        var nameRange = nameNode.range;
                        return new Alias(new RangeAnnotated(name_2, nameRange), null);
                    }
                    else {
                        // create a string of the form a.b.c
                        var str = '';
                        for (var i = 0; i < NCH(n); i += 2) {
                            str += CHILD(n, i).value + ".";
                        }
                        return new Alias(new RangeAnnotated(str.substr(0, str.length - 1), null), null);
                    }
                case Tokens.T_STAR: {
                    return new Alias(new RangeAnnotated("*", n.range), null);
                }
                case Tokens.T_NAME: {
                    // Temporary.
                    return new Alias(new RangeAnnotated(n.value, n.range), null);
                }
                default: {
                    throw syntaxError("unexpected import name " + grammarName(n.type), n.range);
                }
            }
        }
    }
    function parseModuleSpecifier(c, moduleSpecifierNode) {
        REQ(moduleSpecifierNode, SYM.ModuleSpecifier);
        var N = NCH(moduleSpecifierNode);
        var ret = "";
        var range;
        for (var i = 0; i < N; ++i) {
            var child = CHILD(moduleSpecifierNode, i);
            ret = ret + parsestr(c, child.value);
            range = child.range;
        }
        return { value: ret, range: range };
    }
    function astForImportStmt(c, importStatementNode) {
        REQ(importStatementNode, SYM.import_stmt);
        var nameOrFrom = CHILD(importStatementNode, 0);
        if (nameOrFrom.type === SYM.import_name) {
            var n = CHILD(nameOrFrom, 1);
            REQ(n, SYM.dotted_as_names);
            var aliases = [];
            for (var i = 0; i < NCH(n); i += 2) {
                aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
            }
            return new ImportStatement(aliases, importStatementNode.range);
        }
        else if (nameOrFrom.type === SYM.import_from) {
            // let mod: Alias = null;
            var moduleSpec = void 0;
            var ndots = 0;
            var nchildren = void 0;
            var idx = void 0;
            for (idx = 1; idx < NCH(nameOrFrom); ++idx) {
                var child = CHILD(nameOrFrom, idx);
                var childType = child.type;
                if (childType === SYM.dotted_name) {
                    // This should be dead code since we support ECMAScript 2015 modules.
                    throw syntaxError("unknown import statement " + grammarName(childType) + ".", child.range);
                    // mod = aliasForImportName(c, child);
                    // idx++;
                    // break;
                }
                else if (childType === SYM.ModuleSpecifier) {
                    moduleSpec = parseModuleSpecifier(c, child);
                    break;
                }
                else if (childType !== Tokens.T_DOT) {
                    // Let's be more specific...
                    throw syntaxError("unknown import statement " + grammarName(childType) + ".", child.range);
                    // break;
                }
                ndots++;
            }
            ++idx; // skip the import keyword
            var n = nameOrFrom;
            switch (CHILD(nameOrFrom, idx).type) {
                case Tokens.T_STAR: {
                    // from ... import
                    n = CHILD(nameOrFrom, idx);
                    nchildren = 1;
                    break;
                }
                case Tokens.T_LPAR: {
                    // from ... import (x, y, z)
                    n = CHILD(n, idx + 1);
                    nchildren = NCH(n);
                    break;
                }
                case SYM.ImportList: {
                    // from ... import x, y, z
                    n = CHILD(n, idx);
                    nchildren = NCH(n);
                    if (nchildren % 2 === 0) {
                        throw syntaxError("trailing comma not allowed without surrounding parentheses", n.range);
                    }
                }
            }
            var aliases = [];
            if (n.type === Tokens.T_STAR) {
                aliases[0] = aliasForImportName(c, n);
            }
            else {
                REQ(n, SYM.import_from);
                var importListNode = CHILD(n, FIND(n, SYM.ImportList));
                astForImportList(c, importListNode, aliases);
            }
            // moduleName = mod ? mod.name : moduleName;
            assert$1(typeof moduleSpec.value === 'string');
            return new ImportFrom(new RangeAnnotated(moduleSpec.value, moduleSpec.range), aliases, ndots, importStatementNode.range);
        }
        else {
            throw syntaxError("unknown import statement " + grammarName(nameOrFrom.type) + ".", nameOrFrom.range);
        }
    }
    function astForImportList(c, importListNode, aliases) {
        REQ(importListNode, SYM.ImportList);
        var N = NCH(importListNode);
        for (var i = 0; i < N; i++) {
            var child = CHILD(importListNode, i);
            if (child.type === SYM.ImportSpecifier) {
                aliases.push(aliasForImportName(c, child));
            }
        }
    }
    function astForTestlistGexp(c, n) {
        assert$1(n.type === SYM.testlist_gexp || n.type === SYM.argument);
        if (NCH(n) > 1 && CHILD(n, 1).type === SYM.gen_for)
            return astForGenexp(c, n);
        return astForTestlist(c, n);
    }
    function astForListcomp(c, n) {
        function countListFors(c, n) {
            var nfors = 0;
            var ch = CHILD(n, 1);
            count_list_for: while (true) {
                nfors++;
                REQ(ch, SYM.list_for);
                if (NCH(ch) === 5)
                    ch = CHILD(ch, 4);
                else
                    return nfors;
                count_list_iter: while (true) {
                    REQ(ch, SYM.list_iter);
                    ch = CHILD(ch, 0);
                    if (ch.type === SYM.list_for)
                        continue count_list_for;
                    else if (ch.type === SYM.list_if) {
                        if (NCH(ch) === 3) {
                            ch = CHILD(ch, 2);
                            continue count_list_iter;
                        }
                        else
                            return nfors;
                    }
                    break;
                }
                // FIXME: What does a break at the end of a function do?
                break;
            }
            throw new Error("TODO: Should this be returning void 0?");
        }
        function countListIfs(c, n) {
            var nifs = 0;
            while (true) {
                REQ(n, SYM.list_iter);
                if (CHILD(n, 0).type === SYM.list_for)
                    return nifs;
                n = CHILD(n, 0);
                REQ(n, SYM.list_if);
                nifs++;
                if (NCH(n) === 2)
                    return nifs;
                n = CHILD(n, 2);
            }
        }
        REQ(n, SYM.listmaker);
        assert$1(NCH(n) > 1);
        var elt = astForExpr(c, CHILD(n, 0));
        var nfors = countListFors(c, n);
        var listcomps = [];
        var ch = CHILD(n, 1);
        for (var i = 0; i < nfors; ++i) {
            REQ(ch, SYM.list_for);
            var forch = CHILD(ch, 1);
            var t = astForExprlist(c, forch, Store);
            var expression = astForTestlist(c, CHILD(ch, 3));
            var lc = void 0;
            if (NCH(forch) === 1)
                lc = new Comprehension(t[0], expression, []);
            else
                lc = new Comprehension(new Tuple(t, Store, ch.range), expression, []);
            if (NCH(ch) === 5) {
                ch = CHILD(ch, 4);
                var nifs = countListIfs(c, ch);
                var ifs = [];
                for (var j = 0; j < nifs; ++j) {
                    REQ(ch, SYM.list_iter);
                    ch = CHILD(ch, 0);
                    REQ(ch, SYM.list_if);
                    ifs[j] = astForExpr(c, CHILD(ch, 1));
                    if (NCH(ch) === 3)
                        ch = CHILD(ch, 2);
                }
                if (ch.type === SYM.list_iter)
                    ch = CHILD(ch, 0);
                lc.ifs = ifs;
            }
            listcomps[i] = lc;
        }
        return new ListComp(elt, listcomps, n.range);
    }
    function astForUnaryExpr(c, n) {
        if (CHILD(n, 0).type === Tokens.T_MINUS && NCH(n) === 2) {
            var pfactor = CHILD(n, 1);
            if (pfactor.type === SYM.UnaryExpr && NCH(pfactor) === 1) {
                var ppower = CHILD(pfactor, 0);
                if (ppower.type === SYM.PowerExpr && NCH(ppower) === 1) {
                    var patom = CHILD(ppower, 0);
                    if (patom.type === SYM.AtomExpr) {
                        var pnum = CHILD(patom, 0);
                        if (pnum.type === Tokens.T_NUMBER) {
                            pnum.value = "-" + pnum.value;
                            return astForAtomExpr(c, patom);
                        }
                    }
                }
            }
        }
        var expression = astForExpr(c, CHILD(n, 1));
        switch (CHILD(n, 0).type) {
            case Tokens.T_PLUS: return new UnaryOp(UAdd, expression, n.range);
            case Tokens.T_MINUS: return new UnaryOp(USub, expression, n.range);
            case Tokens.T_TILDE: return new UnaryOp(Invert, expression, n.range);
        }
        throw new Error("unhandled UnaryExpr");
    }
    function astForForStmt(c, n) {
        var seq = [];
        REQ(n, SYM.for_stmt);
        if (NCH(n) === 9) {
            seq = astForSuite(c, CHILD(n, 8));
        }
        var nodeTarget = CHILD(n, 1);
        var _target = astForExprlist(c, nodeTarget, Store);
        var target;
        if (NCH(nodeTarget) === 1)
            target = _target[0];
        else
            target = new Tuple(_target, Store, n.range);
        return new ForStatement(target, astForTestlist(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 5)), seq, n.range);
    }
    function astForCall(c, n, func) {
        /*
            arglist: (argument ',')* (argument [',']| '*' test [',' '**' test]
                    | '**' test)
            argument: [test '='] test [gen_for]        # Really [keyword '='] test
        */
        REQ(n, SYM.arglist);
        var nargs = 0;
        var nkeywords = 0;
        var ngens = 0;
        for (var i = 0; i < NCH(n); ++i) {
            var ch = CHILD(n, i);
            if (ch.type === SYM.argument) {
                if (NCH(ch) === 1)
                    nargs++;
                else if (CHILD(ch, 1).type === SYM.gen_for)
                    ngens++;
                else
                    nkeywords++;
            }
        }
        if (ngens > 1 || (ngens && (nargs || nkeywords)))
            throw syntaxError("Generator expression must be parenthesized if not sole argument", n.range);
        if (nargs + nkeywords + ngens > 255)
            throw syntaxError("more than 255 arguments", n.range);
        var args = [];
        var keywords = [];
        nargs = 0;
        nkeywords = 0;
        var vararg = null;
        var kwarg = null;
        for (var i = 0; i < NCH(n); ++i) {
            var ch = CHILD(n, i);
            if (ch.type === SYM.argument) {
                if (NCH(ch) === 1) {
                    if (nkeywords)
                        throw syntaxError("non-keyword arg after keyword arg", n.range);
                    if (vararg)
                        throw syntaxError("only named arguments may follow *expression", n.range);
                    args[nargs++] = astForExpr(c, CHILD(ch, 0));
                }
                else if (CHILD(ch, 1).type === SYM.gen_for)
                    args[nargs++] = astForGenexp(c, ch);
                else {
                    var e = astForExpr(c, CHILD(ch, 0));
                    if (e.constructor === Lambda)
                        throw syntaxError("lambda cannot contain assignment", n.range);
                    else if (e.constructor !== Name)
                        throw syntaxError("keyword can't be an expression", n.range);
                    var key = e.id;
                    forbiddenCheck(c, CHILD(ch, 0), key.value, n.range);
                    for (var k = 0; k < nkeywords; ++k) {
                        var tmp = keywords[k].arg.value;
                        if (tmp === key.value)
                            throw syntaxError("keyword argument repeated", n.range);
                    }
                    keywords[nkeywords++] = new Keyword(key, astForExpr(c, CHILD(ch, 2)));
                }
            }
            else if (ch.type === Tokens.T_STAR)
                vararg = astForExpr(c, CHILD(n, ++i));
            else if (ch.type === Tokens.T_DOUBLESTAR)
                kwarg = astForExpr(c, CHILD(n, ++i));
        }
        // Convert keywords to a Dict, which is one arg
        var keywordDict = keywordsToDict(keywords);
        if (keywordDict.keys.length !== 0) {
            args.push(keywordDict);
        }
        return new Call(func, args, [], vararg, kwarg);
    }
    function keywordsToDict(keywords) {
        var keys = [];
        var values = [];
        for (var _i = 0, keywords_1 = keywords; _i < keywords_1.length; _i++) {
            var keyword = keywords_1[_i];
            values.push(keyword.value);
            keys.push(new Name(new RangeAnnotated(keyword.arg.value, keyword.arg.range), Load));
        }
        return new Dict(keys, values);
    }
    function astForTrailer(c, node, leftExpr) {
        /* trailer: '(' [arglist] ')' | '[' subscriptlist ']' | '.' NAME
            subscriptlist: subscript (',' subscript)* [',']
            subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
            */
        var n = node;
        var childZero = CHILD(n, 0);
        var childOne = CHILD(n, 1);
        var childTwo = CHILD(n, 2);
        REQ(n, SYM.trailer);
        if (childZero.type === Tokens.T_LPAR) {
            if (NCH(n) === 2) {
                return new Call(leftExpr, [], [], null, null);
            }
            else {
                return astForCall(c, childOne, leftExpr);
            }
        }
        else if (childZero.type === Tokens.T_DOT) {
            return new Attribute(leftExpr, new RangeAnnotated(childOne.value, childOne.range), Load, n.range);
        }
        else {
            REQ(childZero, Tokens.T_LSQB);
            REQ(childTwo, Tokens.T_RSQB);
            var n_1 = childOne;
            if (NCH(n_1) === 1)
                return new Subscript(leftExpr, astForSlice(c, CHILD(n_1, 0)), Load, n_1.range);
            else {
                /* The grammar is ambiguous here. The ambiguity is resolved
                    by treating the sequence as a tuple literal if there are
                    no slice features.
                */
                var simple = true;
                var slices = [];
                for (var j = 0; j < NCH(n_1); j += 2) {
                    var slc = astForSlice(c, CHILD(n_1, j));
                    if (slc.constructor !== Index) {
                        simple = false;
                    }
                    slices[j / 2] = slc;
                }
                if (!simple) {
                    return new Subscript(leftExpr, new ExtSlice(slices), Load, n_1.range);
                }
                var elts = [];
                for (var j = 0; j < slices.length; ++j) {
                    var slc = slices[j];
                    if (slc instanceof Index) {
                        assert$1(slc.value !== null && slc.value !== undefined);
                        elts[j] = slc.value;
                    }
                    else {
                        assert$1(slc instanceof Index);
                    }
                }
                var e = new Tuple(elts, Load, n_1.range);
                return new Subscript(leftExpr, new Index(e), Load, n_1.range);
            }
        }
    }
    function astForFlowStmt(c, n) {
        REQ(n, SYM.flow_stmt);
        var ch = CHILD(n, 0);
        switch (ch.type) {
            case SYM.break_stmt: return new BreakStatement(n.range);
            case SYM.continue_stmt: return new ContinueStatement(n.range);
            case SYM.yield_stmt:
                return new ExpressionStatement(astForExpr(c, CHILD(ch, 0)), n.range);
            case SYM.return_stmt:
                if (NCH(ch) === 1)
                    return new ReturnStatement(null, n.range);
                else
                    return new ReturnStatement(astForTestlist(c, CHILD(ch, 1)), n.range);
            case SYM.raise_stmt: {
                if (NCH(ch) === 1)
                    return new Raise(null, null, null, n.range);
                else if (NCH(ch) === 2)
                    return new Raise(astForExpr(c, CHILD(ch, 1)), null, null, n.range);
                else if (NCH(ch) === 4)
                    return new Raise(astForExpr(c, CHILD(ch, 1)), astForExpr(c, CHILD(ch, 3)), null, n.range);
                else if (NCH(ch) === 6)
                    return new Raise(astForExpr(c, CHILD(ch, 1)), astForExpr(c, CHILD(ch, 3)), astForExpr(c, CHILD(ch, 5)), n.range);
                else {
                    throw new Error("unhandled flow statement");
                }
            }
            default: {
                throw new Error("unexpected flow_stmt");
            }
        }
    }
    function astForArguments(c, n) {
        /* parameters: '(' [varargslist] ')'
            varargslist: (fpdef ['=' test] ',')* ('*' NAME [',' '**' NAME]
                | '**' NAME) | fpdef ['=' test] (',' fpdef ['=' test])* [',']
        */
        var ch;
        var vararg = null;
        var kwarg = null;
        if (n.type === SYM.parameters) {
            if (NCH(n) === 2)
                return new Arguments([], null, null, []);
            n = CHILD(n, 1); // n is a varargslist here on out
        }
        REQ(n, SYM.varargslist);
        var args = [];
        var defaults = [];
        /* fpdef: NAME [':' IfExpr] | '(' fplist ')'
            fplist: fpdef (',' fpdef)* [',']
        */
        var foundDefault = false;
        var i = 0;
        var j = 0; // index for defaults
        var k = 0; // index for args
        // loop through the children of the varargslist
        while (i < NCH(n)) {
            ch = CHILD(n, i);
            switch (ch.type) {
                // If it is a fpdef - act here
                case SYM.fpdef:
                    var complexArgs = 0;
                    var parenthesized = false;
                    handle_fpdef: while (true) {
                        if (i + 1 < NCH(n) && CHILD(n, i + 1).type === Tokens.T_EQUAL) {
                            defaults[j++] = astForExpr(c, CHILD(n, i + 2));
                            i += 2;
                            foundDefault = true;
                        }
                        else if (foundDefault) {
                            /* def f((x)=4): pass should raise an error.
                                def f((x, (y))): pass will just incur the tuple unpacking warning. */
                            if (parenthesized && !complexArgs)
                                throw syntaxError("parenthesized arg with default", n.range);
                            throw syntaxError("non-default argument follows default argument", n.range);
                        }
                        // For unpacking a tuple
                        if (NCH(ch) === 3 && ch.children[2].type === Tokens.T_RPAR) {
                            ch = CHILD(ch, 1);
                            // def foo((x)): is not complex, special case.
                            if (NCH(ch) !== 1) {
                                throw syntaxError("tuple parameter unpacking has been removed", n.range);
                            }
                            else {
                                /* def foo((x)): setup for checking NAME below. */
                                /* Loop because there can be many parens and tuple
                                    unpacking mixed in. */
                                parenthesized = true;
                                ch = CHILD(ch, 0);
                                assert$1(ch.type === SYM.fpdef);
                                continue handle_fpdef;
                            }
                        }
                        // childzero here is possibly the 'NAME' in fpdef: NAME [':' IfExpr]
                        var childZero = CHILD(ch, 0);
                        if (childZero.type === Tokens.T_NAME) {
                            forbiddenCheck(c, n, childZero.value, n.range);
                            var id = new RangeAnnotated(childZero.value, childZero.range);
                            /**
                             * Setting the type of the param here, will be third child of fpdef if it exists
                             * If it doesn't exist then set the type as null and have typescript attempt to infer it later
                             */
                            var paramTypeNode = CHILD(ch, 2);
                            if (paramTypeNode) {
                                var paramTypeExpr = astForExpr(c, paramTypeNode);
                                args[k++] = new FunctionParamDef(new Name(id, Param), paramTypeExpr);
                            }
                            else {
                                args[k++] = new FunctionParamDef(new Name(id, Param));
                            }
                        }
                        i += 2;
                        if (parenthesized)
                            throw syntaxError("parenthesized argument names are invalid", n.range);
                        break;
                    }
                    break;
                case Tokens.T_STAR:
                    forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value, n.range);
                    vararg = strobj(CHILD(n, i + 1).value);
                    i += 3;
                    break;
                case Tokens.T_DOUBLESTAR:
                    forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value, n.range);
                    kwarg = strobj(CHILD(n, i + 1).value);
                    i += 3;
                    break;
                default: {
                    throw new Error("unexpected node in varargslist");
                }
            }
        }
        return new Arguments(args, vararg, kwarg, defaults);
    }
    function astForFuncdef(c, n, decoratorSeq) {
        /**
         * funcdef: ['export'] def' NAME parameters ['->' IfExpr] ':' suite
         */
        REQ(n, SYM.funcdef);
        var numberOfChildren = NCH(n);
        var ch1;
        var name;
        var args;
        // Name and args are 1 node further if 'export' exists
        if (numberOfChildren !== 8 && numberOfChildren !== 6) {
            ch1 = CHILD(n, 1);
            name = strobj(ch1.value);
            forbiddenCheck(c, ch1, name, n.range);
            args = astForArguments(c, CHILD(n, 2));
        }
        else {
            ch1 = CHILD(n, 2);
            name = strobj(ch1.value);
            forbiddenCheck(c, ch1, name, n.range);
            args = astForArguments(c, CHILD(n, 3));
        }
        // suite is either 4, 6 or 7, depending on whether functype exists
        var body;
        var returnType;
        // Neither Export nor FuncType exist
        if (numberOfChildren === 5) {
            body = astForSuite(c, CHILD(n, 4));
            returnType = null;
        }
        else if (numberOfChildren === 6) {
            body = astForSuite(c, CHILD(n, 5));
            returnType = null;
        }
        else if (numberOfChildren === 7) {
            returnType = astForExpr(c, CHILD(n, 4));
            body = astForSuite(c, CHILD(n, 6));
        }
        else if (numberOfChildren === 8) {
            returnType = astForExpr(c, CHILD(n, 5));
            body = astForSuite(c, CHILD(n, 7));
        }
        else {
            fail("Was expecting 5, 7 or 8 children, received " + numberOfChildren + " children");
        }
        return new FunctionDef(new RangeAnnotated(name, ch1.range), args, body, returnType, decoratorSeq, n.range);
    }
    function astForClassBases(c, n) {
        var numberOfChildren = NCH(n);
        assert$1(numberOfChildren > 0);
        REQ(n, SYM.testlist);
        if (numberOfChildren === 1) {
            return [astForExpr(c, CHILD(n, 0))];
        }
        return seqForTestlist(c, n);
    }
    function astForClassdef(c, node, decoratorSeq) {
        /**
         * ['export'] 'class' NAME ['(' [testlist] ')'] ':' suite
         */
        var n = node;
        var numberOfChildren = NCH(n);
        REQ(n, SYM.classdef);
        var nameNode;
        var className;
        var nameRange;
        if (numberOfChildren !== 5 && numberOfChildren !== 8) {
            if (numberOfChildren !== 7 || CHILD(n, 4).type !== Tokens.T_RPAR) {
                nameNode = CHILD(n, 1);
                forbiddenCheck(c, n, nameNode.value, n.range);
                className = strobj(nameNode.value);
                nameRange = nameNode.range;
            }
        }
        else {
            nameNode = CHILD(n, 2);
            forbiddenCheck(c, n, nameNode.value, n.range);
            className = strobj(nameNode.value);
            nameRange = nameNode.range;
        }
        // If grammar looks like 'class NAME : suite'
        if (numberOfChildren === 4) {
            return new ClassDef(new RangeAnnotated(className, nameRange), [], astForSuite(c, CHILD(n, 3)), decoratorSeq, n.range);
        }
        // If grammar looks like 'export class NAME '(' ')' : suite'
        if (numberOfChildren === 7 && CHILD(n, 3).type !== Tokens.T_RPAR) ;
        var c3 = CHILD(n, 3);
        // If grammar looks like 'class NAME '(' ')' : suite'
        if (c3.type === Tokens.T_RPAR) {
            return new ClassDef(new RangeAnnotated(className, nameRange), [], astForSuite(c, CHILD(n, 5)), decoratorSeq, n.range);
        }
        // Otherwise grammar looks like 'class NAME '(' testlist ')' : suite'
        // ClassBases are 'testlist'
        var bases = astForClassBases(c, c3);
        var s = astForSuite(c, CHILD(n, 6));
        return new ClassDef(new RangeAnnotated(className, nameRange), bases, s, decoratorSeq, n.range);
    }
    function astForLambdef(c, n) {
        var args;
        var expression;
        if (NCH(n) === 3) {
            args = new Arguments([], null, null, []);
            expression = astForExpr(c, CHILD(n, 2));
        }
        else {
            args = astForArguments(c, CHILD(n, 1));
            expression = astForExpr(c, CHILD(n, 3));
        }
        return new Lambda(args, expression, n.range);
    }
    function astForGenexp(c, n) {
        /* testlist_gexp: test ( gen_for | (',' test)* [','] )
            argument: [test '='] test [gen_for]       # Really [keyword '='] test */
        assert$1(n.type === SYM.testlist_gexp || n.type === SYM.argument);
        assert$1(NCH(n) > 1);
        function countGenFors(c, n) {
            var nfors = 0;
            var ch = CHILD(n, 1);
            count_gen_for: while (true) {
                nfors++;
                REQ(ch, SYM.gen_for);
                if (NCH(ch) === 5)
                    ch = CHILD(ch, 4);
                else
                    return nfors;
                count_gen_iter: while (true) {
                    REQ(ch, SYM.gen_iter);
                    ch = CHILD(ch, 0);
                    if (ch.type === SYM.gen_for)
                        continue count_gen_for;
                    else if (ch.type === SYM.gen_if) {
                        if (NCH(ch) === 3) {
                            ch = CHILD(ch, 2);
                            continue count_gen_iter;
                        }
                        else
                            return nfors;
                    }
                    break;
                }
                break;
            }
            throw new Error("logic error in countGenFors");
        }
        function countGenIfs(c, n) {
            var nifs = 0;
            while (true) {
                REQ(n, SYM.gen_iter);
                if (CHILD(n, 0).type === SYM.gen_for)
                    return nifs;
                n = CHILD(n, 0);
                REQ(n, SYM.gen_if);
                nifs++;
                if (NCH(n) === 2)
                    return nifs;
                n = CHILD(n, 2);
            }
        }
        var elt = astForExpr(c, CHILD(n, 0));
        var nfors = countGenFors(c, n);
        var genexps = [];
        var ch = CHILD(n, 1);
        for (var i = 0; i < nfors; ++i) {
            REQ(ch, SYM.gen_for);
            var forch = CHILD(ch, 1);
            var t = astForExprlist(c, forch, Store);
            var expression = astForExpr(c, CHILD(ch, 3));
            var ge = void 0;
            if (NCH(forch) === 1)
                ge = new Comprehension(t[0], expression, []);
            else
                ge = new Comprehension(new Tuple(t, Store, ch.range), expression, []);
            if (NCH(ch) === 5) {
                ch = CHILD(ch, 4);
                var nifs = countGenIfs(c, ch);
                var ifs = [];
                for (var j = 0; j < nifs; ++j) {
                    REQ(ch, SYM.gen_iter);
                    ch = CHILD(ch, 0);
                    REQ(ch, SYM.gen_if);
                    expression = astForExpr(c, CHILD(ch, 1));
                    ifs[j] = expression;
                    if (NCH(ch) === 3)
                        ch = CHILD(ch, 2);
                }
                if (ch.type === SYM.gen_iter)
                    ch = CHILD(ch, 0);
                ge.ifs = ifs;
            }
            genexps[i] = ge;
        }
        return new GeneratorExp(elt, genexps, n.range);
    }
    function astForWhileStmt(c, n) {
        /* while_stmt: 'while' test ':' suite ['else' ':' suite] */
        REQ(n, SYM.while_stmt);
        if (NCH(n) === 4)
            return new WhileStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.range);
        else if (NCH(n) === 7)
            return new WhileStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.range);
        throw new Error("wrong number of tokens for 'while' stmt");
    }
    function astForAugassign(c, n) {
        REQ(n, SYM.augassign);
        n = CHILD(n, 0);
        switch (n.value.charAt(0)) {
            case '+': return Add;
            case '-': return Sub;
            case '/': {
                if (n.value.charAt(1) === '/') {
                    return FloorDiv;
                }
                else {
                    return Div;
                }
            }
            case '%': return Mod;
            case '<': return LShift;
            case '>': return RShift;
            case '&': return BitAnd;
            case '^': return BitXor;
            case '|': return BitOr;
            case '*': {
                if (n.value.charAt(1) === '*') {
                    return Pow;
                }
                else {
                    return Mult;
                }
            }
            default: {
                throw new Error("invalid augassign");
            }
        }
    }
    function astForBinop(c, n) {
        /* Must account for a sequence of expressions.
            How should A op B op C by represented?
            BinOp(BinOp(A, op, B), op, C).
        */
        var result = new BinOp(astForExpr(c, CHILD(n, 0)), getOperator(CHILD(n, 1)), astForExpr(c, CHILD(n, 2)), n.range);
        var nops = (NCH(n) - 1) / 2;
        for (var i = 1; i < nops; ++i) {
            var nextOper = CHILD(n, i * 2 + 1);
            var tmp = astForExpr(c, CHILD(n, i * 2 + 2));
            result = new BinOp(result, getOperator(nextOper), tmp, nextOper.range);
        }
        return result;
    }
    function astForTestlist(c, n) {
        /* testlist_gexp: test (',' test)* [','] */
        /* testlist: test (',' test)* [','] */
        /* testlist_safe: test (',' test)+ [','] */
        /* testlist1: test (',' test)* */
        assert$1(NCH(n) > 0);
        if (n.type === SYM.testlist_gexp) {
            if (NCH(n) > 1) {
                assert$1(CHILD(n, 1).type !== SYM.gen_for);
            }
        }
        else {
            assert$1(n.type === SYM.testlist || n.type === SYM.testlist_safe || n.type === SYM.testlist1);
        }
        if (NCH(n) === 1) {
            return astForExpr(c, CHILD(n, 0));
        }
        else {
            return new Tuple(seqForTestlist(c, n), Load, n.range);
        }
    }
    function astForExprStmt(c, node) {
        // Prevent assignment.
        var n = node;
        REQ(n, SYM.ExprStmt);
        if (NCH(n) === 1) {
            return new ExpressionStatement(astForTestlist(c, CHILD(n, 0)), n.range);
        }
        else if (CHILD(n, 1).type === SYM.augassign) {
            var ch = CHILD(n, 0);
            var expr1 = astForTestlist(c, ch);
            switch (expr1.constructor) {
                case GeneratorExp: throw syntaxError("augmented assignment to generator expression not possible", n.range);
                case Yield: throw syntaxError("augmented assignment to yield expression not possible", n.range);
                case Name: {
                    var varName = expr1.id;
                    forbiddenCheck(c, ch, varName.value, n.range);
                    break;
                }
                case Attribute:
                case Subscript:
                    break;
                default:
                    throw syntaxError("illegal expression for augmented assignment", n.range);
            }
            setContext(c, expr1, Store, ch);
            ch = CHILD(n, 2);
            var expr2 = void 0;
            if (ch.type === SYM.testlist) {
                expr2 = astForTestlist(c, ch);
            }
            else
                expr2 = astForExpr(c, ch);
            return new AugAssign(expr1, astForAugassign(c, CHILD(n, 1)), expr2, n.range);
        }
        else if (CHILD(n, 1).type === SYM.annasign) {
            // annasign
            // ':' 'IfExpr' ['=' 'IfExpr]
            var ch = CHILD(n, 0);
            var annasignChild = CHILD(n, 1);
            var type = astForExpr(c, CHILD(annasignChild, 1));
            var eq = CHILD(annasignChild, 2); // Equals sign
            if (eq) {
                REQ(eq, Tokens.T_EQUAL);
                var variable = [astForTestlist(c, ch)]; // variable is the first node (before the annasign)
                var valueNode = CHILD(annasignChild, 3);
                var value = void 0;
                if (valueNode.type === SYM.testlist) {
                    value = astForTestlist(c, valueNode);
                }
                else {
                    value = astForExpr(c, valueNode);
                }
                return new Assign(variable, value, n.range, eq.range, type);
            }
            else {
                return new AnnAssign(type, astForTestlist(c, ch), n.range);
            }
        }
        else {
            // normal assignment
            var eq = CHILD(n, 1);
            REQ(eq, Tokens.T_EQUAL);
            var targets = [];
            var N = NCH(n);
            for (var i = 0; i < N - 2; i += 2) {
                var ch = CHILD(n, i);
                if (ch.type === SYM.YieldExpr)
                    throw syntaxError("assignment to yield expression not possible", n.range);
                var e = astForTestlist(c, ch);
                setContext(c, e, Store, CHILD(n, i));
                targets[i / 2] = e;
            }
            var value = CHILD(n, N - 1);
            var expression = void 0;
            if (value.type === SYM.testlist)
                expression = astForTestlist(c, value);
            else
                expression = astForExpr(c, value);
            return new Assign(targets, expression, n.range, eq.range);
        }
    }
    function astForIfexpr(c, n) {
        assert$1(NCH(n) === 5);
        return new IfExp(astForExpr(c, CHILD(n, 2)), astForExpr(c, CHILD(n, 0)), astForExpr(c, CHILD(n, 4)), n.range);
    }
    // escape() was deprecated in JavaScript 1.5. Use encodeURI or encodeURIComponent instead.
    function escape(s) {
        return encodeURIComponent(s);
    }
    /**
     * s is a python-style string literal, including quote characters and u/r/b
     * prefixes. Returns decoded string object.
     */
    function parsestr(c, s) {
        // const encodeUtf8 = function(s) { return unescape(encodeURIComponent(s)); };
        var decodeUtf8 = function (s) { return decodeURIComponent(escape(s)); };
        var decodeEscape = function (s, quote) {
            var len = s.length;
            var ret = '';
            for (var i = 0; i < len; ++i) {
                var c_1 = s.charAt(i);
                if (c_1 === '\\') {
                    ++i;
                    c_1 = s.charAt(i);
                    if (c_1 === 'n')
                        ret += "\n";
                    else if (c_1 === '\\')
                        ret += "\\";
                    else if (c_1 === 't')
                        ret += "\t";
                    else if (c_1 === 'r')
                        ret += "\r";
                    else if (c_1 === 'b')
                        ret += "\b";
                    else if (c_1 === 'f')
                        ret += "\f";
                    else if (c_1 === 'v')
                        ret += "\v";
                    else if (c_1 === '0')
                        ret += "\0";
                    else if (c_1 === '"')
                        ret += '"';
                    else if (c_1 === '\'')
                        ret += '\'';
                    else if (c_1 === '\n') ;
                    else if (c_1 === 'x') {
                        var d0 = s.charAt(++i);
                        var d1 = s.charAt(++i);
                        ret += String.fromCharCode(parseInt(d0 + d1, 16));
                    }
                    else if (c_1 === 'u' || c_1 === 'U') {
                        var d0 = s.charAt(++i);
                        var d1 = s.charAt(++i);
                        var d2 = s.charAt(++i);
                        var d3 = s.charAt(++i);
                        ret += String.fromCharCode(parseInt(d0 + d1, 16), parseInt(d2 + d3, 16));
                    }
                    else {
                        // Leave it alone
                        ret += "\\" + c_1;
                    }
                }
                else {
                    ret += c_1;
                }
            }
            return ret;
        };
        var quote = s.charAt(0);
        var rawmode = false;
        if (quote === 'u' || quote === 'U') {
            s = s.substr(1);
            quote = s.charAt(0);
        }
        else if (quote === 'r' || quote === 'R') {
            s = s.substr(1);
            quote = s.charAt(0);
            rawmode = true;
        }
        assert$1(quote !== 'b' && quote !== 'B', "todo; haven't done b'' strings yet");
        assert$1(quote === "'" || quote === '"' && s.charAt(s.length - 1) === quote);
        s = s.substr(1, s.length - 2);
        if (s.length >= 4 && s.charAt(0) === quote && s.charAt(1) === quote) {
            assert$1(s.charAt(s.length - 1) === quote && s.charAt(s.length - 2) === quote);
            s = s.substr(2, s.length - 4);
        }
        if (rawmode || s.indexOf('\\') === -1) {
            return strobj(decodeUtf8(s));
        }
        return strobj(decodeEscape(s));
    }
    /**
     *
     */
    function parsestrplus(c, n) {
        REQ(CHILD(n, 0), Tokens.T_STRING);
        var ret = "";
        for (var i = 0; i < NCH(n); ++i) {
            var child = CHILD(n, i);
            try {
                ret = ret + parsestr(c, child.value);
            }
            catch (x) {
                throw syntaxError("invalid string (possibly contains a unicode character)", child.range);
            }
        }
        return ret;
    }
    function parsenumber(c, s, range) {
        var endChar = s.charAt(s.length - 1);
        if (endChar === 'j' || endChar === 'J') {
            throw syntaxError("complex numbers are currently unsupported", range);
        }
        if (s.indexOf('.') !== -1) {
            return floatAST(s);
        }
        // Handle integers of various bases
        var tmp = s;
        var value;
        var radix = 10;
        var neg = false;
        if (s.charAt(0) === '-') {
            tmp = s.substr(1);
            neg = true;
        }
        if (tmp.charAt(0) === '0' && (tmp.charAt(1) === 'x' || tmp.charAt(1) === 'X')) {
            // Hex
            tmp = tmp.substring(2);
            value = parseInt(tmp, 16);
            radix = 16;
        }
        else if ((s.indexOf('e') !== -1) || (s.indexOf('E') !== -1)) {
            // Float with exponent (needed to make sure e/E wasn't hex first)
            return floatAST(s);
        }
        else if (tmp.charAt(0) === '0' && (tmp.charAt(1) === 'b' || tmp.charAt(1) === 'B')) {
            // Binary
            tmp = tmp.substring(2);
            value = parseInt(tmp, 2);
            radix = 2;
        }
        else if (tmp.charAt(0) === '0') {
            if (tmp === "0") {
                // Zero
                value = 0;
            }
            else {
                // Octal (Leading zero, but not actually zero)
                if (endChar === 'l' || endChar === 'L') {
                    return longAST(s.substr(0, s.length - 1), 8);
                }
                else {
                    radix = 8;
                    tmp = tmp.substring(1);
                    if ((tmp.charAt(0) === 'o') || (tmp.charAt(0) === 'O')) {
                        tmp = tmp.substring(1);
                    }
                    value = parseInt(tmp, 8);
                }
            }
        }
        else {
            // Decimal
            if (endChar === 'l' || endChar === 'L') {
                return longAST(s.substr(0, s.length - 1), radix);
            }
            else {
                value = parseInt(tmp, radix);
            }
        }
        // Convert to long
        if (value > LONG_THRESHOLD && Math.floor(value) === value && (s.indexOf('e') === -1 && s.indexOf('E') === -1)) {
            // TODO: Does radix zero make sense?
            return longAST(s, 0);
        }
        if (endChar === 'l' || endChar === 'L') {
            return longAST(s.substr(0, s.length - 1), radix);
        }
        else {
            if (neg) {
                return intAST(-value);
            }
            else {
                return intAST(value);
            }
        }
    }
    function astForSlice(c, node) {
        var n = node;
        REQ(n, SYM.subscript);
        var ch = CHILD(n, 0);
        var lower = null;
        var upper = null;
        var step = null;
        if (ch.type === Tokens.T_DOT) {
            return new Ellipsis();
        }
        if (NCH(n) === 1 && ch.type === SYM.IfExpr) {
            return new Index(astForExpr(c, ch));
        }
        if (ch.type === SYM.IfExpr) {
            lower = astForExpr(c, ch);
        }
        if (ch.type === Tokens.T_COLON) {
            if (NCH(n) > 1) {
                var n2 = CHILD(n, 1);
                if (n2.type === SYM.IfExpr)
                    upper = astForExpr(c, n2);
            }
        }
        else if (NCH(n) > 2) {
            var n2 = CHILD(n, 2);
            if (n2.type === SYM.IfExpr) {
                upper = astForExpr(c, n2);
            }
        }
        ch = CHILD(n, NCH(n) - 1);
        if (ch.type === SYM.sliceop) {
            if (NCH(ch) === 1) {
                ch = CHILD(ch, 0);
                step = new Name(new RangeAnnotated("None", null), Load);
            }
            else {
                ch = CHILD(ch, 1);
                if (ch.type === SYM.IfExpr)
                    step = astForExpr(c, ch);
            }
        }
        return new Slice(lower, upper, step);
    }
    function astForAtomExpr(c, n) {
        var c0 = CHILD(n, 0);
        switch (c0.type) {
            case Tokens.T_NAME:
                // All names start in Load context, but may be changed later
                return new Name(new RangeAnnotated(c0.value, c0.range), Load);
            case Tokens.T_STRING: {
                // FIXME: Owing to the way that Python allows string concatenation, this is imprecise.
                return new Str(new RangeAnnotated(parsestrplus(c, n), n.range));
            }
            case Tokens.T_NUMBER: {
                return new Num(new RangeAnnotated(parsenumber(c, c0.value, c0.range), n.range));
            }
            case Tokens.T_LPAR: {
                var c1 = CHILD(n, 1);
                if (c1.type === Tokens.T_RPAR) {
                    return new Tuple([], Load, n.range);
                }
                if (c1.type === SYM.YieldExpr) {
                    return astForExpr(c, c1);
                }
                if (NCH(c1) > 1 && CHILD(c1, 1).type === SYM.gen_for) {
                    return astForGenexp(c, c1);
                }
                return astForTestlistGexp(c, c1);
            }
            case Tokens.T_LSQB: {
                var c1 = CHILD(n, 1);
                if (c1.type === Tokens.T_RSQB)
                    return new List([], Load, n.range);
                REQ(c1, SYM.listmaker);
                if (NCH(c1) === 1 || CHILD(c1, 1).type === Tokens.T_COMMA)
                    return new List(seqForTestlist(c, c1), Load, n.range);
                else
                    return astForListcomp(c, c1);
            }
            case Tokens.T_LBRACE: {
                /* dictmaker: test ':' test (',' test ':' test)* [','] */
                var c1 = CHILD(n, 1);
                var N = NCH(c1);
                // var size = Math.floor((NCH(ch) + 1) / 4); // + 1 for no trailing comma case
                var keys = [];
                var values = [];
                for (var i = 0; i < N; i += 4) {
                    keys[i / 4] = astForExpr(c, CHILD(c1, i));
                    values[i / 4] = astForExpr(c, CHILD(c1, i + 2));
                }
                return new Dict(keys, values, n.range);
            }
            case Tokens.T_BACKQUOTE: {
                throw syntaxError("backquote not supported, use repr()", n.range);
            }
            default: {
                throw new Error("unhandled atom '" + grammarName(c0.type) + "'");
            }
        }
    }
    function astForPowerExpr(c, node) {
        var n = node;
        REQ(n, SYM.PowerExpr);
        var N = NCH(n);
        var NminusOne = N - 1;
        var e = astForAtomExpr(c, CHILD(n, 0));
        if (N === 1)
            return e;
        for (var i = 1; i < N; ++i) {
            var ch = CHILD(n, i);
            if (ch.type !== SYM.trailer) {
                break;
            }
            e = astForTrailer(c, ch, e);
        }
        if (CHILD(n, NminusOne).type === SYM.UnaryExpr) {
            var f = astForExpr(c, CHILD(n, NminusOne));
            return new BinOp(e, { op: Pow, range: null }, f, n.range);
        }
        else {
            return e;
        }
    }
    function astForExpr(c, n) {
        LOOP: while (true) {
            switch (n.type) {
                case SYM.IfExpr:
                case SYM.old_test:
                    if (CHILD(n, 0).type === SYM.LambdaExpr || CHILD(n, 0).type === SYM.old_LambdaExpr)
                        return astForLambdef(c, CHILD(n, 0));
                    else if (NCH(n) > 1)
                        return astForIfexpr(c, n);
                // fallthrough
                case SYM.OrExpr:
                case SYM.AndExpr:
                    if (NCH(n) === 1) {
                        n = CHILD(n, 0);
                        continue LOOP;
                    }
                    var seq = [];
                    for (var i = 0; i < NCH(n); i += 2) {
                        seq[i / 2] = astForExpr(c, CHILD(n, i));
                    }
                    if (CHILD(n, 1).value === "and") {
                        return new BoolOp(And, seq, n.range);
                    }
                    assert$1(CHILD(n, 1).value === "or");
                    return new BoolOp(Or, seq, n.range);
                case SYM.NotExpr:
                    if (NCH(n) === 1) {
                        n = CHILD(n, 0);
                        continue LOOP;
                    }
                    else {
                        return new UnaryOp(Not, astForExpr(c, CHILD(n, 1)), n.range);
                    }
                case SYM.ComparisonExpr:
                    if (NCH(n) === 1) {
                        n = CHILD(n, 0);
                        continue LOOP;
                    }
                    else {
                        var ops = [];
                        var cmps = [];
                        for (var i = 1; i < NCH(n); i += 2) {
                            ops[(i - 1) / 2] = astForCompOp(c, CHILD(n, i));
                            cmps[(i - 1) / 2] = astForExpr(c, CHILD(n, i + 1));
                        }
                        return new Compare(astForExpr(c, CHILD(n, 0)), ops, cmps, n.range);
                    }
                case SYM.ArithmeticExpr:
                case SYM.GeometricExpr:
                case SYM.ShiftExpr:
                case SYM.BitwiseOrExpr:
                case SYM.BitwiseXorExpr:
                case SYM.BitwiseAndExpr:
                    if (NCH(n) === 1) {
                        n = CHILD(n, 0);
                        continue LOOP;
                    }
                    return astForBinop(c, n);
                case SYM.YieldExpr:
                    var exp = null;
                    if (NCH(n) === 2) {
                        exp = astForTestlist(c, CHILD(n, 1));
                    }
                    return new Yield(exp, n.range);
                case SYM.UnaryExpr:
                    if (NCH(n) === 1) {
                        n = CHILD(n, 0);
                        continue LOOP;
                    }
                    return astForUnaryExpr(c, n);
                case SYM.PowerExpr:
                    return astForPowerExpr(c, n);
                default: {
                    throw new Error("unhandled expr" /*, "n.type: %d", n.type*/);
                }
            }
        }
    }
    function astForPrintStmt(c, n) {
        var start = 1;
        var dest = null;
        REQ(n, SYM.print_stmt);
        if (NCH(n) >= 2 && CHILD(n, 1).type === Tokens.T_RIGHTSHIFT) {
            dest = astForExpr(c, CHILD(n, 2));
            start = 4;
        }
        var seq = [];
        for (var i = start, j = 0; i < NCH(n); i += 2, ++j) {
            seq[j] = astForExpr(c, CHILD(n, i));
        }
        var nl = (CHILD(n, NCH(n) - 1)).type === Tokens.T_COMMA ? false : true;
        return new Print(dest, seq, nl, n.range);
    }
    function astForStmt(c, n) {
        if (n.type === SYM.stmt) {
            assert$1(NCH(n) === 1);
            n = CHILD(n, 0);
        }
        if (n.type === SYM.simple_stmt) {
            assert$1(numStmts(n) === 1);
            n = CHILD(n, 0);
        }
        if (n.type === SYM.small_stmt) {
            REQ(n, SYM.small_stmt);
            n = CHILD(n, 0);
            switch (n.type) {
                case SYM.ExprStmt: return astForExprStmt(c, n);
                case SYM.print_stmt: return astForPrintStmt(c, n);
                case SYM.del_stmt: return astForDelStmt(c, n);
                case SYM.pass_stmt: return new Pass(n.range);
                case SYM.flow_stmt: return astForFlowStmt(c, n);
                case SYM.import_stmt: return astForImportStmt(c, n);
                case SYM.GlobalStmt: return astForGlobalStmt(c, n);
                case SYM.NonLocalStmt: return astForNonLocalStmt(c, n);
                case SYM.exec_stmt: return astForExecStmt(c, n);
                case SYM.assert_stmt: return astForAssertStmt(c, n);
                default: {
                    throw new Error("unhandled small_stmt");
                }
            }
        }
        else {
            var ch = CHILD(n, 0);
            REQ(n, SYM.compound_stmt);
            switch (ch.type) {
                case SYM.if_stmt: return astForIfStmt(c, ch);
                case SYM.while_stmt: return astForWhileStmt(c, ch);
                case SYM.for_stmt: return astForForStmt(c, ch);
                case SYM.try_stmt: return astForTryStmt(c, ch);
                case SYM.with_stmt: return astForWithStmt(c, ch);
                case SYM.funcdef: return astForFuncdef(c, ch, []);
                case SYM.classdef: return astForClassdef(c, ch, []);
                case SYM.decorated: return astForDecorated(c, ch);
                default: {
                    throw new Error("unhandled compound_stmt");
                }
            }
        }
    }
    function astFromParse(n) {
        var c = new Compiling("utf-8");
        var stmts = [];
        var k = 0;
        for (var i = 0; i < NCH(n) - 1; ++i) {
            var ch = CHILD(n, i);
            if (n.type === Tokens.T_NEWLINE)
                continue;
            REQ(ch, SYM.stmt);
            var num = numStmts(ch);
            if (num === 1) {
                stmts[k++] = astForStmt(c, ch);
            }
            else {
                ch = CHILD(ch, 0);
                REQ(ch, SYM.simple_stmt);
                for (var j = 0; j < num; ++j) {
                    stmts[k++] = astForStmt(c, CHILD(ch, j * 2));
                }
            }
        }
        return stmts;
        /*
        switch (n.type) {
            case SYM.file_input:
            case SYM.eval_input: {
                throw new Error("todo;");
            }
            case SYM.single_input: {
                throw new Error("todo;");
            }
            default: {
                throw new Error("todo;");
            }
        }
        */
    }

    /* Flags for def-use information */
    var DEF_GLOBAL = 1 << 0; /* global stmt */
    var DEF_LOCAL = 2 << 0; /* assignment in code block */
    var DEF_PARAM = 2 << 1; /* formal parameter */
    var USE = 2 << 2; /* name is used */
    var DEF_FREE_CLASS = 2 << 8; /* free variable from class's method */
    var DEF_IMPORT = 2 << 9; /* assignment occurred via import */
    var DEF_BOUND = (DEF_LOCAL | DEF_PARAM | DEF_IMPORT);
    /* GLOBAL_EXPLICIT and GLOBAL_IMPLICIT are used internally by the symbol
       table.  GLOBAL is returned from PyST_GetScope() for either of them.
       It is stored in ste_symbols at bits 12-14.
    */
    var SCOPE_OFF = 11;
    var SCOPE_MASK = 7;
    var LOCAL = 1;
    var GLOBAL_EXPLICIT = 2;
    var GLOBAL_IMPLICIT = 3;
    var FREE = 4;
    var CELL = 5;
    var ModuleBlock = 'module';
    var FunctionBlock = 'function';
    var ClassBlock = 'class';

    function dictUpdate(a, b) {
        for (var kb in b) {
            if (b.hasOwnProperty(kb)) {
                a[kb] = b[kb];
            }
        }
    }

    /**
     * @param priv
     * @param name
     */
    function mangleName(priv, name) {
        var strpriv = null;
        if (priv === null || name === null || name.charAt(0) !== '_' || name.charAt(1) !== '_') {
            return name;
        }
        // don't mangle dunder (double underscore) names e.g. __id__.
        if (name.charAt(name.length - 1) === '_' && name.charAt(name.length - 2) === '_') {
            return name;
        }
        // don't mangle classes that are all _ (obscure much?)
        strpriv = priv;
        strpriv.replace(/_/g, '');
        if (strpriv === '') {
            return name;
        }
        strpriv = priv;
        strpriv.replace(/^_*/, '');
        strpriv = '_' + strpriv + name;
        return strpriv;
    }

    var Symbol = (function () {
        /**
         * @param name
         * @param flags
         * @param namespaces
         */
        function Symbol(name, flags, namespaces) {
            this.__name = name;
            this.__flags = flags;
            this.__scope = (flags >> SCOPE_OFF) & SCOPE_MASK;
            this.__namespaces = namespaces || [];
        }
        Symbol.prototype.get_name = function () { return this.__name; };
        Symbol.prototype.is_referenced = function () { return !!(this.__flags & USE); };
        Symbol.prototype.is_parameter = function () {
            return !!(this.__flags & DEF_PARAM);
        };
        Symbol.prototype.is_global = function () {
            return this.__scope === GLOBAL_IMPLICIT || this.__scope === GLOBAL_EXPLICIT;
        };
        Symbol.prototype.is_declared_global = function () {
            return this.__scope === GLOBAL_EXPLICIT;
        };
        Symbol.prototype.is_local = function () {
            return !!(this.__flags & DEF_BOUND);
        };
        Symbol.prototype.is_free = function () { return this.__scope === FREE; };
        Symbol.prototype.is_imported = function () { return !!(this.__flags & DEF_IMPORT); };
        Symbol.prototype.is_assigned = function () { return !!(this.__flags & DEF_LOCAL); };
        Symbol.prototype.is_namespace = function () { return this.__namespaces && this.__namespaces.length > 0; };
        Symbol.prototype.get_namespaces = function () { return this.__namespaces; };
        return Symbol;
    }());

    var astScopeCounter = 0;
    /**
     * A SymbolTableScope is created for nodes in the AST.
     * It is created only when the SymbolTable enters a block.
     */
    var SymbolTableScope = (function () {
        /**
         * @param table
         * @param name The name of the node defining the scope.
         * @param blockType
         * @param astNode
         * @param range
         */
        function SymbolTableScope(table, name, blockType, astNode, range) {
            /**
             * A mapping from the name of a symbol to its flags.
             */
            this.symFlags = {};
            /**
             * A list of (local) variables that exists in the current scope.
             * This is populated by the addDef method in SymbolTable.
             * e.g. Name, FunctionDef, ClassDef, Global?, Lambda, Alias.
             * Note that global variables are maintained in the SymbolTable to which we have access.
             */
            this.varnames = [];
            this.children = [];
            this.table = table;
            this.name = name;
            this.blockType = blockType;
            astNode.scopeId = astScopeCounter++;
            table.stss[astNode.scopeId] = this;
            this.range = range;
            if (table.cur && (table.cur.isNested || table.cur.blockType === FunctionBlock)) {
                this.isNested = true;
            }
            else {
                this.isNested = false;
            }
            this.hasFree = false;
            this.childHasFree = false; // true if child block has free vars including free refs to globals
            this.generator = false;
            this.varargs = false;
            this.varkeywords = false;
            this.returnsValue = false;
            // cache of Symbols for returning to other parts of code
            this.symbols = {};
        }
        SymbolTableScope.prototype.get_type = function () { return this.blockType; };
        SymbolTableScope.prototype.get_name = function () { return this.name; };
        SymbolTableScope.prototype.get_range = function () { return this.range; };
        SymbolTableScope.prototype.is_nested = function () { return this.isNested; };
        SymbolTableScope.prototype.has_children = function () { return this.children.length > 0; };
        SymbolTableScope.prototype.get_identifiers = function () { return this._identsMatching(function (x) { return true; }); };
        SymbolTableScope.prototype.lookup = function (name) {
            var sym;
            if (!this.symbols.hasOwnProperty(name)) {
                var flags = this.symFlags[name];
                var namespaces = this.__check_children(name);
                sym = this.symbols[name] = new Symbol(name, flags, namespaces);
            }
            else {
                sym = this.symbols[name];
            }
            return sym;
        };
        SymbolTableScope.prototype.__check_children = function (name) {
            // print("  check_children:", name);
            var ret = [];
            for (var i = 0; i < this.children.length; ++i) {
                var child = this.children[i];
                if (child.name === name)
                    ret.push(child);
            }
            return ret;
        };
        /**
         * Looks in the bindings for this scope and returns the names of the nodes that match the mask filter.
         */
        SymbolTableScope.prototype._identsMatching = function (filter) {
            var ret = [];
            for (var k in this.symFlags) {
                if (this.symFlags.hasOwnProperty(k)) {
                    if (filter(this.symFlags[k]))
                        ret.push(k);
                }
            }
            ret.sort();
            return ret;
        };
        /**
         * Returns the names of parameters (DEF_PARAM) for function scopes.
         */
        SymbolTableScope.prototype.get_parameters = function () {
            assert$1(this.get_type() === 'function', "get_parameters only valid for function scopes");
            if (!this._funcParams) {
                this._funcParams = this._identsMatching(function (x) { return !!(x & DEF_PARAM); });
            }
            return this._funcParams;
        };
        /**
         * Returns the names of local variables (DEF_BOUND) for function scopes.
         */
        SymbolTableScope.prototype.get_locals = function () {
            assert$1(this.get_type() === 'function', "get_locals only valid for function scopes");
            if (!this._funcLocals) {
                this._funcLocals = this._identsMatching(function (x) { return !!(x & DEF_BOUND); });
            }
            return this._funcLocals;
        };
        /**
         * Returns the names of global variables for function scopes.
         */
        SymbolTableScope.prototype.get_globals = function () {
            assert$1(this.get_type() === 'function', "get_globals only valid for function scopes");
            if (!this._funcGlobals) {
                this._funcGlobals = this._identsMatching(function (x) {
                    var masked = (x >> SCOPE_OFF) & SCOPE_MASK;
                    return masked === GLOBAL_IMPLICIT || masked === GLOBAL_EXPLICIT;
                });
            }
            return this._funcGlobals;
        };
        /**
         * Returns the names of free variables for function scopes.
         */
        SymbolTableScope.prototype.get_frees = function () {
            assert$1(this.get_type() === 'function', "get_frees only valid for function scopes");
            if (!this._funcFrees) {
                this._funcFrees = this._identsMatching(function (x) {
                    var masked = (x >> SCOPE_OFF) & SCOPE_MASK;
                    return masked === FREE;
                });
            }
            return this._funcFrees;
        };
        /**
         * Returns the names of methods for class scopes.
         */
        SymbolTableScope.prototype.get_methods = function () {
            assert$1(this.get_type() === 'class', "get_methods only valid for class scopes");
            if (!this._classMethods) {
                // todo; uniq?
                var all = [];
                for (var i = 0; i < this.children.length; ++i)
                    all.push(this.children[i].name);
                all.sort();
                this._classMethods = all;
            }
            return this._classMethods;
        };
        /**
         * I think this returns the scopeId of a node with the specified name.
         */
        SymbolTableScope.prototype.getScope = function (name) {
            // print("getScope");
            // for (var k in this.symFlags) print(k);
            var v = this.symFlags[name];
            if (v === undefined)
                return 0;
            return (v >> SCOPE_OFF) & SCOPE_MASK;
        };
        return SymbolTableScope;
    }());

    /**
     * The symbol table uses the abstract synntax tree (not the parse tree).
     */
    var SymbolTable = (function () {
        /**
         *
         */
        function SymbolTable() {
            this.cur = null;
            this.top = null;
            this.stack = [];
            this.global = null; // points at top level module symFlags
            this.curClass = null; // current class or null
            this.tmpname = 0;
            // mapping from ast nodes to their scope if they have one. we add an
            // id to the ast node when a scope is created for it, and store it in
            // here for the compiler to lookup later.
            this.stss = {};
        }
        /**
         * Lookup the SymbolTableScope for a scopeId of the AST.
         */
        SymbolTable.prototype.getStsForAst = function (ast) {
            assert$1(ast.scopeId !== undefined, "ast wasn't added to st?");
            var v = this.stss[ast.scopeId];
            assert$1(v !== undefined, "unknown sym tab entry");
            return v;
        };
        SymbolTable.prototype.SEQStmt = function (nodes) {
            var len = nodes.length;
            for (var i = 0; i < len; ++i) {
                var val = nodes[i];
                if (val)
                    this.visitStmt(val);
            }
        };
        SymbolTable.prototype.SEQExpr = function (nodes) {
            var len = nodes.length;
            for (var i = 0; i < len; ++i) {
                var val = nodes[i];
                if (val)
                    this.visitExpr(val);
            }
        };
        /**
         * A block represents a scope.
         * The following nodes in the AST define new blocks of the indicated type and name:
         * Module        ModuleBlock   = 'module'    name = 'top'
         * FunctionDef   FunctionBlock = 'function'  name = The name of the function.
         * ClassDef      ClassBlock    = 'class'     name = The name of the class.
         * Lambda        FunctionBlock = 'function'  name = 'lambda'
         * GeneratoeExp  FunctionBlock = 'function'  name = 'genexpr'
         *
         * @param name
         * @param blockType
         * @param astNode The AST node that is defining the block.
         * @param lineno
         */
        SymbolTable.prototype.enterBlock = function (name, blockType, astNode, range) {
            //  name = fixReservedNames(name);
            var prev = null;
            if (this.cur) {
                prev = this.cur;
                this.stack.push(this.cur);
            }
            this.cur = new SymbolTableScope(this, name, blockType, astNode, range);
            if (name === 'top') {
                this.global = this.cur.symFlags;
            }
            if (prev) {
                prev.children.push(this.cur);
            }
        };
        SymbolTable.prototype.exitBlock = function () {
            // print("exitBlock");
            this.cur = null;
            if (this.stack.length > 0)
                this.cur = this.stack.pop();
        };
        SymbolTable.prototype.visitParams = function (args, toplevel) {
            for (var i = 0; i < args.length; ++i) {
                var arg = args[i];
                if (arg.name.constructor === Name) {
                    assert$1(arg.name.ctx === Param || (arg.name.ctx === Store && !toplevel));
                    this.addDef(arg.name.id.value, DEF_PARAM, arg.name.id.range);
                }
                else {
                    // Tuple isn't supported
                    throw syntaxError$1("invalid expression in parameter list");
                }
            }
        };
        SymbolTable.prototype.visitArguments = function (a, range) {
            if (a.args)
                this.visitParams(a.args, true);
            if (a.vararg) {
                this.addDef(a.vararg, DEF_PARAM, range);
                this.cur.varargs = true;
            }
            if (a.kwarg) {
                this.addDef(a.kwarg, DEF_PARAM, range);
                this.cur.varkeywords = true;
            }
        };
        /**
         *
         */
        SymbolTable.prototype.newTmpname = function (range) {
            this.addDef("_[" + (++this.tmpname) + "]", DEF_LOCAL, range);
        };
        /**
         * 1. Modifies symbol flags for the current scope.
         * 2.a Adds a variable name for the current scope, OR
         * 2.b Sets the SymbolFlags for a global variable.
         * @param name
         * @param flags
         * @param lineno
         */
        SymbolTable.prototype.addDef = function (name, flags, range) {
            var mangled = mangleName(this.curClass, name);
            //  mangled = fixReservedNames(mangled);
            // Modify symbol flags for the current scope.
            var val = this.cur.symFlags[mangled];
            if (val !== undefined) {
                if ((flags & DEF_PARAM) && (val & DEF_PARAM)) {
                    throw syntaxError$1("duplicate argument '" + name + "' in function definition", range);
                }
                val |= flags;
            }
            else {
                val = flags;
            }
            this.cur.symFlags[mangled] = val;
            if (flags & DEF_PARAM) {
                this.cur.varnames.push(mangled);
            }
            else if (flags & DEF_GLOBAL) {
                val = flags;
                var fromGlobal = this.global[mangled];
                if (fromGlobal !== undefined)
                    val |= fromGlobal;
                this.global[mangled] = val;
            }
        };
        SymbolTable.prototype.visitSlice = function (s) {
            if (s instanceof Slice) {
                if (s.lower)
                    this.visitExpr(s.lower);
                if (s.upper)
                    this.visitExpr(s.upper);
                if (s.step)
                    this.visitExpr(s.step);
            }
            else if (s instanceof ExtSlice) {
                for (var i = 0; i < s.dims.length; ++i) {
                    this.visitSlice(s.dims[i]);
                }
            }
            else if (s instanceof Index) {
                this.visitExpr(s.value);
            }
            else ;
        };
        /**
         *
         */
        SymbolTable.prototype.visitStmt = function (s) {
            assert$1(s !== undefined, "visitStmt called with undefined");
            if (s instanceof FunctionDef) {
                this.addDef(s.name.value, DEF_LOCAL, s.range);
                if (s.args.defaults)
                    this.SEQExpr(s.args.defaults);
                if (s.decorator_list)
                    this.SEQExpr(s.decorator_list);
                this.enterBlock(s.name.value, FunctionBlock, s, s.range);
                this.visitArguments(s.args, s.range);
                this.SEQStmt(s.body);
                this.exitBlock();
            }
            else if (s instanceof ClassDef) {
                this.addDef(s.name.value, DEF_LOCAL, s.range);
                this.SEQExpr(s.bases);
                if (s.decorator_list)
                    this.SEQExpr(s.decorator_list);
                this.enterBlock(s.name.value, ClassBlock, s, s.range);
                var tmp = this.curClass;
                this.curClass = s.name.value;
                this.SEQStmt(s.body);
                this.curClass = tmp;
                this.exitBlock();
            }
            else if (s instanceof ReturnStatement) {
                if (s.value) {
                    this.visitExpr(s.value);
                    this.cur.returnsValue = true;
                    if (this.cur.generator) {
                        throw syntaxError$1("'return' with argument inside generator");
                    }
                }
            }
            else if (s instanceof DeleteStatement) {
                this.SEQExpr(s.targets);
            }
            else if (s instanceof Assign) {
                this.SEQExpr(s.targets);
                this.visitExpr(s.value);
            }
            else if (s instanceof AugAssign) {
                this.visitExpr(s.target);
                this.visitExpr(s.value);
            }
            else if (s instanceof AnnAssign) {
                this.visitExpr(s.target);
                this.visitExpr(s.value);
            }
            else if (s instanceof Print) {
                if (s.dest)
                    this.visitExpr(s.dest);
                this.SEQExpr(s.values);
            }
            else if (s instanceof ForStatement) {
                this.visitExpr(s.target);
                this.visitExpr(s.iter);
                this.SEQStmt(s.body);
                if (s.orelse)
                    this.SEQStmt(s.orelse);
            }
            else if (s instanceof WhileStatement) {
                this.visitExpr(s.test);
                this.SEQStmt(s.body);
                if (s.orelse)
                    this.SEQStmt(s.orelse);
            }
            else if (s instanceof IfStatement) {
                this.visitExpr(s.test);
                this.SEQStmt(s.consequent);
                if (s.alternate) {
                    this.SEQStmt(s.alternate);
                }
            }
            else if (s instanceof Raise) {
                if (s.type) {
                    this.visitExpr(s.type);
                    if (s.inst) {
                        this.visitExpr(s.inst);
                        if (s.tback)
                            this.visitExpr(s.tback);
                    }
                }
            }
            else if (s instanceof TryExcept) {
                this.SEQStmt(s.body);
                this.SEQStmt(s.orelse);
                this.visitExcepthandlers(s.handlers);
            }
            else if (s instanceof TryFinally) {
                this.SEQStmt(s.body);
                this.SEQStmt(s.finalbody);
            }
            else if (s instanceof Assert) {
                this.visitExpr(s.test);
                if (s.msg)
                    this.visitExpr(s.msg);
            }
            else if (s instanceof ImportStatement) {
                var imps = s;
                this.visitAlias(imps.names, imps.range);
            }
            else if (s instanceof ImportFrom) {
                var impFrom = s;
                this.visitAlias(impFrom.names, impFrom.range);
            }
            else if (s instanceof Exec) {
                this.visitExpr(s.body);
                if (s.globals) {
                    this.visitExpr(s.globals);
                    if (s.locals)
                        this.visitExpr(s.locals);
                }
            }
            else if (s instanceof Global) {
                var nameslen = s.names.length;
                for (var i = 0; i < nameslen; ++i) {
                    var name_1 = mangleName(this.curClass, s.names[i]);
                    //              name = fixReservedNames(name);
                    var cur = this.cur.symFlags[name_1];
                    if (cur & (DEF_LOCAL | USE)) {
                        if (cur & DEF_LOCAL) {
                            throw syntaxError$1("name '" + name_1 + "' is assigned to before global declaration", s.range);
                        }
                        else {
                            throw syntaxError$1("name '" + name_1 + "' is used prior to global declaration", s.range);
                        }
                    }
                    this.addDef(name_1, DEF_GLOBAL, s.range);
                }
            }
            else if (s instanceof ExpressionStatement) {
                this.visitExpr(s.value);
            }
            else if (s instanceof Pass || s instanceof BreakStatement || s instanceof ContinueStatement) ;
            else if (s instanceof WithStatement) {
                var ws = s;
                this.newTmpname(ws.range);
                this.visitExpr(ws.context_expr);
                if (ws.optional_vars) {
                    this.newTmpname(ws.range);
                    this.visitExpr(ws.optional_vars);
                }
                this.SEQStmt(ws.body);
            }
            else {
                fail("Unhandled type " + s.constructor.name + " in visitStmt");
            }
        };
        SymbolTable.prototype.visitExpr = function (e) {
            assert$1(e !== undefined, "visitExpr called with undefined");
            if (e instanceof BoolOp) {
                this.SEQExpr(e.values);
            }
            else if (e instanceof BinOp) {
                this.visitExpr(e.lhs);
                this.visitExpr(e.rhs);
            }
            else if (e instanceof UnaryOp) {
                this.visitExpr(e.operand);
            }
            else if (e instanceof Lambda) {
                this.addDef("lambda", DEF_LOCAL, e.range);
                if (e.args.defaults)
                    this.SEQExpr(e.args.defaults);
                this.enterBlock("lambda", FunctionBlock, e, e.range);
                this.visitArguments(e.args, e.range);
                this.visitExpr(e.body);
                this.exitBlock();
            }
            else if (e instanceof IfExp) {
                this.visitExpr(e.test);
                this.visitExpr(e.body);
                this.visitExpr(e.orelse);
            }
            else if (e instanceof Dict) {
                this.SEQExpr(e.keys);
                this.SEQExpr(e.values);
            }
            else if (e instanceof ListComp) {
                this.newTmpname(e.range);
                this.visitExpr(e.elt);
                this.visitComprehension(e.generators, 0);
            }
            else if (e instanceof GeneratorExp) {
                this.visitGenexp(e);
            }
            else if (e instanceof Yield) {
                if (e.value)
                    this.visitExpr(e.value);
                this.cur.generator = true;
                if (this.cur.returnsValue) {
                    throw syntaxError$1("'return' with argument inside generator");
                }
            }
            else if (e instanceof Compare) {
                this.visitExpr(e.left);
                this.SEQExpr(e.comparators);
            }
            else if (e instanceof Call) {
                this.visitExpr(e.func);
                this.SEQExpr(e.args);
                for (var i = 0; i < e.keywords.length; ++i)
                    this.visitExpr(e.keywords[i].value);
                // print(JSON.stringify(e.starargs, null, 2));
                // print(JSON.stringify(e.kwargs, null,2));
                if (e.starargs)
                    this.visitExpr(e.starargs);
                if (e.kwargs)
                    this.visitExpr(e.kwargs);
            }
            else if (e instanceof Num || e instanceof Str) ;
            else if (e instanceof Attribute) {
                this.visitExpr(e.value);
            }
            else if (e instanceof Subscript) {
                this.visitExpr(e.value);
                this.visitSlice(e.slice);
            }
            else if (e instanceof Name) {
                this.addDef(e.id.value, e.ctx === Load ? USE : DEF_LOCAL, e.id.range);
            }
            else if (e instanceof List || e instanceof Tuple) {
                this.SEQExpr(e.elts);
            }
            else {
                fail("Unhandled type " + e.constructor.name + " in visitExpr");
            }
        };
        SymbolTable.prototype.visitComprehension = function (lcs, startAt) {
            var len = lcs.length;
            for (var i = startAt; i < len; ++i) {
                var lc = lcs[i];
                this.visitExpr(lc.target);
                this.visitExpr(lc.iter);
                this.SEQExpr(lc.ifs);
            }
        };
        /**
         * This is probably not correct for names. What are they?
         * @param names
         * @param range
         */
        SymbolTable.prototype.visitAlias = function (names, range) {
            /* Compute store_name, the name actually bound by the import
                operation.  It is diferent than a->name when a->name is a
                dotted package name (e.g. spam.eggs)
            */
            for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
                var a = names_1[_i];
                var name_2 = a.asname === null ? a.name.value : a.asname;
                var storename = name_2;
                var dot = name_2.indexOf('.');
                if (dot !== -1)
                    storename = name_2.substr(0, dot);
                if (name_2 !== "*") {
                    this.addDef(storename, DEF_IMPORT, range);
                }
                else {
                    if (this.cur.blockType !== ModuleBlock) {
                        throw syntaxError$1("import * only allowed at module level");
                    }
                }
            }
        };
        /**
         *
         */
        SymbolTable.prototype.visitGenexp = function (e) {
            var outermost = e.generators[0];
            // outermost is evaled in current scope
            this.visitExpr(outermost.iter);
            this.enterBlock("genexpr", FunctionBlock, e, e.range);
            this.cur.generator = true;
            this.addDef(".0", DEF_PARAM, e.range);
            this.visitExpr(outermost.target);
            this.SEQExpr(outermost.ifs);
            this.visitComprehension(e.generators, 1);
            this.visitExpr(e.elt);
            this.exitBlock();
        };
        SymbolTable.prototype.visitExcepthandlers = function (handlers) {
            for (var i = 0, eh = void 0; eh = handlers[i]; ++i) {
                if (eh.type)
                    this.visitExpr(eh.type);
                if (eh.name)
                    this.visitExpr(eh.name);
                this.SEQStmt(eh.body);
            }
        };
        /**
         * @param ste The Symbol Table Scope.
         */
        SymbolTable.prototype.analyzeBlock = function (ste, bound, free, global) {
            var local = {};
            var scope = {};
            var newglobal = {};
            var newbound = {};
            var newfree = {};
            if (ste.blockType === ClassBlock) {
                dictUpdate(newglobal, global);
                if (bound)
                    dictUpdate(newbound, bound);
            }
            for (var name_3 in ste.symFlags) {
                if (ste.symFlags.hasOwnProperty(name_3)) {
                    var flags = ste.symFlags[name_3];
                    this.analyzeName(ste, scope, name_3, flags, bound, local, free, global);
                }
            }
            if (ste.blockType !== ClassBlock) {
                if (ste.blockType === FunctionBlock)
                    dictUpdate(newbound, local);
                if (bound)
                    dictUpdate(newbound, bound);
                dictUpdate(newglobal, global);
            }
            var allfree = {};
            var childlen = ste.children.length;
            for (var i = 0; i < childlen; ++i) {
                var c = ste.children[i];
                this.analyzeChildBlock(c, newbound, newfree, newglobal, allfree);
                if (c.hasFree || c.childHasFree)
                    ste.childHasFree = true;
            }
            dictUpdate(newfree, allfree);
            if (ste.blockType === FunctionBlock)
                this.analyzeCells(scope, newfree);
            this.updateSymbols(ste.symFlags, scope, bound, newfree, ste.blockType === ClassBlock);
            dictUpdate(free, newfree);
        };
        SymbolTable.prototype.analyzeChildBlock = function (entry, bound, free, global, childFree) {
            var tempBound = {};
            dictUpdate(tempBound, bound);
            var tempFree = {};
            dictUpdate(tempFree, free);
            var tempGlobal = {};
            dictUpdate(tempGlobal, global);
            this.analyzeBlock(entry, tempBound, tempFree, tempGlobal);
            dictUpdate(childFree, tempFree);
        };
        SymbolTable.prototype.analyzeCells = function (scope, free) {
            for (var name_4 in scope) {
                if (scope.hasOwnProperty(name_4)) {
                    var flags = scope[name_4];
                    if (flags !== LOCAL)
                        continue;
                    if (free[name_4] === undefined)
                        continue;
                    scope[name_4] = CELL;
                    delete free[name_4];
                }
            }
        };
        /**
         * store scope info back into the st symbols dict. symbols is modified,
         * others are not.
         */
        SymbolTable.prototype.updateSymbols = function (symbols, scope, bound, free, classflag) {
            for (var name_5 in symbols) {
                if (symbols.hasOwnProperty(name_5)) {
                    var flags = symbols[name_5];
                    var w = scope[name_5];
                    flags |= w << SCOPE_OFF;
                    symbols[name_5] = flags;
                }
            }
            var freeValue = FREE << SCOPE_OFF;
            for (var name_6 in free) {
                if (free.hasOwnProperty(name_6)) {
                    var o = symbols[name_6];
                    if (o !== undefined) {
                        // it could be a free variable in a method of the class that has
                        // the same name as a local or global in the class scope
                        if (classflag && (o & (DEF_BOUND | DEF_GLOBAL))) {
                            var i = o | DEF_FREE_CLASS;
                            symbols[name_6] = i;
                        }
                        // else it's not free, probably a cell
                        continue;
                    }
                    if (bound[name_6] === undefined)
                        continue;
                    symbols[name_6] = freeValue;
                }
            }
        };
        /**
         * @param {Object} ste The Symbol Table Scope.
         * @param {string} name
         */
        SymbolTable.prototype.analyzeName = function (ste, dict, name, flags, bound, local, free, global) {
            if (flags & DEF_GLOBAL) {
                if (flags & DEF_PARAM)
                    throw syntaxError$1("name '" + name + "' is local and global", ste.range);
                dict[name] = GLOBAL_EXPLICIT;
                global[name] = null;
                if (bound && bound[name] !== undefined)
                    delete bound[name];
                return;
            }
            if (flags & DEF_BOUND) {
                dict[name] = LOCAL;
                local[name] = null;
                delete global[name];
                return;
            }
            if (bound && bound[name] !== undefined) {
                dict[name] = FREE;
                ste.hasFree = true;
                free[name] = null;
            }
            else if (global && global[name] !== undefined) {
                dict[name] = GLOBAL_IMPLICIT;
            }
            else {
                if (ste.isNested)
                    ste.hasFree = true;
                dict[name] = GLOBAL_IMPLICIT;
            }
        };
        SymbolTable.prototype.analyze = function () {
            var free = {};
            var global = {};
            this.analyzeBlock(this.top, null, free, global);
        };
        return SymbolTable;
    }());

    // import { Symbol } from './Symbol';
    /**
     * Creates a SymbolTable for the specified Module.
     */
    function semanticsOfModule(mod) {
        var st = new SymbolTable();
        st.enterBlock("top", ModuleBlock, mod, null);
        st.top = st.cur;
        // This is a good place to dump the AST for debugging.
        for (var _i = 0, _a = mod.body; _i < _a.length; _i++) {
            var stmt = _a[_i];
            st.visitStmt(stmt);
        }
        st.exitBlock();
        st.analyze();
        return st;
    }

    /**
     * We're looking for something that is truthy, not just true.
     */
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    class SourceMap {
        constructor(sourceToTarget, targetToSource) {
            this.sourceToTarget = sourceToTarget;
            this.targetToSource = targetToSource;
            // Do nothing yet.
        }
        getTargetPosition(sourcePos) {
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
        getSourcePosition(targetPos) {
            const nodeL = this.targetToSource.glb(targetPos);
            if (nodeL) {
                return interpolate(targetPos.line, targetPos.column, nodeL.key, nodeL.value);
            }
            else {
                return null;
            }
        }
    }
    function interpolate(sourceLine, sourceColumn, sourceBegin, targetBegin) {
        const lineOffset = sourceLine - sourceBegin.line;
        const columnOffset = sourceColumn - sourceBegin.column;
        const targetLine = targetBegin.line + lineOffset;
        const targetColumn = targetBegin.column + columnOffset;
        return new Position$1(targetLine, targetColumn);
    }

    /**
     * FIXME: Argument should be declared as string but not allowed by TypeScript compiler.
     * May be a bug when comparing to 0x7f below.
     */
    function toStringLiteralJS(value) {
        // single is preferred
        let quote = "'";
        if (value.indexOf("'") !== -1 && value.indexOf('"') === -1) {
            quote = '"';
        }
        const len = value.length;
        let ret = quote;
        for (let i = 0; i < len; ++i) {
            const c = value.charAt(i);
            if (c === quote || c === '\\')
                ret += '\\' + c;
            else if (c === '\t')
                ret += '\\t';
            else if (c === '\n')
                ret += '\\n';
            else if (c === '\r')
                ret += '\\r';
            else if (c < ' ' || c >= 0x7f) {
                let ashex = c.charCodeAt(0).toString(16);
                if (ashex.length < 2)
                    ashex = "0" + ashex;
                ret += "\\x" + ashex;
            }
            else
                ret += c;
        }
        ret += quote;
        return ret;
    }

    /**
     * Determines whether the name or attribute should be considered to be a class.
     * This is a heuristic test based upon the JavaScript convention for class names.
     * In future we may be able to use type information.
     */
    function isClassNameByConvention(name) {
        const id = name.id;
        if (id instanceof RangeAnnotated && typeof id.value === 'string') {
            // console.lg(`name => ${JSON.stringify(name, null, 2)}`);
            const N = id.value.length;
            if (N > 0) {
                const firstChar = id.value[0];
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
    function isMethod(functionDef) {
        for (let i = 0; i < functionDef.args.args.length; i++) {
            if (i === 0) {
                const arg = functionDef.args.args[i];
                if (arg.name.id.value === 'self') {
                    return true;
                }
            }
            else {
                return false;
            }
        }
        return false;
    }

    /**
     * Provides enhanced scope information beyond the SymbolTableScope.
     */
    class PrinterUnit {
        /**
         * Stuff that changes on entry/exit of code blocks. must be saved and restored
         * when returning to a block.
         * Corresponds to the body of a module, class, or function.
         */
        constructor(name, ste) {
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
        activateScope() {
            // Do nothing yet.
        }
        deactivateScope() {
            // Do nothing yet.
        }
    }
    class Printer {
        /**
         *
         * @param st The symbol table obtained from semantic analysis.
         * @param flags Not being used yet. May become options.
         * @param sourceText The original source code, provided for annotating the generated code and source mapping.
         */
        constructor(st, flags, sourceText, beginLine, beginColumn, trace) {
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
            this.writer = new CodeWriter(beginLine, beginColumn, {}, trace);
        }
        /**
         * This is the entry point for this visitor.
         */
        transpileModule(module) {
            // Traversing the AST sends commands to the writer.
            this.enterScope("<module>", module, this.beginLine, this.beginColumn);
            this.module(module);
            this.exitScope();
            // Now return the captured events as a transpiled module.
            return this.writer.snapshot();
        }
        /**
         * Looks up the SymbolTableScope.
         * Pushes a new PrinterUnit onto the stack.
         * Returns a string identifying the scope.
         * @param name The name that will be assigned to the PrinterUnit.
         * @param key A scope object in the AST from sematic analysis. Provides the mapping to the SymbolTableScope.
         */
        enterScope(name, key, beginLine, beginColumn) {
            const u = new PrinterUnit(name, this.st.getStsForAst(key));
            u.beginLine = beginLine;
            u.beginColumn = beginColumn;
            if (this.u && this.u.private_) {
                u.private_ = this.u.private_;
            }
            this.stack.push(this.u);
            this.allUnits.push(u);
            const scopeName = this.gensym('scope');
            u.scopename = scopeName;
            this.u = u;
            this.u.activateScope();
            // this.nestlevel++;
            return scopeName;
        }
        exitScope() {
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
        }
        forStatement(fs) {
            const body = fs.body;
            const range = fs.iter;
            const target = fs.target;
            this.writer.write("for", null);
            this.writer.openParen();
            if (range instanceof Call) {
                this.writer.beginStatement();
                if (target instanceof Name) {
                    const flags = this.u.ste.symFlags[target.id.value];
                    if (flags && DEF_LOCAL) {
                        if (this.u.declared[target.id.value]) ;
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
                const secondArg = range.args[1];
                const thirdArg = range.args[2];
                if (range.args[3]) {
                    throw new Error("Too many arguments");
                }
                // range() accepts 1 or 2 parameters, if 1 then first param is always 0
                if (secondArg) {
                    const firstArg = range.args[0];
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
            else if (range instanceof Name) {
                // "for (" written so far
                const greedyIterator = range.id.value; // The list to iterate over
                this.writer.write("let ", null);
                if (target instanceof Name) {
                    const flags = this.u.ste.symFlags[target.id.value];
                    if (flags && DEF_LOCAL) {
                        if (this.u.declared[target.id.value]) ;
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
                this.writer.write(` ${greedyIterator}`, null);
            }
            else {
                // console.lg(range);
                throw new Error(`Invalid range... range is instance of ${range.constructor.name}, not 'Call' or 'Name'`);
            }
            this.writer.closeParen();
            this.writer.beginBlock();
            for (const stmt of body) {
                this.writer.beginStatement();
                stmt.accept(this);
                this.writer.endStatement();
            }
            this.writer.endBlock();
        }
        /**
         * Generates a unique symbol name for the provided namespace.
         */
        gensym(namespace) {
            let symbolName = namespace || '';
            symbolName = '$' + symbolName;
            symbolName += this.gensymCount++;
            return symbolName;
        }
        // Everything below here is an implementation of the Visitor
        annAssign(annassign) {
            this.writer.beginStatement();
            // TODO: Declaration.
            // TODO: How to deal with multiple target?
            /**
             * Decides whether to write let or not
             */
            const target = annassign.target;
            if (target instanceof Name) {
                const flags = this.u.ste.symFlags[target.id.value];
                if (flags && DEF_LOCAL) {
                    if (this.u.declared[target.id.value]) ;
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
        }
        assign(assign) {
            this.writer.beginStatement();
            // TODO: Declaration.
            // TODO: How to deal with multiple target?
            /**
             * Decides whether to write let or not
             */
            for (const target of assign.targets) {
                if (target instanceof Name) {
                    const flags = this.u.ste.symFlags[target.id.value];
                    if (flags && DEF_LOCAL) {
                        if (this.u.declared[target.id.value]) ;
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
        }
        attribute(attribute) {
            attribute.value.accept(this);
            this.writer.write(".", null);
            this.writer.str(attribute.attr.value, attribute.attr.range);
        }
        binOp(be) {
            be.lhs.accept(this);
            const op = be.op;
            const opRange = be.opRange;
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
                    throw new Error(`Unexpected binary operator ${op}: ${typeof op}`);
                }
            }
            be.rhs.accept(this);
        }
        callExpression(ce) {
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
                throw new Error(`Call.func must be a Name ${ce.func}`);
            }
            ce.func.accept(this);
            this.writer.openParen();
            for (let i = 0; i < ce.args.length; i++) {
                if (i > 0) {
                    this.writer.comma(null, null);
                }
                const arg = ce.args[i];
                arg.accept(this);
            }
            for (let i = 0; i < ce.keywords.length; ++i) {
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
        }
        classDef(cd) {
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
            for (const stmt of cd.body) {
                stmt.accept(this);
            }
            this.writer.endBlock();
        }
        compareExpression(ce) {
            ce.left.accept(this);
            for (const op of ce.ops) {
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
                        throw new Error(`Unexpected comparison expression operator: ${op}`);
                    }
                }
            }
            for (const comparator of ce.comparators) {
                comparator.accept(this);
            }
        }
        dict(dict) {
            const keys = dict.keys;
            const values = dict.values;
            const N = keys.length;
            this.writer.beginObject();
            for (let i = 0; i < N; i++) {
                if (i > 0) {
                    this.writer.comma(null, null);
                }
                keys[i].accept(this);
                this.writer.write(":", null);
                values[i].accept(this);
            }
            this.writer.endObject();
        }
        expressionStatement(s) {
            this.writer.beginStatement();
            s.value.accept(this);
            this.writer.endStatement();
        }
        functionDef(functionDef) {
            const isClassMethod = isMethod(functionDef);
            const sts = this.st.getStsForAst(functionDef);
            const parentScope = this.u.ste;
            for (const scope of parentScope.children) {
                if (sts === scope) {
                    this.writer.write("export ", null);
                }
            }
            if (!isClassMethod) {
                this.writer.write("function ", null);
            }
            this.writer.name(functionDef.name.value, functionDef.name.range);
            this.writer.openParen();
            for (let i = 0; i < functionDef.args.args.length; i++) {
                const arg = functionDef.args.args[i];
                const argType = arg.type;
                if (i === 0) {
                    if (arg.name.id.value === 'self') ;
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
            for (const stmt of functionDef.body) {
                stmt.accept(this);
            }
            this.writer.endBlock();
        }
        ifStatement(i) {
            this.writer.write("if", null);
            this.writer.openParen();
            i.test.accept(this);
            this.writer.closeParen();
            this.writer.beginBlock();
            for (const con of i.consequent) {
                con.accept(this);
            }
            this.writer.endBlock();
        }
        importFrom(importFrom) {
            this.writer.beginStatement();
            this.writer.write("import", null);
            this.writer.space();
            this.writer.beginBlock();
            for (let i = 0; i < importFrom.names.length; i++) {
                if (i > 0) {
                    this.writer.comma(null, null);
                }
                const alias = importFrom.names[i];
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
        }
        list(list) {
            const elements = list.elts;
            const N = elements.length;
            this.writer.write('[', null);
            for (let i = 0; i < N; i++) {
                if (i > 0) {
                    this.writer.comma(null, null);
                }
                elements[i].accept(this);
            }
            this.writer.write(']', null);
        }
        module(m) {
            for (const stmt of m.body) {
                stmt.accept(this);
            }
        }
        name(name) {
            // TODO: Since 'True' and 'False' are reserved words in Python,
            // syntactic analysis (parsing) should be sufficient to identify
            // this name as a boolean expression - avoiding this overhead.
            const value = name.id.value;
            const range = name.id.range;
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
        }
        num(num) {
            const value = num.n.value;
            const range = num.n.range;
            this.writer.num(value.toString(), range);
        }
        print(print) {
            this.writer.name("console", null);
            this.writer.write(".", null);
            this.writer.name("log", null);
            this.writer.openParen();
            for (const value of print.values) {
                value.accept(this);
            }
            this.writer.closeParen();
        }
        returnStatement(rs) {
            this.writer.beginStatement();
            this.writer.write("return", null);
            this.writer.write(" ", null);
            rs.value.accept(this);
            this.writer.endStatement();
        }
        str(str) {
            const s = str.s;
            // const begin = str.begin;
            // const end = str.end;
            this.writer.str(toStringLiteralJS(s.value), s.range);
        }
    }
    function transpileModule(sourceText, trace = false) {
        const cst = parse(sourceText, SourceKind.File);
        if (typeof cst === 'object') {
            const stmts = astFromParse(cst);
            const mod = new Module(stmts);
            const symbolTable = semanticsOfModule(mod);
            const printer = new Printer(symbolTable, 0, sourceText, 1, 0, trace);
            const textAndMappings = printer.transpileModule(mod);
            const code = textAndMappings.text;
            const sourceMap = mappingTreeToSourceMap(textAndMappings.tree, trace);
            return { code, sourceMap };
        }
        else {
            throw new Error(`Error parsing source for file.`);
        }
    }
    const NIL_VALUE = new Position$1(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    const HI_KEY = new Position$1(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    const LO_KEY = new Position$1(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
    function mappingTreeToSourceMap(mappingTree, trace) {
        const sourceToTarget = new RBTree(LO_KEY, HI_KEY, NIL_VALUE, positionComparator);
        const targetToSource = new RBTree(LO_KEY, HI_KEY, NIL_VALUE, positionComparator);
        if (mappingTree) {
            for (const mapping of mappingTree.mappings()) {
                const source = mapping.source;
                const target = mapping.target;
                // Convert to immutable values for targets.
                const tBegin = new Position$1(target.begin.line, target.begin.column);
                const tEnd = new Position$1(target.end.line, target.end.column);
                if (trace) {
                    console.log(`${source.begin} => ${tBegin}`);
                    console.log(`${source.end} => ${tEnd}`);
                }
                sourceToTarget.insert(source.begin, tBegin);
                sourceToTarget.insert(source.end, tEnd);
                targetToSource.insert(tBegin, source.begin);
                targetToSource.insert(tEnd, source.end);
            }
        }
        return new SourceMap(sourceToTarget, targetToSource);
    }

    exports.SourceMap = SourceMap;
    exports.transpileModule = transpileModule;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map
