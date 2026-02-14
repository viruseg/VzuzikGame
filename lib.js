function ElementFullyVisibleOnScreen(element)
{
    let rect = element.getBoundingClientRect();
    return Math.round(rect.top) >= 0 &&
        Math.round(rect.left) >= 0 &&
        Math.round(rect.bottom) <= window.innerHeight &&
        Math.round(rect.right) <= window.innerWidth;
}

function ElementPartialVisibleOnScreen(element)
{
    let rect = element.getBoundingClientRect();
    let centerX = rect.x + rect.width / 2;
    let centerY = rect.y + rect.height / 2;
    return Math.round(centerY) >= 0 &&
        Math.round(centerX) >= 0 &&
        Math.round(centerY) <= window.innerHeight &&
        Math.round(centerX) <= window.innerWidth;
}

/**
 * Проверяет, виден ли центр элемента на экране с учётом pinch-zoom и перекрытий.
 * @param {Element} element
 * @param {Object} [opts]
 * @param {boolean} [opts.checkOcclusion=false] - если true, дополнительно проверяет, что в центре действительно "виден" сам элемент (не перекрыт другим элементом).
 * @returns {boolean}
 */
function IsElementCenterVisible(element, { checkOcclusion = false } = {}) {
    if (!element || !(element instanceof Element)) return false;

    const rect = element.getBoundingClientRect();
    const centerLayoutX = rect.left + rect.width / 2;
    const centerLayoutY = rect.top + rect.height / 2;

    // Если есть visualViewport — используем его (учтёт pinch-zoom, виртуальную клавиатуру и т.п.)
    if (window.visualViewport) {
        const vv = window.visualViewport;

        // Визуальная вьюпорт-область в координатах layout viewport:
        const visLeft = vv.offsetLeft;
        const visTop = vv.offsetTop;
        const visRight = visLeft + vv.width;
        const visBottom = visTop + vv.height;

        const inside = centerLayoutX >= visLeft &&
            centerLayoutY >= visTop &&
            centerLayoutX <= visRight &&
            centerLayoutY <= visBottom;

        if (!inside) return false;

        if (!checkOcclusion) return true;

        // Для elementFromPoint нужны координаты относительно визуального вьюпорта:
        const pointX = centerLayoutX - visLeft;
        const pointY = centerLayoutY - visTop;

        const topEl = document.elementFromPoint(pointX, pointY);
        return topEl === element || element.contains(topEl);
    }

    // Fallback: старые браузеры — проверяем против layout viewport (обычно совпадает с client viewport)
    const insideLegacy = Math.round(centerLayoutX) >= 0 &&
        Math.round(centerLayoutY) >= 0 &&
        Math.round(centerLayoutX) <= window.innerWidth &&
        Math.round(centerLayoutY) <= window.innerHeight;

    if (!insideLegacy) return false;

    if (!checkOcclusion) return true;

    const topEl = document.elementFromPoint(Math.round(centerLayoutX), Math.round(centerLayoutY));
    return topEl === element || element.contains(topEl);
}
