// Particle Fragment Shader
varying vec3 vColor;
varying float vOpacity;

void main() {
  // Distance from center of point (0-0.5 range from center to edge)
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // Discard pixels outside circle
  if (dist > 0.5) discard;

  // Soft glow falloff - brighter center, fading edges
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);

  // Extra glow intensity at center
  float glow = exp(-dist * 4.0);

  // Combine color with glow
  vec3 finalColor = vColor * (1.0 + glow * 0.5);

  // Apply opacity
  float finalAlpha = alpha * vOpacity;

  gl_FragColor = vec4(finalColor, finalAlpha);
}
