// Trapper — the original tk-ai illustration. A chrome-and-neon still life from
// the cover of a 1990s school binder: crystal, chrome spheres, a spinning cube,
// neon frames and a checkerboard floor. Scrolling orbits the camera.

vec2 scene(vec3 p) {
  float t = u_time * 0.12;
  vec2 hit = vec2(p.y + 1.05, 1.0);

  vec3 q = p - vec3(0.8, 0.55 + 0.08 * sin(t), 0.0);
  q.xz = rotate(t * 0.65 + 0.45) * q.xz;
  q.xy = rotate(0.14) * q.xy;
  hit = nearest(hit, vec2(sdOctahedron(q, 1.35), 2.0));

  q = p - vec3(0.8, 0.55, 0.0);
  q.yz = rotate(0.55 + 0.12 * sin(t * 0.7)) * q.yz;
  hit = nearest(hit, vec2(sdTorus(q, vec2(1.38, 0.065)), 3.0));
  hit = nearest(hit, vec2(length(p - vec3(-1.85, 0.03 + 0.09 * sin(t + 1.0), 0.8)) - 0.85, 3.0));
  hit = nearest(hit, vec2(length(p - vec3(2.65, -0.37, 1.1)) - 0.48, 3.0));
  hit = nearest(hit, vec2(length(p - vec3(-2.6, 1.65, -1.8)) - 0.24, 3.0));

  q = p - vec3(-2.8, 1.4 + 0.12 * sin(t + 2.0), -2.6);
  q.xz = rotate(-t * 0.45 + 0.6) * q.xz;
  q.xy = rotate(0.4) * q.xy;
  hit = nearest(hit, vec2(sdBox(q, vec3(0.62)) - 0.025, 4.0));

  q = p - vec3(-1.0, 1.0, -3.5);
  q.xy = rotate(-0.15 + 0.06 * sin(t * 0.5)) * q.xy;
  float triangle = sdSegment(q, vec3(-1.8, -1.0, 0.0), vec3(1.8, -1.0, 0.0), 0.035);
  triangle = min(triangle, sdSegment(q, vec3(1.8, -1.0, 0.0), vec3(0.0, 1.8, 0.0), 0.035));
  triangle = min(triangle, sdSegment(q, vec3(0.0, 1.8, 0.0), vec3(-1.8, -1.0, 0.0), 0.035));
  hit = nearest(hit, vec2(triangle, 5.0));

  q = p - vec3(2.3, 1.4, -3.0);
  q.yz = rotate(1.25) * q.yz;
  hit = nearest(hit, vec2(sdTorus(q, vec2(0.95, 0.04)), 6.0));
  hit = nearest(hit, vec2(sdBox(p - vec3(0.8, -0.88, 0.0), vec3(1.5, 0.17, 1.12)), 7.0));
  return hit;
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.002, -0.002);
  return normalize(e.xyy * scene(p + e.xyy).x + e.yyx * scene(p + e.yyx).x
                 + e.yxy * scene(p + e.yxy).x + e.xxx * scene(p + e.xxx).x);
}

vec3 environment(vec3 direction) {
  float horizon = exp(-abs(direction.y + 0.08) * 7.0);
  vec3 color = mix(vec3(0.012, 0.008, 0.055), vec3(0.025, 0.15, 0.32), max(direction.y, 0.0));
  color += horizon * mix(vec3(0.65, 0.045, 0.22), vec3(1.0, 0.28, 0.065), smoothstep(-0.4, 0.5, direction.x));
  color += vec3(0.35, 0.85, 1.0) * pow(max(dot(direction, normalize(vec3(-0.7, 0.7, 0.2))), 0.0), 18.0) * 2.0;
  color += vec3(1.0, 0.85, 0.95) * pow(max(dot(direction, normalize(vec3(0.4, 0.8, -0.4))), 0.0), 40.0) * 3.0;
  return color;
}

vec3 materialAt(vec3 p, float id) {
  if (id < 1.5) {
    vec2 tile = floor(p.xz / 1.25);
    float checker = mod(tile.x + tile.y, 2.0);
    return mix(vec3(0.045, 0.012, 0.12), vec3(0.16, 0.025, 0.22), checker);
  }
  if (id < 2.5) return vec3(0.85, 0.025, 0.23);
  if (id < 3.5) return vec3(0.7, 0.8, 0.95);
  if (id < 4.5) return vec3(0.025, 0.3, 0.8);
  if (id < 5.5) return vec3(1.0, 0.06, 0.42);
  if (id < 6.5) return vec3(0.025, 0.85, 1.0);
  return vec3(0.13, 0.018, 0.24);
}

