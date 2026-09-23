// Aurora — northern lights folding over a ridge of pines. Stars wheel slowly,
// the curtains ripple, and far below one cabin window is lit.
// Scrolling tilts the view up into the sky.

float pines(float x, float scale, float seed) {
  // A ridge line with a sawtooth of conifers along it.
  float ridge = 0.25 * fbm(vec2(x * 0.35 * scale + seed, seed)) - 0.1;
  float tree = fract(x * scale * 3.0 + seed);
  float jitter = hash11(floor(x * scale * 3.0 + seed) + seed * 13.0);
  float peak = (1.0 - abs(tree - 0.5) * 2.0) * (0.06 + 0.08 * jitter) / scale;
  return ridge + peak;
}

vec4 render(vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * u_resolution) / u_resolution.y;
  float tilt = -u_parallax.y * 0.25;
  vec2 sky = uv + vec2(0.0, tilt);

  vec3 color = mix(vec3(0.02, 0.03, 0.05), vec3(0.002, 0.004, 0.01), smoothstep(-0.2, 0.6, sky.y));

  // Stars, turning around a pole off the top of the frame.
  vec2 polar = rotate(u_time * 0.004) * (sky - vec2(0.3, 1.1));
  vec2 starCell = floor(polar * 70.0);
  float star = step(0.985, hash12(starCell));
  float twinkle = 0.6 + 0.4 * sin(u_time * 2.0 + hash12(starCell + 3.0) * 30.0);
  color += vec3(0.5) * star * twinkle * smoothstep(-0.05, 0.2, sky.y);

  // Curtains: bands of light whose folds drift along the horizon.
  float curtains = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float x = sky.x * (1.2 + fi * 0.4) + u_time * (0.02 + fi * 0.008) + fi * 3.0;
    float base = 0.12 + fi * 0.09 + 0.08 * sin(x * 1.3 + fbm(vec2(x * 0.6, fi)) * 3.0);
    float height = sky.y - base;
    float fold = fbm(vec2(x * 3.0, u_time * 0.05 + fi));
    float band = smoothstep(0.0, 0.03, height) * exp(-height * (5.0 - fi)) * (0.4 + 0.9 * fold);
    curtains += band * (1.0 - fi * 0.25);
  }
  color += mix(vec3(0.05, 0.3, 0.2), vec3(0.3, 0.22, 0.5), smoothstep(0.1, 0.5, sky.y)) * curtains * 0.28;

  // Two ridges of pines, the nearer one darker.
  float far = pines(uv.x, 1.0, 2.0) - 0.08;
  float near = pines(uv.x + 0.3, 0.6, 7.0) - 0.22;
  if (sky.y < far) color = mix(vec3(0.008, 0.014, 0.016), color, 0.25);
  if (sky.y < near) color = vec3(0.002, 0.004, 0.004);

  // The cabin: one warm window among the near trees.
  vec2 cabin = vec2(-0.42, pines(-0.42 + 0.3, 0.6, 7.0) - 0.28);
  float window = 1.0 - smoothstep(0.0, 0.006, max(abs(sky.x - cabin.x) - 0.012, abs(sky.y - cabin.y) - 0.009));
  float halo = glow(sky, cabin, 0.05) * 0.5;
  float ember = clamp(window + halo * step(sky.y, near + 0.02), 0.0, 1.0);
  color += vec3(0.3, 0.12, 0.03) * ember;
  return vec4(tonemap(color), ember);
}
