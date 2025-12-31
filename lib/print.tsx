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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Arial', sans-serif; 
          /* Memperbesar ukuran dasar font agar terbaca jelas */
          font-size: 14px; 
          width: 384px; /* Lebar standar printer 58mm dalam pixel (48mm efektif) */
          color: #000;
          background: #fff;
        }

        @media print {
          @page { 
            size: 58mm 3276mm; 
            margin: 0; 
          }
          body { 
            width: 384px; 
          }
        }

        .receipt-wrapper {
          padding: 10px;
          width: 100%;
        }

        .header { 
          text-align: center; 
          margin-bottom: 12px; 
        }
        .header h1 { 
          font-size: 18px; /* Nama toko lebih besar */
          font-weight: bold; 
          margin-bottom: 4px;
        }
        .header p { 
          font-size: 11px; 
          line-height: 1.2;
        }

        .divider { 
          border-top: 1px dashed #000; 
          margin: 8px 0; 
        }

        .info-table { 
          width: 100%; 
          font-size: 12px; 
          margin-bottom: 8px;
        }
        .flex-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .items-container {
          width: 100%;
        }
        .item-row {
          margin-bottom: 8px;
        }
        .item-name {
          font-weight: bold;
          font-size: 14px;
          display: block;
          margin-bottom: 2px;
        }
        .item-details {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .total-section {
          margin-top: 10px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 13px;
        }
        .grand-total {
          font-size: 16px;
          font-weight: bold;
          border-top: 2px solid #000;
          margin-top: 5px;
          padding-top: 5px;
        }

        .footer { 
          text-align: center; 
          margin-top: 20px; 
          margin-bottom: 40px; /* Jarak sobek */
          font-size: 12px; 
        }
      </style>
    </head>
    <body>
      <div class="receipt-wrapper">
        <div class="header">
          <h1>${namaToko}</h1>
          <p>${alamatToko}</p>
        </div>
        
        <div class="divider"></div>
        
        <div class="info-table">
          <div class="flex-row">
            <span>No: #${displayId}</span>
            <span>${data.tanggal}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="items-container">
          ${data.items.map((item) => `
            <div class="item-row">
              <span class="item-name">${item.nama_barang}</span>
              <div class="item-details">
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
          <p>Barang yang sudah dibeli tidak dapat ditukar</p>
        </div>
      </div>
    </body>
    </html>
  `

  const printWindow = window.open("", "_blank", "width=400,height=600")
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Memberikan delay agar browser selesai menghitung layout sebelum print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }
}


