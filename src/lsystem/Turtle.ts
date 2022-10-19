import {vec3, vec4, mat3, mat4} from 'gl-matrix';

class Turtle {
  position: vec3;
  orientation: vec3;
  orientation_euler: vec3;
  scale: number;
  t: number;

  constructor(pos: vec3, angles: vec3, angles_euler:vec3, s: number, t_val: number) {
    this.position = vec3.fromValues(pos[0], pos[1], pos[2]);
    this.orientation = vec3.fromValues(angles[0], angles[1], angles[2]);
    this.orientation_euler = vec3.fromValues(angles_euler[0], angles_euler[1], angles_euler[2]);
    this.scale = s;
    this.t = t_val;
  }

  reset(pos: vec3, angles: vec3, angles_euler:vec3, s: number, t_val: number) {
    this.position = vec3.fromValues(pos[0], pos[1], pos[2]);
    this.orientation = vec3.fromValues(angles[0], angles[1], angles[2]);
    this.orientation_euler = vec3.fromValues(angles_euler[0], angles_euler[1], angles_euler[2]);
    this.scale = s;
    this.t = t_val;
  }

  moveForward(step_size: number) {
    let movement: vec3 = vec3.create();
    vec3.add(this.position, this.position, vec3.multiply(movement, this.orientation, vec3.fromValues(step_size, step_size, step_size)));
    this.t += vec3.length(movement);
  }

  scaleUp(s: number) {
    this.scale *= s;
  }

  scaleDown(s: number) {
    this.scale /= s;
  }


  rotateX(angle: number) {
    let temp_vec: vec4 = vec4.fromValues(this.orientation[0], this.orientation[1], this.orientation[2], 0);
    let rot_mat: mat4 = mat4.create(); 
    mat4.fromXRotation(rot_mat, angle * Math.PI / 180.0);
    vec4.transformMat4(temp_vec, temp_vec, rot_mat);
    this.orientation = vec3.fromValues(temp_vec[0], temp_vec[1], temp_vec[2]);
    vec3.normalize(this.orientation, this.orientation);

    this.orientation_euler[0] += angle;
  }

  flipX() {
    let temp_vec: vec4 = vec4.fromValues(this.orientation[0], this.orientation[1], this.orientation[2], 0);
    let rot_mat: mat4 = mat4.create(); 
    mat4.fromXRotation(rot_mat, 180.0 * Math.PI / 180.0);
    vec4.transformMat4(temp_vec, temp_vec, rot_mat);
    this.orientation = vec3.fromValues(temp_vec[0], temp_vec[1], temp_vec[2]);
    vec3.normalize(this.orientation, this.orientation);

    this.orientation_euler[0] += 180.0;
  }

  rotateY(angle: number) {
    let temp_vec: vec4 = vec4.fromValues(this.orientation[0], this.orientation[1], this.orientation[2], 0);
    let rot_mat: mat4 = mat4.create(); 
    mat4.fromYRotation(rot_mat, angle * Math.PI / 180.0);
    vec4.transformMat4(temp_vec, temp_vec, rot_mat);
    this.orientation = vec3.fromValues(temp_vec[0], temp_vec[1], temp_vec[2]);
    vec3.normalize(this.orientation, this.orientation);

    this.orientation_euler[1] += angle;
  }

  flipY() {
    let temp_vec: vec4 = vec4.fromValues(this.orientation[0], this.orientation[1], this.orientation[2], 0);
    let rot_mat: mat4 = mat4.create(); 
    mat4.fromYRotation(rot_mat, 180.0 * Math.PI / 180.0);
    vec4.transformMat4(temp_vec, temp_vec, rot_mat);
    this.orientation = vec3.fromValues(temp_vec[0], temp_vec[1], temp_vec[2]);
    vec3.normalize(this.orientation, this.orientation);

    this.orientation_euler[1] += 180.0;
  }

  rotateZ(angle: number) {
    let temp_vec: vec4 = vec4.fromValues(this.orientation[0], this.orientation[1], this.orientation[2], 0);
    let rot_mat: mat4 = mat4.create(); 
    mat4.fromZRotation(rot_mat, angle * Math.PI / 180.0);
    vec4.transformMat4(temp_vec, temp_vec, rot_mat);
    this.orientation = vec3.fromValues(temp_vec[0], temp_vec[1], temp_vec[2]);
    vec3.normalize(this.orientation, this.orientation);

    this.orientation_euler[2] += angle;
  }

  flipZ() {
    let temp_vec: vec4 = vec4.fromValues(this.orientation[0], this.orientation[1], this.orientation[2], 0);
    let rot_mat: mat4 = mat4.create(); 
    mat4.fromZRotation(rot_mat, 180.0 * Math.PI / 180.0);
    vec4.transformMat4(temp_vec, temp_vec, rot_mat);
    this.orientation = vec3.fromValues(temp_vec[0], temp_vec[1], temp_vec[2]);
    vec3.normalize(this.orientation, this.orientation);

    this.orientation_euler[2] += 180.0;
  }

};

export default Turtle;
