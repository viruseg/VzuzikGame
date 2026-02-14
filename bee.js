class Bee
{
    constructor()
    {
        this.scene = document.getElementById("scene");

        this.el = document.createElement("div");
        this.el.className = "bee";

        const beesLayer = document.getElementById("bees");
        beesLayer.appendChild(this.el);

        this.reset(true);
    }

    reset(initial = false)
    {
        const width = this.scene.clientWidth;
        const height = this.scene.clientHeight * 0.85;
        const fromLeft = Math.random() > 0.5;
        this.direction = fromLeft ? 1 : -1;
        this.startX = fromLeft ? -0.2 * width : 1.2 * width;
        this.endX = fromLeft ? 1.2 * width : -0.2 * width;
        this.baseY = height * (0.2 + Math.random() * 0.5);
        this.speed = Math.floor(Math.random() * (110 - 50 + 1)) + 50;
        this.amplitude = 20 + Math.random() * 30;
        this.frequency = 0.6 + Math.random() * 1.0;
        this.phase = Math.random() * Math.PI * 2;
        this.x = initial ? this.startX : this.startX;
        this.elapsed = 0;
        this.scale = 1 + this.baseY / scene.clientHeight;
    }

    update(dt)
    {
        this.elapsed += dt;
        this.x += this.speed * dt * this.direction;
        const y = this.baseY + Math.sin(this.elapsed * this.frequency + this.phase) * this.amplitude + Math.sin(this.elapsed * 2.4 + this.phase) * (this.amplitude * 0.35);
        const tilt = Math.sin(this.elapsed * 3 + this.phase) * 12 * this.direction;
        this.el.style.transform = `translate(${this.x}px, ${y}px) scale(${this.scale * this.direction}, ${this.scale}) rotate(${tilt}deg)`;
        if ((this.direction === 1 && this.x > this.endX) || (this.direction === -1 && this.x < this.endX))
        {
            this.reset();
        }
    }
}