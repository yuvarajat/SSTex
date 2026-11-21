import { databaseError, requireAccount } from "./firebase.js";
import { formatInvoiceDate, invoiceKey, ITEMS_PER_PAGE } from "./invoice-data.js";
import {
  clearFinalizedInvoice, draftLink, invoiceLink, queueInvoice, readDraft, readLegacyInvoice,
  readPendingInvoice, saveDraft, saveInvoice,
} from "./invoice-store.js";

const notice = document.getElementById("billNotice");
const status = document.getElementById("pageStatus");
const retryButton = document.getElementById("retrySave");
const editLink = document.getElementById("editPending");
const historyLink = document.getElementById("backToHistory");
const invoicePages = document.getElementById("invoicePages");
const copyButton = document.getElementById("toggler");
const downloadStatus = document.getElementById("downloadStatus");
const draftStatus = document.getElementById("draftStatus");
const finalizeButton = document.getElementById("finalizeInvoice");

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

function renderInvoice(invoice, isDraft) {
  const lastRow = Math.max(1, ...Object.keys(invoice.items).map(Number));
  const pageCount = Math.ceil(lastRow / ITEMS_PER_PAGE);
  const firstPage = invoicePages.firstElementChild;
  const pages = [firstPage];
  for (let index = 1; index < pageCount; index++) pages.push(firstPage.cloneNode(true));
  pages.forEach((page, index) => renderInvoicePage(page, invoice, index, index === pageCount - 1));
  invoicePages.append(...pages.slice(1));
  if (isDraft) {
    for (const label of invoicePages.querySelectorAll(".invoice-copy-label")) {
      label.textContent = "DRAFT · FOR REVIEW";
      label.classList.add("draft-label");
    }
  }
  document.querySelector("[data-private]").hidden = false;
}

function toggleContent() {
  const text = copyButton.textContent === "ORIGINAL FOR RECIPIENT"
    ? "DUPLICATE FOR RECORDS"
    : "ORIGINAL FOR RECIPIENT";
  copyButton.textContent = text;
  for (const label of invoicePages.querySelectorAll(".invoice-copy-label")) label.textContent = text;
}

async function downloadPDF(event, isDraft = false) {
  const button = event.currentTarget;
  const buttonLabel = button.textContent;
  const [first, ...remaining] = invoicePages.querySelectorAll(".main-grid");
  const options = {
    margin: 0,
    filename: isDraft ? "SS Tex Invoice - DRAFT.pdf" : "SS Tex Invoice.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 3 },
    jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
  };
  button.disabled = true;
  copyButton.disabled = true;
  finalizeButton.disabled = true;
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
    if (isDraft) {
      draftStatus.textContent = "Could not download the draft. Try again.";
    } else {
      downloadStatus.textContent = "Could not download the invoice. Try again or use Print.";
      downloadStatus.hidden = false;
    }
  } finally {
    button.disabled = false;
    copyButton.disabled = false;
    finalizeButton.disabled = false;
    button.textContent = buttonLabel;
  }
}

function showDraftActions(firebase, draft, isPreview) {
  const { user } = firebase;
  const download = document.getElementById("downloadDraft");
  document.getElementById("editDraft").href = draftLink(draft.draftId, { edit: true, preview: isPreview });
  document.getElementById("draftActions").hidden = false;
  document.getElementById("finalInvoiceActions").hidden = true;
  download.addEventListener("click", (event) => downloadPDF(event, true));

  const save = document.getElementById("saveDraft");
  save.addEventListener("click", () => {
    try {
      saveDraft(user.uid, draft);
      draftStatus.textContent = "Draft saved on this device. Find it in Invoice History.";
    } catch {
      draftStatus.textContent = "Could not save this draft. Keep this tab open to return to the preview.";
    }
  });

  finalizeButton.addEventListener("click", async () => {
    finalizeButton.disabled = true;
    download.disabled = true;
    try {
      queueInvoice(user.uid, draft);
    } catch {
      draftStatus.textContent = "Finalizing invoice… Keep this page open.";
      try {
        await saveInvoice(firebase, draft);
        clearFinalizedInvoice(user.uid, draft);
        location.replace(invoiceLink(invoiceKey(draft.invoiceNo)));
      } catch (error) {
        draftStatus.textContent = error.code === "duplicate-invoice" ? error.message
          : databaseError(error, "Could not finalize the invoice. Your preview is still available.");
        finalizeButton.disabled = false;
        download.disabled = false;
      }
      return;
    }
    location.replace(invoiceLink(draft.submissionId, true));
  });
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
      clearFinalizedInvoice(firebase.user.uid, invoice);
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
  const previewId = params.get("preview");
  const draftId = previewId ?? params.get("draft");
  const pendingId = params.get("pending");
  const id = params.get("id");
  let invoice;
  if (draftId) {
    invoice = readDraft(firebase.user.uid, draftId, Boolean(previewId));
  } else if (pendingId) {
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
  renderInvoice(invoice, Boolean(draftId));
  if (draftId) {
    showDraftActions(firebase, invoice, Boolean(previewId));
    showStatus("");
    return;
  }
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
