import { databaseError, requireAccount } from "./firebase.js";
import { formatInvoiceDate, invoiceKey, MAX_ITEMS } from "./invoice-data.js";
import {
  invoiceLink, readLegacyInvoice, readPendingInvoice, removePendingInvoice, saveInvoice,
} from "./invoice-store.js";

const notice = document.getElementById("billNotice");
const status = document.getElementById("pageStatus");
const retryButton = document.getElementById("retrySave");
const editLink = document.getElementById("editPending");
const historyLink = document.getElementById("backToHistory");

function showStatus(message) {
  status.textContent = message;
  notice.hidden = !message;
}

function renderInvoice(invoice) {
  const set = (id, value) => { document.getElementById(id).textContent = value ?? ""; };
  const { customer, totals } = invoice;
  const suffixIndex = invoice.invoiceNo.lastIndexOf("/");
  set("invoiceNo", invoice.invoiceNo.slice(0, suffixIndex));
  set("invoiceYear", invoice.invoiceNo.slice(suffixIndex));
  set("invoiceDate", formatInvoiceDate(invoice.invoiceDate));
  set("millName", customer.name);
  set("millAddress", customer.address);
  set("millGSTIN", customer.gstin);
  set("placeOfSupply", customer.placeOfSupply);

  for (let row = 1; row <= MAX_ITEMS; row++) {
    const item = invoice.items[row];
    set(`sno${row}`, item?.serial ?? (item ? row : ""));
    set(`par${row}`, item?.description);
    set(`hsn${row}`, item?.hsn);
    set(`rat${row}`, item?.rate);
    set(`qty${row}`, item?.quantity);
    set(`amo${row}`, item?.amount);
  }

  set("total", totals.subtotal);
  set("igst", totals.igst);
  set("cgst", totals.cgst);
  set("sgst", totals.sgst);
  set("totalAmount", `${totals.grandTotal}/-`);
  set("amountInWords", `${totals.amountInWords} Rupees Only`);
  document.querySelector("[data-private]").hidden = false;
}

function toggleContent() {
  const button = document.getElementById("toggler");
  const text = button.textContent === "ORIGINAL FOR RECIPIENT"
    ? "DUPLICATE FOR RECORDS"
    : "ORIGINAL FOR RECIPIENT";
  button.textContent = text;
  document.getElementById("oORd").textContent = text;
}

function printToPDF() {
  const element = document.querySelector(".main-grid");
  const options = {
    margin: 0,
    filename: "SS Tex Invoice.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 3 },
    jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
  };
  window.html2pdf(element, options);
}

function syncPending(firebase, invoice) {
  async function sync() {
    retryButton.hidden = true;
    editLink.hidden = true;
    showStatus("Saved on this device. Saving to Firebase…");
    const waiting = setTimeout(() => {
      showStatus("Saved on this device. Waiting for Firebase to confirm the save…");
    }, 6000);
    try {
      await saveInvoice(firebase, invoice);
      history.replaceState(null, "", invoiceLink(invoiceKey(invoice.invoiceNo)));
      removePendingInvoice(firebase.user.uid, invoice.submissionId);
      showStatus("Saved to Invoice History.");
      setTimeout(() => showStatus(""), 3000);
    } catch (error) {
      if (error.code === "duplicate-invoice") {
        showStatus(`${error.message} This copy is still on this device.`);
        editLink.href = `calc.html?${new URLSearchParams({ pending: invoice.submissionId })}`;
        editLink.hidden = false;
      } else {
        const message = databaseError(error, "Could not save to Firebase.");
        showStatus(`${message} This invoice is still on this device.`);
        retryButton.hidden = false;
      }
    } finally {
      clearTimeout(waiting);
    }
  }

  retryButton.addEventListener("click", sync);
  return sync();
}

async function start() {
  const firebase = await requireAccount();
  if (!firebase) return;
  const params = new URLSearchParams(location.search);
  const pendingId = params.get("pending");
  const id = params.get("id");
  let invoice;
  if (pendingId) {
    invoice = readPendingInvoice(firebase.user.uid, pendingId);
  } else if (id !== null) {
    if (!/^[\w!%'()~*\-]+$/.test(id)) throw new Error("Invalid invoice link.");
    const { get, ref } = firebase.databaseSdk;
    try {
      invoice = (await get(ref(firebase.database, `invoices/${id}`))).val();
    } catch (error) {
      throw new Error(databaseError(error, "Could not load the invoice. Check your connection and try again."));
    }
  } else {
    invoice = readLegacyInvoice();
  }

  if (!invoice) throw new Error("This invoice could not be found.");
  renderInvoice(invoice);
  document.getElementById("toggler").addEventListener("click", toggleContent);
  document.getElementById("printInvoice").addEventListener("click", () => window.print());
  document.getElementById("downloadInvoice").addEventListener("click", printToPDF);
  if (pendingId) await syncPending(firebase, invoice);
  else showStatus("");
}

start().catch((error) => {
  showStatus(error.message);
  historyLink.hidden = false;
});
