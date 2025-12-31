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
  /* Reset dasar agar tidak ada jarak bawaan browser */
  * { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box; 
  }

  @media print {
    @page { 
      size: 58mm auto; /* Wajib untuk memberitahu driver printer ukurannya 58mm */
      margin: 0;       /* Hapus margin kertas */
    }
    body { 
      width: 100%;    /* Gunakan 100% dari lebar yang disediakan driver */
      margin: 0;
      padding: 0;
    }
  }

  body { 
    font-family: 'Courier New', monospace; 
    font-size: 12px; 
    width: 58mm;      /* Samakan dengan lebar kertas */
    color: #000;
    padding: 2px;     /* Sedikit padding agar tidak mepet besi printer */
  }

  /* Agar teks memenuhi lebar kertas */
  .item-detail, .total-row, .info-row {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .divider { 
    border-top: 1px dashed #000; 
    margin: 4px 0;
    width: 100%;
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
