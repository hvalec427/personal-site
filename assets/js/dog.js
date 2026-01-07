let keyPressSequence = "";

document.addEventListener("keypress", (event) => {
  keyPressSequence += event.key.toLowerCase();
  if (keyPressSequence.length > 3) {
    keyPressSequence = keyPressSequence.slice(-3);
  }

  if (keyPressSequence === "dog") {
    window.location.href = "/dog";
    keyPressSequence = "";
  }
});
