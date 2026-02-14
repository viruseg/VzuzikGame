class Frog
{
    constructor(anchor, sm)
    {
        this.sm = sm;
        this.anchor = anchor;
        this.el = document.createElement("div");
        this.el.className = "frog";

        const style = getComputedStyle(anchor);
        const frogSize = style.getPropertyValue('--frog-size');
        this.el.style.setProperty('--frog-size', frogSize);

        const frogsLayer = document.getElementById("frogs");
        frogsLayer.appendChild(this.el);

        this.floatPhase = Math.random() * Math.PI * 2;
        this.jumpTime = 0;
        this.jumpDuration = 0;
        this.croakTime = 0;
        this.croakDuration = 0;
        this.nextActionIn = 0.8 + Math.random() * 2.4;
    }

    triggerAction()
    {
        if (Math.random() < 0.85)
        {
            this.jumpDuration = 0.45 + Math.random() * 0.18;
            this.jumpTime = this.jumpDuration;
        } else
        {
            this.croakDuration = 0.35 + Math.random() * 0.3;
            this.croakTime = this.croakDuration;
            this.el.classList.add('frogCroak');
            if (IsElementCenterVisible(this.el)) this.sm.play('frog');
        }
        this.nextActionIn = 1.1 + Math.random() * 3.8;
    }

    update(dt, now)
    {
        this.nextActionIn -= dt;
        if (this.nextActionIn <= 0 && this.jumpTime <= 0 && this.croakTime <= 0)
        {
            this.triggerAction();
        }

        if (this.jumpTime > 0)
        {
            this.jumpTime -= dt;
        }

        if (this.croakTime > 0)
        {
            this.croakTime -= dt;
            if (this.croakTime <= 0)
            {
                this.el.classList.remove('frogCroak');
            }
        }

        let jumpOffset = 0;
        let squash = 1;
        if (this.jumpTime > 0)
        {
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