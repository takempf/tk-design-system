// Peaks — the sun, the moon and the five peaks (irworobongdo), the screen that
// stood behind the Joseon throne. Five domed peaks rise in nested bands, two
// waterfalls run between them into a rolling sea, a pine stands at either
// side, and over it all hang the white moon and the red sun. Flat and
// symmetric, like the painting. Scrolling moves the near things more than
// the far ones.

// A domed peak at x = centre, foot on `base`, `width` the half-width there.
// Returns its level: 1 at the heart of the foot, 0 on the outline, negative
// outside. Level sets are the outline again, nested toward the foot: the
// painting's stacked ridges.
float peak(vec2 p, float centre, float base, float top, float width) {
  float t = (p.y - base) / (top - base);
  if (t < 0.0) t = 0.0;
  float x = abs(p.x - centre) / width;
  return 1.0 - pow(x, 1.8) - pow(t, 1.25);
}

// Bands stepping from the outline in toward the heart, light on dark.
float banded(float level, float steps, float low, float high) {
  float band = floor(clamp(level, 0.0, 0.999) * steps) / (steps - 1.0);
  // A dark keyline just inside every band edge.
  float edge = fract(level * steps);
  float line = smoothstep(0.0, 0.08, edge);
  return mix(low, high, band) * mix(0.55, 1.0, line);
}

// One pine, rooted at y = -0.42: a red trunk swaying up out of the rocks and
// flat crowns of needles, like the painted ones. `p` runs +x toward the
// middle of the screen.
float pine(vec2 p, out bool hit) {
  hit = false;
  float value = 0.0;
  float lean = 0.06 * sin((p.y + 0.42) * 3.4) - 0.02;
  float width = mix(0.019, 0.009, smoothstep(-0.42, 0.18, p.y));
  float trunk = abs(p.x - lean) - width;
  if (trunk < 0.0 && p.y > -0.44 && p.y < 0.17) {
    hit = true;
    // Bark: plates stacked up the trunk.
    float plate = fract(p.y * 30.0 + 0.5 * step(lean, p.x));
    value = 0.44 + 0.05 * step(0.6, plate);
  }
  // A branch out to each crown, and the crown: three flat lobes, needles
  // drawn as fine strokes, darker toward their underside.
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float y = 0.16 - fi * 0.1;
    float trunkX = 0.06 * sin((y + 0.42) * 3.4) - 0.02;
    float reach = (i == 1 ? -0.07 : 0.06) + 0.01 * fi;
    vec2 centre = vec2(trunkX + reach, y);
    float size = 0.09 - fi * 0.012;
    float branch = sdSegment2(p, vec2(trunkX, y - 0.03), centre) - 0.006;
    if (branch < 0.0) {
      hit = true;
      value = 0.4;
    }
    float crown = 1e3;
    for (int j = 0; j < 3; j++) {
      float fj = float(j) - 1.0;
      vec2 lobe = centre + vec2(fj * size * 0.55, (1.0 - abs(fj)) * 0.012);
      crown = min(crown, length((p - lobe) / vec2(size * 0.62, 0.026)) - 1.0);
    }
    vec2 q = (p - centre) / vec2(size, 0.03);
    if (crown < 0.0 && q.y > -0.5) {
      hit = true;
      float needles = step(0.5, fract(q.x * 9.0 + q.y * 2.0 * sign(q.x)));
      value = mix(0.34, 0.46, needles) * (0.9 + 0.2 * q.y);
    }
  }
  return value;
}

