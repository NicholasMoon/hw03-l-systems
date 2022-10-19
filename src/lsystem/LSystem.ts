import {vec3, vec4, mat4, quat} from 'gl-matrix';
import Turtle from './Turtle';
import LinkedList from './LinkedList';
import ExpansionRule from './ExpansionRule';
import DrawingRule from './DrawingRule';

class LSystem {
  iterations: number;
  turtle_stack: Array<Turtle>;
  current_turtle: Turtle;
  stack_size: number;
  grammar: string;
  expansion_rules : Map<string, ExpansionRule>;
  drawing_rules: Map<string, DrawingRule>;
  scale_array: Array<number>;
  lsystemnum: number;

  angle: number;
  step_size: number;
  initial_scale: number;
  scale_change: number;

  offsetsArray: number[];
  colorsArray: number[];

  fruitsoffsetsArray: number[];
  fruitscolorsArray: number[];

  constructor(ls: number) {
    this.lsystemnum = ls;
    this.angle = 45.0;
    this.step_size = 2.0;
    this.initial_scale = 2.0;
    this.scale_change = 1.0;

    this.iterations = 0;
    this.turtle_stack = new Array();
    if (this.lsystemnum == 0) {
      this.current_turtle = new Turtle(vec3.fromValues(28,0,-100), vec3.fromValues(0,1,0), vec3.fromValues(0,0,0), this.initial_scale, 0.0);
    }
    else {
      this.current_turtle = new Turtle(vec3.fromValues(32,0,-100), vec3.fromValues(0,1,0), vec3.fromValues(0,0,0), this.initial_scale, 0.0);
    }

    this.stack_size = 0;
    
    this.expansion_rules = new Map();
    this.drawing_rules = new Map();

    this.scale_array = new Array();

    this.drawing_rules.set('F', new DrawingRule("F", this.moveForward.bind(this), 1.0));

    this.drawing_rules.set('[', new DrawingRule("[", this.push.bind(this), 1.0));
    this.drawing_rules.set(']', new DrawingRule("]", this.pop.bind(this), 1.0));

    this.drawing_rules.set('<', new DrawingRule("<", this.scaleUp.bind(this), 1.0));
    this.drawing_rules.set('>', new DrawingRule(">", this.scaleDown.bind(this), 1.0));

    this.drawing_rules.set('*', new DrawingRule("*", this.createFruit.bind(this), 1.0));

    this.drawing_rules.set('+', new DrawingRule("+", this.rotatePosZ.bind(this), 1.0));
    this.drawing_rules.set('-', new DrawingRule("-", this.rotateNegZ.bind(this), 1.0));
    this.drawing_rules.set('!', new DrawingRule("!", this.flipZ.bind(this), 1.0));
    this.drawing_rules.set('&', new DrawingRule("&", this.rotatePosX.bind(this), 1.0));
    this.drawing_rules.set('^', new DrawingRule("^", this.rotateNegX.bind(this), 1.0));
    this.drawing_rules.set('#', new DrawingRule("#", this.flipX.bind(this), 1.0));
    this.drawing_rules.set('/', new DrawingRule("/", this.rotatePosY.bind(this), 1.0));
    this.drawing_rules.set('\\', new DrawingRule("\\", this.rotateNegY.bind(this), 1.0));
    this.drawing_rules.set('$', new DrawingRule("$", this.flipY.bind(this), 1.0));

 

    this.offsetsArray = [];
    this.colorsArray = [];
    this.fruitsoffsetsArray = [];
    this.fruitscolorsArray = [];
  }

  setGrammar(s: string) {
    this.grammar = s;
  }

  setIterations(i: number) {
    this.iterations = i;
  }

  setAngle(a: number) {
    this.angle = a;
  }

  setStepSize(ss: number) {
    this.step_size = ss;
  }

  setInitialScale(s: number) {
    this.initial_scale = s;
    this.current_turtle.scale = this.initial_scale;
  }

  setScaleChange(s: number) {
    this.scale_change = s;
  }

