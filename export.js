/* Ekspor mengikuti template DAFTAR NILAI UTS (Kelas X: 12 mapel, Kelas XI: 11 mapel) */
const MAPEL = {
  X: ["PENDIDIKAN AGAMA DAN BUDI PEKERTI","PENDIDIKAN PANCASILA DAN KEWARGANEGARAAN","BAHASA INDONESIA","BAHASA INGGRIS","MATEMATIKA","PENDIDIKAN JASMANI, OLAHRAGA DAN KESEHATAN","SEJARAH INDONESIA","ILMU PENGETAHUAN ALAM DAN SOSIAL","INFORMATIKA","SENI BUDAYA","KODING DAN KECERDASAN ARTIFISIAL","DASAR - DASAR PROGRAM KEAHLIAN"],
  XI: ["PENDIDIKAN AGAMA DAN BUDI PEKERTI","PENDIDIKAN PANCASILA DAN KEWARGANEGARAAN","BAHASA INDONESIA","BAHASA INGGRIS","MATEMATIKA","PENDIDIKAN JASMANI, OLAHRAGA DAN KESEHATAN","KREATIFITAS, INOVASI DAN KEWIRAUSAHAAN","SEJARAH INDONESIA","MUATAN LOKAL","PROGRAM KEAHLIAN","MATA PELAJARAN PILIHAN"]
};
const MAPEL_DEFAULT = { X: [...MAPEL.X], XI: [...MAPEL.XI] };
const LAY0 = {
  judul: "DAFTAR NILAI UJIAN TENGAH SEMESTER",
  judulRekap: "REKAP NILAI UJIAN TENGAH SEMESTER",
  lbl: { nama: "NAMA", kelas: "KELAS", semester: "SEMESTER", tp: "TP" },
  hdr: { no: "No.", mapel: "MATA PELAJARAN", kktp: "KKTP", nilai: "NILAI UTS", ket: "Ket" },
  showKKTP: true, showKet: true, showJumlah: true, jumlahLabel: "JUMLAH NILAI",
  ttd: { mengetahui: "Mengetahui,", kepalaLabel: "Kepala", waliLabel: "Wali Kelas", showNIP: true }
};
function layOf(S) {
  const u = (S && S.layout) || {};
  return { ...LAY0, ...u, lbl: { ...LAY0.lbl, ...(u.lbl || {}) }, hdr: { ...LAY0.hdr, ...(u.hdr || {}) }, ttd: { ...LAY0.ttd, ...(u.ttd || {}) } };
}
const colsOf = lay => ["no", "mapel", ...(lay.showKKTP ? ["kktp"] : []), "nilai", ...(lay.showKet ? ["ket"] : [])];
function applyLayout(S) {
  const m = S && S.layout && S.layout.mapel;
  ["X", "XI"].forEach(t => {
    MAPEL[t].length = 0;
    const src = m && Array.isArray(m[t]) && m[t].length ? m[t] : MAPEL_DEFAULT[t];
    src.forEach(x => MAPEL[t].push(String(x)));
  });
}
function distribute(base, cols) {
  const all = Object.values(base).reduce((a, b) => a + b, 0), w = cols.map(c => base[c]);
  w[cols.indexOf("mapel")] += all - w.reduce((a, b) => a + b, 0);
  return w;
}
const estTw = s => [...String(s)].reduce((a, c) => a + (/[A-Z]/.test(c) ? 175 : /[a-z0-9]/.test(c) ? 135 : /\s/.test(c) ? 65 : 90), 0);
const estXl = (s, pt = 12) => [...String(s)].reduce((a, c) => a + (/[A-Z]/.test(c) ? 1.35 : /[a-z0-9]/.test(c) ? 1.05 : .5), 0) * pt / 12;
const toNum = v => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isNaN(n) ? null : n; };
const fmt = n => String(+n.toFixed(2)).replace(".", ",");
function totalOf(s) { return s.nilai.reduce((a, v) => a + (toNum(v) || 0), 0); }
const ketMapel = (n, k) => { n = toNum(n); k = toNum(k); return n === null || k === null ? "" : (n >= k ? "TUNTAS" : "TIDAK TUNTAS"); };
function view(s, S) {
  const lay = layOf(S), m = MAPEL[s.t];
  return {
    m,
    rows: m.map((n, i) => [i + 1, n, S.kktp[s.t][i] ?? "", s.nilai[i] ?? "", ketMapel(s.nilai[i], S.kktp[s.t][i])]),
    total: totalOf(s),
    kepala: (lay.ttd.kepalaLabel + " " + S.set.sekolah).trim(),
    nipK: "NIP. " + S.set.nipKepsek,
    nipW: "NIP." + (S.set.nipWali ? " " + S.set.nipWali : "")
  };
}
function sigLines(S, lay, v) {
  const L = ["", lay.ttd.mengetahui, v.kepala, "", "", "", S.set.kepsek];
  const R = [S.set.tempat, "", lay.ttd.waliLabel, "", "", "", S.set.wali];
  if (lay.ttd.showNIP) { L.push(v.nipK); R.push(v.nipW); }
  return { L, R };
}
const cellOf = (r, c) => ({ no: r[0], mapel: r[1], kktp: r[2], nilai: r[3], ket: r[4] })[c];

