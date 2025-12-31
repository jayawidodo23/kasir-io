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
        /* Reset & Base Styling */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Courier New', monospace; /* Font struk standar */
          font-size: 12px; /* Ukuran font ideal untuk 58mm */
          width: 48mm; /* Lebar area cetak efektif printer 58mm */
          margin: 0;
          color: #000;
        }

        @media print {
          @page { 
            size: 58mm auto; /* Paksa ukuran kertas ke 58mm */
            margin: 0; 
          }
          body { width: 48mm; } /* Sisakan sedikit margin fisik printer */
        }

        .header { text-align: center; margin-bottom: 5px; }
        .header h1 { font-size: 14px; font-weight: bold; text-transform: uppercase; }
        .header p { font-size: 10px; line-height: 1.2; }

        .divider { 
          border-top: 1px dashed #000; 
          margin: 5px 0; 
          width: 100%;
        }

        .info { font-size: 11px; margin-bottom: 5px; }
        .info table { width: 100%; }

        .items { width: 100%; font-size: 11px; }
        .item { margin-bottom: 3px; }
        .item-detail { 
          display: flex; 
          justify-content: space-between;
        }

        .total-section { margin-top: 5px; font-size: 12px; }
        .total-row { display: flex; justify-content: space-between; padding: 1px 0; }
        .grand-total { 
          font-weight: bold; 
          border-top: 1px dashed #000;
          margin-top: 3px;
          padding-top: 3px;
        }

        .footer { 
          text-align: center; 
          margin-top: 15px; 
          font-size: 10px;
          line-height: 1.2;
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
        <div style="display:flex; justify-content:space-between">
            <span>No: #${displayId}</span>
            <span>${data.tanggal.split(' ')[0]}</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="items">
        ${data.items.map((item) => `
          <div class="item">
            <div class="item-name">${item.nama_barang.toUpperCase()}</div>
            <div class="item-detail">
              <span>${item.qty} x ${item.harga_jual.toLocaleString()}</span>
              <span>${item.subtotal.toLocaleString()}</span>
            </div>
          </div>
        `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row grand-total">
          <span>TOTAL</span>
          <span>${formatRupiah(data.total)}</span>
        </div>
        <div class="total-row">
          <span>BAYAR</span>
          <span>${formatRupiah(data.uang_dibayar)}</span>
        </div>
        <div class="total-row">
          <span>KEMBALI</span>
          <span>${formatRupiah(data.kembalian)}</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="footer">
        <p>TERIMA KASIH</p>
        <p>BARANG YANG SUDAH DIBELI</p>
        <p>TIDAK DAPAT DITUKAR/DIKEMBALIKAN</p>
      </div>
    </body>
    </html>
  `

  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Menunggu font dan resource load
    printWindow.onload = () => {
        printWindow.print()
        // Jangan langsung ditutup agar user bisa memastikan print dialog muncul
        // printWindow.close() 
    }
  }
}
