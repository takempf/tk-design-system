// Bojagi — a ramie patchwork wrapping cloth hung in a window. Scraps of
// every size are cut square and seamed together; light comes through them
// at different strengths, the seams catch it, and a breeze moves through
// the cloth. Now and then a scrap is dyed vermilion. Scrolling draws the
// cloth up.

const float BLOCK = 0.62;

vec4 render(vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * u_resolution) / u_resolution.y;
  float t = u_time;

  // The breeze: the cloth shifts a little and its folds pass across it.
  vec2 p = uv + vec2(0.0, -u_parallax.y * 0.3);
  p.x += 0.012 * sin(p.y * 3.1 + t * 0.35);
  p.y += 0.008 * sin(p.x * 2.3 - t * 0.27);
  float fold = 0.88 + 0.16 * sin(p.x * 2.4 + t * 0.21 + 1.3 * sin(p.y * 1.6 - t * 0.13));

  // Cut each block of cloth into scraps: split the longer side somewhere
  // near its middle, again and again, stopping early now and then so some
  // scraps stay large.
  vec2 cell = floor(p / BLOCK);
  vec2 lo = cell * BLOCK;
  vec2 hi = lo + BLOCK;
  float id = hash12(cell + 7.0);
  for (int i = 0; i < 6; i++) {
    vec2 size = hi - lo;
    if (min(size.x, size.y) < 0.09) break;
    float h1 = hash11(id * 91.7 + float(i) * 3.1);
    float h2 = hash11(id * 37.3 + float(i) * 5.7);
    if (i > 1 && h1 < 0.26) break;
    float cut = mix(0.3, 0.7, h2);
    if (size.x > size.y * mix(0.8, 1.25, h1)) {
      float x = lo.x + size.x * cut;
      if (p.x < x) { hi.x = x; id = id * 1.31 + 0.17; } else { lo.x = x; id = id * 1.73 + 0.41; }
    } else {
      float y = lo.y + size.y * cut;
      if (p.y < y) { hi.y = y; id = id * 1.47 + 0.29; } else { lo.y = y; id = id * 1.19 + 0.53; }
    }
    id = fract(id);
  }

  // The scrap: one of five weights of ramie, the light through it.
  float shade = hash11(id * 113.0);
  float tone = 0.16 + 0.09 * floor(shade * 5.0);
  // A faint weave.
  vec2 thread = abs(fract(p * 180.0) - 0.5);
  tone *= 0.94 + 0.06 * step(0.3, min(thread.x, thread.y));
  vec3 color = vec3(tone * fold);
  // Dyed scraps are never mere slivers.
  float dyed = step(hash11(id * 57.0), 0.08) * step(0.07, min(hi.x - lo.x, hi.y - lo.y));
  float ember = 0.7 * dyed;

  // Seams: where scraps meet, the folded-over edges are doubled cloth, a
  // bright line with a darker margin either side.
  float edge = min(min(p.x - lo.x, hi.x - p.x), min(p.y - lo.y, hi.y - p.y));
  if (edge < 0.012) {
    color = vec3(edge < 0.005 ? 0.58 * fold : tone * fold * 0.55);
    ember = 0.0;
  }
  return vec4(color, ember);
}
