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
        /* Reset total agar tidak ada margin bawaan browser */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Arial', sans-serif; 
          font-size: 11px; 
          width: 58mm; /* Sesuaikan dengan printer Blueprint 58D */
          padding: 0;
          margin: 0;
          color: #000;
        }

        @media print {
          @page { 
            size: 58mm auto; 
            margin: 0; 
          }
          body { width: 58mm; }
        }

        .container {
          padding: 2mm; /* Sedikit padding agar teks tidak terpotong fisik printer */
          width: 100%;
        }

        .header { text-align: center; margin-bottom: 8px; }
        .header h1 { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
        .header p { font-size: 9px; line-height: 1.2; }

        .divider { 
          border-top: 1px dashed #000; 
          margin: 6px 0; 
        }

        .info { margin-bottom: 6px; font-size: 10px; }
        .info p { display: flex; justify-content: space-between; margin-bottom: 2px; }

        .items { width: 100%; }
        .item { margin-bottom: 5px; }
        .item-name { font-weight: bold; display: block; text-transform: uppercase; }
        .item-detail { 
          display: flex; 
          justify-content: space-between;
          padding-left: 0; /* Dihapus padding agar space lebih luas */
        }

        .total-section { margin-top: 5px; }
        .total-section p { 
          display: flex; 
          justify-content: space-between;
          padding: 1px 0;
        }
        .total-section .grand-total { 
          font-weight: bold; 
          font-size: 12px;
          border-top: 1px solid #000;
          margin-top: 4px;
          padding: 4px 0;
        }

        .footer { 
          text-align: center; 
          margin-top: 15px; 
          font-size: 9px; 
          line-height: 1.3;
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
          <p>Terima Kasih</p>
          <p>Selamat Berbelanja Kembali</p>
        </div>
      </div>
    </body>
    </html>
  `

  // Logika pembuka jendela print (dikembalikan ke versi awal Anda yang stabil)
  const printWindow = window.open("", "_blank", "width=300,height=600")
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    
    // Memberikan waktu loading untuk CSS sebelum jendela print muncul
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500) // Ditambah ke 500ms agar browser sempat merender layout 58mm
  }
}
