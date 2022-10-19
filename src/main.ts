import {vec3} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import LSystem from './lsystem/LSystem'
import Mesh from './geometry/Mesh'
import Cube from './geometry/Cube'
import Icosphere from './geometry/Icosphere';






// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  Tree_Iterations: 6,
  Tree_Premise: "A",
  Tree_Rule_1: "A=>B[+BAB][-BAB][&BAB][^BAB][+&BAB][-&BAB][+^BAB][-^BAB]{1.0}",
  Tree_Rule_2: "B=AEAE{1.0}",
  Tree_Rule_3: "E=*{0.125}|F{0.875}",
  Tree_Angle: 45.0,
  Tree_Step_Size: 2.0,
  Tree_Initial_Scale: 4.9,
  Tree_Scale_Change: 1.007,

  Roots_Iterations: 9,
  Roots_Premise: "!FFFFFFF--&^^&&A",
  Roots_Rule_1: "A=>^FF-[+FFFB]&[-FFFB]+[&FFFB]-[^FFFB]{1.0}",
  Roots_Rule_2: "B=+X-XX^FF-A&FFB{1.0}", 
  Roots_Rule_3: "X=+F{0.5}|++&FA{0.5}",
  Roots_Angle: 15.0,
  Roots_Step_Size: 1.9,
  Roots_Initial_Scale: 4.7,
  Roots_Scale_Change: 1.31
};

let cube: Cube;
let roots_cube: Cube;
let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let apple: Icosphere;

let tree_l_system: LSystem;
let roots_l_system: LSystem;

let prev_tree_iter: number = 6;
let prev_tree_premise: string = "A";

let prev_tree_rule_1: string = "A=>B[+BAB][-BAB][&BAB][^BAB][+&BAB][-&BAB][+^BAB][-^BAB]{1.0}";
let tree_rule_1: string = "A=>B[+BAB][-BAB][&BAB][^BAB][+&BAB][-&BAB][+^BAB][-^BAB]{1.0}";

let tree_rule_2: string = "B=AEAE{1.0}";
let prev_tree_rule_2: string = "B=AEAE{1.0}";

let tree_rule_3: string = "E=*{0.125}|F{0.875}";
let prev_tree_rule_3: string = "E=*{0.125}|F{0.875}";

let prev_tree_angle: number = 45.0;
let prev_tree_step_size: number = 2.0;
let prev_tree_initial_scale: number = 4.9;
let prev_tree_scale_change: number = 1.007;

let prev_roots_iter: number = 9;
let prev_roots_premise: string = "!FFFFFFF--&^^&&A";

let roots_rule_1: string = "A=>^FF-[+FFFB]&[-FFFB]+[&FFFB]-[^FFFB]{1.0}";
let prev_roots_rule_1: string = "A=>^FF-[+FFFB]&[-FFFB]+[&FFFB]-[^FFFB]{1.0}";

let roots_rule_2: string = "B=+X-XX^FF-A&FFB{1.0}";
let prev_roots_rule_2: string = "B=+X-XX^FF-A&FFB{1.0}";

let roots_rule_3: string = "X=+F{0.5}|++&FA{0.5}";
let prev_roots_rule_3: string = "X=+F{0.5}|++&FA{0.5}";

let prev_roots_angle: number = 15.0;
let prev_roots_step_size: number = 1.9;
let prev_roots_initial_scale: number = 4.7;
let prev_roots_scale_change: number = 1.31;


