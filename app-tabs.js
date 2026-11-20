const tabs = [
  { label: "New Invoice", href: "calc.html" },
  { label: "Invoice History", href: "history.html" },
  { label: "Customer Details", href: "catalog.html" },
  { label: "Service Items", href: "services.html" },
];

const tabList = document.querySelector(".app-tabs");
const currentPage = location.pathname.split("/").at(-1);

for (const { label, href } of tabs) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  if (href === currentPage) link.setAttribute("aria-current", "page");
  tabList.append(link);
}
