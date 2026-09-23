// Monolith — a brutalist hall that goes on further than it should. Concrete
// piers recede in rows, a hard shaft of light falls from an oculus, and in it
// hangs a black inverted pyramid, turning slowly, edged in red.
// Scrolling walks you down the hall.

const float BAY = 4.0;

vec2 map(vec3 p) {
  // Floor and coffered ceiling.
  vec2 hit = vec2(p.y, 1.0);
  float ceiling = 9.0 - p.y;
  vec2 coffer = abs(fract(p.xz / 2.0) - 0.5);
  ceiling += 0.25 * step(0.4, max(coffer.x, coffer.y));
  hit = nearest(hit, vec2(ceiling, 1.0));

  // Two rows of square piers, repeated down the hall.
  vec3 q = p;
  q.x = abs(q.x) - 5.0;
  q.z = mod(q.z + BAY * 0.5, BAY) - BAY * 0.5;
  hit = nearest(hit, vec2(sdBox(q, vec3(0.6, 9.0, 0.6)), 2.0));

  // Side walls behind the piers.
  hit = nearest(hit, vec2(9.0 - abs(p.x), 2.0));

  // The monolith: an inverted pyramid hanging above the floor.
  vec3 m = p - vec3(0.0, 5.6 + 0.15 * sin(u_time * 0.2), -14.0);
  m.xz = rotate(u_time * 0.05) * m.xz;
  m.y = -m.y;
  hit = nearest(hit, vec2(sdPyramid(m / 4.2, 1.2) * 4.2, 3.0));
  return hit;
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.005, 0.0);
  return normalize(vec3(
    map(p + e.xyy).x - map(p - e.xyy).x,
    map(p + e.yxy).x - map(p - e.yxy).x,
    map(p + e.yyx).x - map(p - e.yyx).x
  ));
}

// Soft shadow toward the oculus, so the shaft carves the floor.
float shadow(vec3 p, vec3 light) {
  float shade = 1.0;
  float travel = 0.1;
  for (int i = 0; i < 24; i++) {
    float d = map(p + light * travel).x;
    shade = min(shade, 6.0 * d / travel);
    travel += clamp(d, 0.1, 1.2);
    if (d < 0.001 || travel > 14.0) break;
  }
  return clamp(shade, 0.0, 1.0);
}

vec4 render(vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * u_resolution) / u_resolution.y;
  float walk = u_time * 0.08 - u_parallax.y * 2.0;
  vec3 camera = vec3(1.4, 1.7, 6.0 - mod(walk, BAY * 2.0));
  vec3 target = camera + vec3(-0.12, 0.28, -1.0);
  vec3 forward = normalize(target - camera);
  vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, forward);
  vec3 ray = normalize(forward * 1.35 + right * uv.x + up * uv.y);

  float travel = 0.0;
  vec2 hit = vec2(0.0);
  bool found = false;
  for (int i = 0; i < 110; i++) {
    vec3 p = camera + ray * travel;
    hit = map(p);
    if (hit.x < 0.002 * max(1.0, travel)) { found = true; break; }
    travel += hit.x * 0.9;
    if (travel > 60.0) break;
  }

  vec3 light = normalize(vec3(0.15, 1.0, 0.1));
  vec3 color = vec3(0.03);
  float ember = 0.0;
  if (found) {
    vec3 p = camera + ray * travel;
    vec3 n = normalAt(p);
    // The oculus lights a disc of the hall; the rest is ambient bounce.
    float pool = smoothstep(9.0, 2.0, length(p.xz - vec2(0.0, -14.0)));
    float direct = max(dot(n, light), 0.0) * shadow(p + n * 0.02, light) * pool;
    float concrete = 0.7 + 0.3 * fbm(p.xz * 1.5 + p.y * 2.0);
    // Light pooled under the oculus bounces round the hall and up the piers.
    float bounce = 0.35 + 0.65 * smoothstep(22.0, 4.0, length(p.xz - vec2(0.0, -14.0)));
    float ambient = (0.55 + 0.45 * abs(n.x)) * bounce;
    color = vec3(0.07, 0.068, 0.064) * concrete * ambient + vec3(0.7, 0.68, 0.64) * direct * concrete;
    if (hit.y > 2.5) {
      // Blacker than black, except the rim.
      color = vec3(0.002);
      vec3 m = p - vec3(0.0, 5.6 + 0.15 * sin(u_time * 0.2), -14.0);
      float rim = smoothstep(0.35, 0.0, abs(m.y + 0.05));
      ember = rim;
      color += vec3(0.6, 0.05, 0.05) * rim;
    }
    // Red wayfinding strips at the foot of every pier.
    if (hit.y > 1.5 && hit.y < 2.5 && p.y < 0.12) {
      ember = max(ember, 0.9);
      color += vec3(0.4, 0.02, 0.02);
    }
    color = mix(color, vec3(0.035, 0.034, 0.033), 1.0 - exp(-travel * 0.04));
  }

  // Volumetric shaft: march the ray through the cone of light.
  float beam = 0.0;
  for (int i = 0; i < 24; i++) {
    float t = (float(i) + hash12(fragCoord)) / 24.0 * min(travel, 40.0);
    vec3 p = camera + ray * t;
    float radius = 2.2 + (9.0 - p.y) * 0.12;
    beam += smoothstep(radius, radius * 0.4, length(p.xz - vec2(0.0, -14.0))) * step(0.0, p.y);
  }
  color += vec3(0.08, 0.08, 0.075) * beam / 24.0 * 3.0;
  return vec4(tonemap(color), ember);
}
