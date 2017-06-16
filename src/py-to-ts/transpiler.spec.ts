import { transpileModule as compile } from './transpiler';
import { sourceLines } from '../data/eight';
import { SourceMap } from './SourceMap';
import { Position } from 'code-writer';
// import { parseTreeDump } from '../pytools/parser';
// import { dumpSymbolTable } from '../pytools/symtable';
// import { astDump } from '../pytools/builder';

function mapToTarget(sourceMap: SourceMap, sourceLine: number, sourceColumn: number): { line: number; column: number } | null {
    return sourceMap.getTargetPosition(new Position(sourceLine, sourceColumn));
}

function mapToSource(sourceMap: SourceMap, targetLine: number, targetColumn: number): { line: number; column: number } | null {
    return sourceMap.getSourcePosition(new Position(targetLine, targetColumn));
}

function column(position: { line: number, column: number }): number {
    if (position) {
        return position.column;
    }
    else {
        return null;
    }
}

describe('transpiler', function () {

    it('should be available', function () {
        expect(typeof compile).toBe('function');
    });

    describe('NumericLiteral', function () {
        it('Float', function () {
            const result = compile('0.01');
            // console.lg(JSON.stringify(result.sourceMap, null, 2));
            // console.lg(JSON.stringify(result.mod, null, 2));
            expect(result.code).toBe("0.01;");

            const sourceMap = result.sourceMap;
            expect(sourceMap).toBeDefined();

            expect(column(mapToTarget(sourceMap, 1, 0))).toBe(0);
            expect(column(mapToTarget(sourceMap, 1, 1))).toBe(1);
            expect(column(mapToTarget(sourceMap, 1, 2))).toBe(2);
            expect(column(mapToTarget(sourceMap, 1, 3))).toBe(3);
            expect(column(mapToTarget(sourceMap, 1, 4))).toBe(4);
            expect(column(mapToTarget(sourceMap, 1, 5))).toBeNull();
            expect(column(mapToTarget(sourceMap, 1, 6))).toBeNull();

            expect(column(mapToSource(sourceMap, 1, 0))).toBe(0);
        });
    });

    describe('STRING', function () {
        it('with double quotes', function () {
            const result = compile('"Hello"');
            expect(result.code).toBe("'Hello';");
        });
    });

    describe('BooleanLiteral', function () {
        it('True should be converted', function () {
            const result = compile('True');
            expect(result.code).toBe("true;");
        });
        it('False should be converted', function () {
            const result = compile('False');
            expect(result.code).toBe("false;");
        });
    });

    describe('Assign', function () {
        it('should provide a declaration', function () {
            const result = compile('x = 0.01');
            expect(result.code).toBe("let x=0.01;");
        });
        it('should provide a declaration', function () {
            const sourceText = "the_world_is_flat = True";
            const result = compile(sourceText);
            expect(result.code).toBe("let the_world_is_flat=true;");
        });
    });

    describe('Assign', function () {
        it('Integer', function () {
            const result = compile('x = 1');
            expect(typeof result).toBe('object');
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe("let x=1;");
        });
    });

    describe('Assign', function () {
        it('String', function () {
            const result = compile("name = 'David'");
            expect(typeof result).toBe('object');
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe("let name='David';");
        });
    });

    describe('Attribute', function () {
        it('should allow access to child attributes', function () {
            const result = compile('box = Box(engine, {color: Color.blue})');
            expect(result.code).toBe("let box=new Box(engine,{color:Color.blue});");
        });
    });

    describe('BinOp', function () {
        it('Add', function () {
            const result = compile("a + b");
            expect(result.code).toBe("a+b;");
        });
        it('Sub', function () {
            const result = compile("a - b");
            expect(result.code).toBe("a-b;");
        });
        it('Mult', function () {
            const result = compile("a * b");
            expect(result.code).toBe("a*b;");
        });
        it('Div', function () {
            const result = compile("a / b");
            expect(result.code).toBe("a/b;");
        });
        it('BitOr', function () {
            const result = compile("a | b");
            expect(result.code).toBe("a|b;");
        });
        it('BitXor', function () {
            const result = compile("a ^ b");
            expect(result.code).toBe("a^b;");
        });
        it('BitAnd', function () {
            const result = compile("a & b");
            expect(result.code).toBe("a&b;");
        });
        it('LShift', function () {
            const result = compile("a << b");
            expect(result.code).toBe("a<<b;");
        });
        it('RShift', function () {
            const result = compile("a >> b");
            expect(result.code).toBe("a>>b;");
        });
        it('Mod', function () {
            const result = compile("a % b");
            expect(result.code).toBe("a%b;");
        });
        it('FloorDiv', function () {
            const result = compile("a // b");
            expect(result.code).toBe("a//b;");
        });
    });

    describe('Compare', function () {
        it('Eq', function () {
            const result = compile("a == b");
            expect(result.code).toBe("a===b;");
        });
        it('NotEq', function () {
            const result = compile("a != b");
            expect(result.code).toBe("a!==b;");
        });
        it('Lt', function () {
            const result = compile("a < b");
            expect(result.code).toBe("a<b;");
        });
        it('LtE', function () {
            const result = compile("a <= b");
            expect(result.code).toBe("a<=b;");
        });
        it('Gt', function () {
            const result = compile("a > b");
            expect(result.code).toBe("a>b;");
        });
        it('GtE', function () {
            const result = compile("a >= b");
            expect(result.code).toBe("a>=b;");
        });
        it('Is', function () {
            const result = compile("a is b");
            expect(result.code).toBe("a===b;");
        });
        it('IsNot', function () {
            const result = compile("a is not b");
            expect(result.code).toBe("a!==b;");
        });
        it('In', function () {
            const result = compile("a in b");
            expect(result.code).toBe("a in b;");
        });
        it('NotIn', function () {
            const result = compile("a not in b");
            expect(result.code).toBe("a not in b;");
        });
        it('FloorDiv', function () {
            const result = compile("a // b");
            expect(result.code).toBe("a//b;");
        });
    });

    describe('Call', function () {
        it('should work with no arguments', function () {
            const result = compile('f()');
            expect(result.code).toBe("f();");
        });
        it('should work with 1 argument', function () {
            const result = compile('f(1)');
            expect(result.code).toBe("f(1);");
        });
        it('should work with 2 arguments', function () {
            const result = compile('f(1,2)');
            expect(result.code).toBe("f(1,2);");
        });
        it('should assume Upper case function name is a constructor function', function () {
            const result = compile('Engine()');
            expect(result.code).toBe("new Engine();");
        });
    });

    describe('ClassDef', function () {
        it('should make the self parameter implicit in the method', function () {
            const sourceText = [
                "class MyClass:",
                "    def f(self, name):",
                "        return 'Hello' + name"
            ].join("\n");
            const result = compile(sourceText);
            /*
            const resultText = [
                "class MyClass {",
                "    f(name) {",
                "        return 'Hello' + name;",
                "    }",
                "}"
            ].join("\n");
            */
            // console.lg(dumpSymbolTable(result.symbolTable));
            expect(result.code).toBe("class MyClass{export f(name){return 'Hello'+name;}}");
            // console.lg(JSON.stringify(result.sourceMap, null, 2));
        });
    });

    describe('Dict', function () {
        it('should allow the empty dictionary', function () {
            const result = compile('{}');
            expect(result.code).toBe("{};");
        });
        it('should allow a dictionary of many items', function () {
            const result = compile("{'a': 1, 'b': 23, 'c': 'eggs'}");
            expect(result.code).toBe("{'a':1,'b':23,'c':'eggs'};");
            // console.lg(JSON.stringify(result.sourceMap, null, 2));
        });

        it("Should convert kwargs into a single map argument", function () {
            const sourceText = [
                "foo({test:4},one=1, two=2, three=3)",
                ""
            ].join("\n");
            const result = compile(sourceText);
            expect(result.code).toBe("foo({test:4},{one:1,two:2,three:3});");
        });
    });

    describe('FunctionDef', function () {
        it('should work with no arguments', function () {
            const sourceText = [
                "def greeting(name):",
                "    return 'Hello' + name"
            ].join("\n");
            const result = compile(sourceText);
            expect(result.code).toBe("export function greeting(name){return 'Hello'+name;}");
        });
        it("should work with a type", function () {
            const sourceText = [
                "def greeting(name) -> str:",
                "   return 'Hello' + name"
            ].join("\n");
            const result = compile(sourceText);
            expect(result.code).toBe("export function greeting(name):string{return 'Hello'+name;}");
        });

    });

    describe('IfStatement', function () {
        it('should basically work', function () {
            const sourceText = "if the_world_is_flat:\n    print('Be careful not to fall off!')";
            const result = compile(sourceText);
            expect(result.code).toBe("if(the_world_is_flat){console.log('Be careful not to fall off!')}");
        });
        it('should work with assignments', function () {
            const result = compile('x = 7\nx=4\nif x < 1:\n  x = 3');
            expect(result.code).toBe("let x=7;x=4;if(x<1){x=3;}");
        });
    });

    describe('ImportFrom', function () {
        it('Experiment', function () {
            const sourceText = [
                "from eight import Engine",
                ""
            ].join("\n");
            try {
                compile(sourceText);
                fail(`ECMAScript 2015 modules require the ModuleSpecifier to be a STRING.`);
            }
            catch (e) {
                expect(`${e}`).toBe("ParseError: Unexpected T_NAME at [1,6]");
            }
        });
        it('should allow a single named import', function () {
            const sourceText = [
                "from 'eight' import Engine",
                ""
            ].join("\n");
            const result = compile(sourceText);
            // console.lg(parseTreeDump(result.cst));
            expect(result.code).toBe("import {Engine} from 'eight';");
        });
        it('should allow a multiple named imports', function () {
            const sourceText = [
                "from 'eight' import Engine, Scene",
                ""
            ].join("\n");
            const result = compile(sourceText);
            // console.lg(parseTreeDump(result.cst));
            expect(result.code).toBe("import {Engine,Scene} from 'eight';");
        });
        it('should allow a single alias named import', function () {
            const sourceText = [
                "from 'eight' import Engine as Context",
                ""
            ].join("\n");
            const result = compile(sourceText);
            expect(result.code).toBe("import {Engine as Context} from 'eight';");
        });
        it('should allow a multiple alias named imports', function () {
            const sourceText = [
                "from 'eight' import Engine as Context, Scene as Model",
                ""
            ].join("\n");
            const result = compile(sourceText);
            expect(result.code).toBe("import {Engine as Context,Scene as Model} from 'eight';");
        });
        it('should allow hyphens in module name', function () {
            const sourceText = [
                "from 'davinci-eight' import Engine",
                ""
            ].join("\n");
            const result = compile(sourceText);
            expect(result.code).toBe("import {Engine} from 'davinci-eight';");
        });
        it('should allow slashes in module name', function () {
            const sourceText = [
                "from 'davinci/eight' import Engine",
                ""
            ].join("\n");
            const result = compile(sourceText);
            expect(result.code).toBe("import {Engine} from 'davinci/eight';");
        });
        it('should allow commercial @ module name', function () {
            const sourceText = [
                "from '@eight' import Engine",
                ""
            ].join("\n");
            const result = compile(sourceText);
            const targetText = result.code;
            expect(targetText).toBe("import {Engine} from '@eight';");
        });
        //
        // Source Mapping
        //
        it('should compute the sourceMap', function () {
            const sourceText = [
                "from 'foo' import bar",
                ""
            ].join("\n");
            const result = compile(sourceText);
            const targetText = result.code;
            const sourceMap = result.sourceMap;
            expect(targetText).toBe("import {bar} from 'foo';");
            expect(sourceMap).toBeDefined();

            // The endpoints of the token ranges will map exactly.
            expect(column(mapToTarget(sourceMap, 1, 18))).toBe(8);
            expect(column(mapToTarget(sourceMap, 1, 21))).toBe(11);
            expect(column(mapToTarget(sourceMap, 1, 5))).toBe(18);
            expect(column(mapToTarget(sourceMap, 1, 10))).toBe(23);

            expect(mapToTarget(sourceMap, 1, 0)).toBeNull();
            // expect(mapToTarget(sourceMap, 1, 1)).toBeNull();
            // expect(mapToTarget(sourceMap, 1, 2)).toBeNull();
            // expect(mapToTarget(sourceMap, 1, 3)).toBeNull();
            // expect(mapToTarget(sourceMap, 1, 4)).toBeNull();
            expect(column(mapToTarget(sourceMap, 1, 5))).toBe(18);   // quote
            expect(column(mapToTarget(sourceMap, 1, 6))).toBe(19);   // f
            expect(column(mapToTarget(sourceMap, 1, 7))).toBe(20);   // o
            expect(column(mapToTarget(sourceMap, 1, 8))).toBe(21);   // o
            expect(column(mapToTarget(sourceMap, 1, 9))).toBe(22);   // quote
            // expect(mapToTarget(sourceMap, 1, 10)).toBeNull();
            // expect(mapToTarget(sourceMap, 1, 11)).toBeNull();
            // expect(mapToTarget(sourceMap, 1, 12)).toBeNull();
            // expect(mapToTarget(sourceMap, 1, 13)).toBeNull();
            // expect(mapToTarget(sourceMap, 1, 14)).toBeNull();
            // expect(mapToTarget(sourceMap, 1, 15)).toBeNull();
            // expect(mapToTarget(sourceMap, 1, 16)).toBeNull();
            // expect(mapToTarget(sourceMap, 1, 17)).toBeNull();
            expect(column(mapToTarget(sourceMap, 1, 18))).toBe(8);   // b
            expect(column(mapToTarget(sourceMap, 1, 19))).toBe(9);   // a
            expect(column(mapToTarget(sourceMap, 1, 20))).toBe(10);  // r
            // expect(mapToTarget(sourceMap, 1, 21)).toBeNull();
        });
    });

    describe('List', function () {
        it('should allow the empty list', function () {
            const result = compile('[]');
            expect(result.code).toBe("[];");
        });
        it('should allow the singleton list', function () {
            const result = compile('[1]');
            expect(result.code).toBe("[1];");
        });
        it('should allow a list of many items', function () {
            const result = compile('[1, 2, 3, 4, 5]');
            expect(result.code).toBe("[1,2,3,4,5];");
        });
    });

    describe('Print', function () {
        it('should provide a declaration', function () {
            const result = compile('print("Hello, World!")');
            expect(result.code).toBe("console.log('Hello, World!')");
        });
    });

    describe('Comments', function () {
        it('should allow single line comments', function () {
            const result = compile('# This is a single-line comment.');
            expect(result.code).toBe("");
        });
    });

    describe('Performance and Burn Test', function () {
        it('should be sub-second for standard graphics example', function () {
            const sourceText = sourceLines.join('\n');
            const result = compile(sourceText);
            expect(typeof result.code).toBe('string');
            const targetText = [
                "import {Geometric3,Color} from 'davinci-eight';",
                "import {Engine,Capability,Scene} from 'davinci-eight';",
                "import {Facet,PerspectiveCamera,DirectionalLight} from 'davinci-eight';",
                "import {TrackballControls} from 'davinci-eight';",
                "import {Box} from 'davinci-eight';",
                "let e2=Geometric3.e2(true);",
                "let e3=Geometric3.e3(true);",
                "let engine=new Engine('canvas3D');",
                "engine.size(500,500);",
                "engine.clearColor(0.1,0.1,0.1,1.0);",
                "engine.enable(Capability.DEPTH_TEST);",
                "let scene=new Scene(engine);",
                "let ambients=[];",
                "let camera=new PerspectiveCamera();",
                "camera.eye=e2+3*e3;",
                "ambients.push(camera);",
                "let dirLight=new DirectionalLight();",
                "ambients.push(dirLight);",
                "let trackball=new TrackballControls(camera);",
                "trackball.subscribe(engine.canvas);",
                "let box=new Box(engine,{color:Color.red});",
                "scene.add(box);",
                "export function animate(timestamp){",
                "engine.clear();",
                "trackball.update();",
                "dirLight.direction.copyVector(camera.look).subVector(camera.eye);",
                "box.attitude.rotorFromAxisAngle(e2,timestamp*0.001);",
                "scene.render(ambients);",
                "requestAnimationFrame(animate);",
                "}",
                "requestAnimationFrame(animate);"
            ].join("");
            expect(result.code).toBe(targetText);
        });
    });

    describe('Debug', function () {
        it('should be sub-second for standard graphics example', function () {
            const result = compile("a().b()");
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe('a().b();');
        });
    });

    // Trying out things. Break down into simpler tests.
    describe('Misc', function () {
        it('a = b.c(t)', function () {
            const sourceText = "a = b.c(t)";
            const result = compile(sourceText);
            expect(result.code).toBe("let a=b.c(t);");
        });
        it('a.b(c)', function () {
            const sourceText = [
                "a.b(c)",
                "x.y(z)"
            ].join("\n");
            const result = compile(sourceText);
            // const mod = result.mod;
            // console.lg(astDump(mod));
            expect(result.code).toBe("a.b(c);x.y(z);");
        });
    });
});
