import { databaseError, requireAccount } from "./firebase.js";
import { formatInvoiceDate } from "./invoice-data.js";
import { draftLink, draftsPath, invoiceLink, migrateLocalDrafts, watchInvoiceRecords } from "./invoice-store.js";

const pageStatus = document.getElementById("pageStatus");
const invoiceStatus = document.getElementById("recentInvoiceStatus");
const draftStatus = document.getElementById("recentDraftStatus");
const invoiceList = document.getElementById("recentInvoiceList");
const draftList = document.getElementById("recentDraftList");
const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const counts = new Intl.NumberFormat("en-IN");
const billingTimeZone = "Asia/Kolkata";
const monthPeriod = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: billingTimeZone });
const monthParts = new Intl.DateTimeFormat("en-IN", { month: "2-digit", year: "numeric", timeZone: billingTimeZone });
const recentLimit = 5;

function showStatus(element, message) {
  element.textContent = message;
  element.classList.remove("is-loading");
  element.hidden = !message;
}

function renderRecent(list, records, linkTo) {
  const entries = records.slice(0, recentLimit).map(({ id, invoice }) => {
    const row = document.createElement("li");
    const details = document.createElement("div");
    const link = document.createElement("a");
    link.href = linkTo(id);
    link.textContent = invoice.invoiceNo;
    const date = document.createElement("time");
    date.dateTime = invoice.invoiceDate;
    date.textContent = formatInvoiceDate(invoice.invoiceDate);
    const caption = document.createElement("small");
    caption.append(`${invoice.customer.name} `, date);
    details.append(link, caption);
    const amount = document.createElement("span");
    amount.className = "dashboard-amount";
    amount.textContent = rupees.format(invoice.totals.grandTotal);
    row.append(details, amount);
    return row;
  });
  list.replaceChildren(...entries);
}

function renderInvoiceTotals(records) {
  const now = new Date();
  const parts = Object.fromEntries(monthParts.formatToParts(now).map(({ type, value }) => [type, value]));
  const month = `${parts.year}-${parts.month}`;
  let total = 0;
  for (const { invoice } of records) {
    if (invoice.invoiceDate.startsWith(`${month}-`)) total += invoice.totals.grandTotal;
  }
  document.getElementById("currentMonth").textContent = monthPeriod.format(now);
  document.getElementById("monthlyTotal").textContent = rupees.format(total);
  document.getElementById("invoiceCount").textContent = counts.format(records.length);
}

async function start() {
  const firebase = await requireAccount();
  if (!firebase) return;
  document.querySelector("[data-private]").hidden = false;
  showStatus(pageStatus, "");

  watchInvoiceRecords(firebase, "invoices", (records) => {
    renderInvoiceTotals(records);
    renderRecent(invoiceList, records, invoiceLink);
    showStatus(invoiceStatus, records.length ? "" : "No saved invoices yet.");
  }, (error) => {
    showStatus(invoiceStatus, databaseError(error, "Could not load invoices. Check your connection and reload."));
  });

  watchInvoiceRecords(firebase, draftsPath(firebase.user.uid), (records) => {
    document.getElementById("draftCount").textContent = counts.format(records.length);
    document.getElementById("allDraftsLink").hidden = records.length === 0;
    renderRecent(draftList, records, draftLink);
    showStatus(draftStatus, records.length ? "" : "No open drafts.");
  }, (error) => {
    showStatus(draftStatus, databaseError(error, "Could not load drafts. Check your connection and reload."));
  });

  migrateLocalDrafts(firebase).catch((error) => showStatus(pageStatus, error.message));
}

start().catch((error) => showStatus(pageStatus, error.message));
