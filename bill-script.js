// const millName = localStorage.getItem('millName');
// const millAddress = localStorage.getItem('millAddress');
// const millGSTIN = localStorage.getItem('millGSTIN');
// const invoiceNo = localStorage.getItem('invoiceNo');
// const invoiceDate = localStorage.getItem('invoiceDate');

function convertDateFormat(inputDate) {
  // Parse the input date
  const parts = inputDate.split("-");
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  // Create a new date string in the desired format
  const outputDate = `${day}-${month}-${year}`;

  return outputDate;
}

document.getElementById("millName").textContent =
  localStorage.getItem("millName");
document.getElementById("millAddress").textContent =
  localStorage.getItem("millAddress");
document.getElementById("millGSTIN").textContent =
  localStorage.getItem("millGSTIN");
document.getElementById("invoiceNo").textContent =
  localStorage.getItem("invoiceNo");
document.getElementById("invoiceDate").textContent = convertDateFormat(
  localStorage.getItem("invoiceDate")
);

document.getElementById("sno1").textContent = localStorage.getItem("sno1");
document.getElementById("par1").textContent = localStorage.getItem("par1");
document.getElementById("hsn1").textContent = localStorage.getItem("hsn1");
document.getElementById("qty1").textContent = localStorage.getItem("qty1");
document.getElementById("rat1").textContent = localStorage.getItem("rat1");
document.getElementById("amo1").textContent = localStorage.getItem("amo1");

document.getElementById("sno2").textContent = localStorage.getItem("sno2");
document.getElementById("par2").textContent = localStorage.getItem("par2");
document.getElementById("hsn2").textContent = localStorage.getItem("hsn2");
document.getElementById("qty2").textContent = localStorage.getItem("qty2");
document.getElementById("rat2").textContent = localStorage.getItem("rat2");
document.getElementById("amo2").textContent = localStorage.getItem("amo2");

document.getElementById("sno3").textContent = localStorage.getItem("sno3");
document.getElementById("par3").textContent = localStorage.getItem("par3");
document.getElementById("hsn3").textContent = localStorage.getItem("hsn3");
document.getElementById("qty3").textContent = localStorage.getItem("qty3");
document.getElementById("rat3").textContent = localStorage.getItem("rat3");
document.getElementById("amo3").textContent = localStorage.getItem("amo3");

document.getElementById("sno4").textContent = localStorage.getItem("sno4");
document.getElementById("par4").textContent = localStorage.getItem("par4");
document.getElementById("hsn4").textContent = localStorage.getItem("hsn4");
document.getElementById("qty4").textContent = localStorage.getItem("qty4");
document.getElementById("rat4").textContent = localStorage.getItem("rat4");
document.getElementById("amo4").textContent = localStorage.getItem("amo4");

document.getElementById("sno5").textContent = localStorage.getItem("sno5");
document.getElementById("par5").textContent = localStorage.getItem("par5");
document.getElementById("hsn5").textContent = localStorage.getItem("hsn5");
document.getElementById("qty5").textContent = localStorage.getItem("qty5");
document.getElementById("rat5").textContent = localStorage.getItem("rat5");
document.getElementById("amo5").textContent = localStorage.getItem("amo5");

document.getElementById("sno6").textContent = localStorage.getItem("sno6");
document.getElementById("par6").textContent = localStorage.getItem("par6");
document.getElementById("hsn6").textContent = localStorage.getItem("hsn6");
document.getElementById("qty6").textContent = localStorage.getItem("qty6");
document.getElementById("rat6").textContent = localStorage.getItem("rat6");
document.getElementById("amo6").textContent = localStorage.getItem("amo6");

document.getElementById("sno7").textContent = localStorage.getItem("sno7");
document.getElementById("par7").textContent = localStorage.getItem("par7");
document.getElementById("hsn7").textContent = localStorage.getItem("hsn7");
document.getElementById("qty7").textContent = localStorage.getItem("qty7");
document.getElementById("rat7").textContent = localStorage.getItem("rat7");
document.getElementById("amo7").textContent = localStorage.getItem("amo7");

document.getElementById("sno8").textContent = localStorage.getItem("sno8");
document.getElementById("par8").textContent = localStorage.getItem("par8");
document.getElementById("hsn8").textContent = localStorage.getItem("hsn8");
document.getElementById("qty8").textContent = localStorage.getItem("qty8");
document.getElementById("rat8").textContent = localStorage.getItem("rat8");
document.getElementById("amo8").textContent = localStorage.getItem("amo8");

document.getElementById("sno9").textContent = localStorage.getItem("sno9");
document.getElementById("par9").textContent = localStorage.getItem("par9");
document.getElementById("hsn9").textContent = localStorage.getItem("hsn9");
document.getElementById("qty9").textContent = localStorage.getItem("qty9");
document.getElementById("rat9").textContent = localStorage.getItem("rat9");
document.getElementById("amo9").textContent = localStorage.getItem("amo9");

document.getElementById("sno10").textContent = localStorage.getItem("sno10");
document.getElementById("par10").textContent = localStorage.getItem("par10");
document.getElementById("hsn10").textContent = localStorage.getItem("hsn10");
document.getElementById("qty10").textContent = localStorage.getItem("qty10");
document.getElementById("rat10").textContent = localStorage.getItem("rat10");
document.getElementById("amo10").textContent = localStorage.getItem("amo10");

document.getElementById("total").textContent = localStorage.getItem("total");
document.getElementById("igst").textContent = localStorage.getItem("igst");
document.getElementById("cgst").textContent = localStorage.getItem("cgst");
document.getElementById("sgst").textContent = localStorage.getItem("sgst");
document.getElementById("totalAmount").textContent =
  localStorage.getItem("totalAmount");

document.getElementById("amountInWords").textContent =
  localStorage.getItem("amountInWords") + " " + "Rupees Only";

function printPage() {
    window.print();
}

function toggleContent(buttonId, spanId) {
    const buttonText = document.getElementById(buttonId);
    const spanContent = document.getElementById(spanId);

    // Toggle content between "DUPLICATE FOR RECORDS" and "ORIGINAL FOR RECIPIENT"
    if (buttonText.textContent === 'ORIGINAL FOR RECIPIENT') {
      buttonText.textContent = 'DUPLICATE FOR RECORDS';
      spanContent.textContent = 'DUPLICATE FOR RECORDS';
    } else {
      buttonText.textContent = 'ORIGINAL FOR RECIPIENT';
      spanContent.textContent = 'ORIGINAL FOR RECIPIENT';
    }
  }