async function makeXlsx(list, S) {
  const lay = layOf(S), cols = colsOf(lay), nc = cols.length, ni = cols.indexOf("nilai");
  const wb = new ExcelJS.Workbook();
  const used = new Set();
  const F = { name: "Arial", size: 12 };
  const B = { style: "thin" };
  const box = { top: B, left: B, bottom: B, right: B };
  const widths = distribute({ no: 8.54, mapel: 52, kktp: 7.63, nilai: 11, ket: 17 }, cols);
  const LT = i => String.fromCharCode(65 + i), last = LT(nc - 1), ctr = { horizontal: "center", vertical: "middle" };
  list.forEach((s, k) => {
    const v = view(s, S);
    let nm = ((k + 1) + ". " + (s.nama || "Siswa")).replace(/[\\\/\?\*\[\]:]/g, " ").slice(0, 31);
    while (used.has(nm.toLowerCase())) nm = nm.slice(0, 28) + "~" + Math.floor(Math.random() * 90 + 10);
    used.add(nm.toLowerCase());
    const ws = wb.addWorksheet(nm, { pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: .7, right: .7, top: .75, bottom: .75, header: .3, footer: .3 } } });
    widths.forEach((w, i) => ws.getColumn(i + 1).width = w);
    const put = (addr, val, o = {}) => { const c = ws.getCell(addr); c.value = val; c.font = { ...F, bold: !!o.bold }; if (o.al) c.alignment = o.al; if (o.border) c.border = box; return c; };
    ws.mergeCells(`A1:${last}1`); put("A1", lay.judul, { bold: true, al: { horizontal: "center" } });
    put("A3", lay.lbl.nama); put("B3", ": " + s.nama); put(LT(2) + "3", `${lay.lbl.semester} : ${S.set.semester}`);
    put("A4", lay.lbl.kelas); put("B4", ": " + s.kelas); put(LT(2) + "4", `${lay.lbl.tp} : ${S.set.tp}`);
    cols.forEach((c, i) => put(LT(i) + 6, lay.hdr[c], { border: 1, al: ctr }));
    v.rows.forEach((r, i) => {
      const n = 7 + i;
      cols.forEach((c, j) => {
        const val = cellOf(r, c);
        if (c === "no") put(LT(j) + n, val, { border: 1, al: ctr });
        else if (c === "mapel") put(LT(j) + n, val, { border: 1, al: { vertical: "middle" } });
        else put(LT(j) + n, val === "" ? null : (toNum(val) ?? val), { border: 1, al: ctr });
      });
    });
    const nrows = v.rows.length, t = 6 + nrows + (lay.showJumlah ? 1 : 0);
    if (lay.showJumlah) {
      const jr = 7 + nrows;
      if (ni > 1) ws.mergeCells(`A${jr}:${LT(ni - 1)}${jr}`);
      put("A" + jr, lay.jumlahLabel, { border: 1, al: ctr });
      for (let c = 1; c < ni; c++) ws.getCell(LT(c) + jr).border = box;
      put(LT(ni) + jr, { formula: `SUM(${LT(ni)}7:${LT(ni)}${jr - 1})`, result: v.total }, { border: 1, al: ctr });
      for (let c = ni + 1; c < nc; c++) put(LT(c) + jr, null, { border: 1 });
    }
    for (let r = 6; r <= t; r++) ws.getRow(r).height = 25;
    const { L, R } = sigLines(S, lay, v);
    const availW = widths.slice(2).reduce((a, b) => a + b, 0) - 2;
    const fit = Math.max(...R.map(x => estXl(x))) <= availW;
    const rc = fit ? LT(2) : last, ra = { horizontal: fit ? "left" : "right" };
    [[0, 5], [2, 7], [6, 11], [7, 12]].forEach(([i, off]) => { if (R[i] !== undefined) put(rc + (t + off), R[i], { al: ra }); });
    [[1, 6], [2, 7], [6, 11], [7, 12]].forEach(([i, off]) => { if (L[i] !== undefined) put("A" + (t + off), L[i]); });
  });
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

