
  
  const homeLink = document.getElementById("homeLink");
  const aboutLink = document.getElementById("aboutLink");
  const trainingLink = document.getElementById("trainingLink");

  homeLink.addEventListener("click", () => {
    window.location.href = "index.html"; 
  });

  aboutLink.addEventListener("click", () => {
    window.location.href = "about.html"; 
  });

  trainingLink.addEventListener("click", () => {
    window.location.href = "training.html"; 
  });
