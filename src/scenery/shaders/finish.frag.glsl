#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_bayerSize;
uniform float u_ditherStrength;
uniform vec3 u_inks[5];
uniform vec3 u_ember;
uniform vec2 u_tone;
uniform float u_key;
uniform int u_preview;
out vec4 fragColor;

float bayer2(vec2 p) {
  p = mod(floor(p), 2.0);
  return 2.0 * p.x + 3.0 * p.y - 4.0 * p.x * p.y;
}

// Ordered threshold in [0, 1). Anchored to the output grid, never to the scene,
// so the pattern stays fixed on screen while the illustration moves beneath it.
float bayer(vec2 p) {
  if (u_bayerSize < 3.0) return (bayer2(p) + 0.5) / 4.0;
  float four = 4.0 * bayer2(p) + bayer2(floor(p / 2.0));
  if (u_bayerSize < 5.0) return (four + 0.5) / 16.0;
  return (4.0 * four + bayer2(floor(p / 4.0)) + 0.5) / 64.0;
}

// Between luma and the brightest channel, so saturated neon reads as bright
// rather than as dark as its green channel.
float lightness(vec3 color) {
  return mix(dot(color, vec3(0.2126, 0.7152, 0.0722)), max(color.r, max(color.g, color.b)), 0.5);
}

void main() {
  vec4 source = textureLod(u_image, gl_FragCoord.xy / u_resolution, 0.0);
  if (u_preview == 1) {
    fragColor = vec4(source.rgb + u_ember * source.a, 1.0);
    return;
  }
  float threshold = mix(0.5, bayer(gl_FragCoord.xy), u_ditherStrength);

  // Auto-exposure: the smallest mip level is the frame's average, pulled part of
  // the way toward the theme's key. Dim and bright scenes land in the same tone
  // window, while a night scene still stays darker than a studio one.
  float average = lightness(textureLod(u_image, vec2(0.5), 16.0).rgb);
  float exposure = clamp(pow(u_key / max(average, 0.02), 0.6), 0.6, 2.4);

  // A gradient map: lightness picks one of five inks, so any scene is re-inked
  // entirely by the theme. Ramps may run light-to-dark for a negative print.
  float tone = smoothstep(u_tone.x, u_tone.y, lightness(source.rgb) * exposure);
  int ink = int(clamp(floor(tone * 4.0 + threshold), 0.0, 4.0));
  vec3 color = u_inks[ink];

  // Emissive spots scatter into the ember ink with the same ordered pattern.
  float ember = smoothstep(0.06, 0.85, source.a);
  if (ember > 1.0 - threshold) color = u_ember;

  fragColor = vec4(color, 1.0);
}
