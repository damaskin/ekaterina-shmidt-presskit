import { useEffect, useRef, useState } from 'react';
import './Aurora.css';

/**
 * Aurora — animated gradient background using WebGL simplex noise.
 * Falls back to CSS animation when WebGL is unavailable.
 * Matching h2-pro.ru aurora effect with project color scheme.
 */

const vertexShaderSource = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uAmplitude;
  uniform float uBlend;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;

    float n1 = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uv.y * 1.5 + uTime * 0.25)) * uAmplitude;
    float n2 = snoise(vec2(uv.x * 3.0 - uTime * 0.15, uv.y * 2.0 + uTime * 0.2)) * uAmplitude;
    float n3 = snoise(vec2(uv.x * 1.5 + uTime * 0.08, uv.y * 2.5 - uTime * 0.18)) * uAmplitude;

    // Shmidt presskit palette — magenta / plum / violet
    vec3 color1 = vec3(1.0, 0.176, 0.541);    // #FF2D8A
    vec3 color2 = vec3(0.761, 0.094, 0.478);  // #C2187A
    vec3 color3 = vec3(0.608, 0.302, 0.416);  // #9B4D6A
    vec3 color4 = vec3(0.322, 0.071, 0.251);  // #521240

    float t = uv.x;
    vec3 colorA = mix(color3, color1, smoothstep(0.0, 0.4, t));
    vec3 colorB = mix(color1, color2, smoothstep(0.3, 0.7, t));
    vec3 colorC = mix(color2, color4, smoothstep(0.6, 1.0, t));

    vec3 baseColor = mix(colorA, colorB, smoothstep(0.2, 0.5, t));
    baseColor = mix(baseColor, colorC, smoothstep(0.5, 0.8, t));

    float wave = (n1 + n2 * 0.5 + n3 * 0.3) * 0.5 + 0.5;
    float verticalMask = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.5, uv.y);
    float intensity = wave * verticalMask * uBlend;
    float edgeFade = smoothstep(0.0, 0.1, uv.x) * smoothstep(1.0, 0.9, uv.x);
    intensity *= edgeFade;

    vec3 finalColor = baseColor * intensity;
    float alpha = intensity * 0.7;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export default function Aurora() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });

    if (!gl) {
      setUseFallback(true);
      return;
    }

    function compileShader(type: number, source: string): WebGLShader | null {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) {
      setUseFallback(true);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setUseFallback(true);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setUseFallback(true);
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]),
      gl.STATIC_DRAW,
    );

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'uTime');
    const uResolution = gl.getUniformLocation(program, 'uResolution');
    const uAmplitude = gl.getUniformLocation(program, 'uAmplitude');
    const uBlend = gl.getUniformLocation(program, 'uBlend');

    gl.uniform1f(uAmplitude, 1.0);
    gl.uniform1f(uBlend, 0.55);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const startTime = Date.now();
    function animate() {
      const elapsed = (Date.now() - startTime) / 1000;
      gl!.uniform1f(uTime, elapsed);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      animRef.current = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="aurora-container" aria-hidden="true">
      {!useFallback && (
        <canvas ref={canvasRef} className="aurora-canvas" />
      )}
      {useFallback && (
        <div className="aurora-css-fallback">
          <div className="aurora-css-fallback__layer aurora-css-fallback__layer--1" />
          <div className="aurora-css-fallback__layer aurora-css-fallback__layer--2" />
        </div>
      )}
    </div>
  );
}
