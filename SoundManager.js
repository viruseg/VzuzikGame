class SoundManager
{
    constructor()
    {
        this.ctx = null;
        this.masterGain = null; // Главный узел громкости
        this.buffers = new Map();
        this.activeNodes = new Set();
        this.loopingSounds = new Map();
        this.unlocked = false;

        this.bindVisibilityEvents();
    }

    bindVisibilityEvents()
    {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAll();
            } else {
                this.resumeAll();
            }
        });
    }

    // Вспомогательный метод инициализации
    _initContext()
    {
        if (this.ctx) return;

        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return;

        this.ctx = new AudioCtor();

        // Создаем мастер-гейн и подключаем к выходу
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1;
        this.masterGain.connect(this.ctx.destination);
    }

    unlock()
    {
        if (this.unlocked) return;
        this._initContext(); // Используем новый метод

        if (this.ctx && this.ctx.state === 'suspended')
        {
            this.ctx.resume().catch(() => {});
        }
        this.unlocked = true;
    }

    async load(name, url)
    {
        this._initContext(); // Гарантируем наличие контекста и masterGain
        const resp = await fetch(url);
        const arrayBuffer = await resp.arrayBuffer();
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.buffers.set(name, audioBuffer);
    }

    async preload(map)
    {
        await Promise.all(Object.entries(map).map(([n, u]) => this.load(n, u)));
    }

    play(name, {volume = 1, playbackRate = 1, when = 0, loop = false} = {})
    {
        if (!this.unlocked) return;
        if (document.hidden) return;

        this._initContext(); // На случай, если play вызван без unlock/load
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended')
        {
            this.ctx.resume().catch(() => {});
        }

        const buffer = this.buffers.get(name);
        if (!buffer)
        {
            console.warn('Sound not loaded:', name);
            return;
        }

        if (loop)
        {
            let loopData = this.loopingSounds.get(name);
            if (loopData) {
                if (loopData.source) return loopData.source;
            } else {
                loopData = {
                    name,
                    buffer,
                    volume,
                    playbackRate,
                    startTime: 0,
                    offset: 0,
                    source: null,
                    gain: null
                };
                this.loopingSounds.set(name, loopData);
            }
            return this._startLoopingSound(loopData, when);
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = false;
        source.playbackRate.value = playbackRate;

        const gain = this.ctx.createGain();
        gain.gain.value = volume;

        source.connect(gain);

        // ВАЖНО: Подключаем к masterGain, а не к destination
        if (this.masterGain) {
            gain.connect(this.masterGain);
        } else {
            gain.connect(this.ctx.destination);
        }

        source.onended = () => this.activeNodes.delete(source);
        this.activeNodes.add(source);

        source.start(this.ctx.currentTime + when);
        return source;
    }

    _startLoopingSound(item, when = 0)
    {
        const ctx = this.ctx;
        const source = ctx.createBufferSource();
        source.buffer = item.buffer;
        source.loop = true;
        source.playbackRate.value = item.playbackRate;

        const gain = ctx.createGain();
        gain.gain.value = item.volume;

        source.connect(gain);

        // ВАЖНО: Подключаем к masterGain
        if (this.masterGain) {
            gain.connect(this.masterGain);
        } else {
            gain.connect(ctx.destination);
        }

        item.source = source;
        item.gain = gain;

        item.startTime = ctx.currentTime - (item.offset / item.playbackRate);
        const startOffset = item.offset % item.buffer.duration;
        source.start(ctx.currentTime + when, startOffset);

        return source;
    }

    pauseAll()
    {
        if (!this.ctx) return;

        // 1. Сначала физически отрубаем мастер-канал от динамиков
        if (this.masterGain) {
            try {
                this.masterGain.disconnect();
                // Ставим громкость в 0, чтобы при реконнекте не было "щелчка" до resumeAll
                this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
            } catch (e) {}
        }

        // 2. Останавливаем ноды (логика сохранения состояния)
        for (const node of Array.from(this.activeNodes)) {
            try { node.stop(); } catch (e) {}
        }
        this.activeNodes.clear();

        for (const [name, item] of this.loopingSounds) {
            if (item.source) {
                try {
                    item.source.stop();
                    const elapsed = (this.ctx.currentTime - item.startTime) * item.playbackRate;
                    item.offset = (item.offset || 0) + elapsed;
                } catch (e) {}
                item.source = null;
            }
        }

        // 3. Пытаемся уснуть контекст
        if (this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
        }
    }

    async resumeAll()
    {
        if (!this.ctx) return;
        if (document.hidden) return;

        if (this.ctx.state === 'suspended') {
            try { await this.ctx.resume(); } catch (err) {}
        }

        // 1. Восстанавливаем мастер-канал
        if (this.masterGain) {
            try {
                // Возвращаем громкость
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
                // Подключаем обратно
                this.masterGain.connect(this.ctx.destination);
            } catch (e) {}
        }

        // 2. Перезапускаем лупы
        for (const [name, item] of this.loopingSounds) {
            if (!item.source) {
                this._startLoopingSound(item);
            }
        }
    }

    stopAll()
    {
        for (const node of Array.from(this.activeNodes)) {
            try { node.stop(); } catch (e) {}
        }
        this.activeNodes.clear();

        for (const [name, item] of this.loopingSounds) {
            if (item.source) {
                try { item.source.stop(); } catch(e) {}
            }
        }
        this.loopingSounds.clear();
    }
}