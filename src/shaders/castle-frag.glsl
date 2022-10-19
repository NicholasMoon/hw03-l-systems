#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

#define PI 3.1415927
#define TWO_PI 6.2831853


#define MAX_RAY_STEPS 100
#define EPSILON_P 0.1f
#define EPSILON_N 0.001f

#define MAX_WORLD_BOUNDS 500

struct Ray {
  vec3        o;
  vec3        d;
};

struct Material {
  vec3 albedo;
};

struct Intersection {
  vec3        p;
  vec2        uv;
  float       t;
  vec3        n;
  float       distance_to_surface;
  int         obj_ID;
  int         inst_ID;
  int         material_ID;
  float       fbm_val;
};

struct DirectionalLight
{
    vec3      dir;
    vec3      col;
};

struct Sun {
  vec3 p; // this is technically "incoming ray direction"
  float r_core;
  vec3 col_core;
  float r_corona;
  vec3 col_corona;
  DirectionalLight sunlight;
};

const DirectionalLight light = DirectionalLight(  normalize(vec3(-1,-1,-1)), 
                                                  vec3(1.0f, 1.0f, 1.0f)
                                                );

const Material material = Material(vec3(0.05f, 0.85f, 0.92f));

const DirectionalLight fill_light = DirectionalLight(normalize(vec3(0, -1, 0)), vec3(.61, .55, .51));
const DirectionalLight gi_light_0 = DirectionalLight(normalize(vec3(1.0, 0, 1.0)), vec3(0.55,0.6,0.65));
const DirectionalLight gi_light_1 = DirectionalLight(normalize(vec3(5.0, 0, -5.0)), vec3(1,1,1));

const vec3 globe_position = vec3(-55,355,-500);
const float globe_radius = 360.0f;

const float lod_max = 9.0f;

/////////////////////////////////////////////////////////////////////////////////////////////////
// 3D FBM implementation
//
// Based on Adam's 560 slides

float random3D_to_float_fbm( vec3 input_vals ) {
	return fract(sin(dot(input_vals, vec3(2114.11f, 1298.46f, 598.25f))) * 51034.13f);
}

float interpolate3D_cubic( vec3 input_vals ) {
    vec3 input_fract = fract(input_vals);
	vec3 input_floor = floor(input_vals);
	
	// generate the random values associated with the 8 points on our grid
	float bottom_left_front = random3D_to_float_fbm(input_floor);
	float bottom_left_back = random3D_to_float_fbm(input_floor + vec3(0,0,1));
	float bottom_right_front = random3D_to_float_fbm(input_floor + vec3(1,0,0));
	float bottom_right_back = random3D_to_float_fbm(input_floor + vec3(1,0,1));
	float top_left_front = random3D_to_float_fbm(input_floor + vec3(0,1,0));
	float top_left_back = random3D_to_float_fbm(input_floor + vec3(0,1,1));
	float top_right_front = random3D_to_float_fbm(input_floor + vec3(1,1,0));
	float top_right_back = random3D_to_float_fbm(input_floor + vec3(1,1,1));

	float t_x = smoothstep(0.0, 1.0, input_fract.x);
	float t_y = smoothstep(0.0, 1.0, input_fract.y);
	float t_z = smoothstep(0.0, 1.0, input_fract.z);

    float interpX_bottom_front = mix(bottom_left_front, bottom_right_front, t_x);
    float interpX_bottom_back = mix(bottom_left_back, bottom_right_back, t_x);
    float interpX_top_front = mix(top_left_front, top_right_front, t_x);
    float interpX_top_back = mix(top_left_back, top_right_back, t_x);

    float interpY_front = mix(interpX_bottom_front, interpX_top_front, t_y);
    float interpY_bottom = mix(interpX_bottom_back, interpX_top_back, t_y);

    return mix(interpY_front, interpY_bottom, t_z);
}

float fbm3D( vec3 p, float amp, float freq, float persistence, int octaves ) {
    float sum = 0.0;
    for(int i = 0; i < octaves; ++i) {
        sum += interpolate3D_cubic(p * freq) * amp;
        amp *= persistence;
        freq *= 2.0;
    }
    return sum;
}

/////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////
// 3D Worley Noise implementation
//
// Based on Adam's 560 slides

vec3 random3D_to_3D_worley( vec3 input_vals ) {
    return fract(
		sin(
			vec3(
				dot(
					input_vals, vec3(136.38, 564.45, 853.345)
				),
                dot(
					input_vals, vec3(522.5, 635.53, 211.34)
				),
				dot(
					input_vals, vec3(363.63, 755.69, 892.35)
				)
			)
		) * 58387.3569
	);
}


float worley3D( vec3 p, float freq ) {
	// scale input by freq to increase size of grid
    p *= freq;

    vec3 p_floor = floor(p);
    vec3 p_fract = fract(p);
    float min_d = 1.0;

  // look for closest voronoi centroid point in 3x3x3 grid around current position
	for (int z = -1; z <= 1; ++z) {
		for	(int y = -1; y <= 1; ++y) {
			for	(int x = -1; x <= 1; ++x) {

				vec3 this_neighbor = vec3(float(x), float(y), float(z));

        // voronoi centroid
				vec3 neighbor_point = random3D_to_3D_worley(p_floor + this_neighbor);

				vec3 diff = this_neighbor + neighbor_point - p_fract;

				float d = length(diff);

				min_d = min(min_d, d);
			}
		}
	}
    
    return min_d;
}

