const form = document.getElementById('form');

// const millName = document.getElementById('millName');
// const millAddress = document.getElementById('millAddress');
// const millGSTIN = document.getElementById('millGSTIN');
// const invoiceNo = document.getElementById('invoiceNo');
// const invoiceDate = document.getElementById('invoiceDate');

form.addEventListener('submit', function(e) {
    e.preventDefault();

    const millName = document.getElementById('millName').value;
    const millAddress = document.getElementById('millAddress').value;
    const millGSTIN = document.getElementById('millGSTIN').value;
    const invoiceNo = document.getElementById('invoiceNo').value;
    const invoiceDate = document.getElementById('invoiceDate').value;

    localStorage.setItem('millName', millName);
    localStorage.setItem('millAddress', millAddress);
    localStorage.setItem('millGSTIN', millGSTIN);
    localStorage.setItem('invoiceNo', invoiceNo);
    localStorage.setItem('invoiceDate', invoiceDate);

    window.location.href = "index.html";
});
