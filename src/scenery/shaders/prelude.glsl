#version 300 es
precision highp float;

// Every scene receives the same inputs and defines `vec4 render(vec2 fragCoord)`:
// rgb is the illustration, alpha is its ember (emissive) mask.
uniform float u_time;
uniform vec2 u_resolution;
// y: screenfuls scrolled (negative going down). x: reserved.
uniform vec2 u_parallax;
out vec4 fragColor;

#define PI 3.14159265359
#define TAU 6.28318530718

mat2 rotate(float angle) {
  float c = cos(angle), s = sin(angle);
  return mat2(c, -s, s, c);
}

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
    mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amplitude = 0.5;
  mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    sum += amplitude * noise(p);
    p = turn * p * 2.02 + 17.0;
    amplitude *= 0.5;
  }
  return sum;
}

float sdBox(vec3 p, vec3 bounds) {
  vec3 q = abs(p) - bounds;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdTorus(vec3 p, vec2 radii) {
  return length(vec2(length(p.xz) - radii.x, p.y)) - radii.y;
}

float sdSegment(vec3 p, vec3 a, vec3 b, float radius) {
  vec3 ab = b - a;
  return length(p - a - ab * clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0)) - radius;
}

float sdSegment2(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  return length(p - a - ab * clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0));
}

float sdOctahedron(vec3 p, float size) {
  p = abs(p);
  float sum = p.x + p.y + p.z;
  float inside = (sum - size) * 0.57735027;
  if (inside <= 0.0) return inside;
  float largest = max(p.x, max(p.y, p.z));
  float smallest = min(p.x, min(p.y, p.z));
  float threshold = max((sum - size) / 3.0, max((sum - smallest - size) * 0.5, largest - size));
  return length(min(p, vec3(threshold)));
}

// Square pyramid, apex up, base half-width 0.5 at y=0 and height h.
float sdPyramid(vec3 p, float h) {
  float m2 = h * h + 0.25;
  p.xz = abs(p.xz);
  p.xz = (p.z > p.x) ? p.zx : p.xz;
  p.xz -= 0.5;
  vec3 q = vec3(p.z, h * p.y - 0.5 * p.x, h * p.x + 0.5 * p.y);
  float s = max(-q.x, 0.0);
  float t = clamp((q.y - 0.5 * p.z) / (m2 + 0.25), 0.0, 1.0);
  float a = m2 * (q.x + s) * (q.x + s) + q.y * q.y;
  float b = m2 * (q.x + 0.5 * t) * (q.x + 0.5 * t) + (q.y - m2 * t) * (q.y - m2 * t);
  float d2 = min(q.y, -q.x * m2 - q.y * 0.5) > 0.0 ? 0.0 : min(a, b);
  return sqrt((d2 + q.z * q.z) / m2) * sign(max(q.z, -p.y));
}

vec2 nearest(vec2 a, vec2 b) {
  return a.x < b.x ? a : b;
}

// Filmic-ish compression into display range, then gamma.
vec3 tonemap(vec3 color) {
  return pow(color / (1.0 + color), vec3(0.4545));
}

// Soft point glow for fireflies, embers and stars.
float glow(vec2 p, vec2 center, float radius) {
  vec2 d = p - center;
  return exp(-dot(d, d) / (radius * radius));
}
