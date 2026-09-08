document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const navbar = document.querySelector(".navbar");

  if (menuToggle && navbar) {
    menuToggle.addEventListener("click", () => {
      navbar.classList.toggle("mobile-menu-open");
      menuToggle.classList.toggle("active");
      const isOpen = navbar.classList.contains("mobile-menu-open");
      menuToggle.setAttribute("aria-expanded", isOpen);
    });
  }
});