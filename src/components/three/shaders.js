// Earth vertex shader
export const earthVertexShader = `
  uniform vec3 sunDirection;
  uniform float displacementScale;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying vec3 vTangent;
  varying vec3 vBitangent;

  void main() {
    vUv = uv;
    vec3 displacedPosition = position;
    vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
    vWorldPosition = worldPosition.xyz;

    vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
    vViewPosition = -mvPosition.xyz;

    vNormal = normalMatrix * normal;

    // Compute tangent for normal mapping on UV-mapped sphere
    vec3 t = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
    if (length(t) < 0.001) t = normalize(cross(normal, vec3(1.0, 0.0, 0.0)));
    vTangent = normalMatrix * t;
    vBitangent = cross(vNormal, vTangent);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Earth fragment shader
export const earthFragmentShader = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform sampler2D normalMap;
  uniform sampler2D specularMap;
  uniform vec3 sunDirection;

  uniform vec3 ambientLightColor;
  uniform vec3 directionalLightColor;
  uniform vec3 directionalLightDirection;
  uniform float temperature;
  uniform float precession;
  uniform float iceFactor;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying vec3 vTangent;
  varying vec3 vBitangent;

  void main() {
    vec4 dayColor = texture2D(dayTexture, vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);

    // Normal mapping — perturb surface normal with the normal map
    vec3 normalMapSample = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
    normalMapSample.xy *= 0.8;
    mat3 TBN = mat3(normalize(vTangent), normalize(vBitangent), normalize(vNormal));
    vec3 normal = normalize(TBN * normalMapSample);

    vec3 sunDir = normalize(sunDirection);
    float sunInfluence = dot(normal, sunDir);
    float mixValue = smoothstep(-0.2, 0.2, sunInfluence);
    vec4 color = mix(nightColor, dayColor, mixValue);

    // Atmosphere — two-layer fresnel effect
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 3.0);
    vec3 atmosphereColor = vec3(0.4, 0.7, 1.0);
    // Day side: bright atmosphere rim
    color.rgb += atmosphereColor * fresnel * max(0.0, sunInfluence) * 0.5;
    // Terminator: subtle warm glow
    float terminator = 1.0 - smoothstep(-0.1, 0.3, abs(sunInfluence));
    color.rgb += vec3(1.0, 0.5, 0.2) * fresnel * terminator * 0.15;

    // Night glow
    float nightGlow = pow(max(0.0, -sunInfluence), 2.0) * 0.3;
    color.rgb += nightColor.rgb * nightGlow;

    // Directional lighting
    vec3 lightDir = normalize(directionalLightDirection);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 lighting = ambientLightColor + directionalLightColor * diff;
    color.rgb *= lighting;

    // Specular highlights — ocean reflections
    float specularMask = texture2D(specularMap, vUv).r;
    vec3 viewDir = normalize(vViewPosition);
    vec3 halfDir = normalize(sunDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 64.0) * specularMask;
    color.rgb += vec3(1.0, 0.95, 0.8) * spec * 0.6 * max(0.0, sunInfluence);

    // Ice factor — desaturation
    vec3 gray = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));
    color.rgb = mix(gray, color.rgb, iceFactor);

    gl_FragColor = color;
  }
`;

// Atmosphere glow vertex shader
export const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

// Atmosphere glow fragment shader
export const atmosphereFragmentShader = `
  uniform vec3 sunDirection;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float rim = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0);

    float sunFacing = dot(-normal, normalize(sunDirection));
    float dayFactor = smoothstep(-0.2, 0.5, sunFacing);

    vec3 dayColor = vec3(0.3, 0.6, 1.0);
    vec3 nightColor = vec3(0.05, 0.1, 0.2);
    vec3 color = mix(nightColor, dayColor, dayFactor);

    float alpha = rim * mix(0.15, 0.6, dayFactor);

    // Push color above 1.0 so bloom picks it up
    gl_FragColor = vec4(color * 1.5, alpha);
  }
`;
