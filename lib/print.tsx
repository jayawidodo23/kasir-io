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
      <style>
        /* Menggunakan font sans-serif agar lebih tebal dan mudah dibaca */
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
          font-family: 'Arial', sans-serif;
        }

        body { 
          width: 48mm; /* Area cetak efektif Blueprint 58D */
          margin: 0 auto; 
          background-color: white;
          color: #000;
        }

        @media print {
          @page { 
            size: 58mm auto; 
            margin: 0; 
          }
          body { 
            width: 48mm; 
            margin: 0 auto;
          }
        }

        .receipt {
          width: 100%;
          padding: 0;
        }

        .header { 
          text-align: center; 
          margin-bottom: 5px; 
          padding-top: 5mm;
        }
        .header h1 { 
          font-size: 14px; 
          font-weight: bold; 
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        .header p { 
          font-size: 9px; 
          line-height: 1.1;
        }

        .divider { 
          border-top: 1px dashed #000; 
          margin: 5px 0; 
          width: 100%;
        }

        .info { 
          font-size: 10px; 
          margin-bottom: 5px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
        }

        .items { 
          width: 100%; 
        }
        .item { 
          margin-bottom: 4px; 
        }
        .item-name { 
          font-size: 10px; 
          font-weight: bold; 
          display: block;
          text-transform: uppercase;
        }
        .item-detail { 
          display: flex; 
          justify-content: space-between;
          font-size: 10px;
        }

        .total-section { 
          margin-top: 5px; 
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          font-size: 11px;
          padding: 1px 0;
        }
        .grand-total { 
          font-weight: bold; 
          font-size: 12px;
          border-top: 1px solid #000;
          margin-top: 2px;
          padding-top: 3px;
        }

        .footer { 
          text-align: center; 
          margin-top: 10px; 
          margin-bottom: 10mm; /* Ruang agar tidak terpotong saat sobek */
          font-size: 9px; 
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>${namaToko}</h1>
          <p>${alamatToko}</p>
        </div>
        
        <div class="divider"></div>
        
        <div class="info">
          <div class="info-row">
            <span>No: #${displayId}</span>
            <span>${data.tanggal.split(',')[0]}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="items">
          ${data.items.map((item) => `
            <div class="item">
              <span class="item-name">${item.nama_barang}</span>
              <div class="item-detail">
                <span>${item.qty} x ${item.harga_jual.toLocaleString()}</span>
                <span>${item.subtotal.toLocaleString()}</span>
              </div>
            </div>
          `).join("")}
        </div>
        
        <div class="total-section">
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>${formatRupiah(data.total)}</span>
          </div>
          <div class="total-row">
            <span>Bayar:</span>
            <span>${formatRupiah(data.uang_dibayar)}</span>
          </div>
          <div class="total-row">
            <span>Kembali:</span>
            <span>${formatRupiah(data.kembalian)}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          <p>Terima Kasih</p>
          <p>Selamat Berbelanja Kembali</p>
        </div>
      </div>
    </body>
    </html>
  `

  const printWindow = window.open("", "_blank", "width=400,height=600")
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