async function makeDocx(list, S) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign, HeightRule, TabStopType } = docx;
  const lay = layOf(S), cols = colsOf(lay), ni = cols.indexOf("nilai");
  const run = (text, o = {}) => new TextRun({ text: String(text), font: "Arial", size: 24, ...o });
  const para = (text, o = {}) => new Paragraph({ spacing: { after: 0, before: 0 }, alignment: o.al, tabStops: o.tabs, children: [run(text, { bold: o.bold, ...(o.size ? { size: o.size } : {}) })] });
  const line = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const W = distribute({ no: 600, mapel: 5400, kktp: 880, nilai: 1380, ket: 1486 }, cols);
  const cell = (text, i, o = {}) => new TableCell({
    width: { size: o.w ?? W[i], type: WidthType.DXA }, columnSpan: o.span, verticalAlign: VerticalAlign.CENTER,
    margins: { left: 90, right: 90 },
    children: [para(text, { al: o.c ? AlignmentType.CENTER : AlignmentType.LEFT, size: o.size })]
  });
  const row = cells => new TableRow({ height: { value: 500, rule: HeightRule.ATLEAST }, children: cells });
  const tabs = [{ type: TabStopType.LEFT, position: 1100 }, { type: TabStopType.LEFT, position: 6700 }];
  const sections = list.map(s => {
    const v = view(s, S);
    const info = [
      para(`${lay.lbl.nama}\t: ${s.nama}\t${lay.lbl.semester} : ${S.set.semester}`, { tabs }),
      para(`${lay.lbl.kelas}\t: ${s.kelas}\t${lay.lbl.tp} : ${S.set.tp}`, { tabs })
    ];
    const rows = [row(cols.map((c, i) => cell(lay.hdr[c], i, { c: 1 })))];
    v.rows.forEach(r => rows.push(row(cols.map((c, i) => cell(cellOf(r, c), i, { c: c !== "mapel", size: c === "mapel" ? 20 : c === "ket" ? 16 : undefined })))));
    if (lay.showJumlah) rows.push(row([cell(lay.jumlahLabel, 0, { c: 1, span: ni, w: W.slice(0, ni).reduce((a, b) => a + b, 0) }), cell(v.total ? fmt(v.total) : "", ni, { c: 1 }), ...(lay.showKet ? [cell("", ni + 1)] : [])]));
    const table = new Table({
      width: { size: 9746, type: WidthType.DXA }, columnWidths: W, rows,
      borders: { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line }
    });
    const { L, R } = sigLines(S, lay, v);
    const nb = { top: none, bottom: none, left: none, right: none };
    const lMin = Math.max(...L.map(estTw)) + 250, rW = Math.max(3546, Math.min(9746 - lMin, Math.max(...R.map(estTw)) + 250)), lW = 9746 - rW;
    const sign = new Table({
      width: { size: 9746, type: WidthType.DXA }, columnWidths: [lW, rW],
      borders: { ...nb, insideHorizontal: none, insideVertical: none },
      rows: [new TableRow({ children: [L, R].map((col, k) => new TableCell({ width: { size: k ? rW : lW, type: WidthType.DXA }, borders: nb, children: col.map(t => para(t)) })) })]
    });
    return {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children: [para(lay.judul, { bold: true, al: AlignmentType.CENTER }), para(""), ...info, para(""), table, para(""), para(""), para(""), para(""), para(""), sign]
    };
  });
  return Packer.toBlob(new Document({ creator: "Aplikasi Daftar Nilai UTS", sections }));
}

