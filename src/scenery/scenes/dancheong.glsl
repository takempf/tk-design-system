// Dancheong — looking up under the corner of a temple's eaves. The rafters
// fan out from the corner over a painted beam; every round rafter end is
// ringed in stepped bands (hwi), every square flying-rafter end boxed in
// them, and the beam carries lotus roundels. Past the tile ends, sky. Lotus
// lanterns hang below and sway. Scrolling turns you under the corner.

const float SPACING = 0.072;   // radians between rafters
const float BEAM_IN = 0.5;
const float BEAM_OUT = 0.7;

// Where the round rafter ends sit: the eave sweeps out toward its corner.
float eave(float angle) {
  return 1.13 * (1.0 + 0.22 * angle * angle);
}

// Concentric stepped rings, white keylines between them: a rafter end.
float roundel(float d, float radius) {
  float r = d / radius;
  if (r > 1.0) return -1.0;
  if (r > 0.86) return 0.08;           // ink rim
  if (r > 0.72) return 0.72;           // white
  if (r > 0.52) return 0.42;           // azure
  if (r > 0.32) return 0.26;           // deep azure
  if (r > 0.2) return 0.66;            // white
  return 0.5;                          // the centre, vermilion
}

vec4 render(vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * u_resolution) / u_resolution.y;
  float aspect = u_resolution.x / u_resolution.y;
  // A narrow frame shows fewer rafters, never smaller ones.
  vec2 p = uv;
  float t = u_time;

  // The corner, below the frame. A slow drift and the page's scroll turn it.
  vec2 corner = vec2(0.0, -0.98);
  float turn = 0.05 * sin(t * 0.05) + u_parallax.y * 0.12;
  vec2 q = rotate(turn) * (p - corner);
  float r = length(q);
  float angle = atan(q.x, q.y);

  float slot = angle / SPACING;
  float index = floor(slot + 0.5);
  float across = (slot - index) * SPACING * r; // distance from the rafter's axis
  float rafterAngle = index * SPACING;
  float ends = eave(rafterAngle);
  bool corner0 = index == 0.0;
  float halfWidth = corner0 ? 0.04 : 0.029;

  // Sky beyond the eaves.
  vec3 color = vec3(0.035);
  float ember = 0.0;

  float roof = eave(angle);
  float tiles = roof + 0.25;
  if (r < tiles) {
    // Under the eaves: dark boards between the rafters.
    color = vec3(r < roof ? 0.1 : 0.07);
  }
  // Tile ends along the eave: round, with a boss in the middle.
  float tileSlot = angle / (SPACING * 0.5);
  float tileIndex = floor(tileSlot + 0.5);
  float tileAngle = tileIndex * SPACING * 0.5;
  float tile = length(q - vec2(sin(tileAngle), cos(tileAngle)) * (eave(tileAngle) + 0.25));
  if (tile < 0.022) color = vec3(tile < 0.008 ? 0.4 : tile > 0.018 ? 0.12 : 0.28);

  // Flying rafters: square-cut, past the round ends, their ends boxed in bands.
  float flyingEnd = ends + 0.2;
  if (abs(across) < halfWidth * 0.9 && r > ends && r < flyingEnd) {
    float along = (flyingEnd - r) / 0.2;
    color = vec3(0.3);
    // Hwi bands across the rafter just before its end.
    if (along < 0.34) {
      float band = floor(along / 0.34 * 4.0);
      color = vec3(band == 0.0 ? 0.08 : band == 1.0 ? 0.62 : band == 2.0 ? 0.4 : 0.2);
    }
  }
  // Their square ends, face on.
  vec2 face = vec2(across, r - flyingEnd) / (halfWidth * 0.9);
  if (abs(face.x) < 1.0 && abs(face.y) < 1.0) {
    float box = max(abs(face.x), abs(face.y));
    color = vec3(box > 0.82 ? 0.08 : box > 0.62 ? 0.7 : box > 0.4 ? 0.36 : 0.62);
    // A four-petal flower in the middle.
    float petals = length(face) - 0.32 * (0.7 + 0.3 * cos(4.0 * atan(face.y, face.x)));
    if (petals < 0.0) color = vec3(0.5);
  }

  // Rafters: verdigris bodies, hwi bands near their ends, round ends ringed.
  if (abs(across) < halfWidth && r > BEAM_OUT && r < ends) {
    float along = (ends - r) / (ends - BEAM_OUT);
    // Rounded: a little lighter along the middle of each log.
    color = vec3(0.33 + 0.06 * (1.0 - pow(abs(across) / halfWidth, 2.0)));
    if (along < 0.2) {
      float band = floor(along / 0.2 * 5.0);
      color = vec3(band == 0.0 ? 0.08 : band == 1.0 ? 0.6 : band == 2.0 ? 0.42 : band == 3.0 ? 0.6 : 0.16);
    }
    // A pale keyline down both edges.
    if (abs(across) > halfWidth * 0.84) color *= 0.5;
  }
  vec2 end = vec2(across, r - ends);
  float ring = roundel(length(end), halfWidth * 1.22);
  if (ring >= 0.0) {
    color = vec3(ring);
    if (ring == 0.5) ember = max(ember, 0.55);
  }

  // The beam the rafters rest on: bands along its edges, lotus roundels.
  if (r > BEAM_IN && r < BEAM_OUT) {
    float depth = (r - BEAM_IN) / (BEAM_OUT - BEAM_IN);
    float edge = min(depth, 1.0 - depth);
    color = vec3(0.24);
    if (edge < 0.24) {
      float band = floor(edge / 0.24 * 4.0);
      color = vec3(band == 0.0 ? 0.08 : band == 1.0 ? 0.56 : band == 2.0 ? 0.38 : 0.62);
    } else {
      // Lotus roundels every other rafter: petals around a stepped heart.
      float lotusSlot = angle / (SPACING * 2.0);
      float lotus = (lotusSlot - floor(lotusSlot + 0.5)) * SPACING * 2.0 * r;
      vec2 l = vec2(lotus, r - (BEAM_IN + BEAM_OUT) * 0.5);
      float petal = length(l) - 0.052 * (0.78 + 0.22 * abs(cos(4.0 * atan(l.y, l.x))));
      if (petal < 0.0) {
        float d = length(l) / 0.052;
        color = vec3(d > 0.75 ? 0.62 : d > 0.5 ? 0.4 : d > 0.25 ? 0.6 : 0.3);
      }
    }
  }
  if (r < BEAM_IN) {
    // Below the beam, the bracket arms in shadow.
    float arm = abs(fract(angle / (SPACING * 3.0)) - 0.5);
    color = vec3(arm < 0.18 ? 0.16 : 0.06);
  }

  // Lotus lanterns hanging under the eaves, swaying on their cords.
  float spread = min(aspect, 1.6);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 hang = vec2((fi - 1.0) * spread * 0.34, 0.6);
    float sway = 0.05 * sin(t * (0.45 + 0.07 * fi) + fi * 2.0);
    float drop = 0.5 + 0.1 * hash11(fi * 3.7 + 1.0);
    vec2 lamp = hang + vec2(sin(sway), -cos(sway)) * drop;
    float cord = sdSegment2(p, hang, lamp);
    if (cord < 0.002 && p.y > lamp.y) color = vec3(0.3);
    vec2 l = (p - lamp) / vec2(0.048, 0.042);
    // A ball of petals: a scalloped rim, rows of petal tips, a tassel below.
    float body = length(l) - (0.88 + 0.12 * abs(cos(5.0 * atan(l.y, l.x))));
    if (body < 0.0) {
      float rows = step(0.5, fract(l.y * 2.0 + 0.3 * abs(sin(l.x * 5.0))));
      color = vec3(0.48 + 0.12 * rows);
      ember = max(ember, 0.6 + 0.25 * rows);
    }
    if (abs(p.x - lamp.x) < 0.003 && p.y < lamp.y - 0.04 && p.y > lamp.y - 0.08) color = vec3(0.4);
    ember = max(ember, glow(p, lamp, 0.055) * 0.3);
  }

  return vec4(color, ember);
}
