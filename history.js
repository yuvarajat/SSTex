import { databaseError, requireAccount } from "./firebase.js";
import { formatInvoiceDate } from "./invoice-data.js";
import { draftLink, draftsPath, invoiceLink, listPendingInvoices, migrateLocalDrafts, readLegacyInvoice } from "./invoice-store.js";

const pageStatus = document.getElementById("pageStatus");
const historyStatus = document.getElementById("historyStatus");
const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

function showStatus(element, message) {
  element.textContent = message;
  element.classList.remove("is-loading");
  element.hidden = !message;
}

function makeLink(number, href) {
  const link = document.createElement("a");
  link.textContent = number;
  link.href = href;
  return link;
}

function showLocalInvoices(uid) {
  try {
    const pending = listPendingInvoices(uid);
    document.getElementById("pendingSection").hidden = pending.length === 0;
    document.getElementById("pendingList").replaceChildren(...pending.map((invoice) => {
      const item = document.createElement("li");
      item.append(
        makeLink(invoice.invoiceNo, invoiceLink(invoice.submissionId, true)),
        ` · ${invoice.customer.name} · ${rupees.format(invoice.totals.grandTotal)}`,
      );
      return item;
    }));
    document.getElementById("legacyInvoice").hidden = !readLegacyInvoice();
  } catch {
    showStatus(pageStatus, "This browser could not read locally saved invoices.");
  }
}

function watchDrafts(firebase) {
  const { database, databaseSdk, user } = firebase;
  const { onValue, orderByChild, query, ref } = databaseSdk;
  const section = document.getElementById("draftSection");
  const draftsStatus = document.getElementById("draftsStatus");
  section.hidden = false;
  onValue(query(ref(database, draftsPath(user.uid)), orderByChild("savedAt")), (snapshot) => {
    const links = [];
    snapshot.forEach((child) => {
      const draft = child.val();
      const item = document.createElement("li");
      item.append(
        makeLink(draft.invoiceNo, draftLink(child.key)),
        ` · ${draft.customer.name} · ${rupees.format(draft.totals.grandTotal)}`,
      );
      links.push(item);
    });
    document.getElementById("draftList").replaceChildren(...links.reverse());
    showStatus(draftsStatus, "");
    section.hidden = links.length === 0;
  }, (error) => {
    showStatus(draftsStatus, databaseError(error, "Could not load drafts. Check your connection and reload."));
  });
  migrateLocalDrafts(firebase).catch(() => {
    showStatus(pageStatus, "Some drafts from this browser could not sync. Reload to try again.");
  });
}

async function start() {
  const firebase = await requireAccount();
  if (!firebase) return;
  const { database, databaseSdk, user } = firebase;
  document.querySelector("[data-private]").hidden = false;
  showStatus(pageStatus, "");
  showLocalInvoices(user.uid);
  window.addEventListener("storage", () => showLocalInvoices(user.uid));
  watchDrafts(firebase);
  const { onValue, orderByChild, query, ref } = databaseSdk;
  onValue(query(ref(database, "invoices"), orderByChild("savedAt")), (snapshot) => {
    const rows = [];
    snapshot.forEach((child) => {
      const invoice = child.val();
      const row = document.createElement("tr");
      const number = row.insertCell();
      number.append(makeLink(invoice.invoiceNo, invoiceLink(child.key)));
      row.insertCell().textContent = formatInvoiceDate(invoice.invoiceDate);
      row.insertCell().textContent = invoice.customer.name;
      row.insertCell().textContent = rupees.format(invoice.totals.grandTotal);
      rows.push(row);
    });
    document.getElementById("invoiceList").replaceChildren(...rows.reverse());
    document.getElementById("invoiceTable").hidden = rows.length === 0;
    showStatus(historyStatus, rows.length ? "" : "No saved invoices yet.");
  }, (error) => {
    showStatus(historyStatus, databaseError(error, "Could not load saved invoices. Check your connection and reload."));
  });
}

start().catch((error) => showStatus(pageStatus, error.message));