function makePdf(list, S) {
  const lay = layOf(S), cols = colsOf(lay), ni = cols.indexOf("nilai");
  const doc = new jspdf.jsPDF({ unit: "mm", format: "a4" });
  const X = 18, cw = distribute({ no: 12, mapel: 98, kktp: 14, nilai: 24, ket: 26 }, cols);
  list.forEach((s, k) => {
    if (k) doc.addPage();
    const v = view(s, S);
    doc.setFont("helvetica", "bold").setFontSize(12).text(lay.judul, 105, 22, { align: "center" });
    doc.setFont("helvetica", "normal").setFontSize(11);
    const off = Math.max(20, Math.max(doc.getTextWidth(lay.lbl.nama), doc.getTextWidth(lay.lbl.kelas)) + 3);
    doc.text(lay.lbl.nama, X, 33); doc.text(": " + s.nama, X + off, 33); doc.text(`${lay.lbl.semester} : ${S.set.semester}`, 140, 33);
    doc.text(lay.lbl.kelas, X, 39); doc.text(": " + s.kelas, X + off, 39); doc.text(`${lay.lbl.tp} : ${S.set.tp}`, 140, 39);
    const body = v.rows.map(r => cols.map(c => String(cellOf(r, c))));
    if (lay.showJumlah) body.push([{ content: lay.jumlahLabel, colSpan: ni, styles: { halign: "center" } }, v.total ? fmt(v.total) : "", ...(lay.showKet ? [""] : [])]);
    const cs = {};
    cols.forEach((c, i) => { cs[i] = { cellWidth: cw[i], halign: c === "mapel" ? "left" : "center", ...(c === "ket" ? { fontSize: 7.5 } : {}) }; });
    doc.autoTable({
      startY: 46, margin: { left: X, right: X }, theme: "grid",
      head: [cols.map(c => lay.hdr[c])], body,
      styles: { font: "helvetica", fontSize: 10, textColor: 0, lineColor: 0, lineWidth: .2, minCellHeight: 8.8, valign: "middle", cellPadding: { left: 2, right: 2, top: 1, bottom: 1 } },
      headStyles: { fillColor: 255, textColor: 0, fontStyle: "normal", halign: "center" },
      columnStyles: cs
    });
    const y = doc.lastAutoTable.finalY + 12, dots = t => String(t).replace(/…/g, ".");
    doc.setFontSize(11);
    const { L, R } = sigLines(S, lay, v);
    const xr = Math.min(140, 192 - Math.max(...R.map(x => doc.getTextWidth(dots(x)))));
    doc.text(dots(R[0]), xr, y);
    doc.text(L[1], X, y + 6);
    doc.text(L[2], X, y + 12); doc.text(R[2], xr, y + 12);
    doc.text(L[6], X, y + 36); doc.text(dots(R[6]), xr, y + 36);
    if (L[7] !== undefined) { doc.text(L[7], X, y + 42); doc.text(R[7], xr, y + 42); }
  });
  return doc.output("blob");
}
/* ===== TEMPLATE BARU: REKAP KELAS (terpisah dari lembar siswa) ===== */
function ketOf(s, S) {
  let below = 0, kosong = 0;
  MAPEL[s.t].forEach((_, i) => {
    const n = toNum(s.nilai[i]); if (n === null) { kosong++; return; }
    const k = toNum(S.kktp[s.t][i]); if (k !== null && n < k) below++;
  });
  if (kosong) return `Belum lengkap (${kosong} kosong)`;
  return below ? `TIDAK TUNTAS (${below} mapel)` : "TUNTAS";
}
function rekapData(list, S, t, ket) {
  const m = MAPEL[t];
  const rows = list.map((s, i) => {
    const vals = m.map((_, j) => toNum(s.nilai[j]));
    const flags = m.map((_, j) => { const k = toNum(S.kktp[t][j]); return vals[j] !== null && k !== null && vals[j] < k; });
    const f = vals.filter(v => v !== null), sum = f.reduce((a, b) => a + b, 0);
    return { no: i + 1, nama: s.nama, vals, flags, jumlah: f.length ? sum : null, rata: f.length ? sum / f.length : null, ket: ket ? ketOf(s, S) : "" };
  });
  return { m, kktp: m.map((_, j) => toNum(S.kktp[t][j])), rows };
}
const cv = v => v === null || v === undefined ? "" : fmt(v);
const REKAP_TITLE = "REKAP NILAI UJIAN TENGAH SEMESTER";

