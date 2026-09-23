// Contour — a surveyor's map of the hills. Isolines drift as the land slowly
// breathes, every fifth line is an index contour, the slopes are hill-shaded,
// and a few waypoints pulse on the peaks. Scrolling pans north.

// Three smooth octaves: enough for ridges and valleys, few enough that the
// isolines read as land rather than noise.
float terrain(vec2 p) {
  float sum = 0.0;
  float amplitude = 0.55;
  for (int i = 0; i < 3; i++) {
    sum += amplitude * noise(p);
    p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.1 + 13.1;
    amplitude *= 0.42;
  }
  return sum;
}

float height(vec2 p) {
  vec2 q = p + 0.25 * vec2(noise(p * 0.5 + u_time * 0.02), noise(p * 0.5 - u_time * 0.017 + 5.0));
  return terrain(q * 0.55) * 1.4 + 0.2 * sin(q.x * 0.5) * cos(q.y * 0.4);
}

vec4 render(vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * u_resolution) / u_resolution.y;
  vec2 p = uv * 3.0 + vec2(0.0, -u_parallax.y * 1.1) + vec2(3.0, 1.0);

  float h = height(p);
  float levels = 12.0;
  float scaled = h * levels;
  // Screen-space line width so contours stay one weight at every slope.
  float width = fwidth(scaled);
  float line = 1.0 - smoothstep(0.0, width * 1.2, abs(fract(scaled - 0.5) - 0.5));
  float index = 1.0 - smoothstep(0.0, width * 2.2, abs(fract(scaled / 5.0 - 0.5) - 0.5) * 5.0);

  // Hill shading from the north-west.
  vec2 e = vec2(0.01, 0.0);
  vec3 n = normalize(vec3(height(p - e.xy) - height(p + e.xy), 2.0 * e.x * 3.0, height(p - e.yx) - height(p + e.yx)));
  float shade = clamp(dot(n, normalize(vec3(-0.6, 0.6, 0.5))), 0.0, 1.0);

  vec3 color = vec3(0.012, 0.018, 0.018) + vec3(0.07, 0.08, 0.08) * shade * h;
  color += vec3(0.12, 0.13, 0.13) * line;
  color += vec3(0.4, 0.42, 0.45) * index;

  // A grid, very faint, like the survey sheet it's printed on.
  vec2 grid = abs(fract(p * 1.25) - 0.5);
  color += vec3(0.02) * (1.0 - smoothstep(0.0, fwidth(p.x) * 2.0, min(grid.x, grid.y)));

  // Waypoints: small pulsing rings on high ground.
  float ember = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 cell = vec2(fi * 2.7, floor(p.y / 4.0) * 4.0 + fi * 1.3);
    vec2 site = vec2(mod(cell.x, 8.0) + 1.0, cell.y + 2.0 * hash11(fi + cell.y));
    float ring = abs(length(p - site) - 0.12 - 0.05 * sin(u_time * 1.2 + fi));
    ember += (1.0 - smoothstep(0.0, 0.03, ring)) * step(0.7, height(site));
  }
  return vec4(tonemap(color * 1.4), clamp(ember, 0.0, 1.0));
}
