const scene = document.getElementById("scene");
const frogsLayer = document.getElementById("frogs");
const beesLayer = document.getElementById("bees");
const balloonsLayer = document.getElementById("balloons");
const soundOverlay = document.getElementById("soundOverlay");

const beeSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110">
  <defs>
    <linearGradient id="g" x1="0" x2="1">
      <stop offset="0" stop-color="#ffd447"/>
      <stop offset="1" stop-color="#ffb400"/>
    </linearGradient>
  </defs>
  <ellipse cx="80" cy="60" rx="55" ry="35" fill="url(#g)" stroke="#222" stroke-width="4"/>
  <ellipse cx="48" cy="60" rx="10" ry="30" fill="#222"/>
  <ellipse cx="75" cy="60" rx="10" ry="30" fill="#222"/>
  <ellipse cx="102" cy="60" rx="10" ry="30" fill="#222"/>
  <circle cx="122" cy="55" r="10" fill="#222"/>
  <circle cx="128" cy="50" r="4" fill="#fff"/>
  <ellipse cx="60" cy="25" rx="25" ry="15" fill="#c9f0ff" stroke="#7bbbe0" stroke-width="3"/>
  <ellipse cx="90" cy="22" rx="25" ry="15" fill="#c9f0ff" stroke="#7bbbe0" stroke-width="3"/>
</svg>`);

const beeImage = `url("data:image/svg+xml;utf8,${beeSvg}")`;

const frogSvgs = {
  idle: encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
  <ellipse cx="70" cy="62" rx="45" ry="28" fill="#4caf50"/>
  <ellipse cx="38" cy="38" rx="14" ry="12" fill="#6dd66d"/>
  <ellipse cx="102" cy="38" rx="14" ry="12" fill="#6dd66d"/>
  <circle cx="38" cy="38" r="8" fill="#fff"/><circle cx="102" cy="38" r="8" fill="#fff"/>
  <circle cx="38" cy="39" r="3.5" fill="#1f3a1f"/><circle cx="102" cy="39" r="3.5" fill="#1f3a1f"/>
  <ellipse cx="70" cy="74" rx="16" ry="6" fill="#356c35"/>
  <ellipse cx="24" cy="74" rx="12" ry="10" fill="#3f8f3f"/>
  <ellipse cx="116" cy="74" rx="12" ry="10" fill="#3f8f3f"/>
</svg>`),
  croak: encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
  <ellipse cx="70" cy="62" rx="45" ry="28" fill="#4caf50"/>
  <ellipse cx="38" cy="38" rx="14" ry="12" fill="#6dd66d"/>
  <ellipse cx="102" cy="38" rx="14" ry="12" fill="#6dd66d"/>
  <circle cx="38" cy="38" r="8" fill="#fff"/><circle cx="102" cy="38" r="8" fill="#fff"/>
  <circle cx="38" cy="39" r="3.5" fill="#1f3a1f"/><circle cx="102" cy="39" r="3.5" fill="#1f3a1f"/>
  <ellipse cx="70" cy="72" rx="20" ry="12" fill="#2f5f2f"/>
  <ellipse cx="70" cy="74" rx="12" ry="7" fill="#122512"/>
  <ellipse cx="24" cy="74" rx="12" ry="10" fill="#3f8f3f"/>
  <ellipse cx="116" cy="74" rx="12" ry="10" fill="#3f8f3f"/>
</svg>`),
};

const frogImages = {
  idle: `url("data:image/svg+xml;utf8,${frogSvgs.idle}")`,
  croak: `url("data:image/svg+xml;utf8,${frogSvgs.croak}")`,
};

const balloonSvgs = [
  "#ff5d73",
  "#ffb347",
  "#7bdff2",
  "#b6f36b",
  "#cbb3ff",
].map((color) =>
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 200">
  <defs>
    <radialGradient id="shine" cx="0.35" cy="0.3" r="0.6">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <path d="M70 10 C25 10 10 60 10 95 C10 140 40 175 70 185 C100 175 130 140 130 95 C130 60 115 10 70 10 Z" fill="${color}"/>
  <path d="M70 10 C25 10 10 60 10 95" fill="url(#shine)"/>
  <circle cx="70" cy="190" r="6" fill="#f5c56a"/>
</svg>`)
);

