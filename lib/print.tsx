// Print Nota via Browser yang disesuaikan untuk kejelasan dan kerapihan
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
          font-family: 'Courier New', Courier, monospace; /* Font struk klasik agar lebih rapi */
          font-size: 12px; 
          width: 58mm; 
          color: #000;
          line-height: 1.4;
        }

        @media print {
          @page { size: 58mm auto; margin: 0; }
          body { width: 58mm; }
        }

        .container {
          padding: 4mm 2mm; 
          width: 100%;
          text-align: center; /* Membuat semua konten default ke tengah */
        }

        .header { margin-bottom: 10px; }
        .header h1 { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .header p { font-size: 10px; }

        .divider { 
          border-top: 1px dashed #000; 
          margin: 8px 0; 
        }

        .info { margin-bottom: 10px; font-size: 11px; }
        .info p { display: flex; justify-content: space-between; margin-bottom: 2px; }

        .items { width: 100%; text-align: left; } /* Nama barang tetap kiri agar mudah dibaca */
        .item { margin-bottom: 8px; }
        .item-name { font-weight: bold; display: block; text-transform: uppercase; font-size: 12px; }
        .item-detail { 
          display: flex; 
          justify-content: space-between;
          font-size: 11px;
        }

        .total-section { margin-top: 10px; }
        .total-section p { 
          display: flex; 
          justify-content: space-between;
          padding: 2px 0;
          font-size: 11px;
        }
        .total-section .grand-total { 
          font-weight: bold; 
          font-size: 14px; /* Perbesar total utama */
          border-top: 1px double #000;
          border-bottom: 1px double #000;
          margin: 6px 0;
          padding: 6px 0;
        }

        .footer { 
          margin-top: 20px; 
          font-size: 10px;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${namaToko}</h1>
          <p>${alamatToko}</p>
        </div>
        
        <div class="divider"></div>
        
        <div class="info">
          <p><span>No:</span><span>#${displayId}</span></p>
          <p><span>Tgl:</span><span>${data.tanggal}</span></p>
        </div>
        
        <div class="divider"></div>
        
        <div class="items">
          ${data.items
            .map(
              (item) => `
            <div class="item">
              <span class="item-name">${item.nama_barang}</span>
              <div class="item-detail">
                <span>${item.qty} x ${formatRupiah(item.harga_jual)}</span>
                <span>${formatRupiah(item.subtotal)}</span>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
        
        <div class="total-section">
          <div class="grand-total">
            <p><span>TOTAL:</span><span>${formatRupiah(data.total)}</span></p>
          </div>
          <p><span>Bayar:</span><span>${formatRupiah(data.uang_dibayar)}</span></p>
          <p><span>Kembali:</span><span>${formatRupiah(data.kembalian)}</span></p>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          <p>*** Terima Kasih ***</p>
          <p>Selamat Berbelanja Kembali</p>
        </div>
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
    }, 500)
  }
}