/////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////
// Toolbox Function implementations

float bias(float t, float b) {
    return (t / ((((1.0/b) - 2.0)*(1.0 - t))+1.0));
}

float gain(float t, float g) {
    if (t < 0.5f) {
		return bias(1.0f - g, 2.0f * t) / 2.0f;
	}
	else {
		return 1.0 - bias(1.0f - g, 2.0 - 2.0 * t) / 2.0f;
	}
}

float tri_wave(float x, float freq, float amp) {
    return abs(mod(x * freq, amp) - (0.5 * amp));
}


/////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////////////////////////////////
// Procedural Color implementations

// https://iquilezles.org/articles/palettes/
vec3 getCosinePaletteColor(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    return a + b * cos(TWO_PI * (c * t + d));
}
		
/////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////
// SDF toolbox implementations

// Most taken from https://iquilezles.org/articles/distfunctions/
float smoothUnion_SDF( float sdf_0, float sdf_1, float t ) {
    float h = clamp( 0.5 + 0.5*(sdf_1-sdf_0)/t, 0.0, 1.0 );
    return mix( sdf_1, sdf_0, h ) - t*h*(1.0-h);
}

float sphere_SDF(vec3 p, vec3 c, float r) {
    return length(p - c) - r;
}

float box_round_SDF( vec3 p, vec3 c, vec3 s, float r )
{
  vec3 q = abs(p - c) - s;
  return length(max(q, 0.0f)) + min(max(q.x,max(q.y,q.z)), 0.0f) - r;
}

float plane_SDF( vec3 p, vec3 n, float h )
{
  return dot(p, n) + h;
}

float cylinder_rounded_SDF( vec3 p, vec3 c, float ra, float rb, float h )
{
  vec3 q = p - c;
  vec2 d = vec2( length(q.xz)-2.0*ra+rb, abs(q.y) - h );
  return min(max(d.x,d.y),0.0) + length(max(d,0.0)) - rb;
}

float capsule_SDF( vec3 p, vec3 a, vec3 b, float r )
{
  vec3 pa = p - a, ba = b - a;
  float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
  return length( pa - ba*h ) - r;
}

float repeat_SDF(vec3 p, vec3 c) {
  vec3 q = mod(p,c) - 0.5f * c;
  return sphere_SDF(q, vec3(0.0f, -5.0f, 0.0f), 1.0f);
}

float repeat_bridge_SDF_0(vec3 p, vec3 c) {
  vec3 q = mod(p,c) - 0.5f * c;
  return box_round_SDF(q, vec3(0,0,0), vec3(3.0f, 4.0f, 0.75f), 0.5f);
}

float repeat_bridge_SDF_1(vec3 p, vec3 c) {
  vec3 q = mod(p,c) - 0.5f * c;
  return box_round_SDF(q, vec3(0,0,0), vec3(1.0f, 4.0f, 0.75f), 0.5f);
}
		
/////////////////////////////////////////////////////////////////////////////////////////////////       

float scene_SDF(out Intersection isect, Ray r) {
  float fbm_val = fbm3D(isect.p, 1.0, 0.35, 0.5, 8);

 
  vec3 offset = isect.p + vec3(fbm_val, fbm_val, fbm_val);
  float castle = capsule_SDF(offset, vec3(-5.5,0,-198), vec3(-5.5,5,-198), 1.5);
  castle = min(castle, capsule_SDF(offset, vec3(-9.5,0,-201), vec3(-9.5,5,-201), 1.0));
  castle = min(castle, capsule_SDF(offset, vec3(-1.0,0,-200), vec3(-1.0,5,-200), 1.2));
  castle = min(castle, capsule_SDF(offset, vec3(-0.5,0,-206), vec3(-0.5,5,-206), 1.3));
  castle = min(castle, capsule_SDF(offset, vec3(1.3,0,-206), vec3(1.3,4.5,-206), 1.1));
  castle = min(castle, capsule_SDF(offset, vec3(-11.3,0,-206), vec3(-11.3,4.5,-206), 1.1));
  castle = min(castle, capsule_SDF(offset, vec3(-7.3,0,-208), vec3(-7.3,4.5,-208), 1.6));
  castle = min(castle, capsule_SDF(offset, vec3(-2.3,0,-208), vec3(-2.3,4.5,-208), 1.6));
  castle = min(castle, cylinder_rounded_SDF( offset, vec3(-5.5,5.5,-203), 4.0, 0.1, 0.25 ));
  castle = min(castle, cylinder_rounded_SDF( offset, vec3(-5.5,8.5,-203), 2.0, 2.0, 1.0 ));
  castle = min(castle, cylinder_rounded_SDF( offset, vec3(-5.5,10.75,-203), 5.0, 0.1, 0.5 ));
  isect.fbm_val = fbm_val;
  float min_distance = castle;
  isect.material_ID = 1;

  return min_distance;
}