async function makeRekapXlsx(list, S, t, ket, label) {
  const lay = layOf(S);
  const R = rekapData(list, S, t, ket), n = R.m.length, nc = 2 + n + 2 + (ket ? 1 : 0);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Rekap Kelas " + t, { pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  const F = { name: "Arial", size: 10 }, B = { style: "thin" }, box = { top: B, left: B, bottom: B, right: B };
  ws.getColumn(1).width = 5; ws.getColumn(2).width = 34;
  for (let i = 0; i < n; i++) ws.getColumn(3 + i).width = 7;
  ws.getColumn(3 + n).width = 9; ws.getColumn(4 + n).width = 11; if (ket) ws.getColumn(5 + n).width = 26;
  const put = (r, c, v, o = {}) => { const x = ws.getCell(r, c); x.value = v; x.font = { ...F, bold: !!o.bold, size: o.size || 10, color: o.red ? { argb: "FFC0392B" } : undefined }; if (o.box) x.border = box; x.alignment = { horizontal: o.al || "center", vertical: "middle" }; if (o.nf) x.numFmt = o.nf; return x; };
  ws.mergeCells(1, 1, 1, nc); put(1, 1, lay.judulRekap, { bold: true, size: 12 });
  put(3, 1, lay.lbl.kelas + " : " + label, { al: "left" }); put(4, 1, `${lay.lbl.semester} : ${S.set.semester}      ${lay.lbl.tp} : ${S.set.tp}`, { al: "left" });
  const head = ["No", "NAMA SISWA", ...R.m.map((_, i) => i + 1), "JUMLAH", "RATA-RATA", ...(ket ? ["KET"] : [])];
  head.forEach((h, i) => put(6, i + 1, h, { box: 1, bold: true }));
  ws.mergeCells(7, 1, 7, 2); put(7, 1, "KKTP", { box: 1 }); ws.getCell(7, 2).border = box;
  for (let c = 3; c <= nc; c++) put(7, c, c < 3 + n ? R.kktp[c - 3] : null, { box: 1 });
  R.rows.forEach((r, k) => {
    const row = 8 + k, a = ws.getCell(row, 3).address, z = ws.getCell(row, 2 + n).address;
    put(row, 1, r.no, { box: 1 }); put(row, 2, r.nama, { box: 1, al: "left" });
    r.vals.forEach((v, j) => put(row, 3 + j, v, { box: 1, red: r.flags[j], bold: r.flags[j] }));
    put(row, 3 + n, { formula: `SUM(${a}:${z})`, result: r.jumlah ?? 0 }, { box: 1 });
    put(row, 4 + n, { formula: `IF(COUNT(${a}:${z})=0,"",AVERAGE(${a}:${z}))`, result: r.rata === null ? "" : +r.rata.toFixed(2) }, { box: 1, nf: "0.00" });
    if (ket) put(row, 5 + n, r.ket, { box: 1, al: "left" });
    ws.getRow(row).height = 20;
  });
  let y = 8 + R.rows.length + 1;
  put(y, 1, "Keterangan mata pelajaran:", { bold: true, al: "left" });
  R.m.forEach((nm, i) => put(y + 1 + i, 1, `${i + 1}. ${nm}`, { al: "left" }));
  y += n + 3; const rc0 = Math.max(3, nc - 3), nipW = "NIP." + (S.set.nipWali ? " " + S.set.nipWali : "");
  const wd = c => c < 3 ? 34 : c < 3 + n ? 7 : c === 3 + n ? 9 : c === 4 + n ? 11 : 26;
  let avail = 0; for (let c = rc0; c <= nc; c++) avail += wd(c);
  const fit = Math.max(...[S.set.tempat, lay.ttd.waliLabel, S.set.wali, nipW].map(x => estXl(x, 10))) <= avail - 2;
  const rc = fit ? rc0 : nc, ral = fit ? "left" : "right";
  put(y, rc, S.set.tempat, { al: ral }); put(y + 1, 2, lay.ttd.mengetahui, { al: "left" });
  put(y + 2, 2, (lay.ttd.kepalaLabel + " " + S.set.sekolah).trim(), { al: "left" }); put(y + 2, rc, lay.ttd.waliLabel, { al: ral });
  put(y + 6, 2, S.set.kepsek, { al: "left" }); put(y + 6, rc, S.set.wali, { al: ral });
  if (lay.ttd.showNIP) { put(y + 7, 2, "NIP. " + S.set.nipKepsek, { al: "left" }); put(y + 7, rc, nipW, { al: ral }); }
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

async function makeRekapDocx(list, S, t, ket, label) {
  const lay = layOf(S);
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign, HeightRule, PageOrientation } = docx;
  const R = rekapData(list, S, t, ket), n = R.m.length;
  const rp = (text, o = {}) => new Paragraph({ spacing: { after: 0, before: 0 }, alignment: o.c ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: String(text), font: "Arial", size: o.size || 18, bold: !!o.bold, color: o.red ? "C0392B" : undefined })] });
  const line = { style: BorderStyle.SINGLE, size: 4, color: "000000" }, none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const TOT = 15398, ketW = ket ? 2300 : 0, wm = Math.floor((TOT - 500 - 1100 - 1250 - ketW - 3000) / n);
  const W = [500, TOT - 500 - 1100 - 1250 - ketW - wm * n, ...Array(n).fill(wm), 1100, 1250, ...(ket ? [ketW] : [])];
  const cell = (text, i, o = {}) => new TableCell({ width: { size: o.w ?? W[i], type: WidthType.DXA }, columnSpan: o.span, verticalAlign: VerticalAlign.CENTER, margins: { left: 60, right: 60 }, children: [rp(text, o)] });
  const row = c => new TableRow({ height: { value: 340, rule: HeightRule.ATLEAST }, children: c });
  const head = ["No", "NAMA SISWA", ...R.m.map((_, i) => i + 1), "JUMLAH", "RATA-RATA", ...(ket ? ["KET"] : [])];
  const rows = [row(head.map((h, i) => cell(h, i, { c: 1, bold: 1 })))];
  rows.push(row([cell("KKTP", 0, { c: 1, span: 2, w: W[0] + W[1] }), ...R.kktp.map((k, j) => cell(cv(k), 2 + j, { c: 1 })), cell("", 2 + n), cell("", 3 + n), ...(ket ? [cell("", 4 + n)] : [])]));
  R.rows.forEach(r => rows.push(row([cell(r.no, 0, { c: 1 }), cell(r.nama, 1), ...r.vals.map((v, j) => cell(cv(v), 2 + j, { c: 1, red: r.flags[j], bold: r.flags[j] })), cell(cv(r.jumlah), 2 + n, { c: 1 }), cell(r.rata === null ? "" : fmt(r.rata), 3 + n, { c: 1 }), ...(ket ? [cell(r.ket, 4 + n)] : [])])));
  const table = new Table({ width: { size: TOT, type: WidthType.DXA }, columnWidths: W, rows, borders: { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line } });
  const nb = { top: none, bottom: none, left: none, right: none };
  const L = ["", lay.ttd.mengetahui, (lay.ttd.kepalaLabel + " " + S.set.sekolah).trim(), "", "", "", S.set.kepsek];
  const Rr = [S.set.tempat, "", lay.ttd.waliLabel, "", "", "", S.set.wali];
  if (lay.ttd.showNIP) { L.push("NIP. " + S.set.nipKepsek); Rr.push("NIP." + (S.set.nipWali ? " " + S.set.nipWali : "")); }
  const lMin = Math.round(Math.max(...L.map(estTw)) * 10 / 12) + 250, rW = Math.max(4998, Math.min(TOT - lMin, Math.round(Math.max(...Rr.map(estTw)) * 10 / 12) + 250)), lW = TOT - rW;
  const sign = new Table({ width: { size: TOT, type: WidthType.DXA }, columnWidths: [lW, rW], borders: { ...nb, insideHorizontal: none, insideVertical: none },
    rows: [new TableRow({ cantSplit: true, children: [L, Rr].map((col, k) => new TableCell({ width: { size: k ? rW : lW, type: WidthType.DXA }, borders: nb, children: col.map(x => rp(x, { size: 20 })) })) })] });
  const kids = [rp(lay.judulRekap, { bold: 1, c: 1, size: 24 }), rp(""), rp(lay.lbl.kelas + " : " + label, { size: 20 }), rp(`${lay.lbl.semester} : ${S.set.semester}      ${lay.lbl.tp} : ${S.set.tp}`, { size: 20 }), rp(""), table, rp(""), rp("Keterangan mata pelajaran:", { bold: 1, size: 16 }), ...R.m.map((nm, i) => rp(`${i + 1}. ${nm}`, { size: 16 })), rp(""), rp(""), sign];
  return Packer.toBlob(new Document({ creator: "Aplikasi Daftar Nilai UTS", sections: [{ properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children: kids }] }));
}

