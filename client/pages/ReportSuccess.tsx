import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Download, Home } from "lucide-react";

type Logo = string;

type ReportState = {
  pdfUrl?: string;
  title?: string;
  logos?: Logo[];
  report?: Record<string, unknown>;
};

const valueOf = (report: Record<string, unknown> | undefined, key: string, fallback = "غير محدد") => {
  const value = report?.[key];
  return value === undefined || value === null || value === "" ? fallback : String(value);
};

export default function ReportSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const state = (location.state as ReportState) || {};
  const report = state.report || {};
  const title = state.title || valueOf(report, "title");
  const logos = state.logos || [];

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafc",
      });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const pageHeightInCanvas = Math.floor((pageHeight / pageWidth) * canvas.width);
      let sourceY = 0;
      let pageIndex = 0;

      while (sourceY < canvas.height) {
        const sliceHeight = Math.min(pageHeightInCanvas, canvas.height - sourceY);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const context = pageCanvas.getContext("2d");
        if (!context) throw new Error("Unable to prepare PDF page");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        if (pageIndex > 0) pdf.addPage();
        const sliceHeightInMm = (sliceHeight * pageWidth) / canvas.width;
        pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", 0, 0, pageWidth, sliceHeightInMm, undefined, "FAST");
        sourceY += sliceHeight;
        pageIndex += 1;
      }

      pdf.save(`${title.replace(/\s+/g, "-") || "rapport"}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-5 rounded-3xl border border-rose-100 bg-rose-50 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8b1e3f] text-white shadow-lg shadow-rose-200">
              <CheckCircle2 size={30} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#8b1e3f]">تم حفظ التقرير بنجاح</p>
              <h1 className="text-2xl font-black text-slate-900">{title}</h1>
            </div>
          </div>
          <Button onClick={downloadPdf} disabled={isExporting} className="gap-2 rounded-xl px-6 py-6 font-black">
            <Download size={18} />
            {isExporting ? "جاري تجهيز PDF..." : "تحميل PDF"}
          </Button>
        </div>

        <div ref={reportRef} dir="rtl" className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 p-4 shadow-xl sm:p-8">
          <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-sm">
            <header className="relative overflow-hidden bg-gradient-to-l from-[#7f1d3f] via-[#9d174d] to-[#5b2a86] px-6 py-10 text-white sm:px-12">
              <div className="absolute -left-16 -top-20 h-52 w-52 rounded-full border-[20px] border-white/10" />
              <div className="relative flex items-center justify-between gap-5">
                <div className="flex items-center gap-3">
                  {logos[0] ? <img src={logos[0]} alt="الشعار" className="h-20 w-20 rounded-xl bg-white object-contain p-2 shadow-lg" /> : <div className="h-20 w-20 rounded-xl border border-white/30" />}
                  {logos[1] && <img src={logos[1]} alt="الشعار الثاني" className="h-20 w-20 rounded-xl bg-white object-contain p-2 shadow-lg" />}
                </div>
                <div className="text-left">
                  <p className="mb-2 text-sm font-bold tracking-[0.25em] text-violet-100">تقرير حصة</p>
                  <h2 className="text-3xl font-black leading-tight sm:text-4xl">تقرير حول {title}</h2>
                  <p className="mt-2 text-sm font-medium text-white/80">الكشفية الحسنية المغربية — فرع آسفي</p>
                </div>
              </div>
            </header>

            <div className="space-y-8 p-6 sm:p-12">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-right">
                  <tbody>
                    <TableRow label="التاريخ" value={valueOf(report, "date")} />
                    <TableRow label="المكان" value={valueOf(report, "location")} />
                    <TableRow label="الوقت" value={valueOf(report, "time")} />
                    <TableRow label="الفئة المستهدفة" value={valueOf(report, "beneficiary")} />
                    <TableRow label="الأهداف" value={valueOf(report, "objective")} />
                    <TableRow label="سير الجلسة" value={valueOf(report, "description")} />
                    <TableRow label="النقط الإيجابية" value={valueOf(report, "evaluationPositive")} accent="rose" />
                    <TableRow label="النقط السلبية" value={valueOf(report, "evaluationNegative")} accent="violet" />
                    <TableRow label="التوصيات" value={valueOf(report, "recommendations")} />
                  </tbody>
                </table>
              </div>

              <footer className="border-t border-slate-100 pt-5 text-center text-xs font-bold text-slate-400">
                حرر بتاريخ {new Date().toLocaleDateString("ar-MA")} • وثيقة داخلية
              </footer>
            </div>
          </article>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <button onClick={() => navigate("/dashboard")} className="flex items-center justify-center gap-2 font-black text-slate-400 transition hover:text-[#5b2a86]"><Home size={17} /> العودة إلى لوحة القيادة</button>
          <button onClick={() => navigate("/add-report")} className="flex items-center justify-center gap-2 font-black text-[#5b2a86] transition hover:text-[#8b1e3f]"><ArrowRight size={17} /> إنشاء تقرير آخر</button>
        </div>
      </div>
    </Layout>
  );
}

function TableRow({ label, value, accent = "violet" }: { label: string; value: string; accent?: "rose" | "violet" }) {
  const labelColor = accent === "rose" ? "bg-rose-50 text-[#8b1e3f]" : "bg-violet-50 text-[#5b2a86]";
  return (
    <tr className="border-b border-slate-200 last:border-b-0">
      <th className={`w-1/3 px-4 py-4 align-top text-sm font-black sm:w-1/4 ${labelColor}`}>{label}</th>
      <td className="whitespace-pre-wrap px-4 py-4 text-sm font-medium leading-7 text-slate-700">{value}</td>
    </tr>
  );
}