void getNormal_SDF(out Intersection isect, Ray r) {
    Intersection isect_neighbors_pos = isect;
    Intersection isect_neighbors_neg = isect;

    isect_neighbors_pos.p.x = isect.p.x + EPSILON_N;
    isect_neighbors_neg.p.x = isect.p.x - EPSILON_N;
    float dx = scene_SDF(isect_neighbors_pos, r) - scene_SDF(isect_neighbors_neg, r);
    isect_neighbors_pos = isect;
    isect_neighbors_neg = isect;
    isect_neighbors_pos.p.y = isect.p.y + EPSILON_N;
    isect_neighbors_neg.p.y = isect.p.y - EPSILON_N;
    float dy = scene_SDF(isect_neighbors_pos, r) - scene_SDF(isect_neighbors_neg, r);
    isect_neighbors_pos = isect;
    isect_neighbors_neg = isect;
    isect_neighbors_pos.p.z = isect.p.z + EPSILON_N;
    isect_neighbors_neg.p.z = isect.p.z - EPSILON_N;
    float dz = scene_SDF(isect_neighbors_pos, r) - scene_SDF(isect_neighbors_neg, r);

    isect.n = normalize(vec3(dx, dy, dz));
}

bool sphereMarch(Ray r, out Intersection isect) {  
    isect.p = r.o;

    for (int i=0; i < MAX_RAY_STEPS; ++i)
    {

        if (length(isect.p - r.o) > 300.0f) {
          break;
        }

        float closest_distance = scene_SDF(isect, r);
        
        if (closest_distance < EPSILON_P)
        {
            
            getNormal_SDF(isect, r);
            isect.t = length(isect.p - r.o);
            isect.distance_to_surface = closest_distance;
            return true;
        }
        
        isect.p = isect.p + r.d * closest_distance;
    }
    
    isect.t = -1.0;
    return false;
}

vec3 shadeIntersection(Ray r, Intersection isect) {
  vec3 color = vec3(0, 0, 0);

  float dist_to_castle_center = abs(length(isect.p - globe_position));

  vec3 material_color = vec3(0,0,0);

  if (isect.p.y > 8.5) {
  material_color = vec3(0.4, 0.5, 0.3);
  } 
  else if (isect.p.y > 5.4) {
      material_color = vec3(0.5 / 0.4,0.5 / 0.5,0.5 / 0.45);
  }
  else if (isect.p.y > 3.8) {
    material_color = vec3(0.4, 0.5, 0.3);
  } 
  else  {
      material_color = vec3(0.5 / 0.4,0.5 / 0.5,0.5 / 0.45);
  }


    // fill light
  float n_dot_light = dot(isect.n, fill_light.dir);
  if (n_dot_light > 0.0f) {
    color += material_color * fill_light.col * n_dot_light;
  }

  // gi light 0
  n_dot_light = dot(isect.n, gi_light_0.dir);
  if (n_dot_light > 0.0f) {
    color += material_color * gi_light_0.col * n_dot_light;
  }

    // gi light 1
  n_dot_light = dot(isect.n, gi_light_1.dir);
  if (n_dot_light > 0.0f) {
    color += material_color * gi_light_1.col * n_dot_light;
  }

  return color;
}

vec3 shadeBackground(Ray r, Intersection isect) {
  vec3 color = vec3(.025,.05,.1);
  return color;
}

Ray genCameraRay(vec2 uv) {
    Ray ray;
    
    float len = tan(PI * 0.03) * distance(u_Eye, u_Ref);
    vec3 H = normalize(cross(vec3(0.0, 1.0, 0.0), u_Eye - u_Ref));
    vec3 V = normalize(cross(H, u_Eye - u_Ref));
    V *= len;
    H *= len * u_Dimensions.x / u_Dimensions.y;
    vec3 p = u_Ref + uv.x * H + uv.y * V;
    vec3 dir = normalize(p - u_Eye);
    
    ray.o = u_Eye;
    ray.d = dir;
    return ray;
}

void main() {
    vec2 pixel_dimensions = vec2(1.0f / u_Dimensions.x, 1.0f / u_Dimensions.y);

    vec3 color = vec3(0.0f, 0.0f, 0.0f);

  float this_alpha = 0.0f;
  vec2 uv = fs_Pos;

  Ray r = genCameraRay(uv);

  Intersection isect;
  isect.uv = uv;
  if (sphereMarch(r, isect)) {
    // render geometry
    color = shadeIntersection(r, isect);
    // inigo quilez style fog (from his painting landscapes video)
    isect.t -= 300.0f;
    float t = exp(-0.015f * isect.t);
    t = smoothstep(0.0f, 1.0f, t);
    t = bias(t, 0.905f);
    color = mix(vec3(0.1, 0.31, 0.49),color, t);
    this_alpha = 1.0f;

  }
  else {
    this_alpha = 0.0f;
  }

  out_Col = vec4(color, this_alpha);
}

