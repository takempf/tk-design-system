import { sceneryHeld } from './hold';
import { defaultScene, type SceneInfo, scenes } from './scenes';
import { type ScenerySettings, scenerySettings } from './settings';
import blurSource from './shaders/blur.frag.glsl?raw';
import finishSource from './shaders/finish.frag.glsl?raw';
import prelude from './shaders/prelude.glsl?raw';

/*
  One renderer serves every scenery surface on the page.

  For each scene in view it ray-marches one frame at low resolution, blurs it,
  then gradient-maps and Bayer-dithers it once per distinct palette into a cached
  2D frame. Surfaces never render: each copies the crop of that frame lying under
  its own box, so a dozen windows cost the same as one and the illustration looks
  fixed behind the page — a trapper-keeper cover seen through die-cut holes.

  Everything visual is read from CSS custom properties on the surface, so a
  window inside `[data-tk-theme='grove']` is inked by Grove automatically.
*/

type Vec3 = readonly [number, number, number];

export type Attachment = 'fixed' | 'local';

interface Look {
  scene: string;
  attachment: Attachment;
  inks: Vec3[];
  ember: Vec3;
  bayer: number;
  pixel: number;
  toneLow: number;
  toneHigh: number;
  key: number;
  softness: number;
}

interface Surface {
  canvas: HTMLCanvasElement;
  bounds: HTMLElement;
  context: CanvasRenderingContext2D;
  visible: boolean;
  look: Look | null;
  /** The finished frame this surface copies from, set during render. */
  frame: Frame | null;
  /** What the canvas holds now (render and crop), so an unchanged one isn't copied again. */
  shown: string;
}

interface Frame {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  /** Size of the area the frame covers, in CSS pixels. */
  width: number;
  height: number;
  used: boolean;
}

interface Pass {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
}

interface Target {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
}

/** A program whose compile has been queued but not yet checked. */
interface Build {
  program: WebGLProgram;
  shaders: WebGLShader[];
}

const sceneSource = (scene: SceneInfo) =>
  `${prelude}\n${scene.source}\nvoid main() { fragColor = render(gl_FragCoord.xy); }\n`;

const idle = (callback: () => void) =>
  'requestIdleCallback' in window ? requestIdleCallback(callback) : setTimeout(callback, 200);