float shadowAt(vec3 p, vec3 light) {
  float shade = 1.0;
  float travel = 0.04;
  for (int i = 0; i < 14; i++) {
    float distance = scene(p + light * travel).x;
    shade = min(shade, 9.0 * distance / travel);
    travel += clamp(distance, 0.045, 0.5);
    if (distance < 0.002 || travel > 5.0) break;
  }
  return clamp(shade, 0.16, 1.0);
}

vec3 reflectionAt(vec3 origin, vec3 direction) {
  float travel = 0.03;
  for (int i = 0; i < 26; i++) {
    vec3 p = origin + direction * travel;
    vec2 hit = scene(p);
    if (hit.x < 0.006) {
      vec3 n = normalAt(p);
      float light = 0.25 + 0.75 * max(dot(n, normalize(vec3(-0.6, 0.8, 0.4))), 0.0);
      vec3 color = materialAt(p, hit.y) * light;
      if (hit.y > 4.5 && hit.y < 6.5) color *= 2.0;
      return mix(color, environment(direction), 0.25);
    }
    travel += hit.x * 0.85;
    if (travel > 16.0) break;
  }
  return environment(direction);
}

vec4 render(vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * u_resolution) / max(u_resolution.y, u_resolution.x * 0.46);
  uv = rotate(-0.1) * uv;
  float sway = sin(u_time * 0.035) * 0.2;
  vec3 camera = vec3(4.0 + sway, 2.55, 7.4);
  vec3 target = vec3(0.1, 0.35, -0.2);
  // About 13 degrees of orbit per screenful scrolled, on a fixed radius.
  camera.xz = target.xz + rotate(u_parallax.y * 0.225) * (camera.xz - target.xz);
  vec3 forward = normalize(target - camera);
  vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, forward);
  vec3 ray = normalize(forward * 1.65 + right * uv.x + up * uv.y);

  float travel = 0.0;
  vec2 hit = vec2(0.0);
  vec3 neon = vec3(0.0);
  bool found = false;
  for (int i = 0; i < 72; i++) {
    vec3 p = camera + ray * travel;
    hit = scene(p);
    if (hit.y > 4.5 && hit.y < 6.5) {
      neon += materialAt(p, hit.y) * 0.0015 / (0.025 + hit.x * hit.x);
    }
    if (hit.x < 0.0025) { found = true; break; }
    travel += hit.x * 0.85;
    if (travel > 30.0) break;
  }

  float ember = 0.0;
  vec3 color = environment(ray) * 0.55;
  if (found) {
    vec3 p = camera + ray * travel;
    vec3 n = normalAt(p);
    vec3 light = normalize(vec3(-0.6, 0.8, 0.4));
    vec3 albedo = materialAt(p, hit.y);
    float diffuse = max(dot(n, light), 0.0);
    float shadow = shadowAt(p + n * 0.015, light);
    float ao = clamp(scene(p + n * 0.18).x / 0.18, 0.35, 1.0);
    float specular = pow(max(dot(n, normalize(light - ray)), 0.0), 55.0);
    float fresnel = pow(1.0 - max(dot(n, -ray), 0.0), 4.0);
    vec3 reflected = environment(reflect(ray, n));
    bool chrome = hit.y > 2.5 && hit.y < 3.5;
    if (chrome || hit.y < 1.5) reflected = reflectionAt(p + n * 0.018, reflect(ray, n));
    color = albedo * (vec3(0.13, 0.16, 0.3) * ao + diffuse * shadow * vec3(0.8, 0.85, 1.0));
    color += vec3(0.9, 0.95, 1.0) * specular * shadow * 0.8;
    color = mix(color, reflected, chrome ? 0.88 : 0.16 + fresnel * 0.32);

    if (hit.y < 1.5) {
      vec2 grid = abs(fract(p.xz / 1.25 + 0.5) - 0.5);
      float line = 1.0 - smoothstep(0.006, 0.022, min(grid.x, grid.y));
      color += vec3(0.2, 0.035, 0.38) * line * exp(-travel * 0.045);
    }
    if (hit.y > 4.5 && hit.y < 6.5) {
      color = albedo * 2.5;
      ember = 1.0;
    }
    color = mix(color, vec3(0.04, 0.012, 0.1), 1.0 - exp(-travel * 0.018));
  }
  color += neon * 0.45;
  ember = max(ember, clamp(dot(neon, vec3(0.33)) * 0.9, 0.0, 1.0));
  color = tonemap(color);
  // Keep the text side of the scene quiet.
  color *= mix(0.48, 0.9, smoothstep(0.05, 0.85, fragCoord.x / u_resolution.x));
  return vec4(color, ember);
}