  addRule(s: string) {
    let num_postconditions: number = 0;
    let s_postcondition_start: number = 0;
    let s_postcondition_end: number = 0;
    let s_prob_start: number = 0;
    let s_prob_end: number = 0;

    // trim white space from rule
    let s_trimmed: string = s.replace(/\s/g, "");

    // create new expansion rule
    let new_expansion_rule: ExpansionRule = new ExpansionRule(s_trimmed.charAt(0));

    // get the precondition
    let s_precondition = s_trimmed.charAt(0);
    s_postcondition_start = 2;
    console.log("precondition: [" + s_precondition + "]");

    // get the postconditions with their probabilities
    while (s_postcondition_start < s_trimmed.length) {
      num_postconditions++;

      // end of postcondition
      s_postcondition_end = s_trimmed.indexOf("{", s_postcondition_start);
      if (s_postcondition_end == -1) {
        if (num_postconditions == 1) {
          s_postcondition_end = s_trimmed.length;
        }
        else{
          break;
        }
      }
      // get postcondition
      let s_postcondition: string = s_trimmed.slice(s_postcondition_start, s_postcondition_end);

      // start and end of probability
      s_prob_start = s_postcondition_end + 1;
      s_prob_end = s_trimmed.indexOf("}", s_prob_start);
      
      // get probability
      let f_prob: number = parseFloat(s_trimmed.slice(s_prob_start, s_prob_end));

      if (s_precondition == "F" || s_precondition == "A") {
        console.log("postcondition: [" + s_postcondition + "], probability: [" + f_prob + "]");
      }


      // add new postcondition/probability pair to the expansion rule
      new_expansion_rule.addPostConditionWithProb(s_postcondition, f_prob);

      // get the starting index for the next iteration of postcondition parsing
      s_postcondition_start = s_trimmed.indexOf("|", s_prob_end) + 1;
      if (s_postcondition_start == 0) {
        break;
      }
    }

    // add precondition/expansion rule pair to map
    this.expansion_rules.set(s_trimmed.charAt(0), new_expansion_rule);
  }

  execute() {
    this.parseGrammar();
    this.applyGrammar();
  }

  parseGrammar() {
    for(let i = 0; i < this.iterations; ++i) {
        let new_grammar: string = "";
        for (let c = 0; c < this.grammar.length; ++c) {
            if (this.expansion_rules.has(this.grammar.charAt(c))) {
                let this_expansion_rule: ExpansionRule = this.expansion_rules.get(this.grammar.charAt(c));
                if (this_expansion_rule.postconditions.length > 1) {
                  let rng_val: number = Math.random();
                  let rng_accum: number = 0.0;
                  for (let postcondition = 0; postcondition < this_expansion_rule.postconditions.length; ++postcondition) {
                    rng_accum += this_expansion_rule.postconditions[postcondition].probability;
                    if (rng_val <= rng_accum) {
                      new_grammar = new_grammar + this_expansion_rule.postconditions[postcondition].new_symbol;
                      break;
                    }
                  }
                }
                else {
                  new_grammar = new_grammar + this_expansion_rule.postconditions[0].new_symbol;
                }
            }
            else {
                new_grammar = new_grammar + this.grammar.charAt(c);
            }
        }
        this.grammar = new_grammar;
    }
  }

  applyGrammar() {
    for (let c = 0; c < this.grammar.length; ++c) {
        let drawing_rule = this.drawing_rules.get(this.grammar.charAt(c));
        if (drawing_rule) {
          drawing_rule.drawing_commands[0].draw_function();
        }
    }
  }

