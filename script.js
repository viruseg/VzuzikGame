const scene = document.getElementById("scene");
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
    const height = scene.clientHeight * 0.55;
    const fromLeft = Math.random() > 0.5;
    this.direction = fromLeft ? 1 : -1;
    this.startX = fromLeft ? -0.2 * width : 1.2 * width;
    this.endX = fromLeft ? 1.2 * width : -0.2 * width;
    this.baseY = height * (0.2 + Math.random() * 0.7);
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

const bees = Array.from({ length: 4 }, (_, index) => new Bee(index));
let balloons = [];

let lastTime = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
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
  addBalloon(event);
}, { passive: false });

let beeAudio;

async function startBuzz() {
  if (!beeAudio) {
    beeAudio = new Audio("bee.mp3");
    beeAudio.loop = true;
    beeAudio.volume = 1;
  }
  if (!beeAudio.paused) {
    return;
  }
  await beeAudio.play();
}

function handleSoundStart() {
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}
