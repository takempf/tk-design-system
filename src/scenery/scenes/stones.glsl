// Stones — a ring of standing stones in a misty clearing. Simple marks cut into
// their faces smoulder, a small fire burns at the centre, sparks rise. The camera
// circles slowly; scrolling carries it further round.

const int STONES = 9;
const float RING = 3.6;

// Stone i: position on the ring and a slight individual lean.
vec3 stonePosition(int i) {
  float a = float(i) / float(STONES) * TAU + 0.35 * hash11(float(i) * 3.1);
  return vec3(cos(a) * RING, 0.0, sin(a) * RING);
}

float stoneHeight(int i) {
  return 1.3 + 0.9 * hash11(float(i) * 5.7 + 2.0);
}

// Local frame of a stone: x along its face, y up, z out toward the centre.
vec3 stoneLocal(vec3 p, int i) {
  vec3 centre = stonePosition(i);
  vec3 q = p - centre;
  float facing = atan(centre.z, centre.x);
  q.xz = rotate(-facing - PI * 0.5) * q.xz;
  q.xy = rotate((hash11(float(i) * 9.3) - 0.5) * 0.18) * q.xy;
  return q;
}

float sdStone(vec3 q, float height) {
  vec3 size = vec3(0.5, height, 0.26);
  // Taper toward the top, and round every edge like weathered granite.
  q.x *= 1.0 + 0.18 * smoothstep(0.0, height * 2.0, q.y);
  return sdBox(q - vec3(0.0, height, 0.0), size - 0.08) - 0.08;
}

vec3 map(vec3 p) {
  float ground = p.y + 0.12 * fbm(p.xz * 0.35) - 0.05;
  vec3 hit = vec3(ground, 1.0, -1.0);
  for (int i = 0; i < STONES; i++) {
    float d = sdStone(stoneLocal(p, i), stoneHeight(i));
    if (d < hit.x) hit = vec3(d, 2.0, float(i));
  }
  // Fire: a few logs and a low stone hearth.
  float hearth = sdTorus(p - vec3(0.0, 0.05, 0.0), vec2(0.45, 0.1));
  if (hearth < hit.x) hit = vec3(hearth, 3.0, -1.0);
  return hit;
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.004, 0.0);
  return normalize(vec3(
    map(p + e.xyy).x - map(p - e.xyy).x,
    map(p + e.yxy).x - map(p - e.yxy).x,
    map(p + e.yyx).x - map(p - e.yyx).x
  ));
}

