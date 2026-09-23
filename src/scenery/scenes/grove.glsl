// Grove — walking a trail through a pine wood at night. Trunks recede into
// moonlit mist, the canopy frames the sky, fireflies drift near the ground.
// Scrolling walks you further down the trail.

const float CELL = 2.3;

float terrain(vec2 xz) {
  float trail = smoothstep(0.4, 2.2, abs(xz.x));
  return 0.35 * fbm(xz * 0.22) * trail - 0.08 * (1.0 - trail);
}

// Nearest trunk, checking the 2×2 cells around p so none are stepped over.
float trunks(vec3 p, out float radiusOut) {
  float d = 1e5;
  radiusOut = 0.2;
  vec2 grid = p.xz / CELL;
  vec2 base = floor(grid) + step(0.5, fract(grid)) - 1.0;
  for (int j = 0; j < 2; j++) {
    for (int i = 0; i < 2; i++) {
      vec2 cell = base + vec2(float(i), float(j));
      vec2 centre = (cell + 0.2 + 0.6 * hash22(cell)) * CELL;
      if (abs(centre.x) < 1.7 || hash12(cell + 3.7) > 0.84) continue;
      float radius = 0.1 + 0.24 * hash12(cell + 9.1);
      float lean = (hash12(cell + 1.3) - 0.5) * 0.06;
      vec2 offset = p.xz - centre - vec2(lean * p.y, 0.0);
      float trunk = length(offset) - radius * (1.0 - 0.018 * p.y);
      if (trunk < d) {
        d = trunk;
        radiusOut = radius;
      }
    }
  }
  return d;
}

vec2 map(vec3 p) {
  float radius;
  float ground = p.y - terrain(p.xz);
  float wood = trunks(p, radius);
  return wood < ground ? vec2(wood * 0.9, 2.0) : vec2(ground * 0.7, 1.0);
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.01, 0.0);
  return normalize(vec3(
    map(p + e.xyy).x - map(p - e.xyy).x,
    map(p + e.yxy).x - map(p - e.yxy).x,
    map(p + e.yyx).x - map(p - e.yyx).x
  ));
}

const vec3 MOON = normalize(vec3(0.42, 0.38, -1.0));

vec3 sky(vec3 ray, vec3 camera) {
  float height = max(ray.y, 0.0);
  vec3 color = mix(vec3(0.045, 0.06, 0.07), vec3(0.004, 0.009, 0.01), pow(height, 0.5));
  float moon = max(dot(ray, MOON), 0.0);
  color += vec3(0.3, 0.28, 0.4) * pow(moon, 10.0);
  color += vec3(2.0, 1.9, 2.2) * smoothstep(0.9983, 0.999, moon);
  // The canopy: dark needle masses against the sky, sliding as you walk.
  if (ray.y > 0.02) {
    vec2 plane = ray.xz / ray.y * 3.0 + camera.xz * 0.35;
    float leaves = fbm(plane * 0.8 + vec2(0.0, u_time * 0.004));
    float mask = smoothstep(0.45, 0.6, leaves + 0.55 * smoothstep(0.05, 0.7, ray.y) - 0.12);
    color = mix(color, vec3(0.002, 0.005, 0.004), mask);
  }
  return color;
}

vec4 render(vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * u_resolution) / u_resolution.y;
  float walk = u_time * 0.22 - u_parallax.y * 2.6;
  vec3 camera = vec3(0.25 * sin(walk * 0.21), 1.45, -walk);
  camera.y += terrain(camera.xz) + 0.03 * sin(walk * 2.2);
  float yaw = 0.12 * sin(walk * 0.13) + 0.08;
  vec3 forward = normalize(vec3(sin(yaw), 0.07, -cos(yaw)));
  vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, forward);
  vec3 ray = normalize(forward * 1.3 + right * uv.x + up * uv.y);

  float travel = 0.05;
  vec2 hit = vec2(0.0);
  bool found = false;
  for (int i = 0; i < 90; i++) {
    vec3 p = camera + ray * travel;
    hit = map(p);
    if (hit.x < 0.002 * travel) { found = true; break; }
    travel += hit.x;
    if (travel > 42.0) break;
  }

  // Mist is darkest away from the moon and glows lavender toward it.
  vec3 haze = mix(vec3(0.012, 0.03, 0.027), vec3(0.11, 0.1, 0.16), pow(max(dot(ray, MOON), 0.0), 4.0));
  vec3 color = sky(ray, camera);
  if (found) {
    vec3 p = camera + ray * travel;
    vec3 n = normalAt(p);
    float moonlight = max(dot(n, MOON), 0.0);
    if (hit.y < 1.5) {
      // Dappled light where the canopy parts, and a paler trail underfoot.
      float dapple = smoothstep(0.52, 0.72, fbm(p.xz * 0.45 + 4.0));
      float trail = 1.0 - smoothstep(0.5, 1.6, abs(p.x));
      color = vec3(0.004, 0.008, 0.007) + vec3(0.05, 0.05, 0.07) * dapple * (0.4 + 0.6 * moonlight);
      color += vec3(0.012, 0.014, 0.016) * trail;
    } else {
      float bark = 0.7 + 0.3 * noise(vec2(atan(n.z, n.x) * 6.0, p.y * 3.0));
      float rim = pow(1.0 - max(dot(n, -ray), 0.0), 3.0) * moonlight;
      color = vec3(0.003, 0.005, 0.005) * bark + vec3(0.07, 0.07, 0.1) * rim;
    }
    // Mist thickens with distance and pools near the ground.
    float mist = 1.0 - exp(-travel * 0.075);
    mist = clamp(mist + 0.18 * smoothstep(0.8, 0.0, p.y) * smoothstep(4.0, 16.0, travel), 0.0, 1.0);
    color = mix(color, haze, mist);
  }

  // Fireflies, in screen space so they read clearly at any depth.
  vec2 screen = fragCoord / u_resolution;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  float ember = 0.0;
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    vec2 home = vec2(hash11(fi * 7.31), 0.12 + 0.42 * hash11(fi * 3.17 + 1.0));
    home.x = fract(home.x - walk * 0.015 * (0.5 + hash11(fi)));
    vec2 drift = 0.035 * vec2(sin(u_time * 0.21 + fi * 2.3), sin(u_time * 0.17 + fi * 1.7));
    float pulse = smoothstep(0.35, 1.0, 0.5 + 0.5 * sin(u_time * (0.5 + 0.4 * hash11(fi + 5.0)) + fi * 4.1));
    ember += glow(screen * aspect, (home + drift) * aspect, 0.009) * pulse;
  }
  color += vec3(0.1, 0.08, 0.04) * ember;
  return vec4(tonemap(color), clamp(ember * 1.4, 0.0, 1.0));
}
