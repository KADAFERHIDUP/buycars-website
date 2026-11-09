/* BuyCars · 3D showroom car (three.js r187, no external models).
 *
 * The car is modelled in code: an extruded side profile with real wheel arches for the body,
 * a tinted glass greenhouse, five-spoke wheels with brake calipers, LED head and tail lights.
 * Exposes a small controller so the page can change paint, lights, drive mode and rotation.
 */
import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';

const WHEEL_R = 0.37, WHEEL_W = 0.27, AXLE_X = 1.38, ARCH_R = 0.46;
const WIDTH = 1.9, BEVEL = 0.07;

export function initCar3D(host, { color = '#c8102e', onReady, shift } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Mobil 3D. Geser untuk memutar.');
  renderer.domElement.setAttribute('role', 'img');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;
  scene.fog = new THREE.Fog(0x07080d, 11, 24);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(6.5, 2.4, 6.3);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.62, 0);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 5;
  controls.maxDistance = 12;
  controls.minPolarAngle = 0.55;
  controls.maxPolarAngle = 1.48;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.9;
  controls.update();

  // ---------------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 7, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 1; key.shadow.camera.far = 20;
  key.shadow.radius = 4; key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6ea8ff, 1.4);
  rim.position.set(-6, 3, -4);
  scene.add(rim);
  const warm = new THREE.PointLight(0xffa64d, 6, 9, 2);
  warm.position.set(-3, 1.2, 3.5);
  scene.add(warm);

  // ---------------------------------------------------------------- materials
  const M = {
    paint: new THREE.MeshPhysicalMaterial({ color, metalness: 0.45, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.04 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0b0f16, metalness: 0.2, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.92 }),
    trim: new THREE.MeshStandardMaterial({ color: 0x0e0f12, metalness: 0.3, roughness: 0.55 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xd9dde3, metalness: 1, roughness: 0.12 }),
    rim: new THREE.MeshStandardMaterial({ color: 0x9aa1ab, metalness: 1, roughness: 0.22 }),
    tire: new THREE.MeshStandardMaterial({ color: 0x15161a, metalness: 0, roughness: 0.92 }),
    disc: new THREE.MeshStandardMaterial({ color: 0x6b6e74, metalness: 0.9, roughness: 0.35 }),
    caliper: new THREE.MeshStandardMaterial({ color: 0xf2b705, metalness: 0.3, roughness: 0.4 }),
    head: new THREE.MeshStandardMaterial({ color: 0xe8f0ff, emissive: 0xcfe2ff, emissiveIntensity: 0.25, metalness: 0.2, roughness: 0.1 }),
    tail: new THREE.MeshStandardMaterial({ color: 0x4a0005, emissive: 0xff1a2a, emissiveIntensity: 0.35, roughness: 0.3 }),
    well: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 1, side: THREE.DoubleSide }),
  };

  const car = new THREE.Group();
  scene.add(car);
  const mesh = (geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; };

  // ---------------------------------------------------------------- body: side profile with wheel arches, extruded across the width
  const s = new THREE.Shape();
  s.moveTo(-2.2, 0.3);
  s.lineTo(-AXLE_X - ARCH_R, 0.3);
  s.lineTo(-AXLE_X - ARCH_R, WHEEL_R);
  s.absarc(-AXLE_X, WHEEL_R, ARCH_R, Math.PI, 0, true);
  s.lineTo(-AXLE_X + ARCH_R, 0.27);
  s.lineTo(AXLE_X - ARCH_R, 0.27);
  s.lineTo(AXLE_X - ARCH_R, WHEEL_R);
  s.absarc(AXLE_X, WHEEL_R, ARCH_R, Math.PI, 0, true);
  s.lineTo(AXLE_X + ARCH_R, 0.3);
  s.lineTo(2.16, 0.3);
  s.quadraticCurveTo(2.32, 0.34, 2.3, 0.5);
  s.quadraticCurveTo(2.27, 0.62, 2.0, 0.66);
  s.quadraticCurveTo(1.4, 0.75, 0.85, 0.8);
  s.lineTo(-1.1, 0.84);
  s.quadraticCurveTo(-1.9, 0.86, -2.12, 0.8);
  s.quadraticCurveTo(-2.28, 0.76, -2.28, 0.6);
  s.quadraticCurveTo(-2.32, 0.4, -2.2, 0.3);
  const bodyGeo = new THREE.ExtrudeGeometry(s, { depth: WIDTH - BEVEL * 2, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL * 0.8, bevelSegments: 6, curveSegments: 28 });
  bodyGeo.translate(0, 0, -(WIDTH - BEVEL * 2) / 2);
  car.add(mesh(bodyGeo, M.paint));

  // greenhouse: tinted glass cabin, narrower than the body, with a painted roof cap
  const g = new THREE.Shape();
  g.moveTo(0.86, 0.79);
  g.quadraticCurveTo(0.4, 1.02, 0.0, 1.16);
  g.quadraticCurveTo(-0.42, 1.21, -0.82, 1.17);
  g.quadraticCurveTo(-1.45, 1.06, -1.98, 0.82);
  g.lineTo(0.86, 0.79);
  const cabinW = 1.38;
  const cabinGeo = new THREE.ExtrudeGeometry(g, { depth: cabinW, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 5, curveSegments: 24 });
  cabinGeo.translate(0, 0, -cabinW / 2);
  car.add(mesh(cabinGeo, M.glass));
  const roof = new THREE.Shape();
  roof.moveTo(0.02, 1.155);
  roof.quadraticCurveTo(-0.42, 1.205, -0.86, 1.165);
  roof.lineTo(-0.84, 1.13);
  roof.quadraticCurveTo(-0.42, 1.17, 0.02, 1.12);
  roof.lineTo(0.02, 1.155);
  const roofGeo = new THREE.ExtrudeGeometry(roof, { depth: cabinW - 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 4 });
  roofGeo.translate(0, 0.015, -(cabinW - 0.08) / 2);
  car.add(mesh(roofGeo, M.paint));
  // B-pillars and window trim
  for (const z of [-1, 1]) {
    const pillar = mesh(new THREE.BoxGeometry(0.1, 0.32, 0.02), M.trim);
    pillar.position.set(-0.58, 1.0, z * (cabinW / 2 + 0.065));
    pillar.rotation.z = 0.25;
    car.add(pillar);
    const strip = mesh(new THREE.BoxGeometry(2.55, 0.022, 0.02), M.chrome, false);
    strip.position.set(-0.55, 0.9, z * (cabinW / 2 + 0.06));
    car.add(strip);
    // mirrors
    const mirror = mesh(new THREE.CapsuleGeometry(0.045, 0.1, 4, 10), M.paint);
    mirror.rotation.x = Math.PI / 2;
    mirror.position.set(0.66, 0.93, z * (cabinW / 2 + 0.17));
    car.add(mirror);
    const stalk = mesh(new THREE.BoxGeometry(0.06, 0.04, 0.16), M.trim);
    stalk.position.set(0.68, 0.9, z * (cabinW / 2 + 0.09));
    car.add(stalk);
    // side skirt and air intake
    const skirt = mesh(new THREE.BoxGeometry(1.75, 0.07, 0.03), M.trim);
    skirt.position.set(0, 0.3, z * (WIDTH / 2 + 0.002));
    car.add(skirt);
  }

  // lights
  const heads = [];
  for (const z of [-1, 1]) {
    const h = mesh(new THREE.BoxGeometry(0.1, 0.05, 0.46), M.head, false);
    h.position.set(2.265, 0.585, z * 0.56);
    h.rotation.z = -0.55;
    h.rotation.y = z * 0.22;
    car.add(h);
    heads.push(h);
  }
  const tail = mesh(new THREE.BoxGeometry(0.06, 0.06, 1.72), M.tail, false);
  tail.position.set(-2.335, 0.7, 0);
  car.add(tail);
  // front grille, lower lip, rear diffuser, exhausts
  const grille = mesh(new THREE.BoxGeometry(0.08, 0.09, 1.25), M.trim);
  grille.position.set(2.335, 0.37, 0);
  car.add(grille);
  const diffuser = mesh(new THREE.BoxGeometry(0.12, 0.12, 1.5), M.trim);
  diffuser.position.set(-2.29, 0.34, 0);
  car.add(diffuser);
  for (const z of [-0.45, 0.45]) {
    const ex = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 20), M.chrome);
    ex.rotation.z = Math.PI / 2;
    ex.position.set(-2.33, 0.34, z);
    car.add(ex);
  }
  const spoiler = mesh(new THREE.BoxGeometry(0.2, 0.025, 1.55), M.paint);
  spoiler.position.set(-2.08, 0.885, 0);
  spoiler.rotation.z = 0.08;
  car.add(spoiler);
  // floor pan so nothing shows through
  const pan = mesh(new THREE.BoxGeometry(4.3, 0.04, WIDTH - 0.1), M.trim, false);
  pan.position.set(0, 0.29, 0);
  car.add(pan);

  // ---------------------------------------------------------------- wheels
  const wheels = [];
  function wheel() {
    const w = new THREE.Group();
    const tire = mesh(new THREE.TorusGeometry(WHEEL_R - 0.075, 0.08, 18, 48), M.tire);
    tire.scale.set(1, 1, 1.55);
    w.add(tire);
    const disc = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 32), M.disc);
    disc.rotation.x = Math.PI / 2; disc.position.z = -0.06;
    w.add(disc);
    const caliper = mesh(new THREE.BoxGeometry(0.1, 0.16, 0.06), M.caliper);
    caliper.position.set(0.15, 0.08, -0.03);
    caliper.rotation.z = 0.5;
    w.add(caliper);
    const spin = new THREE.Group();
    const barrel = mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.22, 40, 1, true), M.rim);
    barrel.rotation.x = Math.PI / 2;
    spin.add(barrel);
    const lip = mesh(new THREE.TorusGeometry(0.255, 0.014, 8, 48), M.chrome);
    lip.position.z = 0.11;
    spin.add(lip);
    for (let i = 0; i < 5; i++) {
      const sp = mesh(new THREE.BoxGeometry(0.05, 0.24, 0.035), M.rim);
      sp.geometry.translate(0, 0.12, 0);
      sp.rotation.z = (i / 5) * Math.PI * 2;
      sp.position.z = 0.09;
      spin.add(sp);
    }
    const cap = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 20), M.chrome);
    cap.rotation.x = Math.PI / 2; cap.position.z = 0.1;
    spin.add(cap);
    w.add(spin);
    w.userData.spin = spin;
    w.userData.tire = tire;
    return w;
  }
  for (const x of [-AXLE_X, AXLE_X]) {
    for (const side of [-1, 1]) {
      const w = wheel();
      w.position.set(x, WHEEL_R, side * (WIDTH / 2 - WHEEL_W / 2 - 0.02));
      if (side < 0) w.rotation.y = Math.PI;     // rim face points outwards on both sides
      car.add(w);
      wheels.push(w);
    }
    // dark wheel well so the arch never shows the other side of the car
    const well = new THREE.Mesh(new THREE.CylinderGeometry(ARCH_R - 0.065, ARCH_R - 0.065, WIDTH - 0.1, 32, 1, true, -Math.PI / 2, Math.PI), M.well);
    well.rotation.x = -Math.PI / 2;     // axis across the car, half-shell over the wheel
    well.position.set(x, WHEEL_R, 0);
    car.add(well);
  }

  // ---------------------------------------------------------------- stage: glossy turntable, glow ring, contact shadow, road stripes
  const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshStandardMaterial({ color: 0x07080c, metalness: 0.15, roughness: 0.7, envMapIntensity: 0.25 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const turntable = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.35, 0.06, 96), new THREE.MeshStandardMaterial({ color: 0x0f1118, metalness: 0.2, roughness: 0.62, envMapIntensity: 0.18 }));
  turntable.position.y = 0.03;
  turntable.receiveShadow = true;
  scene.add(turntable);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.32, 0.012, 8, 160), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.062;
  scene.add(ring);
  car.position.y = 0.06;

  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.8), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.065;
  car.add(contact);
  contact.position.y = 0.006;

  const road = new THREE.Group();
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  for (let i = 0; i < 12; i++) {
    for (const z of [-1.55, 1.55]) {
      const st = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.06), stripeMat);
      st.rotation.x = -Math.PI / 2;
      st.position.set(-8 + i * 1.6, 0.004, z);
      road.add(st);
    }
  }
  car.add(road);

  // headlight beams (visible only with lights on)
  const beams = [];
  for (const z of [-0.6, 0.6]) {
    const spot = new THREE.SpotLight(0xdfe9ff, 0, 12, 0.45, 0.6, 1.5);
    spot.position.set(2.2, 0.6, z);
    spot.target.position.set(6, 0, z * 1.4);
    car.add(spot, spot.target);
    beams.push(spot);
  }

  // ---------------------------------------------------------------- state + loop
  const st = { lights: false, drive: false, speed: 0, visible: true, raf: 0, t: 0, targetColor: new THREE.Color(color) };
  const clock = { last: performance.now(), getDelta() { const n = performance.now(), d = (n - this.last) / 1000; this.last = n; return d; } };

  function resize() {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole car in frame on narrow screens
    camera.fov = w / h < 0.9 ? 42 : w / h < 1.3 ? 34 : 44;
    // on wide screens the car sits right of centre so the headline has room on the left
    const k = typeof shift === 'function' ? shift(w, h) : 0;
    if (k > 0) { camera.aspect = w / (1 - k) / h; camera.setViewOffset(w / (1 - k), h, 0, 0, w, h); } else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  function frame() {
    st.raf = 0;
    if (!st.visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    st.t += dt;
    // paint colour eases to its target
    M.paint.color.lerp(st.targetColor, 1 - Math.pow(0.001, dt));
    // drive: wheels spin, road stripes stream past, body breathes
    const target = st.drive ? 14 : 0;
    st.speed += (target - st.speed) * (1 - Math.pow(0.02, dt));
    for (const w of wheels) w.userData.spin.rotation.z -= (st.speed / WHEEL_R) * dt * (w.rotation.y ? -1 : 1);
    stripeMat.opacity += ((st.drive ? 0.55 : 0) - stripeMat.opacity) * (1 - Math.pow(0.01, dt));
    for (const r of road.children) { r.position.x -= st.speed * dt * 0.6; if (r.position.x < -9.6) r.position.x += 19.2; }
    car.position.y = 0.06 + (st.speed > 0.5 ? Math.sin(st.t * 18) * 0.004 : 0);
    // lights fade in and out
    const li = st.lights ? 1 : 0;
    M.head.emissiveIntensity += ((st.lights ? 3.2 : 0.25) - M.head.emissiveIntensity) * 0.15;
    M.tail.emissiveIntensity += ((st.lights ? 2.6 : 0.35) - M.tail.emissiveIntensity) * 0.15;
    for (const b of beams) b.intensity += (li * 45 - b.intensity) * 0.12;
    ring.material.color.setHSL(0.07, 1, 0.5 + Math.sin(st.t * 2) * 0.08);
    controls.update();
    renderer.render(scene, camera);
    loop();
  }
  const loop = () => { if (!st.raf) st.raf = requestAnimationFrame(frame); };

  // pause when the hero is off-screen or the tab is hidden
  const io = new IntersectionObserver(es => { st.visible = es[0].isIntersecting; if (st.visible) { clock.getDelta(); loop(); } }, { threshold: 0.02 });
  io.observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { clock.getDelta(); loop(); } });
  controls.addEventListener('start', () => host.classList.add('grabbing'));
  controls.addEventListener('end', () => host.classList.remove('grabbing'));

  renderer.render(scene, camera);
  loop();
  if (onReady) onReady();

  return {
    setColor(hex) { st.targetColor.set(hex); loop(); },
    setLights(on) { st.lights = !!on; loop(); },
    setDrive(on) { st.drive = !!on; if (on) st.lights = true; loop(); return st.lights; },
    setAutoRotate(on) { controls.autoRotate = !!on; loop(); },
    setCaliper(hex) { M.caliper.color.set(hex); loop(); },
    view(name) {
      const views = { front: [6.2, 1.4, 1.8], side: [0.01, 1.2, 8.2], rear: [-6.2, 1.8, -2.6], top: [3.8, 7.6, 3.8], default: [6.5, 2.4, 6.3] };
      const v = views[name] || views.default;
      const from = camera.position.clone(), to = new THREE.Vector3(...v);
      const t0 = performance.now();
      controls.autoRotate = false;
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / 900), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        camera.position.lerpVectors(from, to, e);
        if (k < 1) requestAnimationFrame(step);
        loop();
      };
      step();
    },
    get state() { return { lights: st.lights, drive: st.drive, autoRotate: controls.autoRotate }; },
    dispose() { ro.disconnect(); io.disconnect(); cancelAnimationFrame(st.raf); renderer.dispose(); },
  };
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch { return false; }
}
