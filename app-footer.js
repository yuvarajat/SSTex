const footer = document.querySelector(".app-footer");
const content = document.createElement("div");
content.className = "app-footer-content";

const copyright = document.createElement("span");
copyright.textContent = "© 2026 SS Tex. All rights reserved.";

const credit = document.createElement("span");
const company = document.createElement("a");
company.href = "https://yuvathy.in";
company.textContent = "Yuvathy Technologies";
credit.append("Developed by ", company);

content.append(copyright, credit);
footer.append(content);