  createInstance() {
    let scale_vec: vec3 = vec3.fromValues(this.current_turtle.scale, this.step_size * 4.0, this.current_turtle.scale);

    let rot_vec: vec3 = vec3.fromValues(this.current_turtle.orientation_euler[0], this.current_turtle.orientation_euler[1], this.current_turtle.orientation_euler[2]);

    let rot_quat: quat = quat.create();
    quat.fromEuler(rot_quat, rot_vec[0], rot_vec[1], rot_vec[2]);

    let trans_vec = vec3.fromValues(this.current_turtle.position[0], this.current_turtle.position[1], this.current_turtle.position[2]);

    let transform_mat: mat4 = mat4.create();
    mat4.fromRotationTranslationScale(transform_mat, rot_quat, trans_vec, scale_vec);

    this.offsetsArray.push(transform_mat[0]);
    this.offsetsArray.push(transform_mat[1]);
    this.offsetsArray.push(transform_mat[2]);
    this.offsetsArray.push(transform_mat[3]);
    
    this.offsetsArray.push(transform_mat[4]);
    this.offsetsArray.push(transform_mat[5]);
    this.offsetsArray.push(transform_mat[6]);
    this.offsetsArray.push(transform_mat[7]);
    
    this.offsetsArray.push(transform_mat[8]);
    this.offsetsArray.push(transform_mat[9]);
    this.offsetsArray.push(transform_mat[10]);
    this.offsetsArray.push(transform_mat[11]);

    this.offsetsArray.push(transform_mat[12]);
    this.offsetsArray.push(transform_mat[13]);
    this.offsetsArray.push(transform_mat[14]);
    this.offsetsArray.push(transform_mat[15]);
  
    let a: vec3;
    let b: vec3;
    let c: vec3;
    let d: vec3;

    let t: vec3;

    if (this.lsystemnum == 0) {
      a = vec3.fromValues(0.028, 0.138, -0.012);
      b = vec3.fromValues(0.608, 0.278, 0.128);
      c = vec3.fromValues(0.158, -0.032, 0.418);
      d = vec3.fromValues(-1.112, 0.148, -1.152);

      t = vec3.fromValues(this.current_turtle.t / 12.0, this.current_turtle.t / 12.0, this.current_turtle.t / 12.0);
    }
    else {
      a = vec3.fromValues(0.488, 0.248, 0.098);
      b = vec3.fromValues(0.088, 0.020, -0.052);
      c = vec3.fromValues(0.268, 1.378, 2.528);
      d = vec3.fromValues(1.558, -0.812, 0.818);

      t = vec3.fromValues(this.current_turtle.t / 12.0, this.current_turtle.t / 12.0, this.current_turtle.t / 12.0);
    }

    // Inigo Quilez https://iquilezles.org/articles/palettes/
    vec3.multiply(t, c, t);
    vec3.add(t, t, d);
    vec3.multiply(t, t, vec3.fromValues(6.28318, 6.28318, 6.28318));
    t = vec3.fromValues(Math.cos(t[0]), Math.cos(t[1]), Math.cos(t[2]));
    vec3.multiply(t, b, t);
    vec3.add(t, a, t);

    this.colorsArray.push(t[0]);
    this.colorsArray.push(t[1]);
    this.colorsArray.push(t[2]);
    this.colorsArray.push(1.0);
  }

  createFruitInstance() {
    let scale_vec: vec3 = vec3.fromValues(0.75, 0.75, 0.75);

    let rot_vec: vec3 = vec3.fromValues(this.current_turtle.orientation_euler[0], this.current_turtle.orientation_euler[1], this.current_turtle.orientation_euler[2]);

    let rot_quat: quat = quat.create();
    quat.fromEuler(rot_quat, rot_vec[0], rot_vec[1], rot_vec[2]);

    let trans_vec = vec3.fromValues(this.current_turtle.position[0], this.current_turtle.position[1], this.current_turtle.position[2]);

    let transform_mat: mat4 = mat4.create();
    mat4.fromRotationTranslationScale(transform_mat, rot_quat, trans_vec, scale_vec);

    this.fruitsoffsetsArray.push(transform_mat[0]);
    this.fruitsoffsetsArray.push(transform_mat[1]);
    this.fruitsoffsetsArray.push(transform_mat[2]);
    this.fruitsoffsetsArray.push(transform_mat[3]);
    
    this.fruitsoffsetsArray.push(transform_mat[4]);
    this.fruitsoffsetsArray.push(transform_mat[5]);
    this.fruitsoffsetsArray.push(transform_mat[6]);
    this.fruitsoffsetsArray.push(transform_mat[7]);
    
    this.fruitsoffsetsArray.push(transform_mat[8]);
    this.fruitsoffsetsArray.push(transform_mat[9]);
    this.fruitsoffsetsArray.push(transform_mat[10]);
    this.fruitsoffsetsArray.push(transform_mat[11]);

    this.fruitsoffsetsArray.push(transform_mat[12]);
    this.fruitsoffsetsArray.push(transform_mat[13]);
    this.fruitsoffsetsArray.push(transform_mat[14]);
    this.fruitsoffsetsArray.push(transform_mat[15]);
  
    let a: vec3;
    let b: vec3;
    let c: vec3;
    let d: vec3;

    let t: vec3;

    a = vec3.fromValues(0.728, 0.358, 0.248);
    b = vec3.fromValues(0.238, 0.128, 0.128);
    c = vec3.fromValues(3.138, 1.718, 0.828);
    d = vec3.fromValues(2.228, -0.812, 0.818);

    t = vec3.fromValues(this.current_turtle.t / 12.0, this.current_turtle.t / 12.0, this.current_turtle.t / 12.0);

    // Inigo Quilez https://iquilezles.org/articles/palettes/
    vec3.multiply(t, c, t);
    vec3.add(t, t, d);
    vec3.multiply(t, t, vec3.fromValues(6.28318, 6.28318, 6.28318));
    t = vec3.fromValues(Math.cos(t[0]), Math.cos(t[1]), Math.cos(t[2]));
    vec3.multiply(t, b, t);
    vec3.add(t, a, t);

    this.fruitscolorsArray.push(t[0]);
    this.fruitscolorsArray.push(t[1]);
    this.fruitscolorsArray.push(t[2]);
    this.fruitscolorsArray.push(1.0);
  }