vec4 render(vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * u_resolution) / u_resolution.y;
  float aspect = u_resolution.x / u_resolution.y;
  // Composed 1.6 wide; a narrower frame stands further back, partway.
  float zoom = max(1.0, pow(1.6 / aspect, 0.45));
  vec2 p = uv * zoom;
  float halfWidth = 0.5 * aspect * zoom;
  float scroll = u_parallax.y;
  float t = u_time;

  // Sky: plain, a little lighter toward the horizon.
  vec3 color = vec3(0.035 + 0.02 * smoothstep(0.5, -0.2, p.y));
  float ember = 0.0;

  // The moon at left, the sun at right, level with the highest summit.
  vec2 sky = p + vec2(0.0, scroll * 0.04);
  float sx = min(0.44, halfWidth * 0.62);
  vec2 moon = vec2(-sx, 0.3);
  vec2 sun = vec2(sx, 0.3);
  float radius = 0.052;
  float moonDisc = 1.0 - smoothstep(radius - 0.004, radius, length(sky - moon));
  color = mix(color, vec3(0.78), moonDisc);
  float sunDistance = length(sky - sun);
  float sunDisc = 1.0 - smoothstep(radius - 0.004, radius, sunDistance);
  float breath = 0.5 + 0.5 * sin(t * 0.5);
  float halo = exp(-pow(max(sunDistance - radius, 0.0) / 0.03, 2.0)) * (0.12 + 0.12 * breath);
  color = mix(color, vec3(0.5), sunDisc);
  ember = max(sunDisc, halo * (1.0 - moonDisc));

  // Five peaks, the outer pair furthest back, the tallest at the centre.
  vec2 hills = p + vec2(0.0, scroll * 0.08);
  float base = -0.2;
  float levels[5];
  levels[0] = peak(hills, -0.58, base, 0.08, 0.15);
  levels[1] = peak(hills, 0.58, base, 0.08, 0.15);
  levels[2] = peak(hills, -0.3, base, 0.17, 0.16);
  levels[3] = peak(hills, 0.3, base, 0.17, 0.16);
  levels[4] = peak(hills, 0.0, base, 0.3, 0.19);
  for (int i = 0; i < 5; i++) {
    float level = levels[i];
    if (level > 0.0) {
      // Further peaks a shade dimmer, so each stands in front of the last.
      float depth = i < 2 ? 0.8 : i < 4 ? 0.9 : 1.0;
      color = vec3(banded(level, 5.0, 0.2, 0.62) * depth);
    }
  }

  // Waterfalls in the two clefts beside the central peak: a thread from high
  // up, widening as it drops, white water running down it, and spray at
  // its foot.
  for (int i = 0; i < 2; i++) {
    float side = i == 0 ? -1.0 : 1.0;
    vec2 q = hills - vec2(0.155 * side, 0.0);
    float drop = clamp((0.02 - q.y) / 0.34, 0.0, 1.0);
    float width = mix(0.005, 0.017, drop);
    float fall = abs(q.x + 0.006 * side * sin(drop * 4.0)) - width;
    if (fall < 0.0 && q.y < 0.02 && q.y > -0.33) {
      float run = fract(q.y * 7.0 + t * 0.35 + hash11(floor(q.x * 260.0)) * 0.6);
      color = vec3(0.5 + 0.2 * step(0.5, run));
    }
    float spray = length((q - vec2(0.0, -0.31)) / vec2(0.045, 0.016)) - 1.0;
    if (spray < 0.0) color = vec3(0.62 - 0.1 * step(-0.45, spray));
  }

  // Rocky foothills along the foot of the peaks, banded like them.
  vec2 rocks = p + vec2(0.0, scroll * 0.1);
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float x = (fi - 4.0) * 0.2 + 0.05 * sin(fi * 2.3);
    float level = peak(rocks, x, -0.34, -0.2 - 0.04 * hash11(fi * 1.7), 0.13);
    // Leave the waterfalls their clefts.
    if (level > 0.0 && abs(abs(rocks.x) - 0.155) > 0.017) {
      color = vec3(banded(level, 3.0, 0.16, 0.36));
    }
  }

  // The pines, one at either edge.
  vec2 trees = p + vec2(0.0, scroll * 0.12);
  // In a narrow frame they stand at its very edges, half out of it.
  float px = halfWidth - mix(0.02, 0.13, smoothstep(0.55, 0.8, halfWidth));
  for (int i = 0; i < 2; i++) {
    float side = i == 0 ? -1.0 : 1.0;
    bool hit;
    float value = pine((trees - vec2(px * side, 0.0)) * vec2(-side, 1.0), hit);
    if (hit) color = vec3(value);
  }

  // The sea: rows of scalloped waves, foam on every crest, rolling slowly
  // one way and the next row the other.
  vec2 sea = p + vec2(0.0, scroll * 0.14);
  float shore = -0.32;
  if (sea.y < shore + 0.04) {
    float rowHeight = 0.058;
    float row = floor((shore - sea.y) / rowHeight);
    for (int k = 1; k >= 0; k--) {
      float r = row + float(k);
      if (r < 0.0) continue;
      float rowBase = shore - (r + 1.0) * rowHeight;
      float direction = mod(r, 2.0) < 1.0 ? 1.0 : -1.0;
      float x = sea.x * (7.0 - min(r, 4.0) * 0.6) + r * 0.37 + direction * t * 0.05;
      float arc = 1.0 - pow(abs(fract(x) - 0.5) * 2.0, 2.0);
      float bob = 0.08 * sin(t * 0.6 + r * 1.3 + floor(x) * 2.1);
      // Never below the row above's foot, so no sky shows between rows.
      float crest = (1.1 + 0.4 * arc + bob) * rowHeight;
      float depth = rowBase + crest - sea.y;
      if (depth > 0.0) {
        float band = floor(depth / rowHeight * 4.0);
        float foam = 1.0 - step(0.16, depth / rowHeight);
        color = vec3(mix(0.3 - min(band, 3.0) * 0.05, 0.62, foam));
        break;
      }
    }
  }

  return vec4(color, ember);
}