class Bee {
  constructor(index) {
    this.index = index;
    this.el = document.createElement("div");
    this.el.className = "bee";
    this.el.style.backgroundImage = beeImage;
    beesLayer.appendChild(this.el);
    this.reset(true);
  }

  reset(initial = false) {
    const width = scene.clientWidth;
    const height = scene.clientHeight * 0.85;
    const fromLeft = Math.random() > 0.5;
    this.direction = fromLeft ? 1 : -1;
    this.startX = fromLeft ? -0.2 * width : 1.2 * width;
    this.endX = fromLeft ? 1.2 * width : -0.2 * width;
    this.baseY = height * (0.2 + Math.random() * 0.8);
    this.speed = width * (0.12 + Math.random() * 0.12);
    this.amplitude = 20 + Math.random() * 30;
    this.frequency = 0.6 + Math.random() * 1.0;
    this.phase = Math.random() * Math.PI * 2;
    this.x = initial ? this.startX : this.startX;
    this.elapsed = 0;
  }

  update(dt) {
    this.elapsed += dt;
    this.x += this.speed * dt * this.direction;
    const y = this.baseY + Math.sin(this.elapsed * this.frequency + this.phase) * this.amplitude + Math.sin(this.elapsed * 2.4 + this.phase) * (this.amplitude * 0.35);
    const tilt = Math.sin(this.elapsed * 3 + this.phase) * 12 * this.direction;
    this.el.style.transform = `translate(${this.x}px, ${y}px) scaleX(${this.direction}) rotate(${tilt}deg)`;
    if ((this.direction === 1 && this.x > this.endX) || (this.direction === -1 && this.x < this.endX)) {
      this.reset();
    }
  }
}

class Frog {
  constructor(index, total) {
    this.index = index;
    this.el = document.createElement("div");
    this.el.className = "frog";
    this.el.style.backgroundImage = frogImages.idle;
    frogsLayer.appendChild(this.el);

    const width = scene.clientWidth;
    const step = width / (total + 1);
    this.x = step * (index + 1) - 36;
    this.baseY = scene.clientHeight * 0.84 + Math.random() * (scene.clientHeight * 0.08);
    this.scale = 0.9 + Math.random() * 0.25;
    this.floatPhase = Math.random() * Math.PI * 2;
    this.jumpTime = 0;
    this.jumpDuration = 0;
    this.croakTime = 0;
    this.croakDuration = 0;
    this.nextActionIn = 0.8 + Math.random() * 2.4;
  }

  triggerAction() {
    if (Math.random() < 0.55) {
      this.jumpDuration = 0.45 + Math.random() * 0.18;
      this.jumpTime = this.jumpDuration;
    } else {
      this.croakDuration = 0.35 + Math.random() * 0.3;
      this.croakTime = this.croakDuration;
      this.el.style.backgroundImage = frogImages.croak;
    }
    this.nextActionIn = 1.1 + Math.random() * 3.8;
  }

  update(dt, now) {
    this.nextActionIn -= dt;
    if (this.nextActionIn <= 0 && this.jumpTime <= 0 && this.croakTime <= 0) {
      this.triggerAction();
    }

    if (this.jumpTime > 0) {
      this.jumpTime -= dt;
    }

    if (this.croakTime > 0) {
      this.croakTime -= dt;
      if (this.croakTime <= 0) {
        this.el.style.backgroundImage = frogImages.idle;
      }
    }

    let jumpOffset = 0;
    let squash = 1;
    if (this.jumpTime > 0) {
      const progress = 1 - this.jumpTime / this.jumpDuration;
      jumpOffset = Math.sin(progress * Math.PI) * 26;
      squash = 1 - Math.sin(progress * Math.PI) * 0.08;
    }

    const breathe = Math.sin(now * 2 + this.floatPhase) * 2;
    this.el.style.transform = `translate(${this.x}px, ${this.baseY - jumpOffset + breathe}px) scale(${this.scale}, ${this.scale * squash})`;
  }
}

class Balloon {
  constructor(x, y) {
    this.el = document.createElement("div");
    this.el.className = "balloon";
    const colorIndex = Math.floor(Math.random() * balloonSvgs.length);
    this.el.style.backgroundImage = `url("data:image/svg+xml;utf8,${balloonSvgs[colorIndex]}")`;
    balloonsLayer.appendChild(this.el);
    this.x = x;
    this.y = y;
    this.speed = 30 + Math.random() * 30;
    this.sway = 10 + Math.random() * 12;
    this.phase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.y -= this.speed * dt;
    const swayX = Math.sin(this.y * 0.02 + this.phase) * this.sway;
    const tilt = Math.sin(this.y * 0.03 + this.phase) * 6;
    this.el.style.transform = `translate(${this.x + swayX}px, ${this.y}px) rotate(${tilt}deg)`;
    if (this.y < -200) {
      this.el.remove();
      return false;
    }
    return true;
  }
}

