import nwbuild from 'nw-builder';

const options = {
  mode: "build",
  version: "latest",
  flavor: "normal",
  platforms: ["win64"],
  srcDir: "./desktop-app", // Arahkan ke folder yang hanya berisi package.json
  glob: false,
  outDir: "./dist",
  logLevel: "info", // Mengatasi error log level
};

async function runBuild() {
  try {
    console.log("--- Memulai Proses Build Desktop ---");
    // Pastikan folder desktop-app ada
    await nwbuild(options);
    console.log("--- Build Berhasil! ---");
    console.log("File .exe Anda ada di folder: ./dist/0-9-kasir-desktop/win64/");
  } catch (error) {
    console.error("Gagal melakukan build:");
    console.error(error.message);
  }
}

runBuild();