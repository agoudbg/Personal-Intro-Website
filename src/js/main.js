calcHeader();
calcCardPx();

pageMain.onscroll = function () {
    calcHeader();
}
$(window).on('resize', function () {
    calcHeader();
    calcCardPx();
});
// setInterval(() => {
//     calcHeader();
//     calcCardPx();
// }, 100);
if (window.location.hash.replace("#", "") != "") {
    cardId = window.location.hash.replace("#", "");
    history.pushState(null, null, "#");
    openCard($(".card[data-cardid=" + cardId + "]")[0]);
}

function openCard(ele, byHistory = false) {
    if ($("body").attr("data-ani-playing") == "true" || $(".pageDetails .card").length != 0) {
        if (byHistory) history.forward();
        return;
    }
    time = new Date().getTime();
    aniTime = 1000;
    cardId = $(ele).attr("data-cardid");
    eleRect = ele.getBoundingClientRect();
    console.log(eleRect);
    // 判断是否打开，否则忽略
    if ($(".pageDetils .card[data-cardid=" + cardId + "]").length > 0) return 0;
    // 复制div
    $(pageDetails).append($(ele).clone(false));
    newEle = $(".pageDetails .card[data-cardid=" + cardId + "]");
    newEle.attr("data-cardmode", "detail");
    // 隐藏旧对象/处理其它元素
    $(ele).attr("data-hidden", "true");
    $(".card").attr("disabled", "disabled");
    $("#pageMain").attr("data-behind", "true");
    $("body").attr("data-card-opened", "true");
    $("body").attr("data-ani-playing", "true");
    // 获取目标参数
    newRect = newEle[0].getBoundingClientRect();
    newDetailRect = newEle.find(".detailArea")[0].getBoundingClientRect();
    console.log(newRect);
    console.log(newDetailRect);
    // 构造动画
    // scale 计算
    console.log(ele.style.borderRadius);
    scalePercent = eleRect.height / newRect.height;
    ani = `
    :root{
        --ani-time: ${aniTime}ms;
    }
    @keyframes cardAnimation${time}{
        0%{
            top: ${(eleRect.top - 0.5 * (1 - scalePercent) * newRect.height)}px;
            left: ${(eleRect.left - 0.5 * (1 - scalePercent) * newRect.height)}px;
            width: ${newRect.height}px;
            transform: scale(${scalePercent});
            border-radius: 4.6% 4.6%;
            opacity: 0;
        }
        14%{
            top: ${(eleRect.top - 0.5 * (1 - scalePercent) * newRect.height)}px;
            left: ${(eleRect.left - 0.5 * (1 - scalePercent) * newRect.height)}px;
            width: ${newRect.height}px;
            transform: scale(${scalePercent * 0.95});
            opacity: 1;
        }
        17%{
            top: ${(eleRect.top - 0.5 * (1 - scalePercent) * newRect.height)}px;
            left: ${(eleRect.left - 0.5 * (1 - scalePercent) * newRect.height)}px;
            width: ${newRect.height}px;
            transform: scale(${scalePercent * 0.95});
            border-radius: 4.6% 4.6%;
            opacity: 1;
        }
        100%{
            top: ${newRect.top}px;
            left: ${newRect}px;
            width: ${newRect.width}px;
            transform: scale(1);
        }
    }`;
    styleEle = document.createElement("style");
    styleEle.innerHTML = ani;
    document.body.appendChild(styleEle);
    newEle[0].style.animation = "cardAnimation" + time + " " + aniTime + "ms";
    newEle.attr("data-anitype", "opening");
    calcHeader();
    calcCardPx();
    newEle.find(".previewArea")[0].style.fontSize = newEle[0].style.fontSize.replace("px", "") / scalePercent + "px";
    newEle.find(".detailArea")[0].style.width = newRect.width * 0.92 + "px";
    inv = setInterval(() => {
        calcHeader();
        calcCardPx();
    }, 1);
    setTimeout(() => {
        newEle.attr("data-anitype", "none");
        newEle.find(".detailArea")[0].style.width = "auto";
        newEle.find(".detailArea button")[0].focus();
        $("body").attr("data-ani-playing", "false");
        window.location.hash = cardId;
        clearInterval(inv);
    }, aniTime);
    history.pushState(null, null, '#' + cardId);
}
function closeCard(cardId = undefined, byHistory = false) {
    if (!cardId) cardId = $(".pageDetails .card").attr("data-cardid");
    if ($("body").attr("data-ani-playing") == "true" || $(".pageDetails .card").length == 0) {
        if (byHistory) history.forward();
        return;
    }
    if (!byHistory) history.back();
    if (window.location.hash.replace("#", "") != "") history.pushState(null, null, "#");
    time = new Date().getTime();
    aniTime = 740;
    mainAniPercent = 80;
    originEle = $(".pageDetails .card[data-cardid=" + cardId + "]");
    targetEle = $(".pageMain .cards .card[data-cardid=" + cardId + "]");
    // 隐藏旧对象/处理其它元素
    $("#pageMain").attr("data-behind", "false");
    $("body").attr("data-ani-playing", "true");
    // 获取目标参数
    targetRect = targetEle[0].getBoundingClientRect();
    eleRect = originEle[0].getBoundingClientRect();
    console.log(targetRect);
    console.log(newDetailRect);
    // 构造动画
    // scale 计算
    scalePercent = targetRect.height / eleRect.height;
    ani = `
    :root{
        --ani-time: ${aniTime}ms;
    }
    @keyframes cardAnimation${time}{
        0%{
            top: ${eleRect.top}px;
            left: ${eleRect.left}px;
            width: ${eleRect.width}px;
            transform: scale(1);
        }
        ${mainAniPercent}%{
            top: ${(targetRect.top - 0.5 * (1 - scalePercent) * eleRect.height)}px;
            left: ${(targetRect.left - 0.5 * (1 - scalePercent) * eleRect.height)}px;
            width: ${eleRect.height}px;
            transform: scale(${scalePercent});
            border-radius: 4.6% 4.6%;
            opacity: 1;
        }
        100%{
            top: ${(targetRect.top - 0.5 * (1 - scalePercent) * eleRect.height)}px;
            left: ${(targetRect.left - 0.5 * (1 - scalePercent) * eleRect.height)}px;
            width: ${eleRect.height}px;
            transform: scale(${scalePercent});
            border-radius: 4.6% 4.6%;
            opacity: 0;
            visibility: hidden;
        }
    }`;
    styleEle = document.createElement("style");
    styleEle.innerHTML = ani;
    document.body.appendChild(styleEle);
    originEle.attr("data-anitype", "closing");
    calcHeader();
    calcCardPx();
    originEle.find(".previewArea")[0].style.fontSize = targetEle[0].style.fontSize.replace("px", "") / scalePercent + "px";
    originEle.find(".detailArea")[0].style.width = eleRect.width * 0.92 + "px";
    inv = setInterval(() => {
        calcHeader();
        calcCardPx();
    }, 1);
    originEle[0].style.animation = "cardAnimation" + time + " " + aniTime + "ms ";
    setTimeout(() => {
        $(targetEle).attr("data-hidden", "false");
        $("body").attr("data-card-opened", "false");
    }, aniTime * mainAniPercent / 100);
    setTimeout(() => {
        pageDetails.innerHTML = "";
        originEle.attr("data-anitype", "none");
        clearInterval(inv);
        $(".card").removeAttr("disabled");
        $("body").attr("data-ani-playing", "false");
    }, aniTime);
}

