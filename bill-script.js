import { databaseError, requireAccount } from "./firebase.js";
import { formatInvoiceDate, invoiceKey, ITEMS_PER_PAGE } from "./invoice-data.js";
import {
  invoiceLink, readLegacyInvoice, readPendingInvoice, removePendingInvoice, saveInvoice,
} from "./invoice-store.js";

const notice = document.getElementById("billNotice");
const status = document.getElementById("pageStatus");
const retryButton = document.getElementById("retrySave");
const editLink = document.getElementById("editPending");
const historyLink = document.getElementById("backToHistory");
const invoicePages = document.getElementById("invoicePages");
const copyButton = document.getElementById("toggler");
const downloadStatus = document.getElementById("downloadStatus");

function showStatus(message, loading = false) {
  status.textContent = message;
  status.classList.toggle("is-loading", loading);
  notice.hidden = !message;
}

function renderInvoicePage(page, invoice, pageIndex, isLastPage) {
  const set = (id, value) => { page.querySelector(`#${id}`).textContent = value ?? ""; };
  const { customer, totals } = invoice;
  const suffixIndex = invoice.invoiceNo.lastIndexOf("/");
  set("invoiceNo", invoice.invoiceNo.slice(0, suffixIndex));
  set("invoiceYear", invoice.invoiceNo.slice(suffixIndex));
  set("invoiceDate", formatInvoiceDate(invoice.invoiceDate));
  set("millName", customer.name);
  set("millAddress", customer.address);
  set("millGSTIN", customer.gstin);
  set("placeOfSupply", customer.placeOfSupply);

  for (let row = 1; row <= ITEMS_PER_PAGE; row++) {
    const serial = pageIndex * ITEMS_PER_PAGE + row;
    const item = invoice.items[serial];
    set(`sno${row}`, item?.serial ?? (item ? serial : ""));
    set(`par${row}`, item?.description);
    set(`hsn${row}`, item?.hsn);
    set(`rat${row}`, item?.rate);
    set(`qty${row}`, item?.quantityUnit ? `${item.quantity} ${item.quantityUnit}` : item?.quantity);
    set(`amo${row}`, item?.amount);
  }

  if (isLastPage) {
    set("total", totals.subtotal);
    set("igst", totals.igst);
    set("cgst", totals.cgst);
    set("sgst", totals.sgst);
    set("totalAmount", `${totals.grandTotal}/-`);
    set("amountInWords", `${totals.amountInWords} Rupees Only`);
  } else {
    page.querySelector(".main-grid").classList.add("invoice-continuation");
    page.querySelectorAll(".item11 ~ *").forEach((item) => item.remove());
  }

  if (pageIndex > 0) {
    for (const field of page.querySelectorAll("[id]")) field.id += `-page${pageIndex + 1}`;
  }
}

function renderInvoice(invoice) {
  const lastRow = Math.max(1, ...Object.keys(invoice.items).map(Number));
  const pageCount = Math.ceil(lastRow / ITEMS_PER_PAGE);
  const firstPage = invoicePages.firstElementChild;
  const pages = [firstPage];
  for (let index = 1; index < pageCount; index++) pages.push(firstPage.cloneNode(true));
  pages.forEach((page, index) => renderInvoicePage(page, invoice, index, index === pageCount - 1));
  invoicePages.append(...pages.slice(1));
  document.querySelector("[data-private]").hidden = false;
}

function toggleContent() {
  const text = copyButton.textContent === "ORIGINAL FOR RECIPIENT"
    ? "DUPLICATE FOR RECORDS"
    : "ORIGINAL FOR RECIPIENT";
  copyButton.textContent = text;
  for (const label of invoicePages.querySelectorAll(".invoice-copy-label")) label.textContent = text;
}

async function downloadPDF(event) {
  const button = event.currentTarget;
  const [first, ...remaining] = invoicePages.querySelectorAll(".main-grid");
  const options = {
    margin: 0,
    filename: "SS Tex Invoice.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 3 },
    jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
  };
  button.disabled = true;
  copyButton.disabled = true;
  button.textContent = "Preparing PDF…";
  downloadStatus.hidden = true;
  try {
    const firstPage = window.html2pdf().set(options).from(first).toPdf();
    const pdf = await firstPage.get("pdf");
    const { inner: { width, height } } = await firstPage.get("pageSize");
    for (const grid of remaining) {
      const canvas = await window.html2pdf().set(options).from(grid).toCanvas().get("canvas");
      const scale = Math.min(width / canvas.width, height / canvas.height);
      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", options.image.quality), "JPEG",
        0, 0, canvas.width * scale, canvas.height * scale);
    }
    pdf.save(options.filename);
  } catch {
    downloadStatus.textContent = "Could not download the invoice. Try again or use Print.";
    downloadStatus.hidden = false;
  } finally {
    button.disabled = false;
    copyButton.disabled = false;
    button.textContent = "Download";
  }
}

function syncPending(firebase, invoice) {
  async function sync() {
    retryButton.hidden = true;
    editLink.hidden = true;
    showStatus("Saved on this device. Syncing the invoice…", true);
    const waiting = setTimeout(() => {
      showStatus("Saved on this device. Waiting to sync…", true);
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
        const message = databaseError(error, "Could not sync the invoice.");
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
  copyButton.addEventListener("click", toggleContent);
  document.getElementById("printInvoice").addEventListener("click", () => window.print());
  document.getElementById("downloadInvoice").addEventListener("click", downloadPDF);
  if (pendingId) await syncPending(firebase, invoice);
  else showStatus("");
}

start().catch((error) => {
  showStatus(error.message);
  historyLink.hidden = false;
});
