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
        /* Menggunakan font Sans-Serif sistem agar lebih modern tapi tetap rapi */
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box;
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        body { 
          width: 58mm; 
          padding: 0;
          margin: 0;
          background-color: white;
        }

        @media print {
          @page { 
            size: 58mm auto; 
            margin: 0; 
          }
          body { 
            width: 58mm;
            /* Memastikan tidak ada margin otomatis dari browser */
            -webkit-print-color-adjust: exact;
          }
        }

        /* Container utama dengan padding kecil agar tidak mepet fisik printer */
        .receipt {
          width: 100%;
          padding: 0 2mm;
          display: block;
        }

        .header { text-align: center; margin-top: 10px; margin-bottom: 8px; }
        .header h1 { font-size: 14px; margin-bottom: 2px; font-weight: 800; }
        .header p { font-size: 9px; line-height: 1.2; }

        .divider { 
          border-top: 1px dashed #000; 
          margin: 6px 0;
          width: 100%;
        }

        .info { font-size: 10px; line-height: 1.4; }
        .info div { display: flex; justify-content: space-between; }

        .items { width: 100%; margin-top: 5px; }
        .item { margin-bottom: 6px; }
        .item-name { 
          font-size: 11px; 
          font-weight: 600; 
          display: block;
          margin-bottom: 1px;
          text-transform: uppercase;
        }
        .item-detail { 
          display: flex; 
          justify-content: space-between;
          font-size: 10px;
        }

        .total-section { margin-top: 5px; }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          font-size: 10px;
          padding: 1px 0;
        }
        .grand-total { 
          font-size: 13px; 
          font-weight: bold; 
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px solid #000;
        }

        .footer { 
          text-align: center; 
          margin-top: 15px; 
          margin-bottom: 20px;
          font-size: 9px; 
          line-height: 1.3;
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
          <div><span>Nota:</span><span>#${displayId}</span></div>
          <div><span>Kasir:</span><span>Admin</span></div>
          <div><span>Waktu:</span><span>${data.tanggal}</span></div>
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
            <span>Tunai:</span>
            <span>${formatRupiah(data.uang_dibayar)}</span>
          </div>
          <div class="total-row">
            <span>Kembali:</span>
            <span>${formatRupiah(data.kembalian)}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          <p>Terima Kasih Atas Kunjungan Anda</p>
          <p>Layanan Pelanggan: 0812-XXXX-XXXX</p>
        </div>
      </div>
    </body>
    </html>
  `
  // ... (Logika window.open tetap sama)
}
