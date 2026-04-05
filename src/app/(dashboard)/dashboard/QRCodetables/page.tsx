'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Download, CheckCircle, FileText, Smartphone } from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { updateRestaurantAction, getActiveSubscriptionAction } from "@/app/actions/restaurant";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useRestaurant } from '@/contexts/AuthProvider';

interface TableAsset {
  id: number;
  name: string;
  slug: string;
  url: string;
}

export default function QRCodetablesPage() {
  const router = useRouter();
  const { restaurant, loading: restaurantLoading } = useRestaurant();

  const [subscription, setSubscription] = useState<any>(null);
  const [numTables, setNumTables] = useState<number>(10);
  const [dbNumTables, setDbNumTables] = useState<number>(10);
  const [maxTablesAllowed, setMaxTablesAllowed] = useState<number>(20);
  const [generatedTables, setGeneratedTables] = useState<TableAsset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    if (!restaurantLoading && restaurant) {
      initializeData();
    }
  }, [restaurant, restaurantLoading]);

  const initializeData = async () => {
    if (!restaurant) return;

    setNumTables(restaurant.number_of_tables || 10);
    setDbNumTables(restaurant.number_of_tables || 10);

    // Fetch subscription
    const subRes = await getActiveSubscriptionAction(restaurant.id);
    if (subRes.success && subRes.data) {
      console.log("DEBUG: Subscription Data", subRes.data);
      const planType = subRes.data.plan?.plan_type;
      console.log("DEBUG: Plan Type", planType);

      setSubscription(subRes.data);
      // Limit: Premium = Unlimited (999), Pro = 50, Free = 20
      let planLimit;
      if (planType === 'premium') {
        planLimit = 999; // Unlimited
      } else if (planType === 'pro') {
        planLimit = 50;
      } else {
        planLimit = 20; // free_trial
      }
      console.log("DEBUG: Set Limit", planLimit);
      setMaxTablesAllowed(planLimit);

      if (restaurant.number_of_tables > planLimit) {
        setNumTables(planLimit);
      }
    } else {
      console.log("DEBUG: No subscription found", subRes);
    }
  };

  // Helper to generate IDs
  const handleGenerate = async () => {
    if (numTables > maxTablesAllowed) {
      // Determine plan type - check subscription or infer from limit
      const limitBasedPlan = maxTablesAllowed === 999 ? 'premium' : (maxTablesAllowed === 50 ? 'pro' : 'free_trial');
      const planType = subscription?.plan?.plan_type || limitBasedPlan;

      if (planType === 'free_trial' && maxTablesAllowed < 50) {
        toast.error(
          <div>
            FREE plan: max {maxTablesAllowed} tables.{' '}
            <button onClick={() => router.push(`/dashboard/subscription/pricing`)} className="underline font-bold">
              Upgrade to PRO
            </button>
          </div>,
          { duration: 5000 }
        );
      } else if (planType === 'pro' || maxTablesAllowed >= 50) {
        toast.error(
          <div>
            PRO plan: max {maxTablesAllowed} tables.{' '}
            <button onClick={() => router.push(`/dashboard/subscription/pricing`)} className="underline font-bold">
              Upgrade to PREMIUM
            </button>
          </div>,
          { duration: 5000 }
        );
      }
      return;
    }

    setIsGenerating(true);

    // Save table count to restaurant settings if changed
    if (numTables !== dbNumTables && restaurant) {
      try {
        const res = await updateRestaurantAction(restaurant.id, restaurant.slug, {
          ...restaurant,
          number_of_tables: numTables
        });

        if (res.success) {
          setDbNumTables(numTables);
          toast.success("Table count updated in database");
        } else {
          throw new Error(res.error);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to update database");
        setIsGenerating(false);
        return;
      }
    }

    // Generate QR codes
    const newTables: TableAsset[] = [];
    const baseUrl = 'http://orders.swipyeat.com';

    for (let i = 1; i <= numTables; i++) {
      // Format as requested: baseUrl/restaurant-slug?table=num
      const url = `${baseUrl}/${restaurant?.slug}/${i}`;
      newTables.push({
        id: i,
        name: `Table ${i}`,
        slug: `${restaurant?.slug}/${i}`,
        url: url,
      });
    }
    setGeneratedTables(newTables);
    setIsGenerating(false);
    toast.success(`${numTables} QR Codes generated!`);
  };

  // Download PDF for Print
  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      setPdfProgress('');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const cardWidth = 80;
      const cardHeight = 100;
      const colGap = 10;
      const rowGap = 10;

      const cards = document.querySelectorAll('.qr-card');
      if (cards.length === 0) {
        alert("No tables found to generate.");
        return;
      }

      let x = margin;
      let y = margin;

      for (let i = 0; i < cards.length; i++) {
        setPdfProgress(`(${i + 1}/${cards.length})`);

        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0));

        const card = cards[i] as HTMLElement;
        try {
          const imgData = await toPng(card, {
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            cacheBust: true,
          });
          pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
        } catch (err) {
          console.error("Error generating image for PDF", err);
        }

        x += cardWidth + colGap;

        if (x + cardWidth > pageWidth - margin) {
          x = margin;
          y += cardHeight + rowGap;
        }

        if (y + cardHeight > pageHeight - margin && i < cards.length - 1) {
          pdf.addPage();
          x = margin;
          y = margin;
        }
      }

      setPdfProgress('Saving...');
      pdf.save(`${restaurant?.slug}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error", error);
      alert("Failed to generate PDF. See console.");
    } finally {
      setIsDownloading(false);
      setPdfProgress('');
    }
  };

  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownloadSinglePNG = async (id: number, name: string) => {
    try {
      setDownloadingId(id);

      const element = document.getElementById(`qr-card-${id}`);
      if (!element) {
        throw new Error('Element not found');
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 50));

      const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 3 });

      const link = document.createElement('a');
      link.download = `${name.replace(/\s+/g, '_')}_QR.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error generating PNG:', error);
      alert(`Failed to generate PNG: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">QR Asset Generator</h1>
        <p className="text-gray-500 mt-1">Bulk table provisioning and print exports</p>
      </header>

      {/* Control Panel */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Slug</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {/* Link Icon */}
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                readOnly
                value={restaurant?.slug || ''}
                className="pl-10 block w-full bg-gray-50 border-gray-200 text-gray-500 rounded-lg p-3 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Number of Tables to Generate</label>
              {numTables === dbNumTables && (
                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-orange-500" /> Linked with DB
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 font-bold">#</span>
              </div>
              <input
                type="number"
                min={1}
                max={100}
                value={numTables}
                onChange={(e) => setNumTables(parseInt(e.target.value) || 0)}
                className="pl-8 block w-full border border-gray-200 rounded-lg p-3 sm:text-sm focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 bg-[#FF4D00] hover:bg-[#E04400] text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? 'Processing...' : (
              <>
                <Smartphone className="w-5 h-5" />
                Generate & Preview Assets
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {generatedTables.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Status Bar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-orange-700 font-medium">
              <CheckCircle className="w-5 h-5 text-orange-500" />
              {generatedTables.length} Tables Generated Successfully
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              {isDownloading ? `Processing ${pdfProgress}` : (
                <>
                  <FileText className="w-4 h-4" />
                  Download All as PDF (Print-Ready)
                </>
              )}
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {generatedTables.map((table) => (
              <div
                key={table.id}
                id={`qr-card-${table.id}`}
                className="qr-card bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center"
              >
                <div className="w-full h-8 mb-4"></div>

                <div className="bg-[#1f5f68] p-4 rounded-lg shadow-inner mb-6 relative group">
                  <div className="bg-white p-2 rounded">
                    <QRCode
                      value={table.url}
                      size={120}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox={`0 0 256 256`}
                    />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1">{table.name}</h3>
                <p className="text-xs text-gray-400 font-mono mb-6">/{table.slug}</p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => handleDownloadSinglePNG(table.id, table.name)}
                    disabled={downloadingId === table.id}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors uppercase tracking-wide disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {downloadingId === table.id ? '...' : 'PNG'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