const frogs = Array.from({ length: 6 }, (_, index) => new Frog(index, 6));
const bees = Array.from({ length: 8 }, (_, index) => new Bee(index));
let balloons = [];

let lastTime = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  frogs.forEach((frog) => frog.update(dt, now / 1000));
  bees.forEach((bee) => bee.update(dt));
  balloons = balloons.filter((balloon) => balloon.update(dt));
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

function addBalloon(event) {
  const rect = scene.getBoundingClientRect();
  const x = (event.clientX || event.touches?.[0]?.clientX || rect.width / 2) - rect.left - 50;
  const y = (event.clientY || event.touches?.[0]?.clientY || rect.height / 2) - rect.top - 80;
  balloons.push(new Balloon(x, y));
}

scene.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  requestWakeLock();
  addBalloon(event);
}, { passive: false });

let audioContext;
let beeBuffer;
let beeSource;
let beeGain;
let soundEnabled = false;
let wakeLockSentinel = null;

async function requestWakeLock() {
  if (!("wakeLock" in navigator) || document.hidden || wakeLockSentinel) {
    return;
  }
  try {
    wakeLockSentinel = await navigator.wakeLock.request("screen");
    wakeLockSentinel.addEventListener("release", () => {
      wakeLockSentinel = null;
    });
  } catch (error) {
    console.error("Unable to acquire wake lock:", error);
  }
}

async function releaseWakeLock() {
  if (!wakeLockSentinel) {
    return;
  }
  try {
    await wakeLockSentinel.release();
  } catch (error) {
    console.error("Unable to release wake lock:", error);
  } finally {
    wakeLockSentinel = null;
  }
}

async function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    beeGain = audioContext.createGain();
    beeGain.gain.value = 1;
    beeGain.connect(audioContext.destination);
  }
  if (!beeBuffer) {
    const response = await fetch("bee.mp3");
    const arrayBuffer = await response.arrayBuffer();
    beeBuffer = await audioContext.decodeAudioData(arrayBuffer);
  }
}

async function startBuzz() {
  await ensureAudioContext();
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
  if (beeSource) {
    return;
  }
  beeSource = audioContext.createBufferSource();
  beeSource.buffer = beeBuffer;
  beeSource.loop = true;
  beeSource.connect(beeGain);
  beeSource.start(0);
}

async function stopBuzz() {
  if (beeSource) {
    beeSource.stop();
    beeSource.disconnect();
    beeSource = null;
  }
  if (audioContext && audioContext.state === "running") {
    await audioContext.suspend();
  }
}

function handleSoundStart() {
  soundEnabled = true;
  requestWakeLock();
  startBuzz().catch((error) => {
    console.error("Unable to start audio:", error);
  });
  soundOverlay.classList.add("hidden");
}

soundOverlay.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  handleSoundStart();
}, { passive: false });
soundOverlay.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    handleSoundStart();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    releaseWakeLock();
    stopBuzz().catch((error) => {
      console.error("Unable to stop audio:", error);
    });
    return;
  }
  requestWakeLock();
  if (soundEnabled) {
    startBuzz().catch((error) => {
      console.error("Unable to resume audio:", error);
    });
  }
});

window.addEventListener("pagehide", () => {
  releaseWakeLock();
  stopBuzz().catch((error) => {
    console.error("Unable to stop audio:", error);
  });
});

window.addEventListener("blur", () => {
  stopBuzz().catch((error) => {
    console.error("Unable to stop audio:", error);
  });
});

window.addEventListener("focus", () => {
  if (soundEnabled) {
    startBuzz().catch((error) => {
      console.error("Unable to resume audio:", error);
    });
  }
});


window.addEventListener("resize", () => {
  frogs.forEach((frog, index) => {
    const step = scene.clientWidth / (frogs.length + 1);
    frog.x = step * (index + 1) - 36;
    frog.baseY = scene.clientHeight * 0.84 + (index % 2) * (scene.clientHeight * 0.03);
  });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}