function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();
  cube = new Cube(vec3.fromValues(0,0,0), 0.25);
  cube.create();
  roots_cube = new Cube(vec3.fromValues(0,0,0), 0.25);
  roots_cube.create();
  apple = new Icosphere(vec3.fromValues(0,0,0), 1, 2);
  apple.create();


  // Set up instanced rendering data arrays here.
  // This example creates a set of positional
  // offsets and gradiated colors for a 100x100 grid
  // of squares, even though the VBO data for just
  // one square is actually passed to the GPU

  tree_l_system = new LSystem(0);
  tree_l_system.setIterations(controls.Tree_Iterations);
  tree_l_system.setGrammar(controls.Tree_Premise);
  tree_l_system.setAngle(controls.Tree_Angle);
  tree_l_system.setStepSize(controls.Tree_Step_Size);
  tree_l_system.setInitialScale(controls.Tree_Initial_Scale);
  tree_l_system.setScaleChange(controls.Tree_Scale_Change);
  tree_l_system.addRule(controls.Tree_Rule_1);
  tree_l_system.addRule(controls.Tree_Rule_2);
  tree_l_system.addRule(controls.Tree_Rule_3);
  tree_l_system.execute();

  let tree_offsets: Float32Array = new Float32Array(tree_l_system.offsetsArray);
  let tree_colors: Float32Array = new Float32Array(tree_l_system.colorsArray);

  let apple_offsets: Float32Array = new Float32Array(tree_l_system.fruitsoffsetsArray);
  let apple_colors: Float32Array = new Float32Array(tree_l_system.fruitscolorsArray);


  cube.setInstanceVBOs(tree_offsets, tree_colors);
  cube.setNumInstances(tree_l_system.colorsArray.length / 4); // grid of "particles"

  apple.setInstanceVBOs(apple_offsets, apple_colors);
  apple.setNumInstances(tree_l_system.fruitscolorsArray.length / 4); // grid of "particles"

  roots_l_system = new LSystem(1);
  roots_l_system.setIterations(controls.Roots_Iterations);
  roots_l_system.setGrammar(controls.Roots_Premise);
  roots_l_system.setAngle(controls.Roots_Angle);
  roots_l_system.setStepSize(controls.Roots_Step_Size);
  roots_l_system.setInitialScale(controls.Roots_Initial_Scale);
  roots_l_system.setScaleChange(controls.Roots_Scale_Change);
  roots_l_system.addRule(controls.Roots_Rule_1);
  roots_l_system.addRule(controls.Roots_Rule_2);
  roots_l_system.addRule(controls.Roots_Rule_3);
  roots_l_system.execute();
  
  let offsets: Float32Array = new Float32Array(roots_l_system.offsetsArray);
  let colors: Float32Array = new Float32Array(roots_l_system.colorsArray);

  roots_cube.setInstanceVBOs(offsets, colors);
  roots_cube.setNumInstances(roots_l_system.colorsArray.length / 4); // grid of "particles"
}

function update_TreeRule1() {
  tree_rule_1 = controls.Tree_Rule_1;
}

function update_TreeRule2() {
  tree_rule_2 = controls.Tree_Rule_2;
}

function update_TreeRule3() {
  tree_rule_3 = controls.Tree_Rule_3;
}

function update_RootsRule1() {
  roots_rule_1 = controls.Roots_Rule_1;
}

function update_RootsRule2() {
  roots_rule_2 = controls.Roots_Rule_2;
}

