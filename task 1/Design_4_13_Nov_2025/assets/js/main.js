const slider = document.getElementById("range");
  const value = document.getElementById("value");

  slider.oninput = function () {
    value.textContent = this.value;
  };