window.addEventListener("popstate", function (e) {
    console.log("Back");
    if (window.location.hash.replace("#", "") != "") openCard($(".card[data-cardid=" + window.location.hash.replace("#", "") + "]")[0]);
    else
        closeCard(undefined, true);
}, false);

//Esc键
$(document).keyup(function (e) {
    var key = e.which || e.keyCode;;
    if (key == 27) {
        history.back();
    }
});

// header 计算
function calcHeader() {
    if (document.visibilityState == "visible" && $("body").attr("data-card-opened") != "true") {
        aniRate = Math.min(1, 1 - (($(".cards .card")[0].getBoundingClientRect().top - 40) / (window.outerHeight * 0.2)));
        // console.log(aniRate);
        pageHeaderInfo.style.transform = "scale(" + (1 - aniRate * 0.5) + ")";
        pageHeaderInfo.style.marginTop = ((window.outerHeight * 0.1) + 6 - aniRate * (window.outerHeight * 0.114)) + "px";
        pageFooter.style.display = "block";
        if (pageMain.scrollHeight - pageMain.offsetHeight - pageMain.scrollTop < pageFooter.getBoundingClientRect().height) {
            pageFooter.style.bottom = 0;
        }
        else {
            pageFooter.style.bottom = "-" + pageFooter.getBoundingClientRect().height + "px";
        }
    }
}

// card 默认em值计算
function calcCardPx() {
    $(".card").each(function () {
        try {
            element = $(this)[0];
            element.style.fontSize = element.getBoundingClientRect().height / 160 + "px"; // 使用header判定解决动画播放过程中的大小判定
            previewArea = element.getElementsByClassName("previewArea")[0];
            previewArea.style.width = (previewArea.getBoundingClientRect().height / ($(this).attr("data-anitype") ? Number($(this).css("transform").split("(")[1].split(",")[0]) : 1)) + "px";
        }
        catch (e) { }
    });
}

let prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
changeTheme(prefersDarkMode);

let media = window.matchMedia('(prefers-color-scheme: dark)');
let callback = (e) => {
    let prefersDarkMode = e.matches;
    changeTheme(prefersDarkMode);
};
if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', callback);
} else if (typeof media.addListener === 'function') {
    media.addListener(callback);
}

function changeTheme(prefersDarkMode) {
    if (prefersDarkMode) {
        $("body").attr("theme", "dark");
    }
    else {
        $("body").attr("theme", "default");
    }
}