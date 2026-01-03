// Print Nota via Browser - Versi Penekanan Visual (Bold & Font Size)
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
          font-family: 'Courier New', Courier, monospace; 
          font-size: 13px; 
          width: 58mm; 
          color: #000;
          line-height: 1.2;
        }

        @media print {
          @page { size: 58mm auto; margin: 0; }
          body { width: 58mm; }
        }

        .container { padding: 4mm 2mm; width: 100%; }

        .header { text-align: left; margin-bottom: 12px; }
        .header h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
        .header p { font-size: 10px; }

        .divider { border-top: 1px dashed #000; margin: 8px 0; }

        /* Tanggal dibuat Bold */
        .info { margin-bottom: 10px; font-size: 13px; font-weight: bold; }
        .info p { display: flex; justify-content: space-between; margin-bottom: 2px; }

        .items { width: 100%; }
        .item { margin-bottom: 12px; }
        
        /* Nama Item diperbesar agar beda dengan harga */
        .item-name { 
          font-weight: bold; 
          display: block; 
          text-transform: uppercase; 
          font-size: 16px; 
          margin-bottom: 3px;
        }
        
        /* Detail/Harga dibuat Bold */
        .item-detail { 
          display: flex; 
          justify-content: space-between;
          font-size: 13px;
          font-weight: bold; 
        }

        .total-section { margin-top: 10px; }
        
        /* Bayar & Kembali dibuat Bold */
        .total-section p { 
          display: flex; 
          justify-content: space-between;
          padding: 2px 0;
          font-size: 14px;
          font-weight: bold; 
        }

        /* Total dibuat paling besar & menonjol */
        .total-section .grand-total { 
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          margin: 8px 0;
          padding: 8px 0;
        }
        .total-section .grand-total p {
          font-size: 20px; /* Ukuran paling besar */
          font-weight: 900;
        }

        .footer { text-align: left; margin-top: 25px; font-size: 11px; }
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
          <p><span>ID:</span><span>#${displayId}</span></p>
          <p><span>TGL:</span><span>${data.tanggal}</span></p>
        </div>
        
        <div class="divider"></div>
        
        <div class="items">
          ${data.items
            .map(
              (item) => `
            <div class="item">
              <span class="item-name">${item.nama_barang}</span>
              <div class="item-detail">
                <span>${item.qty} x ${formatRupiah(item.harga_jual).replace("Rp ", "")}</span>
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
          <p><span>BAYAR:</span><span>${formatRupiah(data.uang_dibayar)}</span></p>
          <p><span>KEMBALI:</span><span>${formatRupiah(data.kembalian)}</span></p>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          <p>TERIMA KASIH</p>
          <p>SELAMAT BERBELANJA KEMBALI</p>
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
