import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Download, Home, MapPin, Users } from "lucide-react";

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
      const image = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const width = 210;
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(image, "PNG", 0, 0, width, height, undefined, "FAST");
      pdf.save(`${title.replace(/\s+/g, "-") || "rapport"}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
              <CheckCircle2 size={30} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-700">تم حفظ التقرير بنجاح</p>
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
            <header className="relative overflow-hidden bg-gradient-to-l from-[#123c35] via-[#176b55] to-[#e3a82b] px-6 py-10 text-white sm:px-12">
              <div className="absolute -left-16 -top-20 h-52 w-52 rounded-full border-[20px] border-white/10" />
              <div className="relative flex items-center justify-between gap-5">
                <div className="flex items-center gap-3">
                  {logos[0] ? <img src={logos[0]} alt="الشعار" className="h-20 w-20 rounded-xl bg-white object-contain p-2 shadow-lg" /> : <div className="h-20 w-20 rounded-xl border border-white/30" />}
                  {logos[1] && <img src={logos[1]} alt="الشعار الثاني" className="h-20 w-20 rounded-xl bg-white object-contain p-2 shadow-lg" />}
                </div>
                <div className="text-left">
                  <p className="mb-2 text-sm font-bold tracking-[0.25em] text-amber-100">SHM • RAPPORT D’ACTIVITÉ</p>
                  <h2 className="text-3xl font-black leading-tight sm:text-4xl">تقرير حول {title}</h2>
                  <p className="mt-2 text-sm font-medium text-white/80">الكشفية الحسنية المغربية — فرع آسفي</p>
                </div>
              </div>
            </header>

            <div className="space-y-8 p-6 sm:p-12">
              <section className="grid gap-4 sm:grid-cols-3">
                <InfoCard icon={<MapPin size={18} />} label="المكان" value={valueOf(report, "location")} />
                <InfoCard icon={<span className="text-lg">◷</span>} label="الوقت" value={valueOf(report, "time")} />
                <InfoCard icon={<Users size={18} />} label="الفئة المستهدفة" value={valueOf(report, "beneficiary")} />
              </section>

              <ReportSection title="الأهداف" content={valueOf(report, "objective")} />
              <ReportSection title="سير الجلسة" content={valueOf(report, "description")} />
              <section className="grid gap-5 sm:grid-cols-2">
                <ReportSection title="النقط الإيجابية" content={valueOf(report, "evaluationPositive")} tone="green" />
                <ReportSection title="النقط السلبية" content={valueOf(report, "evaluationNegative")} tone="amber" />
              </section>
              <ReportSection title="التوصيات" content={valueOf(report, "recommendations")} tone="blue" />

              <footer className="border-t border-slate-100 pt-5 text-center text-xs font-bold text-slate-400">
                حرر بتاريخ {new Date().toLocaleDateString("ar-MA")} • وثيقة داخلية
              </footer>
            </div>
          </article>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <button onClick={() => navigate("/dashboard")} className="flex items-center justify-center gap-2 font-black text-slate-400 transition hover:text-[#176b55]"><Home size={17} /> العودة إلى لوحة القيادة</button>
          <button onClick={() => navigate("/add-report")} className="flex items-center justify-center gap-2 font-black text-[#176b55] transition hover:text-[#e3a82b]"><ArrowRight size={17} /> إنشاء تقرير آخر</button>
        </div>
      </div>
    </Layout>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="mb-2 flex items-center gap-2 text-[#176b55]">{icon}<span className="text-xs font-black">{label}</span></div><p className="font-bold text-slate-700">{value}</p></div>;
}

function ReportSection({ title, content, tone = "green" }: { title: string; content: string; tone?: "green" | "amber" | "blue" }) {
  const colors = { green: "border-[#176b55] bg-emerald-50/40", amber: "border-[#e3a82b] bg-amber-50/50", blue: "border-sky-500 bg-sky-50/50" };
  return <section className={`rounded-2xl border-r-4 p-5 ${colors[tone]}`}><h3 className="mb-3 text-lg font-black text-slate-800">{title}</h3><p className="whitespace-pre-wrap text-sm font-medium leading-8 text-slate-600">{content}</p></section>;
}
