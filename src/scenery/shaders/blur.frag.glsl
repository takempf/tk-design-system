#version 300 es
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform vec2 u_step;
out vec4 fragColor;

// Separable Gaussian out to three standard deviations. The ember channel (alpha)
// blurs with the color, so emissive spots bloom before they are dithered.
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec4 color = vec4(0.0);
  float total = 0.0;
  for (int i = -6; i <= 6; i++) {
    float offset = float(i) * 0.5;
    float weight = exp(-0.5 * offset * offset);
    color += texture(u_image, uv + u_step * offset) * weight;
    total += weight;
  }
  fragColor = color / total;
}
