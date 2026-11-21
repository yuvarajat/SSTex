const tabs = [
  { label: "Dashboard", href: "dashboard.html" },
  { label: "New Invoice", href: "calc.html" },
  { label: "Invoice History", href: "history.html" },
  { label: "Customer Details", href: "catalog.html" },
  { label: "Service Items", href: "services.html" },
];

const navigation = document.querySelector(".app-nav");
const layout = document.createElement("div");
layout.className = "nav-layout";
const brand = document.createElement("div");
brand.className = "brand";
const logo = new Image(38, 38);
logo.src = "media/SST Logo.png";
logo.alt = "";
const name = document.createElement("span");
name.textContent = "SS Tex";
brand.append(logo, name);

const tabList = document.createElement("div");
tabList.className = "app-tabs";
const currentPage = location.pathname.split("/").at(-1);

for (const { label, href } of tabs) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  if (href === currentPage) link.setAttribute("aria-current", "page");
  tabList.append(link);
}

const signOut = document.createElement("button");
signOut.id = "signOut";
signOut.type = "button";
signOut.className = "button sign-out";
signOut.textContent = "Sign out";
layout.append(brand, tabList, signOut);
navigation.append(layout);
