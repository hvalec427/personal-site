// Adds a copy button to each code block
(function () {
  function addCopyButtons() {
    document.querySelectorAll("pre > code").forEach(function (codeBlock) {
      // Avoid duplicate buttons
      if (codeBlock.parentNode.querySelector(".copy-btn")) return;
      const button = document.createElement("button");
      button.className = "copy-btn";
      button.type = "button";
      button.innerHTML = "Copy";
      button.onclick = function () {
        const text = codeBlock.innerText;
        navigator.clipboard.writeText(text).then(function () {
          button.innerHTML = "Copied!";
          setTimeout(function () {
            button.innerHTML = "Copy";
          }, 1200);
        });
      };
      const pre = codeBlock.parentNode;
      pre.style.position = "relative";
      button.style.position = "absolute";
      button.style.top = "8px";
      button.style.right = "8px";
      button.style.padding = "2px 8px";
      button.style.fontSize = "0.9em";
      button.style.background = "#222";
      button.style.color = "#fff";
      button.style.border = "none";
      button.style.borderRadius = "4px";
      button.style.cursor = "pointer";
      button.style.opacity = "0.7";
      button.onmouseenter = function () {
        button.style.opacity = "1";
      };
      button.onmouseleave = function () {
        button.style.opacity = "0.7";
      };
      pre.appendChild(button);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addCopyButtons);
  } else {
    addCopyButtons();
  }
})();
