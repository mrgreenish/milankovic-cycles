// Small, bounded shader programs. All light vectors and normals use world space.
export const sphereVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vTangent;
  varying vec3 vLocal;
  void main() {
    vUv = uv;
    vLocal = normal;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec3 tangent = normalize(vec3(normal.z, 0.0, -normal.x) + vec3(0.00001, 0.0, 0.0));
    vTangent = normalize(mat3(modelMatrix) * tangent);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const common = /* glsl */ `
  uniform float uTime;
  uniform float uDetail;
  uniform sampler2D uNoise;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vTangent;
  varying vec3 vLocal;
  vec2 cloudUv(vec2 uv) {
    float latitudeFade = sin(uv.y * 3.14159265);
    vec2 drift = vec2(uTime * 0.00055, 0.0);
    if (uDetail < 0.5) return uv + drift;
    vec2 flow = texture2D(uNoise, uv * vec2(3.0, 2.0) + vec2(uTime * 0.001, 0.0)).rg - 0.5;
    return uv + drift + flow * 0.005 * latitudeFade * min(uDetail, 1.0);
  }
`;

export const earthFragment = /* glsl */ `
  ${common}
  uniform sampler2D uDay;
  uniform sampler2D uSurface;
  uniform sampler2D uNight;
  uniform sampler2D uClouds;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 sun = normalize(-vWorld);
    vec3 view = normalize(cameraPosition - vWorld);
    float sunHeight = dot(normal, sun);
    vec3 surface = texture2D(uSurface, vUv).rgb;
    float ocean = surface.b;
    vec2 perturbation = (surface.rg * 2.0 - 1.0) * min(uDetail, 1.0);
    vec3 tangent = normalize(vTangent);
    vec3 bitangent = normalize(cross(normal, tangent));
    vec3 terrainNormal = normalize(normal * sqrt(max(0.1, 1.0 - dot(perturbation, perturbation))) + tangent * perturbation.x + bitangent * perturbation.y);
    float daylight = smoothstep(-0.08, 0.16, sunHeight);
    float diffuse = max(dot(terrainNormal, sun), 0.0);
    vec3 albedo = texture2D(uDay, vUv).rgb;
    // Preserve actual coastlines while giving deep ocean its blue optical depth.
    albedo = mix(albedo, mix(vec3(0.006, 0.022, 0.052), albedo, 0.45), ocean * 0.65);
    float shadow = 0.0;
    if (uDetail > 0.5) {
      vec2 offset = vec2(dot(sun, tangent), dot(sun, bitangent)) * (0.002 / max(0.25, sunHeight));
      shadow = texture2D(uClouds, cloudUv(vUv + offset)).r * 0.42 * daylight;
    }
    vec3 color = albedo * (vec3(0.015, 0.022, 0.037) + 1.65 * diffuse * (1.0 - shadow));
    // Fresnel ocean reflection. No shadow map or environment cubemap required.
    vec3 halfVector = normalize(sun + view);
    float fresnel = 0.025 + 0.45 * pow(1.0 - max(dot(view, normal), 0.0), 5.0);
    float specular = pow(max(dot(normal, halfVector), 0.0), 90.0);
    color += vec3(1.0, 0.91, 0.72) * specular * ocean * (0.35 + fresnel) * daylight * (1.0 - shadow);
    float night = texture2D(uNight, vUv).r;
    color += vec3(1.0, 0.58, 0.23) * pow(night, 1.3) * (1.0 - smoothstep(-0.18, 0.04, sunHeight)) * 1.8;
    float rim = pow(1.0 - max(dot(normal, view), 0.0), 3.5);
    vec3 atmosphere = mix(vec3(0.52, 0.16, 0.035), vec3(0.12, 0.4, 0.95), smoothstep(-0.08, 0.35, sunHeight));
    color = mix(color, atmosphere, rim * smoothstep(-0.2, 0.22, sunHeight) * 0.52);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const cloudsFragment = /* glsl */ `
  ${common}
  uniform sampler2D uClouds;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 sun = normalize(-vWorld);
    vec3 view = normalize(cameraPosition - vWorld);
    float sunHeight = dot(normal, sun);
    vec2 uv = cloudUv(vUv);
    float density = texture2D(uClouds, uv).r;
    float cirrus = 0.0;
    if (uDetail > 1.5) {
      cirrus = texture2D(uClouds, uv + vec2(-uTime * 0.00018, 0.002)).r * 0.08;
    }
    float alpha = smoothstep(0.08, 0.88, density + cirrus) * 0.94;
    float daylight = smoothstep(-0.13, 0.24, sunHeight);
    vec3 twilight = mix(vec3(0.017, 0.028, 0.055), vec3(0.68, 0.26, 0.09), smoothstep(-0.15, 0.0, sunHeight));
    vec3 color = mix(twilight, vec3(1.25, 1.3, 1.37) * (0.25 + max(sunHeight, 0.0)), daylight);
    if (uDetail > 0.5) {
      float height = texture2D(uClouds, uv + vec2(0.0015, 0.0008)).r;
      color *= 1.0 + clamp((density - height) * 1.8, -0.22, 0.2);
    }
    color += vec3(0.14, 0.3, 0.55) * pow(1.0 - max(dot(normal, view), 0.0), 4.0) * daylight;
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const atmosphereFragment = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormal;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vWorld);
    float sunHeight = dot(normal, normalize(-vWorld));
    // Back-face shell: grazing rays traverse more atmosphere, then fade outward.
    float grazing = pow(max(0.0, 1.0 - abs(dot(normal, view))), 5.0);
    float sunlight = smoothstep(-0.25, 0.5, sunHeight);
    vec3 color = mix(vec3(0.75, 0.19, 0.035), vec3(0.12, 0.42, 1.0), smoothstep(-0.07, 0.22, sunHeight));
    gl_FragColor = vec4(color, grazing * (0.015 + sunlight * 0.5));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const sunFragment = /* glsl */ `
  ${common}
  // Triplanar noise avoids a pinched polar pattern on the solar surface.
  float solarNoise(vec3 p) {
    vec3 w = abs(normalize(p));
    w /= w.x + w.y + w.z;
    return texture2D(uNoise, p.yz).r * w.x + texture2D(uNoise, p.xz).g * w.y + texture2D(uNoise, p.xy).b * w.z;
  }
  void main() {
    vec3 p = normalize(vLocal);
    vec3 drift = vec3(uTime * 0.012, -uTime * 0.006, uTime * 0.004);
    float broad = solarNoise(p * 1.6 + drift * 0.2);
    float cells = solarNoise(p * 7.0 + drift);
    float fine = uDetail > 0.5 ? solarNoise(p * 19.0 - drift * 0.6) : cells;
    float granulation = smoothstep(0.25, 0.75, cells * 0.7 + fine * 0.3);
    float spots = smoothstep(0.58, 0.72, broad) * (1.0 - smoothstep(0.25, 0.7, abs(p.y)));
    vec3 color = mix(vec3(1.1, 0.18, 0.018), vec3(3.0, 1.65, 0.48), granulation);
    color *= 1.0 - spots * 0.72;
    float facing = max(dot(normalize(vNormal), normalize(cameraPosition - vWorld)), 0.0);
    color *= 0.48 + 0.52 * pow(facing, 0.35);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const coronaVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Billboard at the Sun's real depth: Earth and opaque guides can occlude it.
    vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    center.xy += position.xy * vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
    gl_Position = projectionMatrix * center;
  }
`;