const vertexSource = `#version 300 es
in vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const sceneUniforms = ['u_time', 'u_resolution', 'u_parallax'];
const blurUniforms = ['u_image', 'u_resolution', 'u_step'];
const finishUniforms = [
  'u_image',
  'u_resolution',
  'u_bayerSize',
  'u_ditherStrength',
  'u_inks',
  'u_ember',
  'u_tone',
  'u_key',
  'u_preview',
];

/** Output grid is the area divided by pixel size; the ray-march runs smaller still. */
export function resolution(width: number, height: number, pixel: number) {
  const outputScale = 1 / Math.max(1, pixel);
  const sceneScale = Math.max(1.25, width / 900, height / 600);
  return {
    sceneWidth: Math.max(1, Math.round((width / sceneScale) * outputScale)),
    sceneHeight: Math.max(1, Math.round((height / sceneScale) * outputScale)),
    outputWidth: Math.max(1, Math.round(width * outputScale)),
    outputHeight: Math.max(1, Math.round(height * outputScale)),
  };
}

/** Whole output pixels under `rect`, so copying never resamples the dither. */
export function crop(
  rect: Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom'>,
  areaWidth: number,
  areaHeight: number,
  frameWidth: number,
  frameHeight: number,
) {
  const scaleX = frameWidth / areaWidth;
  const scaleY = frameHeight / areaHeight;
  const x = Math.max(0, Math.round(rect.left * scaleX));
  const y = Math.max(0, Math.round(rect.top * scaleY));
  const right = Math.min(frameWidth, Math.round(rect.right * scaleX));
  const bottom = Math.min(frameHeight, Math.round(rect.bottom * scaleY));
  if (right <= x || bottom <= y) return null;
  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
    left: x / scaleX - rect.left,
    top: y / scaleY - rect.top,
    cssWidth: (right - x) / scaleX,
    cssHeight: (bottom - y) / scaleY,
  };
}

let colorProbe: CanvasRenderingContext2D | null = null;

function parseColor(value: string, fallback: Vec3): Vec3 {
  colorProbe ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!colorProbe || !value) return fallback;
  colorProbe.fillStyle = '#000';
  colorProbe.fillStyle = value;
  const normalized = colorProbe.fillStyle;
  if (normalized.startsWith('#')) {
    const hex = Number.parseInt(normalized.slice(1), 16);
    return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
  }
  if (normalized.startsWith('rgb')) {
    const parts = normalized.match(/[\d.]+/g)?.map(Number);
    if (parts && parts.length >= 3) {
      return [parts[0]! / 255, parts[1]! / 255, parts[2]! / 255];
    }
  }
  colorProbe.clearRect(0, 0, 1, 1);
  colorProbe.fillRect(0, 0, 1, 1);
  const data = colorProbe.getImageData(0, 0, 1, 1).data;
  return [data[0]! / 255, data[1]! / 255, data[2]! / 255];
}

function readLook(element: Element): Look {
  const style = getComputedStyle(element);
  const read = (name: string) => style.getPropertyValue(`--tk-scenery-${name}`).trim();
  const number = (name: string, fallback: number) => {
    const value = Number.parseFloat(read(name));
    return Number.isFinite(value) ? value : fallback;
  };
  const scene = read('scene').replace(/['"]/g, '');
  const inks = [0, 1, 2, 3, 4].map((i) => parseColor(read(`ink-${i}`), [i / 4, i / 4, i / 4]));
  return {
    scene: scene in scenes ? scene : defaultScene,
    attachment: read('attachment') === 'local' ? 'local' : 'fixed',
    inks,
    ember: parseColor(read('ember'), [1, 0.3, 0.2]),
    bayer: number('bayer', 8),
    pixel: Math.max(1, Math.round(number('pixel', 2))),
    toneLow: number('tone-low', 0.1),
    toneHigh: number('tone-high', 0.6),
    key: number('key', 0.25),
    softness: Math.max(0, number('softness', 10)),
  };
}

class SceneryRenderer {
  private canvas = document.createElement('canvas');
  private gl: WebGL2RenderingContext;
  /** Compiled scenes; null for one that failed, so it isn't retried every frame. */
  private scenePasses = new Map<string, Pass | null>();
  private building = new Map<string, Build>();
  private parallel: KHR_parallel_shader_compile | null = null;
  private blurPass: Pass | null = null;
  private finishPass: Pass | null = null;
  private buffer: WebGLBuffer | null = null;
  private targets = new Map<string, [Target, Target]>();
  private frames = new Map<string, Frame>();
  private surfaces = new Set<Surface>();
  private settings: ScenerySettings = scenerySettings.getState();
  private motion = matchMedia('(prefers-reduced-motion: reduce)');
  private themeObserver: MutationObserver;
  private rootObserver: MutationObserver;
  private unsubscribe: () => void;
  private parallax = 0;
  private parallaxTarget = 0;
  private hasScroll = false;
  private elapsed = 0;
  private lastTime = 0;
  private lastRender = 0;
  private frame = 0;
  /** Counts renders: a surface showing an older one copies again. */
  private rendered = 0;
  private presentFrame = 0;
  private requestFrame = 0;
  /** Something changed that the next frame must render, whatever the frame rate. */
  private dirty = false;
  private queued = false;

  constructor() {
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'low-power',
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.initialize();
    this.canvas.addEventListener('webglcontextlost', this.contextLost);
    this.canvas.addEventListener('webglcontextrestored', this.contextRestored);
    document.addEventListener('visibilitychange', this.refresh);
    document.addEventListener('scroll', this.scrolled, { capture: true, passive: true });
    window.addEventListener('resize', this.request);
    this.motion.addEventListener('change', this.refresh);
    // A theme switch anywhere re-inks the surfaces beneath it. Only the theme
    // attribute is watched in the subtree: surfaces restyle their own canvases
    // every frame, and watching `style` everywhere would feed back on itself.
    this.themeObserver = new MutationObserver(() => this.invalidate());
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-tk-theme'],
      subtree: true,
    });
    // Re-observing the same node would replace these options, so the document
    // root's own class and style get a second observer.
    this.rootObserver = new MutationObserver(() => this.invalidate());
    this.rootObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    this.unsubscribe = scenerySettings.subscribe((settings) => {
      this.settings = settings;
      this.request();
    });
    // Start somewhere along each scene's loop rather than always at its first frame.
    this.elapsed = 20 + Math.random() * 40;
    idle(this.prepare);
  }

  /**
   * Queue a compile and link without waiting for either. The driver works on it
   * off the main thread; only asking for its status blocks, so `link` asks late.
   */
  private build(fragment: string): Build {
    const gl = this.gl;
    const program = gl.createProgram();
    const shaders: WebGLShader[] = [];
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertexSource],
      [gl.FRAGMENT_SHADER, fragment],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) continue;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
    }
    gl.bindAttribLocation(program, 0, 'a_position');
    gl.linkProgram(program);
    return { program, shaders };
  }

  private link({ program, shaders }: Build, names: string[]): Pass {
    const gl = this.gl;
    try {
      // One status query, not one per shader: each is a round trip to the GPU.
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = shaders.map((shader) => gl.getShaderInfoLog(shader)).find(Boolean);
        throw new Error(log || gl.getProgramInfoLog(program) || 'Shader linking failed');
      }
      return {
        program,
        uniforms: new Map(names.map((name) => [name, gl.getUniformLocation(program, name)])),
      };
    } catch (error) {
      gl.deleteProgram(program);
      throw error;
    } finally {
      for (const shader of shaders) gl.deleteShader(shader);
    }
  }

  private compile(fragment: string, names: string[]): Pass {
    return this.link(this.build(fragment), names);
  }

  private scenePass(id: string): Pass | null {
    if (this.scenePasses.has(id)) return this.scenePasses.get(id) ?? null;
    const scene = scenes[id] ?? scenes[defaultScene]!;
    let pass: Pass | null = null;
    try {
      pass = this.link(this.building.get(id) ?? this.build(sceneSource(scene)), sceneUniforms);
    } catch (error) {
      console.warn(`Scenery scene "${id}" failed to compile:`, error);
    }
    this.building.delete(id);
    this.scenePasses.set(id, pass);
    return pass;
  }

  /**
   * Ready the scenes nobody has shown yet, one step per idle period, so a page
   * that later shows them doesn't wait on the driver mid-transition. A step
   * either queues a compile or finishes one and draws it once: some drivers put
   * off the real work until a program's first draw.
   */
  private prepare = (): void => {
    const gl = this.gl;
    if (renderer !== this || gl.isContextLost()) return;
    const done = [...this.building].find(
      ([, { program }]) =>
        !this.parallel || gl.getProgramParameter(program, this.parallel.COMPLETION_STATUS_KHR),
    );
    const next = Object.entries(scenes).find(
      ([id]) => !this.scenePasses.has(id) && !this.building.has(id),
    );
    if (done) {
      const pass = this.scenePass(done[0]);
      if (pass) {
        const [target] = this.target(1, 1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
        gl.viewport(0, 0, 1, 1);
        gl.useProgram(pass.program);
        gl.uniform1f(pass.uniforms.get('u_time')!, 0);
        gl.uniform2f(pass.uniforms.get('u_resolution')!, 1, 1);
        gl.uniform2f(pass.uniforms.get('u_parallax')!, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
    } else if (next) {
      this.building.set(next[0], this.build(sceneSource(next[1])));
    }
    if (next || this.building.size) idle(this.prepare);
  };

  private initialize(): void {
    const gl = this.gl;
    this.scenePasses.clear();
    this.building.clear();
    this.targets.clear();
    this.parallel = gl.getExtension('KHR_parallel_shader_compile');
    this.blurPass = this.compile(blurSource, blurUniforms);
    this.finishPass = this.compile(finishSource, finishUniforms);
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    // One oversized triangle covers the viewport.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.disable(gl.DITHER);
  }

  private target(width: number, height: number): [Target, Target] {
    const key = `${width}x${height}`;
    const cached = this.targets.get(key);
    if (cached) return cached;
    const gl = this.gl;
    const make = (): Target => {
      const texture = gl.createTexture();
      const framebuffer = gl.createFramebuffer();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      return { texture, framebuffer };
    };
    const pair: [Target, Target] = [make(), make()];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.targets.set(key, pair);
    return pair;
  }

  private frameFor(key: string, width: number, height: number): Frame {
    let frame = this.frames.get(key);
    if (!frame) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      frame = { canvas, context, width, height, used: true };
      this.frames.set(key, frame);
    }
    frame.used = true;
    frame.width = width;
    frame.height = height;
    return frame;
  }

  private render(): void {
    const gl = this.gl;
    const blur = this.blurPass;
    const finish = this.finishPass;
    if (!blur || !finish) return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    this.dirty = false;
    for (const frame of this.frames.values()) frame.used = false;

    // Group surfaces that can share a ray-march, then a palette.
    const groups = new Map<
      string,
      { look: Look; width: number; height: number; members: Surface[] }
    >();
    for (const surface of this.surfaces) {
      if (!surface.visible) continue;
      surface.look ??= readLook(surface.bounds);
      const look = surface.look;
      const local = look.attachment === 'local';
      const width = local ? Math.max(1, surface.bounds.clientWidth) : viewportWidth;
      const height = local ? Math.max(1, surface.bounds.clientHeight) : viewportHeight;
      const key = [
        look.scene,
        look.pixel,
        look.softness,
        local ? `${width}x${height}` : 'fixed',
      ].join('|');
      const group = groups.get(key) ?? { look, width, height, members: [] };
      group.members.push(surface);
      groups.set(key, group);
    }

    let canvasWidth = this.canvas.width;
    let canvasHeight = this.canvas.height;
    for (const { look, width, height } of groups.values()) {
      const size = resolution(width, height, look.pixel);
      canvasWidth = Math.max(canvasWidth, size.outputWidth);
      canvasHeight = Math.max(canvasHeight, size.outputHeight);
    }
    if (this.canvas.width !== canvasWidth) this.canvas.width = canvasWidth;
    if (this.canvas.height !== canvasHeight) this.canvas.height = canvasHeight;

    const time = this.motion.matches ? 60 : this.elapsed;
    const parallax = this.motion.matches ? 0 : this.parallax * this.settings.parallax;

    for (const [groupKey, { look, width, height, members }] of groups) {
      const scene = this.scenePass(look.scene);
      if (!scene) continue;
      const size = resolution(width, height, look.pixel);
      const [sceneTarget, blurTarget] = this.target(size.sceneWidth, size.sceneHeight);

      gl.viewport(0, 0, size.sceneWidth, size.sceneHeight);
      // The scene texture is sampled plainly while blurring, with mips at the end.
      gl.bindTexture(gl.TEXTURE_2D, sceneTarget.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneTarget.framebuffer);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.useProgram(scene.program);
      gl.uniform1f(scene.uniforms.get('u_time')!, time);
      gl.uniform2f(scene.uniforms.get('u_resolution')!, size.sceneWidth, size.sceneHeight);
      gl.uniform2f(scene.uniforms.get('u_parallax')!, 0, parallax);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (look.softness > 0 && this.settings.preview !== 'scene') {
        gl.useProgram(blur.program);
        gl.uniform1i(blur.uniforms.get('u_image')!, 0);
        gl.uniform2f(blur.uniforms.get('u_resolution')!, size.sceneWidth, size.sceneHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, blurTarget.framebuffer);
        gl.bindTexture(gl.TEXTURE_2D, sceneTarget.texture);
        gl.uniform2f(blur.uniforms.get('u_step')!, look.softness / width, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, sceneTarget.framebuffer);
        gl.bindTexture(gl.TEXTURE_2D, blurTarget.texture);
        gl.uniform2f(blur.uniforms.get('u_step')!, 0, look.softness / height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      // One finish per distinct palette in this group. Mipmaps give the finish
      // pass the frame's average for exposure.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, size.outputWidth, size.outputHeight);
      gl.bindTexture(gl.TEXTURE_2D, sceneTarget.texture);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.useProgram(finish.program);
      gl.uniform1i(finish.uniforms.get('u_image')!, 0);
      gl.uniform2f(finish.uniforms.get('u_resolution')!, size.outputWidth, size.outputHeight);
      gl.uniform1f(finish.uniforms.get('u_ditherStrength')!, this.settings.ditherStrength);
      gl.uniform1i(finish.uniforms.get('u_preview')!, this.settings.preview === 'final' ? 0 : 1);
      const finished = new Map<string, Frame>();
      for (const surface of members) {
        const { inks, ember, bayer, toneLow, toneHigh, key } = surface.look!;
        const inkKey = `${groupKey}|${inks.flat().join()}|${ember.join()}|${bayer}|${toneLow}|${toneHigh}|${key}`;
        let frame = finished.get(inkKey);
        if (!frame) {
          gl.uniform1f(finish.uniforms.get('u_bayerSize')!, bayer);
          gl.uniform3fv(finish.uniforms.get('u_inks')!, inks.flat());
          gl.uniform3fv(finish.uniforms.get('u_ember')!, ember);
          gl.uniform2f(finish.uniforms.get('u_tone')!, toneLow, toneHigh);
          gl.uniform1f(finish.uniforms.get('u_key')!, key);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          frame = this.frameFor(inkKey, width, height);
          if (frame.canvas.width !== size.outputWidth) frame.canvas.width = size.outputWidth;
          if (frame.canvas.height !== size.outputHeight) frame.canvas.height = size.outputHeight;
          frame.context.globalCompositeOperation = 'copy';
          // The drawing buffer's bottom-left viewport is the canvas's bottom rows.
          frame.context.drawImage(
            this.canvas,
            0,
            this.canvas.height - size.outputHeight,
            size.outputWidth,
            size.outputHeight,
            0,
            0,
            size.outputWidth,
            size.outputHeight,
          );
          finished.set(inkKey, frame);
        }
        surface.frame = frame;
      }
    }

    for (const [key, frame] of this.frames) {
      if (!frame.used) this.frames.delete(key);
    }
    this.rendered++;
    this.present();
  }

  private present = (): void => {
    if (document.hidden) return;
    for (const surface of this.surfaces) {
      const { canvas, context, bounds, frame, look } = surface;
      if (!surface.visible || !frame || !look) continue;
      const rect = bounds.getBoundingClientRect();
      const local = look.attachment === 'local';
      const area = local ? { left: 0, top: 0, right: rect.width, bottom: rect.height } : rect;
      const piece = crop(area, frame.width, frame.height, frame.canvas.width, frame.canvas.height);
      // The loop presents every display frame but renders a few times a second;
      // between renders, only a box that moved needs copying again.
      const shown = piece
        ? `${this.rendered} ${piece.x} ${piece.y} ${piece.width} ${piece.height} ${piece.left} ${piece.top}`
        : 'none';
      if (shown === surface.shown) continue;
      surface.shown = shown;
      if (!piece) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        continue;
      }
      // Allocate only the visible slice; the wrapper clips it to the box.
      canvas.style.left = `${piece.left}px`;
      canvas.style.top = `${piece.top}px`;
      canvas.style.width = `${piece.cssWidth}px`;
      canvas.style.height = `${piece.cssHeight}px`;
      if (canvas.width !== piece.width) canvas.width = piece.width;
      if (canvas.height !== piece.height) canvas.height = piece.height;
      context.imageSmoothingEnabled = false;
      context.globalCompositeOperation = 'copy';
      context.drawImage(
        frame.canvas,
        piece.x,
        piece.y,
        piece.width,
        piece.height,
        0,
        0,
        piece.width,
        piece.height,
      );
    }
  };

  private tick = (now: number): void => {
    this.frame = 0;
    if (!this.canAnimate()) {
      this.refresh();
      return;
    }
    const delta = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.2) : 0;
    this.lastTime = now;
    // While a transition holds the scenery, the clock and camera stand still and
    // only changes (a window mounting, a theme swap) render.
    const held = sceneryHeld();
    if (!held) {
      if (!this.settings.paused) this.elapsed += delta * this.settings.speed;
      this.parallax += (this.parallaxTarget - this.parallax) * (1 - Math.exp(-delta * 6));
      if (Math.abs(this.parallaxTarget - this.parallax) < 0.0005) {
        this.parallax = this.parallaxTarget;
      }
    }
    // The scene is slow: 15fps, or 30 while the camera eases after a scroll.
    // Crops are re-presented every frame so windows track moving boxes smoothly.
    const fps = this.cameraMoving() ? 30 : 15;
    if (this.dirty || (!held && now - this.lastRender >= 1000 / fps - 2)) {
      this.lastRender = now;
      this.render();
    } else {
      this.present();
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private cameraMoving(): boolean {
    return this.settings.parallax > 0 && Math.abs(this.parallaxTarget - this.parallax) > 0.0005;
  }

  private anyVisible(): boolean {
    for (const surface of this.surfaces) if (surface.visible) return true;
    return false;
  }

  private canAnimate(): boolean {
    return (
      !this.motion.matches && !document.hidden && !this.gl.isContextLost() && this.anyVisible()
    );
  }

  private scrollRoot(): Element {
    return (
      document.querySelector('[data-scenery-scroll]') ??
      document.scrollingElement ??
      document.documentElement
    );
  }

  private readScroll(): void {
    const root = this.scrollRoot();
    const range = Math.max(0, root.scrollHeight - root.clientHeight);
    const position = Math.max(0, Math.min(range, root.scrollTop));
    // Screenfuls, not a percentage: 300px feels the same on any page length.
    this.parallaxTarget = this.motion.matches ? 0 : -position / Math.max(1, root.clientHeight);
    if (!this.hasScroll) {
      this.parallax = this.parallaxTarget;
      this.hasScroll = true;
    }
  }

  private scrolled = (event: Event): void => {
    const root = this.scrollRoot();
    if (
      event.target === root ||
      (event.target === document && root === document.scrollingElement)
    ) {
      this.readScroll();
    }
    if (this.frame) return;
    // Paused or reduced motion: still move the crops with the page.
    cancelAnimationFrame(this.presentFrame);
    this.presentFrame = requestAnimationFrame(() => {
      if (this.motion.matches || this.settings.paused) this.render();
      else this.present();
    });
  };

  private contextLost = (event: Event): void => {
    event.preventDefault();
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  };

  private contextRestored = (): void => {
    try {
      this.initialize();
      this.refresh();
      idle(this.prepare);
    } catch (error) {
      console.warn('Scenery could not be restored:', error);
    }
  };

  /** Re-read every surface's CSS (theme or token change) and redraw. */
  invalidate = (): void => {
    for (const surface of this.surfaces) surface.look = null;
    this.renderSoon();
  };

  /**
   * Render once when the current task ends, however many callers ask: a page of
   * windows mounting in one commit costs one render, not one each. It still lands
   * before the next paint, so a view transition captures the windows filled.
   */
  renderSoon = (): void => {
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      this.refresh();
    });
  };

  /**
   * Render once on the next frame. For observers and events that report in
   * bursts; a running loop picks it up on its next tick.
   */
  request = (): void => {
    this.dirty = true;
    if (this.frame || this.requestFrame) return;
    this.requestFrame = requestAnimationFrame(() => {
      this.requestFrame = 0;
      if (this.dirty) this.refresh();
    });
  };

  refresh = (): void => {
    this.readScroll();
    if (document.hidden || this.gl.isContextLost() || !this.anyVisible()) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      return;
    }
    this.render();
    if (!this.frame && this.canAnimate()) {
      this.lastTime = 0;
      this.frame = requestAnimationFrame(this.tick);
    }
  };

  add(surface: Surface): void {
    this.surfaces.add(surface);
  }

  remove(surface: Surface): void {
    this.surfaces.delete(surface);
    // The others' frames are still good; the loop stops itself if none is visible.
    if (this.surfaces.size) return;
    cancelAnimationFrame(this.frame);
    cancelAnimationFrame(this.presentFrame);
    cancelAnimationFrame(this.requestFrame);
    document.removeEventListener('visibilitychange', this.refresh);
    document.removeEventListener('scroll', this.scrolled, true);
    window.removeEventListener('resize', this.request);
    this.motion.removeEventListener('change', this.refresh);
    this.themeObserver.disconnect();
    this.rootObserver.disconnect();
    this.unsubscribe();
    this.canvas.removeEventListener('webglcontextlost', this.contextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.contextRestored);
    const gl = this.gl;
    for (const pass of [...this.scenePasses.values(), this.blurPass, this.finishPass]) {
      if (pass) gl.deleteProgram(pass.program);
    }
    for (const { program, shaders } of this.building.values()) {
      gl.deleteProgram(program);
      for (const shader of shaders) gl.deleteShader(shader);
    }
    for (const pair of this.targets.values()) {
      for (const target of pair) {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      }
    }
    gl.deleteBuffer(this.buffer);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    renderer = null;
  }
}

let renderer: SceneryRenderer | null = null;

/** Re-read scenery tokens everywhere, e.g. after swapping a stylesheet. */
export const refreshScenery = (): void => renderer?.invalidate();

/**
 * Make `canvas` reveal the scenery under `bounds`. Returns a cleanup function —
 * which is exactly what a React 19 ref callback may return.
 */
export function attachScenery(canvas: HTMLCanvasElement, bounds: HTMLElement): () => void {
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  let active: SceneryRenderer;
  try {
    active = renderer ??= new SceneryRenderer();
  } catch (error) {
    console.warn('Scenery unavailable; showing the flat fallback.', error);
    bounds.dataset.fallback = '';
    return () => {};
  }
  const surface: Surface = {
    canvas,
    bounds,
    context,
    visible: false,
    look: null,
    frame: null,
    shown: '',
  };
  active.add(surface);
  // Both observers report once on observing. Those first reports repeat what the
  // mount below already knows, so only real changes render.
  let size = `${bounds.clientWidth}x${bounds.clientHeight}`;
  const resize = new ResizeObserver(() => {
    const next = `${bounds.clientWidth}x${bounds.clientHeight}`;
    if (next === size) return;
    size = next;
    active.request();
  });
  const visibility = new IntersectionObserver(([entry]) => {
    const visible = entry?.isIntersecting ?? false;
    if (visible === surface.visible) return;
    surface.visible = visible;
    if (!visible) {
      canvas.width = 1;
      canvas.height = 1;
      surface.shown = '';
    }
    active.request();
  });
  // Props like `scene` arrive as inline custom properties on the bounds element.
  const tokens = new MutationObserver(() => {
    surface.look = null;
    active.renderSoon();
  });
  resize.observe(bounds);
  visibility.observe(bounds);
  tokens.observe(bounds, {
    attributes: true,
    attributeFilter: ['style', 'class', 'data-tk-theme'],
  });
  // Paint in the same frame as mounting, before the observer's first report, so a
  // window that enters inside a view transition is captured already filled.
  const rect = bounds.getBoundingClientRect();
  if (rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth) {
    surface.visible = true;
    active.renderSoon();
  }
  return () => {
    resize.disconnect();
    visibility.disconnect();
    tokens.disconnect();
    active.remove(surface);
  };
}
