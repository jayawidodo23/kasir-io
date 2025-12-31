// Print Nota via Browser
import type { TransaksiItem } from "./db"
import { formatRupiah } from "./currency"

interface NotaData {
  id: string | number
  tanggal: string
  items: TransaksiItem[]
  total: number
  uang_dibayar: number
  kembalian: number
  namaToko?: string
  alamatToko?: string
}

export function printNota(data: NotaData): void {
  const namaToko = data.namaToko || "JAYA WIDODO"
  const alamatToko = data.alamatToko || "Villa Karangsari Blok E-02, Pepabri, Jemur Kec. Kebumen"
  const displayId = typeof data.id === "string" ? data.id.slice(-6).toUpperCase() : data.id

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nota #${displayId}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 12px; 
          width: 80mm; 
          padding: 5mm;
        }
        .header { text-align: center; margin-bottom: 10px; }
        .header h1 { font-size: 16px; font-weight: bold; }
        .header p { font-size: 10px; }
        .divider { 
          border-top: 1px dashed #000; 
          margin: 8px 0; 
        }
        .info { margin-bottom: 8px; }
        .info p { display: flex; justify-content: space-between; }
        .items { width: 100%; }
        .item { margin-bottom: 4px; }
        .item-name { font-weight: bold; }
        .item-detail { 
          display: flex; 
          justify-content: space-between;
          padding-left: 10px;
        }
        .total-section { margin-top: 8px; }
        .total-section p { 
          display: flex; 
          justify-content: space-between;
          padding: 2px 0;
        }
        .total-section .grand-total { 
          font-weight: bold; 
          font-size: 14px;
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 4px 0;
        }
        .footer { 
          text-align: center; 
          margin-top: 15px; 
          font-size: 10px; 
        }
        @media print {
          body { width: 80mm; }
          @page { size: 80mm auto; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${namaToko}</h1>
        <p>${alamatToko}</p>
      </div>
      
      <div class="divider"></div>
      
      <div class="info">
        <p><span>No:</span><span>#${displayId}</span></p>
        <p><span>Tanggal:</span><span>${data.tanggal}</span></p>
      </div>
      
      <div class="divider"></div>
      
      <div class="items">
        ${data.items
          .map(
            (item) => `
          <div class="item">
            <div class="item-name">${item.nama_barang}</div>
            <div class="item-detail">
              <span>${item.qty} x ${formatRupiah(item.harga_jual)}</span>
              <span>${formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      
      <div class="divider"></div>
      
      <div class="total-section">
        <p class="grand-total">
          <span>TOTAL:</span>
          <span>${formatRupiah(data.total)}</span>
        </p>
        <p>
          <span>Bayar:</span>
          <span>${formatRupiah(data.uang_dibayar)}</span>
        </p>
        <p>
          <span>Kembali:</span>
          <span>${formatRupiah(data.kembalian)}</span>
        </p>
      </div>
      
      <div class="divider"></div>
      
      <div class="footer">
        <p>Terima Kasih</p>
        <p>Selamat Berbelanja Kembali</p>
      </div>
    </body>
    </html>
  `

  const printWindow = window.open("", "_blank", "width=300,height=600")
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}