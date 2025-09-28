"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { generateSurveyReportPDF } from '@/client-lib/pdf-generator';
import { toast } from 'sonner';

interface SurveyReportButtonProps {
  dealId: string;
  dealName: string;
  dealData?: any;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
}

export function SurveyReportButton({ 
  dealId, 
  dealName, 
  dealData,
  variant = "outline",
  size = "sm",
  showText = false
}: SurveyReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Fetch votes with LP information
      const response = await fetch(`/api/votes?deal_id=${dealId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch survey responses');
      }
      
      const votes = await response.json();
      
      if (votes.length === 0) {
        toast.warning('No survey responses available for this deal');
        return;
      }
      
      toast.info('Generating report with AI insights...', { duration: 3000 });
      
      // Generate the PDF with AI summary
      await generateSurveyReportPDF(dealName, votes, dealData);
      
      toast.success('Report generated! Save it using the print dialog.');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerateReport}
      disabled={isGenerating}
      variant={variant}
      size={size}
      title="Download Survey Report PDF"
      className={size === "icon" ? "h-8 w-8" : ""}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showText && <span className="ml-2">Generating...</span>}
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          {showText && <span className="ml-2">Download Report</span>}
        </>
      )}
    </Button>
  );
}