const sm = new SoundManager();

sm.preload({
    frog: 'frog.mp3',
    bee: 'bee.mp3',
}).then(() => console.log('mp3 preloaded'));

const scene = document.getElementById("scene");
const soundOverlay = document.getElementById("soundOverlay");

const frogs = Array.from(
    document.querySelectorAll('.background .anchor'),
    anchor => new Frog(anchor, sm)
);

const bees = Array.from({length: 4}, (_, index) => new Bee());

let balloons = [];

let lastTime = performance.now();

function tick(now)
{
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    frogs.forEach((frog) => frog.update(dt, now / 1000));
    bees.forEach((bee) => bee.update(dt));
    balloons = balloons.filter((balloon) => balloon.update(dt));
    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

function addBalloon(event)
{
    const rect = scene.getBoundingClientRect();
    const x = (event.clientX || event.touches?.[0]?.clientX || rect.width / 2) - rect.left - 50;
    const y = (event.clientY || event.touches?.[0]?.clientY || rect.height / 2) - rect.top - 80;
    balloons.push(new Balloon(x, y));
}

scene.addEventListener("pointerup", async (event) =>
{
    event.preventDefault();
    await requestWakeLock();
    if (soundOverlay.classList.contains("hidden")) addBalloon(event);
}, {passive: false});

let wakeLockSentinel = null;

async function requestWakeLock()
{
    if (!("wakeLock" in navigator) || document.hidden || wakeLockSentinel)
    {
        return;
    }
    try
    {
        wakeLockSentinel = await navigator.wakeLock.request("screen");
        wakeLockSentinel.addEventListener("release", () =>
        {
            wakeLockSentinel = null;
        });
    } catch (error)
    {
        console.error("Unable to acquire wake lock:", error);
    }
}

async function releaseWakeLock()
{
    if (!wakeLockSentinel)
    {
        return;
    }
    try
    {
        await wakeLockSentinel.release();
    } catch (error)
    {
        console.error("Unable to release wake lock:", error);
    } finally
    {
        wakeLockSentinel = null;
    }
}

function Init()
{
    sm.unlock();
    sm.play('bee', {loop: true});
    requestWakeLock().then();
    soundOverlay.classList.add("hidden");
}

soundOverlay.addEventListener("click", (event) => {
    Init();
}, { passive: false });

document.addEventListener("visibilitychange", async () =>
{
    if (document.hidden)
    {
        await releaseWakeLock();
        return;
    }
    await requestWakeLock();
});

window.addEventListener("pagehide", async () =>
{
    await releaseWakeLock();
});

if ("serviceWorker" in navigator)
{
    window.addEventListener("load", () =>
    {
        navigator.serviceWorker.register("/sw.js").catch((error) =>
        {
            console.error("Service worker registration failed:", error);
        });
    });
}


function updateSpriteZIndices(baseZ = 0)
{
    const elems = Array.from(document.querySelectorAll('.backgroundSprite:not(.sortExclude), .frog'));
    if (!elems.length) return;

    elems.sort((a, b) =>
    {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const ya = ra.bottom;
        const yb = rb.bottom;
        return ya - yb;
    });

    elems.forEach((el, i) =>
    {
        el.style.zIndex = String(baseZ + i);
    });
}

let zUpdateScheduled = false;

function scheduleZUpdate()
{
    if (zUpdateScheduled) return;
    zUpdateScheduled = true;
    requestAnimationFrame(() =>
    {
        updateSpriteZIndices();
        zUpdateScheduled = false;
    });
}

scheduleZUpdate();
window.addEventListener('resize', scheduleZUpdate);
window.addEventListener('scroll', scheduleZUpdate);
