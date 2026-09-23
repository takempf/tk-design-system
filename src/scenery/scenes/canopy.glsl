// Canopy — lying on the forest floor, looking straight up. Layers of leaves
// sway at different depths; the sky shows through in shifting gaps and a few
// motes catch the light. Scrolling drifts the branches past.

float leaves(vec2 p, float layer) {
  // Leaf clusters: warped cellular blobs, denser toward the edges of view.
  vec2 warp = vec2(fbm(p * 0.8 + layer * 7.0), fbm(p * 0.8 + layer * 3.0 + 11.0));
  p += (warp - 0.5) * 1.4;
  vec2 cell = floor(p);
  vec2 local = fract(p);
  float nearestDistance = 1.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 point = hash22(cell + offset + layer * 17.0);
      nearestDistance = min(nearestDistance, length(offset + point - local));
    }
  }
  return 1.0 - smoothstep(0.35, 0.62, nearestDistance);
}

// Limbs: the dark ridges of a noise field, thick at the edge of view where
// they reach in from the trunks, thinning to twigs toward the gap.
float branches(vec2 p, float r) {
  float ridge = abs(fbm(p * 0.9 + 3.0) - 0.5);
  float width = 0.006 + 0.03 * smoothstep(0.3, 1.1, r);
  return (1.0 - smoothstep(width * 0.6, width, ridge)) * smoothstep(0.25, 0.8, r);
}

vec4 render(vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * u_resolution) / u_resolution.y;
  float drift = -u_parallax.y * 0.35;
  float wind = u_time * 0.05;

  // Sky: brightest where the canopy is thinnest, a pale lavender wash.
  float r = length(uv);
  vec3 color = mix(vec3(0.5, 0.48, 0.62), vec3(0.18, 0.2, 0.26), smoothstep(0.0, 0.9, r));

  float cover = 0.0;
  for (int i = 0; i < 3; i++) {
    float layer = float(i);
    float depth = 1.0 + layer * 0.6;
    vec2 sway = vec2(sin(wind * (1.0 + layer * 0.3) + layer), cos(wind * 0.8 + layer * 2.0)) * 0.03 / depth;
    vec2 p = (uv + sway + vec2(0.0, drift / depth)) * (2.4 + layer * 1.3) + layer * 5.0;
    float mask = leaves(p, layer) * smoothstep(0.1, 0.75, r + 0.35 - layer * 0.12 + 0.2 * noise(p * 0.3));
    vec3 shade = mix(vec3(0.006, 0.02, 0.014), vec3(0.03, 0.08, 0.05), layer / 2.0);
    // Leaves nearest the light glow through, translucent.
    shade += vec3(0.04, 0.09, 0.05) * (1.0 - smoothstep(0.0, 0.7, r)) * (1.0 - layer * 0.3);
    color = mix(color, shade, mask);
    cover = max(cover, mask);
  }
  float limbs = branches((uv + vec2(0.0, drift * 0.6)) * 2.0, r);
  color = mix(color, vec3(0.004, 0.006, 0.005), limbs);

  // Motes drifting down through the gaps.
  float ember = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float fall = fract(u_time * 0.015 * (0.6 + hash11(fi)) + hash11(fi * 3.3));
    vec2 mote = vec2((hash11(fi * 1.7) - 0.5) * 1.6 + 0.05 * sin(u_time * 0.3 + fi), 0.6 - fall * 1.2);
    ember += glow(uv, mote, 0.005) * smoothstep(0.0, 0.2, fall) * smoothstep(1.0, 0.8, fall);
  }
  ember *= 1.0 - cover * 0.7;
  return vec4(tonemap(color) * 0.95, clamp(ember, 0.0, 1.0));
}