function makeRekapPdf(list, S, t, ket, label) {
  const lay = layOf(S);
  const R = rekapData(list, S, t, ket), n = R.m.length, M = 12, PW = 273;
  const doc = new jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  doc.setFont("helvetica", "bold").setFontSize(12).text(lay.judulRekap, 148.5, 14, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(10).text(lay.lbl.kelas + " : " + label, M, 22).text(`${lay.lbl.semester} : ${S.set.semester}      ${lay.lbl.tp} : ${S.set.tp}`, M, 27);
  const ketW = ket ? 42 : 0, wm = Math.floor((PW - 9 - 17 - 19 - ketW - 50) / n * 10) / 10, wn = PW - 9 - 17 - 19 - ketW - wm * n;
  const head = [["No", "NAMA SISWA", ...R.m.map((_, i) => String(i + 1)), "JUMLAH", "RATA-RATA", ...(ket ? ["KET"] : [])]];
  const body = [[{ content: "KKTP", colSpan: 2, styles: { halign: "center" } }, ...R.kktp.map(cv), "", "", ...(ket ? [""] : [])]];
  R.rows.forEach(r => body.push([String(r.no), r.nama, ...r.vals.map(cv), cv(r.jumlah), r.rata === null ? "" : fmt(r.rata), ...(ket ? [r.ket] : [])]));
  const cs = { 0: { cellWidth: 9, halign: "center" }, 1: { cellWidth: wn } };
  for (let i = 0; i < n; i++) cs[2 + i] = { cellWidth: wm, halign: "center" };
  cs[2 + n] = { cellWidth: 17, halign: "center" }; cs[3 + n] = { cellWidth: 19, halign: "center" }; if (ket) cs[4 + n] = { cellWidth: ketW };
  doc.autoTable({ startY: 31, margin: { left: M, right: M }, theme: "grid", head, body, columnStyles: cs,
    styles: { font: "helvetica", fontSize: 8, textColor: 0, lineColor: 0, lineWidth: .2, minCellHeight: 6.5, valign: "middle", cellPadding: { left: 1.5, right: 1.5, top: .8, bottom: .8 } },
    headStyles: { fillColor: 255, textColor: 0, fontStyle: "bold", halign: "center" },
    didParseCell: d => { if (d.section === "body" && d.row.index > 0) { const j = d.column.index - 2; if (j >= 0 && j < n && R.rows[d.row.index - 1].flags[j]) { d.cell.styles.textColor = [192, 57, 43]; d.cell.styles.fontStyle = "bold"; } } } });
  let y = doc.lastAutoTable.finalY + 7; const half = Math.ceil(n / 2);
  if (y + half * 4 + 8 > 200) { doc.addPage(); y = 15; }
  doc.setFontSize(8).setFont("helvetica", "bold").text("Keterangan mata pelajaran:", M, y); doc.setFont("helvetica", "normal");
  R.m.forEach((nm, i) => doc.text(`${i + 1}. ${nm}`, i < half ? M : 150, y + 4 + (i % half) * 4));
  y += half * 4 + 10;
  if (y + 44 > 205) { doc.addPage(); y = 15; }
  const dots = x => x.replace(/…/g, ".");
  doc.setFontSize(10);
  const xr = Math.min(200, 285 - Math.max(...[S.set.tempat, lay.ttd.waliLabel, S.set.wali, "NIP." + (S.set.nipWali ? " " + S.set.nipWali : "")].map(x => doc.getTextWidth(dots(x)))));
  doc.text(dots(S.set.tempat), xr, y); doc.text(lay.ttd.mengetahui, M, y + 6);
  doc.text((lay.ttd.kepalaLabel + " " + S.set.sekolah).trim(), M, y + 12); doc.text(lay.ttd.waliLabel, xr, y + 12);
  doc.text(S.set.kepsek, M, y + 33); doc.text(dots(S.set.wali), xr, y + 33);
  if (lay.ttd.showNIP) { doc.text("NIP. " + S.set.nipKepsek, M, y + 39); doc.text("NIP." + (S.set.nipWali ? " " + S.set.nipWali : ""), xr, y + 39); }
  return doc.output("blob");
}
globalThis.DNU = { ketMapel, MAPEL, makeXlsx, makeDocx, makePdf, totalOf, fmt, toNum, ketOf, rekapData, makeRekapXlsx, makeRekapDocx, makeRekapPdf, layOf, LAY0, colsOf, applyLayout };
