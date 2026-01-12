// Particle Vertex Shader
uniform float uTime;
uniform float uPixelRatio;

attribute float size;
attribute float opacity;

varying vec3 vColor;
varying float vOpacity;

void main() {
  vColor = color;
  vOpacity = opacity;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // Size with pixel ratio for crisp rendering
  // For orthographic camera, use direct size (no perspective division)
  gl_PointSize = size * uPixelRatio * 100.0;
  gl_Position = projectionMatrix * mvPosition;
}
