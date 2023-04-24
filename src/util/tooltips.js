export const initDataTips = renderRoot => {
  // purge previous for dynamic render
  Array.from(renderRoot.querySelectorAll(".tooltip")).forEach(el => {
    el.remove();
  });

  // ignore if false
  // if(!cc.settings.tooltips){
  //   return
  // }

  // built upon: https://stackoverflow.com/a/69340293/10885535
  Array.from(renderRoot.querySelectorAll("[data-tip]")).forEach(el => {
    // tip
    let tip = document.createElement("div");
    tip.classList.add("tooltip");
    tip.innerText = el.getAttribute("data-tip");
    renderRoot.appendChild(tip);

    // arrow
    let arrow = document.createElement("div");
    arrow.classList.add("tooltip-arrow");
    tip.appendChild(arrow);

    // position tip + arrow once added
    setTimeout(() => {
      let elmPos = el.getBoundingClientRect();
      let tipPos = tip.getBoundingClientRect();
      let tipLeft = elmPos.left + (elmPos.width - tipPos.width) / 2;
      let tipTop = elmPos.bottom + 5;
      let arrowLeft = tipPos.width / 2 - 5;
      let arrowTop = -4;

      if (el.hasAttribute("data-tip-left")) {
        tipLeft = elmPos.left - tipPos.width - 5;
        tipTop = elmPos.top + elmPos.height / 2 - tipPos.height / 2;
        arrowLeft = tipPos.width - 6;
        arrowTop = tipPos.height / 2 - 5;
        arrow.style.borderLeft = 0;
        arrow.style.borderBottom = 0;
      } else if (el.hasAttribute("data-tip-right")) {
        tipLeft = elmPos.right + 5;
        tipTop = elmPos.top + elmPos.height / 2 - tipPos.height / 2;
        arrowLeft = -4;
        arrowTop = tipPos.height / 2 - 5;
        arrow.style.borderRight = 0;
        arrow.style.borderTop = 0;
      } else {
        arrow.style.borderRight = 0;
        arrow.style.borderBottom = 0;
      }

      if (tipLeft < 5) {
        tipLeft = 5;
      }
      tip.style.left = tipLeft + "px";
      tip.style.top = tipTop + "px";
      arrow.style.left = arrowLeft + "px";
      arrow.style.top = arrowTop + "px";
    }, 0);

    // toggle with mouse
    el.onmouseover = e => {
      tip.style.opacity = 1;
      tip.style.visibility = "visible";
      e.stopPropagation(); // stop parent
    };
    el.onmouseout = e => {
      tip.style.opacity = 0;
      tip.style.visibility = "hidden";
    };
  });
};