export const coronaFragment = /* glsl */ `
  uniform float uTime;
  uniform float uDetail;
  uniform sampler2D uNoise;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float radius = length(p);
    float edge = 0.267;
    if (radius < edge || radius > 1.0) discard;
    float angle = atan(p.y, p.x);
    float rays = texture2D(uNoise, vec2(angle / 6.2831853 + 0.5, 0.23 + uTime * 0.008)).r;
    float glow = exp(-(radius - edge) * 11.0) * 0.33 + exp(-(radius - edge) * 38.0) * 0.65;
    glow *= 0.8 + rays * 0.5;
    float streamers = pow(max(0.0, sin(angle * 9.0 + rays * 4.0 + uTime * 0.06)), 6.0);
    glow += streamers * exp(-(radius - edge) * 16.0) * min(uDetail, 1.0) * 0.12;
    float fade = 1.0 - smoothstep(0.55, 1.0, radius);
    gl_FragColor = vec4(mix(vec3(1.0, 0.28, 0.055), vec3(1.0, 0.67, 0.24), exp(-(radius-edge) * 25.0)), glow * fade);
    #include <colorspace_fragment>
  }
`;

export const prominenceFragment = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  void main() {
    float thread = pow(max(0.0, sin(vUv.y * 3.14159265)), 1.5);
    float roots = pow(max(0.0, sin(vUv.x * 3.14159265)), 0.3);
    float flow = 0.6 + 0.4 * sin(vUv.x * 38.0 - uTime * 1.2 + uSeed);
    gl_FragColor = vec4(1.0, 0.24 + flow * 0.12, 0.035, thread * roots * (0.4 + flow * 0.3));
    #include <colorspace_fragment>
  }
`;
