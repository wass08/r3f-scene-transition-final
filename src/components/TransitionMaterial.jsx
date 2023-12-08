import { shaderMaterial } from "@react-three/drei";
import { resolveLygia } from "resolve-lygia";

export const TransitionMaterial = shaderMaterial(
  {
    uProgression: 1,
    uTex: undefined,
    uTex2: undefined,
    uTransition: 0,
    uRepeat: 1,
    uSmoothness: 0.5,
  },
  resolveLygia(/*glsl*/ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`),
  resolveLygia(/*glsl*/ ` 
    varying vec2 vUv;
    uniform sampler2D uTex;
    uniform sampler2D uTex2;
    uniform float uProgression;
    uniform float uRepeat;
    uniform int uTransition;
    uniform float uSmoothness;

    #include "lygia/generative/fbm.glsl"
    #include "lygia/generative/cnoise.glsl"
    #include "lygia/generative/worley.glsl"
    #include "lygia/generative/curl.glsl"

    float inverseLerp(float value, float minValue, float maxValue){
      return (value - minValue) / (maxValue - minValue);
    }

    float remap(float value, float inMin, float inMax, float outMin, float outMax){
      float t = inverseLerp(value, inMin, inMax);
      return mix(outMin, outMax, t);
    }

    void main() {
      vec2 uv = vUv;

      vec4 _texture = texture2D(uTex, uv);
      vec4 _texture2 = texture2D(uTex2, uv);

      float pct = 1.0;
      vec4 finalTexture;
      if (uTransition == 0) { // HORIZONTAL
       pct = mod(uv.x * uRepeat, 1.0);
      }
      if (uTransition == 1) { // VERTICAL
        pct = mod(uv.y * uRepeat, 1.0);
      }
      if (uTransition == 2) { // BOTH
        pct = mod(uv.y * uRepeat, 1.0) * mod(uv.x * uRepeat, 1.0);
      }
      if (uTransition == 3) { // FBM
        pct = fbm(uv * uRepeat) * 0.5 + 0.5;
      }
      if (uTransition == 4) { // CNOISE
        pct = cnoise(uv * uRepeat) * 0.5 + 0.5;
      }
      if (uTransition == 5) { // WORLEY
        pct = worley(uv * uRepeat) * 0.5 + 0.5;
      }
      if (uTransition == 6) { // CURL
        pct = curl(uv * uRepeat).x * 0.5 + 0.5;
      }

      // 0 -> 1
      // -uSmoothness / 2 -> 1 + uSmoothness / 2
      
      float smoothenProgression = remap(uProgression, 0.0, 1.0, -uSmoothness / 2.0, 1.0 + uSmoothness / 2.0);

      pct = smoothstep(smoothenProgression, smoothenProgression + uSmoothness / 2.0, pct);

      finalTexture = mix(_texture2, _texture, pct);

      gl_FragColor = finalTexture;
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`)
);
