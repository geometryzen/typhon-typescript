"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourceLines = [
    // Each of these is about 2 ms.
    "from 'davinci-eight' import Geometric3, Color",
    "from 'davinci-eight' import Engine, Capability, Scene",
    "from 'davinci-eight' import Facet, PerspectiveCamera, DirectionalLight",
    "from 'davinci-eight' import TrackballControls",
    "from 'davinci-eight' import Box",
    // Zero ms, as expected.
    "",
    "",
    // 26 and 34 ms
    "e2 = Geometric3.e2(True)",
    "e3 = Geometric3.e3(True)",
    // Zero
    "",
    // 39
    "engine = Engine('canvas3D')",
    // 50
    "engine.size(500, 500)",
    // 94
    "engine.clearColor(0.1, 0.1, 0.1, 1.0)",
    // 49
    "engine.enable(Capability.DEPTH_TEST)",
    // 0
    "",
    // 67
    "scene = Scene(engine)",
    // 0
    "",
    // 50
    "ambients = []",
    // 0
    "",
    // 62
    "camera = PerspectiveCamera()",
    // 94
    "camera.eye = e2 + 3 * e3",
    // 81
    "ambients.push(camera)",
    // 0
    "",
    // 82
    "dirLight = DirectionalLight()",
    // 116
    "ambients.push(dirLight)",
    // 1
    "",
    // 101
    "trackball = TrackballControls(camera)",
    // 82
    "trackball.subscribe(engine.canvas)",
    // 0
    "",
    // 236
    "box = Box(engine, {color: Color.red})",
    // 92
    "scene.add(box)",
    // 0
    "",
    // 16
    "def animate(timestamp):",
    // 56
    "    engine.clear()",
    // 59
    "    trackball.update()",
    // 176
    "    dirLight.direction.copyVector(camera.look).subVector(camera.eye)",
    // 189
    "    box.attitude.rotorFromAxisAngle(e2, timestamp * 0.001)",
    // 114
    "    scene.render(ambients)",
    // 113
    "    requestAnimationFrame(animate)",
    // 0
    "",
    // 116
    "requestAnimationFrame(animate)",
    // 2
    ""
];
//# sourceMappingURL=eight.js.map