class Balloon
{
    balloonSvgs = [
        "#FF5D73",
        "#FFB347",
        "#7BDFF2",
        "#B6F36B",
        "#CBB3FF",
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

    constructor(x, y)
    {
        this.el = document.createElement("div");
        this.el.className = "balloon";
        const colorIndex = Math.floor(Math.random() * this.balloonSvgs.length);
        this.el.style.backgroundImage = `url("data:image/svg+xml;utf8,${this.balloonSvgs[colorIndex]}")`;

        const balloonsLayer = document.getElementById("balloons");
        balloonsLayer.appendChild(this.el);

        this.x = x;
        this.y = y;
        this.speed = 30 + Math.random() * 30;
        this.sway = 10 + Math.random() * 12;
        this.phase = Math.random() * Math.PI * 2;
    }

    update(dt)
    {
        this.y -= this.speed * dt;
        const swayX = Math.sin(this.y * 0.02 + this.phase) * this.sway;
        const tilt = Math.sin(this.y * 0.03 + this.phase) * 6;
        this.el.style.transform = `translate(${this.x + swayX}px, ${this.y}px) rotate(${tilt}deg)`;
        if (this.y < -200)
        {
            this.el.remove();
            return false;
        }
        return true;
    }
}