  reset() {
    this.offsetsArray.length = 0;
    this.colorsArray.length = 0;
    this.fruitsoffsetsArray.length = 0;
    this.fruitscolorsArray.length = 0;
    this.turtle_stack.length = 0;
    this.expansion_rules.clear();
    if (this.lsystemnum == 0) {
      this.current_turtle.reset(vec3.fromValues(28,0,-100), vec3.fromValues(0,1,0), vec3.fromValues(0,0,0), 1.0, 0);
    }
    else {
      this.current_turtle.reset(vec3.fromValues(32,0,-100), vec3.fromValues(0,1,0), vec3.fromValues(0,0,0), 1.0, 0);
    }
    this.iterations = 0;
    this.angle = 45.0;
    this.step_size = 2.0;
    this.initial_scale = 2.0;
    this.scale_change = 1.0;
  }

  recreateLSystem(s: string, i:number, r_1: string, r_2: string, r_3: string, a: number, ss: number, is: number, sc: number) {
    this.reset();
    this.setGrammar(s);
    this.setIterations(i);
    this.setAngle(a);
    this.setStepSize(ss);
    this.setInitialScale(is);
    this.setScaleChange(sc);
    this.addRule(r_1);
    this.addRule(r_2);
    this.addRule(r_3);
  }



  moveForward() {
    this.current_turtle.moveForward(this.step_size);
    this.createInstance();
  }

  scaleUp() {
    this.current_turtle.scaleUp(this.scale_change);
  }

  scaleDown() {
    this.current_turtle.scaleDown(this.scale_change);
  }

  rotatePosX() {
    this.current_turtle.rotateX(this.angle);
  }

  rotateNegX() {
    this.current_turtle.rotateX(-this.angle);
  }

  flipX() {
    this.current_turtle.flipX();
  }

  rotatePosY() {
    this.current_turtle.rotateY(this.angle);
  }

  rotateNegY() {
    this.current_turtle.rotateY(-this.angle);
  }

  flipY() {
    this.current_turtle.flipY();
  }

  rotatePosZ() {
    this.current_turtle.rotateZ(this.angle);
  }

  rotateNegZ() {
    this.current_turtle.rotateZ(-this.angle);
  }

  flipZ() {
    this.current_turtle.flipZ();
  }

  push() {
    let new_turtle = new Turtle(this.current_turtle.position, this.current_turtle.orientation, this.current_turtle.orientation_euler, this.current_turtle.scale, this.current_turtle.t);
    this.turtle_stack.push(this.current_turtle);
    this.current_turtle = new_turtle;
    this.stack_size++;
  }

  pop() {
    if (this.stack_size != 0) {
        this.current_turtle = this.turtle_stack.pop();
        this.stack_size--;
    }
  }

  createFruit() {
    this.createFruitInstance();
  }

  getCurrentPosition(): vec3 {
    return this.current_turtle.position;
  }

  getCurrentOrientation(): vec3 {
    return this.current_turtle.orientation;
  }

};

export default LSystem;
