const scene = document.getElementById("scene");
const frogsLayer = document.getElementById("frogs");
const beesLayer = document.getElementById("bees");
const balloonsLayer = document.getElementById("balloons");
const soundOverlay = document.getElementById("soundOverlay");

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
    this.el = document.createElement("div");
    this.el.className = "bee";
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
    this.speed = Math.floor(Math.random() * (110 - 50 + 1)) + 50;
    this.amplitude = 20 + Math.random() * 30;
    this.frequency = 0.6 + Math.random() * 1.0;
    this.phase = Math.random() * Math.PI * 2;
    this.x = initial ? this.startX : this.startX;
    this.elapsed = 0;
    this.scale = 1 + this.baseY / scene.clientHeight;
  }

  update(dt) {
    this.elapsed += dt;
    this.x += this.speed * dt * this.direction;
    const y = this.baseY + Math.sin(this.elapsed * this.frequency + this.phase) * this.amplitude + Math.sin(this.elapsed * 2.4 + this.phase) * (this.amplitude * 0.35);
    const tilt = Math.sin(this.elapsed * 3 + this.phase) * 12 * this.direction;
    this.el.style.transform = `translate(${this.x}px, ${y}px) scale(${this.scale * this.direction}, ${this.scale}) rotate(${tilt}deg)`;
    if ((this.direction === 1 && this.x > this.endX) || (this.direction === -1 && this.x < this.endX)) {
      this.reset();
    }
  }
}

class Frog {
  constructor(anchor) {
    this.anchor = anchor;
    this.el = document.createElement("div");
    this.el.className = "frog";

    const style = getComputedStyle(anchor);
    const frogSize = style.getPropertyValue('--frog-size');
    this.el.style.setProperty('--frog-size', frogSize);

    frogsLayer.appendChild(this.el);

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
      this.el.classList.add('frogCroak');
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
        this.el.classList.remove('frogCroak');
      }
    }

    let jumpOffset = 0;
    let squash = 1;
    if (this.jumpTime > 0) {
      const progress = 1 - this.jumpTime / this.jumpDuration;
      jumpOffset = Math.sin(progress * Math.PI) * 26;
      squash = 1 - Math.sin(progress * Math.PI) * 0.08;
    }

    let elRect = this.el.getBoundingClientRect();

    let anchorRect = this.anchor.getBoundingClientRect();
    let x = anchorRect.x - elRect.width / 2;
    let y = anchorRect.y - elRect.height * 0.8;

    const breathe = Math.sin(now * 2 + this.floatPhase) * 2;
    this.el.style.transform = `translate(${x}px, ${y - jumpOffset + breathe}px) scale(1, ${squash})`;
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

const frogs = Array.from(
    document.querySelectorAll('.lake .waterLily .anchor'),
    anchor => new Frog(anchor)
);

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
