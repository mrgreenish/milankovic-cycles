// One screen-space line for every guide in the scene. The curve is evaluated
// in the vertex shader, so shapes morph through uniforms with no buffer writes.
export const LINE_KIND = { ellipse: 0, segment: 1, ring: 2, arc: 3 } as const;
export type LineKind = keyof typeof LINE_KIND;

export const lineVertex = /* glsl */ `
  uniform int uKind;
  uniform vec4 uP;
  uniform vec4 uQ;
  uniform float uWidth;
  uniform vec2 uViewport;
  attribute float aT;
  attribute float aSide;
  varying float vT;
  varying float vSide;
  varying float vHidden;

  vec3 curve(float t) {
    if (uKind == 0) {
      // Ellipse in the orbital plane with the Sun at one focus: P = (a, b, c).
      float angle = t * 6.28318530718;
      return vec3(uP.x * cos(angle) - uP.z, 0.0, uP.y * sin(angle));
    }
    if (uKind == 1) return mix(uP.xyz, uQ.xyz, t);
    float angle = uP.z + t * uP.w;
    // Horizontal ring at a height: P = (radius, height, start, span), centre Q.
    if (uKind == 2) return vec3(uP.x * cos(angle), uP.y, uP.x * sin(angle)) + uQ.xyz;
    // Upright arc measured from the local pole, leaning toward -X.
    return vec3(-uP.x * sin(angle), uP.x * cos(angle), 0.0);
  }

  void main() {
    vec4 here = modelViewMatrix * vec4(curve(aT), 1.0);
    vec4 ahead = modelViewMatrix * vec4(curve(aT + 0.004), 1.0);
    // Offsets are meaningless behind the camera; drop those triangles.
    vHidden = here.z > -0.12 || ahead.z > -0.12 ? 1.0 : 0.0;
    vec4 clip = projectionMatrix * here;
    vec4 clipAhead = projectionMatrix * ahead;
    vec2 direction =
      clipAhead.xy / max(clipAhead.w, 0.0001) * uViewport -
      clip.xy / max(clip.w, 0.0001) * uViewport;
    float reach = length(direction);
    direction = reach > 0.00001 ? direction / reach : vec2(1.0, 0.0);
    clip.xy += vec2(-direction.y, direction.x) * aSide * uWidth / uViewport * clip.w;
    gl_Position = clip;
    vT = aT;
    vSide = aSide;
  }
`;

export const lineFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uDash;
  uniform float uFlow;
  uniform float uHead;
  uniform float uTrail;
  uniform float uGradient;
  varying float vT;
  varying float vSide;
  varying float vHidden;

  void main() {
    if (vHidden > 0.001 || uOpacity < 0.004) discard;
    float edge = abs(vSide);
    // A crisp core with a soft halo out to the quad edge.
    float alpha = max(1.0 - smoothstep(0.3, 0.5, edge), pow(1.0 - edge, 2.2) * 0.32);
    if (uDash > 0.0) {
      float phase = fract(vT * uDash - uFlow);
      alpha *= smoothstep(0.0, 0.07, phase) * (1.0 - smoothstep(0.5, 0.57, phase));
    }
    // Rays fade in from their source end.
    alpha *= mix(1.0, smoothstep(0.0, 0.9, vT), uGradient);
    vec3 color = uColor;
    if (uTrail > 0.0) {
      float glow = exp(-fract(uHead - vT) / uTrail);
      alpha *= 0.42 + 0.58 * glow;
      color *= 1.0 + glow * 0.9;
    }
    gl_FragColor = vec4(color, alpha * uOpacity);
    #include <colorspace_fragment>
  }
`;