function update_RootsRule3() {
  roots_rule_3 = controls.Roots_Rule_3;
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'Tree_Iterations', 0, 10).step(1).listen();
  gui.add(controls, 'Tree_Premise').listen();
  gui.add(controls, 'Tree_Rule_1').onFinishChange(update_TreeRule1);
  gui.add(controls, 'Tree_Rule_2').onFinishChange(update_TreeRule2);
  gui.add(controls, 'Tree_Rule_3').onFinishChange(update_TreeRule3);
  gui.add(controls, 'Tree_Angle', 5.0, 175.0).step(1.0).listen();
  gui.add(controls, 'Tree_Step_Size', 0.5, 5.0).step(0.1).listen();
  gui.add(controls, 'Tree_Initial_Scale', 1.0, 5.0).step(0.1).listen();
  gui.add(controls, 'Tree_Scale_Change', 1.0, 1.1).step(0.001).listen();

  gui.add(controls, 'Roots_Iterations', 0, 10).step(1).listen();
  gui.add(controls, 'Roots_Premise').listen();
  gui.add(controls, 'Roots_Rule_1').onFinishChange(update_RootsRule1);
  gui.add(controls, 'Roots_Rule_2').onFinishChange(update_RootsRule2);
  gui.add(controls, 'Roots_Rule_3').onFinishChange(update_RootsRule3);
  gui.add(controls, 'Roots_Angle', 5.0, 175.0).step(1.0).listen();
  gui.add(controls, 'Roots_Step_Size', 0.5, 5.0).step(0.1).listen();
  gui.add(controls, 'Roots_Initial_Scale', 1.0, 5.0).step(0.1).listen();
  gui.add(controls, 'Roots_Scale_Change', 1.0, 2.0).step(0.01).listen();

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(-20, 0, 60), vec3.fromValues(-20, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.0, 0.0, 0.0, 1);
  //gl.enable(gl.BLEND);
  //gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const globe = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/globe-frag.glsl')),
  ]);

  const background = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/background-frag.glsl')),
  ]);

  const castle = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/castle-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time);
    globe.setTime(time);
    background.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    if(controls.Tree_Iterations != prev_tree_iter || controls.Tree_Premise != prev_tree_premise || 
      tree_rule_1 != prev_tree_rule_1 || tree_rule_2 != prev_tree_rule_2 || tree_rule_3 != prev_tree_rule_3 ||
      controls.Tree_Angle != prev_tree_angle || controls.Tree_Step_Size != prev_tree_step_size || controls.Tree_Initial_Scale != prev_tree_initial_scale || controls.Tree_Scale_Change != prev_tree_scale_change)
    {
      // change sphere tesselation
      prev_tree_iter = controls.Tree_Iterations;
      prev_tree_premise = controls.Tree_Premise;
      prev_tree_rule_1 = tree_rule_1;
      prev_tree_rule_2 = tree_rule_2;
      prev_tree_rule_3 = tree_rule_3;
      prev_tree_angle = controls.Tree_Angle;
      prev_tree_step_size = controls.Tree_Step_Size;
      prev_tree_initial_scale = controls.Tree_Initial_Scale;
      prev_tree_scale_change =controls.Tree_Scale_Change;
      tree_l_system.recreateLSystem(controls.Tree_Premise, controls.Tree_Iterations, tree_rule_1, tree_rule_2, tree_rule_3, controls.Tree_Angle, controls.Tree_Step_Size, controls.Tree_Initial_Scale, controls.Tree_Scale_Change);
      tree_l_system.execute();
      
      let offsets: Float32Array = new Float32Array(tree_l_system.offsetsArray);
      let colors: Float32Array = new Float32Array(tree_l_system.colorsArray);

      let apples_offsets: Float32Array = new Float32Array(tree_l_system.fruitsoffsetsArray);
      let apples_colors: Float32Array = new Float32Array(tree_l_system.fruitscolorsArray);

      cube.setInstanceVBOs(offsets, colors);
      cube.setNumInstances(tree_l_system.colorsArray.length / 4); // grid of "particles"

      apple.setInstanceVBOs(apples_offsets, apples_colors);
      apple.setNumInstances(tree_l_system.fruitscolorsArray.length / 4); // grid of "particles"
    }

    if(controls.Roots_Iterations != prev_roots_iter || controls.Roots_Premise != prev_roots_premise || 
      roots_rule_1 != prev_roots_rule_1 || roots_rule_2 != prev_roots_rule_2 || roots_rule_3 != prev_roots_rule_3 ||
      controls.Roots_Angle != prev_roots_angle || controls.Roots_Step_Size != prev_roots_step_size || controls.Roots_Initial_Scale != prev_roots_initial_scale || controls.Roots_Scale_Change != prev_roots_scale_change)
    {
      // change sphere tesselation
      prev_roots_iter = controls.Roots_Iterations;
      prev_roots_premise = controls.Roots_Premise;
      prev_roots_rule_1 = roots_rule_1;
      prev_roots_rule_2 = roots_rule_2;
      prev_roots_rule_3 = roots_rule_3;
      prev_roots_angle = controls.Roots_Angle;
      prev_roots_step_size = controls.Roots_Step_Size;
      prev_roots_initial_scale = controls.Roots_Initial_Scale;
      prev_roots_scale_change =controls.Roots_Scale_Change;
      roots_l_system.recreateLSystem(controls.Roots_Premise, controls.Roots_Iterations, roots_rule_1, roots_rule_2, roots_rule_3, controls.Roots_Angle, controls.Roots_Step_Size, controls.Roots_Initial_Scale, controls.Roots_Scale_Change);
      roots_l_system.execute();
      
      let offsets: Float32Array = new Float32Array(roots_l_system.offsetsArray);
      let colors: Float32Array = new Float32Array(roots_l_system.colorsArray);

      roots_cube.setInstanceVBOs(offsets, colors);
      roots_cube.setNumInstances(roots_l_system.colorsArray.length / 4); // grid of "particles"
    }

    

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    renderer.render(camera, background, [screenQuad]);

    // clear depth buffer so next passes write over
    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    renderer.render(camera, globe, [screenQuad]);

    gl.enable(gl.DEPTH_TEST);


    // clear depth buffer so next passes write over
    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    
    renderer.render(camera, instancedShader, [
      cube,
    ]);

    renderer.render(camera, instancedShader, [
      apple,
    ]);

    renderer.render(camera, instancedShader, [
      roots_cube,
    ]);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    renderer.render(camera, castle, [screenQuad]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
    globe.setDimensions(window.innerWidth, window.innerHeight);
    background.setDimensions(window.innerWidth, window.innerHeight);
    castle.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);
  globe.setDimensions(window.innerWidth, window.innerHeight);
  background.setDimensions(window.innerWidth, window.innerHeight);
  castle.setDimensions(window.innerWidth, window.innerHeight);
  

  // Start the render loop
  tick();
}

main();