float sdEquilateral(vec2 p, float r) {
  const float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

float sdSquare(vec2 p, float r) {
  vec2 q = abs(p) - r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

// Plain geometry cut into each stone, one line weight throughout: distance to
// the carved region (negative inside a solid).
float mark(vec2 p, int kind) {
  const float dot = 0.1;
  if (kind == 0) return abs(length(p) - 0.34);                              // circle
  if (kind == 1) return abs(sdEquilateral(p + vec2(0.0, 0.04), 0.38));       // triangle
  if (kind == 2) return abs(sdSquare(p, 0.3));                              // square
  if (kind == 3) {                                                          // Y in triangle
    const float r = 0.38;
    vec2 q = p + vec2(0.0, 0.04);
    float y = sdSegment2(q, vec2(0.0), vec2(0.0, -r / 1.7320508));
    y = min(y, sdSegment2(q, vec2(0.0), vec2(-r * 0.5, r * 0.2886751)));
    y = min(y, sdSegment2(q, vec2(0.0), vec2(r * 0.5, r * 0.2886751)));
    return min(abs(sdEquilateral(q, r)), y);
  }
  if (kind == 4) return min(abs(sdSquare(p, 0.3)), length(p) - dot);       // dot in square
  if (kind == 5) return min(abs(length(p) - 0.34), sdSquare(p, dot));      // square in circle
  return min(abs(length(p) - 0.34), sdEquilateral(p + vec2(0.0, 0.03), 0.14)); // triangle in circle
}

vec4 render(vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * u_resolution) / u_resolution.y;
  float orbit = u_time * 0.025 - u_parallax.y * 0.35;
  vec3 camera = vec3(cos(orbit) * 8.5, 2.1, sin(orbit) * 8.5);
  vec3 target = vec3(0.0, 0.9, 0.0);
  vec3 forward = normalize(target - camera);
  vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, forward);
  vec3 ray = normalize(forward * 1.5 + right * uv.x + up * uv.y);

  float travel = 0.0;
  vec3 hit = vec3(0.0);
  bool found = false;
  for (int i = 0; i < 80; i++) {
    vec3 p = camera + ray * travel;
    hit = map(p);
    if (hit.x < 0.002) { found = true; break; }
    travel += hit.x * 0.9;
    if (travel > 40.0) break;
  }

  vec3 fire = vec3(0.0, 0.35, 0.0);
  float flicker = 0.8 + 0.2 * sin(u_time * 7.0) * sin(u_time * 4.3 + 1.0);
  // Sky: dark, a pale band of moonlit cloud, a treeline beyond the clearing.
  vec3 color = mix(vec3(0.03, 0.035, 0.05), vec3(0.003, 0.006, 0.01), smoothstep(-0.05, 0.5, ray.y));
  color += vec3(0.05, 0.045, 0.07) * smoothstep(0.35, 0.8, fbm(ray.xz / max(ray.y, 0.05) * 0.6 + u_time * 0.01)) * smoothstep(0.0, 0.3, ray.y);
  float treeline = 0.06 + 0.07 * fbm(vec2(atan(ray.z, ray.x) * 9.0, 0.0)) + 0.03 * noise(vec2(atan(ray.z, ray.x) * 60.0, 1.0));
  if (ray.y < treeline) color = vec3(0.002, 0.004, 0.004);

  float ember = 0.0;
  if (found) {
    vec3 p = camera + ray * travel;
    vec3 n = normalAt(p);
    vec3 toFire = fire - p;
    float fireDistance = length(toFire);
    float firelight = max(dot(n, toFire / fireDistance), 0.0) / (1.0 + fireDistance * fireDistance * 0.35) * flicker;
    vec3 moon = normalize(vec3(-0.4, 0.8, -0.3));
    float moonlight = max(dot(n, moon), 0.0);
    if (hit.y < 1.5) {
      float grass = fbm(p.xz * 2.5);
      color = vec3(0.006, 0.012, 0.01) * (0.6 + grass) + vec3(0.02, 0.02, 0.03) * moonlight;
    } else if (hit.y < 2.5) {
      int i = int(hit.z);
      vec3 q = stoneLocal(p, i);
      float lichen = fbm(q.xy * 3.0 + hit.z);
      color = vec3(0.02, 0.022, 0.028) * (0.5 + lichen) * (0.3 + moonlight);
      // Marks on the inward face, glowing with a slow breath.
      if (q.z > 0.1) {
        float height = stoneHeight(i);
        vec2 face = (q.xy - vec2(0.0, height * 1.1)) / 0.55;
        float d = mark(face, i - (i / 7) * 7);
        float breath = 0.55 + 0.45 * sin(u_time * 0.6 + hit.z * 1.7);
        float carved = 1.0 - smoothstep(0.03, 0.08, d);
        ember = max(ember, carved * breath);
        color += vec3(0.25, 0.08, 0.03) * carved * breath;
      }
    } else {
      color = vec3(0.01);
    }
    color += vec3(0.5, 0.2, 0.06) * firelight;
    color = mix(color, vec3(0.02, 0.03, 0.04), 1.0 - exp(-travel * 0.03));
  }

  // The fire itself and its rising sparks, projected to the screen.
  vec3 toFire = fire - camera;
  float along = dot(toFire, forward);
  vec2 fireScreen = vec2(dot(toFire, right), dot(toFire, up)) / along * 1.5;
  // Hidden when a stone stands between the camera and the hearth.
  float visible = (!found || travel > length(toFire) - 0.6) ? 1.0 : 0.0;
  float flame = glow(uv, fireScreen, 0.035 * flicker) * visible;
  float sparks = 0.0;
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    float life = fract(u_time * (0.12 + 0.06 * hash11(fi)) + hash11(fi * 2.3));
    vec2 spark = fireScreen + vec2(sin(life * 6.0 + fi) * 0.03 + (hash11(fi * 7.0) - 0.5) * 0.08, life * 0.45);
    sparks += glow(uv, spark, 0.006) * (1.0 - life);
  }
  ember = max(ember, clamp(flame * 1.5 + sparks, 0.0, 1.0));
  color += vec3(0.6, 0.25, 0.06) * (flame + sparks);
  return vec4(tonemap(color), ember);
}
