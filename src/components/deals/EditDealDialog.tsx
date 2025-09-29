"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateDeal, deleteDeal } from '@/client-lib/api-client';
import { DealWithVotes, Deal } from '@/shared/models';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, AlertCircle, FileText, AlertTriangle, Globe } from 'lucide-react';
import { generateText } from '@/client-lib/integrations-client';
import { cn } from "@/client-lib/utils";
import { TranscriptAnalysisDialog } from './TranscriptAnalysisDialog';

interface EditDealDialogProps {
  deal: DealWithVotes;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormFounder {
  name: string;
  bio: string;
  linkedin_url: string;
  email: string;
  avatar_url: string;
}

const TECH_INDUSTRIES = [
  'AI/ML',
  'Enterprise Software',
  'FinTech',
  'HealthTech',
  'E-commerce',
  'Consumer Apps',
  'Developer Tools',
  'Cloud Infrastructure',
  'Cybersecurity',
  'EdTech',
  'Gaming',
  'Social Media',
  'Productivity',
  'Analytics',
  'Marketing Tech',
  'Sales Tech',
  'HR Tech',
  'Legal Tech',
  'Real Estate Tech',
  'Transportation',
  'Food Tech',
  'CleanTech',
  'IoT',
  'Blockchain/Crypto',
  'Hardware',
  'Robotics',
  'Other'
];

export function EditDealDialog({ deal, open, onOpenChange }: EditDealDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [showEmptyIndicators, setShowEmptyIndicators] = useState(true);
  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  
  // Company Information
  const [companyData, setCompanyData] = useState({
    company_name: '',
    company_url: '',
    company_description_short: '',
    why_good_fit: '',
  });

  // Founders Information
  const [foundersData, setFoundersData] = useState({
    founders_location: '',
    company_base_location: '',
    founders: [{ name: '', bio: '', linkedin_url: '', email: '', avatar_url: '' }] as FormFounder[]
  });

  // Product Information
  const [productData, setProductData] = useState({
    demo_url: '',
  });

  // Traction Information
  const [tractionData, setTractionData] = useState({
    working_duration: '',
    customer_traction: '',
    has_revenue: false,
    revenue_amount: '',
  });

  // Story & Market
  const [storyData, setStoryData] = useState({
    founder_motivation: '',
    competition_differentiation: '',
  });





  // Round Information
  const [roundData, setRoundData] = useState({
    raising_amount: '',
    safe_or_equity: '',
    confirmed_amount: '',
    lead_investor: '',
    co_investors: [] as string[],
    co_investor_input: '',
  });

  // Other Information
  const [otherData, setOtherData] = useState({
    industry: '',
    stage: 'sourcing' as Deal['stage'],
    deal_size: '',
    valuation: '',
    pitch_deck_url: '',
    funding_round: '',
    contract_link: '',
  });
  
  // Close date (signed/signed_and_wired)
  const [closeDate, setCloseDate] = useState<string>('');
  const [closeDateTouched, setCloseDateTouched] = useState<boolean>(false);


  
  // Track if there's no pitch deck
  const [noPitchDeck, setNoPitchDeck] = useState(false);

  // Helper function to check if a field is empty
  const isFieldEmpty = (value: string | number | undefined | null): boolean => {
    return value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '');
  };

  // Helper function to get field class names
  const getFieldClassName = (value: string | number | undefined | null, baseClassName?: string) => {
    if (!showEmptyIndicators) return baseClassName;
    return cn(
      baseClassName,
      isFieldEmpty(value) && "border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/20"
    );
  };

  // Helper function to format numbers with commas
  const formatNumberWithCommas = (value: string) => {
    if (!value || value === '') return '';
    // Just format the string value directly without extra processing
    return Number(value).toLocaleString();
  };

  // Helper function to handle valuation input
  const handleValuationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove commas and non-digit characters to get raw number  
    const rawValue = e.target.value.replace(/[,\s]/g, '').replace(/[^\d]/g, '');
    setOtherData({ ...otherData, valuation: rawValue });
  };

  // Helper function to handle raising amount input
  const handleRaisingAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove commas and non-digit characters to get raw number  
    const rawValue = e.target.value.replace(/[,\s]/g, '').replace(/[^\d]/g, '');
    setRoundData({ ...roundData, raising_amount: rawValue });
  };

  // Helper function to handle confirmed amount input
  const handleConfirmedAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove commas and non-digit characters to get raw number  
    const rawValue = e.target.value.replace(/[,\s]/g, '').replace(/[^\d]/g, '');
    setRoundData({ ...roundData, confirmed_amount: rawValue });
  };

  // Helper function to handle deal size input
  const handleDealSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove commas and non-digit characters to get raw number  
    const rawValue = e.target.value.replace(/[,\s]/g, '').replace(/[^\d]/g, '');
    setOtherData({ ...otherData, deal_size: rawValue });
  };



  // Get all fields with their metadata and current values
  const getAllFields = () => {
    const fields = [] as Array<{ fieldName: string; fieldLabel: string; tabName: string; currentValue: any; isEmpty: boolean } >;
    
    // Company fields
    fields.push({ 
      fieldName: 'company_name', 
      fieldLabel: 'Company Name', 
      tabName: 'Company',
      currentValue: companyData.company_name,
      isEmpty: isFieldEmpty(companyData.company_name)
    });
    fields.push({ 
      fieldName: 'company_url', 
      fieldLabel: 'Company URL', 
      tabName: 'Company',
      currentValue: companyData.company_url,
      isEmpty: isFieldEmpty(companyData.company_url)
    });
    fields.push({ 
      fieldName: 'company_description_short', 
      fieldLabel: 'Company Description', 
      tabName: 'Company',
      currentValue: companyData.company_description_short,
      isEmpty: isFieldEmpty(companyData.company_description_short)
    });
    fields.push({ 
      fieldName: 'why_good_fit', 
      fieldLabel: 'Why is it a fit for Gandhi Capital', 
      tabName: 'Company',
      currentValue: companyData.why_good_fit,
      isEmpty: isFieldEmpty(companyData.why_good_fit)
    });

    if (!noPitchDeck) {
      fields.push({ 
        fieldName: 'pitch_deck_url', 
        fieldLabel: 'Pitch Deck URL', 
        tabName: 'Company',
        currentValue: otherData.pitch_deck_url,
        isEmpty: isFieldEmpty(otherData.pitch_deck_url)
      });
    }

    
    // Founders fields
    fields.push({ 
      fieldName: 'founders_location', 
      fieldLabel: 'Founders Location', 
      tabName: 'Founders',
      currentValue: foundersData.founders_location,
      isEmpty: isFieldEmpty(foundersData.founders_location)
    });
    fields.push({ 
      fieldName: 'company_base_location', 
      fieldLabel: 'Company Base Location', 
      tabName: 'Founders',
      currentValue: foundersData.company_base_location,
      isEmpty: isFieldEmpty(foundersData.company_base_location)
    });
    
    foundersData.founders.forEach((founder, index) => {
      fields.push({ 
        fieldName: `founder_${index}_name`, 
        fieldLabel: `Founder ${index + 1} Name`, 
        tabName: 'Founders',
        currentValue: founder.name,
        isEmpty: isFieldEmpty(founder.name)
      });
      fields.push({ 
        fieldName: `founder_${index}_email`, 
        fieldLabel: `Founder ${index + 1} Email`, 
        tabName: 'Founders',
        currentValue: founder.email,
        isEmpty: isFieldEmpty(founder.email)
      });
      fields.push({ 
        fieldName: `founder_${index}_bio`, 
        fieldLabel: `Founder ${index + 1} Bio`, 
        tabName: 'Founders',
        currentValue: founder.bio,
        isEmpty: isFieldEmpty(founder.bio)
      });
      fields.push({ 
        fieldName: `founder_${index}_linkedin_url`, 
        fieldLabel: `Founder ${index + 1} LinkedIn`, 
        tabName: 'Founders',
        currentValue: founder.linkedin_url,
        isEmpty: isFieldEmpty(founder.linkedin_url)
      });
    });
    
    // Product & Market fields
    fields.push({ 
      fieldName: 'demo_url', 
      fieldLabel: 'Demo URL', 
      tabName: 'Product & Market',
      currentValue: productData.demo_url,
      isEmpty: isFieldEmpty(productData.demo_url)
    });
    fields.push({ 
      fieldName: 'working_duration', 
      fieldLabel: 'Working Duration', 
      tabName: 'Product & Market',
      currentValue: tractionData.working_duration,
      isEmpty: isFieldEmpty(tractionData.working_duration)
    });
    fields.push({ 
      fieldName: 'customer_traction', 
      fieldLabel: 'Customer Traction', 
      tabName: 'Product & Market',
      currentValue: tractionData.customer_traction,
      isEmpty: isFieldEmpty(tractionData.customer_traction)
    });
    if (tractionData.has_revenue) {
      fields.push({ 
        fieldName: 'revenue_amount', 
        fieldLabel: 'Revenue Amount', 
        tabName: 'Product & Market',
        currentValue: tractionData.revenue_amount,
        isEmpty: isFieldEmpty(tractionData.revenue_amount)
      });
    }
    fields.push({ 
      fieldName: 'founder_motivation', 
      fieldLabel: 'Founder Motivation', 
      tabName: 'Product & Market',
      currentValue: storyData.founder_motivation,
      isEmpty: isFieldEmpty(storyData.founder_motivation)
    });
    fields.push({ 
      fieldName: 'competition_differentiation', 
      fieldLabel: 'Competition Differentiation', 
      tabName: 'Product & Market',
      currentValue: storyData.competition_differentiation,
      isEmpty: isFieldEmpty(storyData.competition_differentiation)
    });

    fields.push({ 
      fieldName: 'industry', 
      fieldLabel: 'Industry', 
      tabName: 'Product & Market',
      currentValue: otherData.industry,
      isEmpty: isFieldEmpty(otherData.industry)
    });

    
    // Round fields
    fields.push({ 
      fieldName: 'raising_amount', 
      fieldLabel: 'Raising Amount', 
      tabName: 'Funding',
      currentValue: roundData.raising_amount,
      isEmpty: isFieldEmpty(roundData.raising_amount)
    });
    fields.push({ 
      fieldName: 'safe_or_equity', 
      fieldLabel: 'SAFE or Equity', 
      tabName: 'Funding',
      currentValue: roundData.safe_or_equity,
      isEmpty: isFieldEmpty(roundData.safe_or_equity)
    });
    fields.push({ 
      fieldName: 'confirmed_amount', 
      fieldLabel: 'Confirmed Amount', 
      tabName: 'Funding',
      currentValue: roundData.confirmed_amount,
      isEmpty: isFieldEmpty(roundData.confirmed_amount)
    });
    fields.push({ 
      fieldName: 'lead_investor', 
      fieldLabel: 'Lead Investor', 
      tabName: 'Funding',
      currentValue: roundData.lead_investor,
      isEmpty: isFieldEmpty(roundData.lead_investor)
    });
    fields.push({ 
      fieldName: 'co_investors', 
      fieldLabel: 'Co-Investors', 
      tabName: 'Funding',
      currentValue: roundData.co_investors.length > 0 ? roundData.co_investors.join(', ') : '',
      isEmpty: roundData.co_investors.length === 0
    });
    fields.push({ 
      fieldName: 'deal_size', 
      fieldLabel: 'Gandhi Capital Investment Amount', 
      tabName: 'Funding',
      currentValue: otherData.deal_size,
      isEmpty: isFieldEmpty(otherData.deal_size)
    });
    fields.push({ 
      fieldName: 'valuation', 
      fieldLabel: 'Valuation', 
      tabName: 'Funding',
      currentValue: otherData.valuation,
      isEmpty: isFieldEmpty(otherData.valuation)
    });
    fields.push({ 
      fieldName: 'funding_round', 
      fieldLabel: 'Funding Round', 
      tabName: 'Funding',
      currentValue: otherData.funding_round,
      isEmpty: isFieldEmpty(otherData.funding_round)
    });



    
    return fields;
  };

  // Handle URL analysis (placeholder for future web scraping functionality)
  const handleScrapeUrls = async () => {
    const urls = [companyData.company_url, otherData.pitch_deck_url].filter(url => url && url.trim());
    
    if (urls.length === 0) {
      toast.error('Please enter at least one URL (Company URL or Pitch Deck URL) to analyze');
      return;
    }

    setIsScraping(true);
    
    try {
      // For now, we'll extract information from the URL itself and provide smart suggestions
      let updatesApplied = 0;
      const urlAnalysis: string[] = [];
      
      urls.forEach(url => {
        try {
          const urlObj = new URL(url);
          const domain = urlObj.hostname.toLowerCase();
          const path = urlObj.pathname.toLowerCase();
          
          // Extract company name from domain
          if (!companyData.company_name && domain) {
            const domainParts = domain.replace('www.', '').split('.');
            if (domainParts.length > 1) {
              const potentialName = domainParts[0];
              // Capitalize first letter and clean up
              const cleanedName = potentialName.charAt(0).toUpperCase() + potentialName.slice(1);
              if (cleanedName.length > 2 && cleanedName.length < 20) {
                setCompanyData(prev => ({ ...prev, company_name: cleanedName }));
                urlAnalysis.push(`Extracted company name "${cleanedName}" from domain`);
                updatesApplied++;
              }
            }
          }
          
          // Detect if it's a pitch deck URL
          if (url === otherData.pitch_deck_url && (
            domain.includes('docsend') || 
            domain.includes('drive.google.com') ||
            domain.includes('dropbox') ||
            domain.includes('notion') ||
            path.includes('pitch') ||
            path.includes('deck')
          )) {
            urlAnalysis.push('Detected pitch deck URL format');
          }
          
          // Detect if it's a demo URL
          if (path.includes('demo') || path.includes('app') || domain.includes('demo')) {
            if (!productData.demo_url) {
              setProductData(prev => ({ ...prev, demo_url: url }));
              urlAnalysis.push(`Set demo URL: ${url}`);
              updatesApplied++;
            }
          }
          
        } catch (urlError) {
          console.error('Error parsing URL:', url, urlError);
        }
      });

      // Provide smart suggestions based on URL patterns
      if (updatesApplied > 0) {
        toast.success(`Applied ${updatesApplied} URL-based insights: ${urlAnalysis.join(', ')}`);
      } else {
        toast.info('URLs analyzed. For full web scraping, a backend service would be needed to fetch and analyze page content.');
      }

      // Show helpful message about future functionality
      setTimeout(() => {
        toast.info('Tip: For complete web scraping, consider adding the website content manually or contact support about implementing full scraping capabilities.');
      }, 2000);

    } catch (error) {
      console.error('URL analysis error:', error);
      toast.error('Failed to analyze URLs. Please check the URL formats.');
    } finally {
      setIsScraping(false);
    }
  };

  // Handle applying values from transcript analysis
  const handleApplyTranscriptValues = (values: Record<string, any>) => {
    console.log('Applying transcript values:', values);
    
    // Company fields
    if ('company_name' in values) {
      setCompanyData(prev => ({ ...prev, company_name: String(values.company_name) }));
    }
    if ('company_url' in values) {
      setCompanyData(prev => ({ ...prev, company_url: String(values.company_url) }));
    }
    if ('company_description_short' in values) {
      setCompanyData(prev => ({ ...prev, company_description_short: String(values.company_description_short) }));
    }
    if ('why_good_fit' in values) {
      setCompanyData(prev => ({ ...prev, why_good_fit: String(values.why_good_fit) }));
    }
    
    // Founders fields
    if ('founders_location' in values) {
      setFoundersData(prev => ({ ...prev, founders_location: String(values.founders_location) }));
    }
    if ('company_base_location' in values) {
      setFoundersData(prev => ({ ...prev, company_base_location: String(values.company_base_location) }));
    }
    
    // Handle founder-specific fields
    const updatedFounders = [...foundersData.founders];
    let foundersUpdated = false;
    
    Object.keys(values).forEach(key => {
      const founderMatch = key.match(/founder_(\d+)_(\w+)/);
      if (founderMatch) {
        const index = parseInt(founderMatch[1]);
        const field = founderMatch[2] as keyof FormFounder;
        
        // Ensure the founder exists at this index
        while (updatedFounders.length <= index) {
          updatedFounders.push({ name: '', bio: '', linkedin_url: '', email: '', avatar_url: '' });
        }
        
        if (updatedFounders[index]) {
          updatedFounders[index][field] = String(values[key]);
          foundersUpdated = true;
        }
      }
    });
    
    if (foundersUpdated) {
      setFoundersData(prev => ({ ...prev, founders: updatedFounders }));
    }
    
    // Product fields
    if ('demo_url' in values) {
      setProductData(prev => ({ ...prev, demo_url: String(values.demo_url) }));
    }
    
    // Traction fields
    if ('working_duration' in values) {
      setTractionData(prev => ({ ...prev, working_duration: String(values.working_duration) }));
    }

    if ('traction_progress' in values) {
      setTractionData(prev => ({ ...prev, customer_traction: String(values.traction_progress) }));
    }
    if ('user_traction' in values) {
      // Append to customer_traction if there's already content
      setTractionData(prev => ({ 
        ...prev, 
        customer_traction: prev.customer_traction 
          ? `${prev.customer_traction}\n\n${String(values.user_traction)}`
          : String(values.user_traction)
      }));
    }
    if ('customer_traction' in values) {
      setTractionData(prev => ({ ...prev, customer_traction: String(values.customer_traction) }));
    }
    if ('revenue_amount' in values) {
      setTractionData(prev => ({ ...prev, revenue_amount: String(values.revenue_amount) }));
    }
    
    // Story fields
    if ('founder_motivation' in values) {
      setStoryData(prev => ({ ...prev, founder_motivation: String(values.founder_motivation) }));
    }
    if ('competition_differentiation' in values) {
      setStoryData(prev => ({ ...prev, competition_differentiation: String(values.competition_differentiation) }));
    }

    
    // Round fields
    if ('raising_amount' in values) {
      setRoundData(prev => ({ ...prev, raising_amount: String(values.raising_amount) }));
    }
    if ('safe_or_equity' in values) {
      setRoundData(prev => ({ ...prev, safe_or_equity: String(values.safe_or_equity) }));
    }
    if ('confirmed_amount' in values) {
      setRoundData(prev => ({ ...prev, confirmed_amount: String(values.confirmed_amount) }));
    }
    if ('lead_investor' in values) {
      setRoundData(prev => ({ ...prev, lead_investor: String(values.lead_investor) }));
    }
    if ('co_investors' in values) {
      // Handle co_investors which can be a string (comma-separated) or an array
      let coInvestors: string[] = [];
      
      if (typeof values.co_investors === 'string') {
        // Split by comma and clean up each investor name
        coInvestors = values.co_investors
          .split(',')
          .map(inv => inv.trim())
          .filter(inv => inv.length > 0);
      } else if (Array.isArray(values.co_investors)) {
        coInvestors = values.co_investors.map(inv => String(inv).trim()).filter(inv => inv.length > 0);
      }
      
      setRoundData(prev => ({ ...prev, co_investors: coInvestors }));
    }
    
    // Other fields
    if ('industry' in values) {
      setOtherData(prev => ({ ...prev, industry: String(values.industry) }));
    }
    if ('funding_round' in values) {
      setOtherData(prev => ({ ...prev, funding_round: String(values.funding_round) }));
    }
    if ('deal_size' in values) {
      setOtherData(prev => ({ ...prev, deal_size: String(values.deal_size) }));
    }
    if ('valuation' in values) {
      setOtherData(prev => ({ ...prev, valuation: String(values.valuation) }));
    }
    if ('pitch_deck_url' in values) {
      setOtherData(prev => ({ ...prev, pitch_deck_url: String(values.pitch_deck_url) }));
    }
    
    console.log('State after applying transcript values:', {
      companyData,
      foundersData,
      productData,
      tractionData,
      storyData,
      roundData,
      otherData
    });
  };

  // Count empty fields per tab
  const getTabEmptyFieldsCount = (tabId: string): number => {
    switch(tabId) {
      case 'company':
        const companyFields = [
          companyData.company_name, 
          companyData.company_url, 
          companyData.company_description_short,
          companyData.why_good_fit
        ];
        if (!noPitchDeck) {
          companyFields.push(otherData.pitch_deck_url);
        }
        return companyFields.filter(isFieldEmpty).length;
      case 'founders':
        const founderEmptyCount = foundersData.founders.reduce((acc, founder) => {
          return acc + [founder.name, founder.email, founder.bio, founder.linkedin_url].filter(isFieldEmpty).length;
        }, 0);
        return founderEmptyCount + [foundersData.founders_location, foundersData.company_base_location].filter(isFieldEmpty).length;
      case 'product-market':
        const productMarketFields = [
          productData.demo_url,
          tractionData.working_duration, 
          tractionData.customer_traction,
          storyData.founder_motivation, 
          storyData.competition_differentiation,
          otherData.industry
        ];
        if (tractionData.has_revenue) {
          productMarketFields.push(tractionData.revenue_amount);
        }
        return productMarketFields.filter(isFieldEmpty).length;
      case 'round':
        return [roundData.raising_amount, roundData.safe_or_equity, roundData.confirmed_amount, roundData.lead_investor, otherData.deal_size, otherData.valuation, otherData.funding_round]
          .filter(isFieldEmpty).length;

      default:
        return 0;
    }
  };

  useEffect(() => {
    if (deal) {
      // Company data
      setCompanyData({
        company_name: deal.company_name || '',
        company_url: deal.company_url || '',
        company_description_short: deal.company_description_short || '',
        why_good_fit: deal.why_good_fit || '',
      });

      // Founders data
      setFoundersData({
        founders_location: deal.founders_location || '',
        company_base_location: deal.company_base_location || '',
        founders: deal.founders && deal.founders.length > 0 
          ? deal.founders.map(f => ({
              name: f.name || '',
              bio: f.bio || '',
              linkedin_url: f.linkedin_url || '',
              email: f.email || '',
              avatar_url: f.avatar_url || '',
            }))
          : [{ name: '', bio: '', linkedin_url: '', email: '', avatar_url: '' }]
      });

      // Product data
      setProductData({
        demo_url: deal.demo_url || '',
      });

      // Traction data
      setTractionData({
        working_duration: deal.working_duration || '', // Single combined field
        customer_traction: (() => {
          // Combine traction_progress and user_traction for backward compatibility
          const progress = deal.traction_progress || '';
          const users = deal.user_traction || '';
          if (progress && users) {
            return `${progress}\n\n${users}`;
          }
          return progress || users || '';
        })(),
        has_revenue: deal.has_revenue || false,
        revenue_amount: deal.revenue_amount?.toString() || '',
      });

      // Story & Market
      setStoryData({
        founder_motivation: deal.founder_motivation || '',
        competition_differentiation: deal.competition_differentiation || '',
      });



      // Round data
      setRoundData({
        raising_amount: deal.raising_amount?.toString() || '',
        safe_or_equity: deal.safe_or_equity || '',
        confirmed_amount: deal.confirmed_amount?.toString() || '',
        lead_investor: deal.lead_investor || '',
        co_investors: deal.co_investors || [],
        co_investor_input: '',
      });

      // Other data
      setOtherData({
        industry: deal.industry || '',
        stage: deal.stage || 'sourcing',
        deal_size: deal.deal_size?.toString() || '',
        valuation: deal.valuation?.toString() || '',
        pitch_deck_url: deal.pitch_deck_url || '',
        funding_round: deal.funding_round || '',
        contract_link: (deal as Deal).contract_link || '',
      });



      // Close date
      if (deal.close_date) {
        const d = new Date(deal.close_date);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          setCloseDate(`${yyyy}-${mm}-${dd}`);
        } else {
          setCloseDate('');
        }
      } else {
        setCloseDate('');
      }
      setCloseDateTouched(false);


    }
  }, [deal]);

  const addFounder = () => {
    setFoundersData({
      ...foundersData,
      founders: [...foundersData.founders, { name: '', bio: '', linkedin_url: '', email: '', avatar_url: '' }]
    });
  };

  const removeFounder = (index: number) => {
    if (foundersData.founders.length > 1) {
      setFoundersData({
        ...foundersData,
        founders: foundersData.founders.filter((_, i) => i !== index)
      });
    }
  };

  const updateFounder = (index: number, field: keyof FormFounder, value: string) => {
    const updatedFounders = foundersData.founders.map((founder, i) => 
      i === index ? { ...founder, [field]: value } : founder
    );
    setFoundersData({ ...foundersData, founders: updatedFounders });
  };

  const addCoInvestor = () => {
    if (roundData.co_investor_input.trim()) {
      setRoundData({
        ...roundData,
        co_investors: [...roundData.co_investors, roundData.co_investor_input.trim()],
        co_investor_input: ''
      });
    }
  };

  const removeCoInvestor = (index: number) => {
    setRoundData({
      ...roundData,
      co_investors: roundData.co_investors.filter((_, i) => i !== index)
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDeal(deal.id);
      toast.success('Deal deleted successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('Submitting with state:', {
      companyData,
      foundersData,
      productData,
      tractionData,
      storyData,
      roundData,
      otherData,
      closeDate,
    });

    try {
      const dealData: Record<string, any> = {
        // Company data - ensure strings are properly handled
        company_name: companyData.company_name || undefined,
        company_url: companyData.company_url || undefined,
        company_description_short: companyData.company_description_short || undefined,
        why_good_fit: companyData.why_good_fit || undefined,
        
        // Founders data
        founders_location: foundersData.founders_location || undefined,
        company_base_location: foundersData.company_base_location || undefined,
        // Only include founders if at least one valid founder is present
        founders: (() => {
          const cleaned = foundersData.founders.filter(f => f.name && f.name.trim() !== '');
          return cleaned.length > 0 ? cleaned : undefined;
        })(),
        
        // Product data
        demo_url: productData.demo_url || undefined,
        
        // Traction data
        working_duration: tractionData.working_duration || undefined,
        has_revenue: tractionData.has_revenue || false,
        revenue_amount: tractionData.revenue_amount ? parseFloat(tractionData.revenue_amount) : undefined,
        traction_progress: tractionData.customer_traction || undefined, // Save to traction_progress only
        user_traction: undefined, // Clear user_traction to avoid duplication
        
        // Story & Market
        founder_motivation: storyData.founder_motivation || undefined,
        competition_differentiation: storyData.competition_differentiation || undefined,
        
        // Round data
        raising_amount: roundData.raising_amount ? parseFloat(roundData.raising_amount) : undefined,
        confirmed_amount: roundData.confirmed_amount ? parseFloat(roundData.confirmed_amount) : 0,
        safe_or_equity: roundData.safe_or_equity || undefined,
        lead_investor: roundData.lead_investor || undefined,
        co_investors: roundData.co_investors.length > 0 ? roundData.co_investors : undefined,
        
        // Other data - ensure proper handling
        industry: otherData.industry || undefined,
        stage: otherData.stage || 'sourcing',
        deal_size: otherData.deal_size ? parseFloat(otherData.deal_size) : 0,
        valuation: otherData.valuation ? parseFloat(otherData.valuation) : undefined,
        pitch_deck_url: otherData.pitch_deck_url || undefined,
        funding_round: otherData.funding_round || undefined,
        contract_link: otherData.contract_link || undefined,
      };

      // Only include close_date if user edited (touched) this field
      if (closeDateTouched) {
        if (!closeDate) {
          dealData.close_date = null;
        } else {
          const iso = new Date(`${closeDate}T00:00:00Z`).toISOString();
          dealData.close_date = iso;
        }
      }



      console.log('Sending deal data:', dealData);

      await updateDeal(deal.id, dealData as any);
      toast.success('Deal updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating deal:', error);
      toast.error('Failed to update deal');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "company", label: "Company" },
    { id: "founders", label: "Founders" },
    { id: "round", label: "Funding" },
    { id: "product-market", label: "Product & Market" },
  ];

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Deal - {deal.company_name}</DialogTitle>
        </DialogHeader>

        {showEmptyIndicators && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Fields highlighted in <span className="text-red-500 font-semibold">red</span> are currently empty. Fill them in to complete the deal information.
              </span>
              <div className="flex gap-2 ml-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleScrapeUrls}
                  disabled={isScraping}
                >
                  {isScraping ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4 mr-2" />
                  )}
                  {isScraping ? 'Analyzing...' : 'Analyze URLs'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTranscriptDialog(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Analyze Transcript
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {tabs.map((tab) => {
                const emptyCount = getTabEmptyFieldsCount(tab.id);
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="relative">
                    {tab.label}
                    {showEmptyIndicators && emptyCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {emptyCount}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Company Tab */}
            <TabsContent value="company" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>About the Company</CardTitle>
                  <CardDescription>Basic information about the company</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">
                        Company Name
                        {showEmptyIndicators && isFieldEmpty(companyData.company_name) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        id="company_name"
                        value={companyData.company_name}
                        onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
                        className={getFieldClassName(companyData.company_name)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_url">
                        Company URL
                        {showEmptyIndicators && isFieldEmpty(companyData.company_url) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        id="company_url"
                        type="url"
                        value={companyData.company_url}
                        onChange={(e) => setCompanyData({ ...companyData, company_url: e.target.value })}
                        className={getFieldClassName(companyData.company_url)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_description_short">
                      What does the Company Do
                      {showEmptyIndicators && isFieldEmpty(companyData.company_description_short) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Textarea
                      id="company_description_short"
                      value={companyData.company_description_short}
                      onChange={(e) => setCompanyData({ ...companyData, company_description_short: e.target.value })}
                      className={getFieldClassName(companyData.company_description_short)}
                      rows={6}
                      placeholder="Brief description of the company"
                    />
                    <p className="text-sm text-muted-foreground">
                      {(companyData.company_description_short || '').length} characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="why_good_fit">
                      Why is it a fit for Gandhi Capital
                      {showEmptyIndicators && isFieldEmpty(companyData.why_good_fit) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Textarea
                      id="why_good_fit"
                      value={companyData.why_good_fit}
                      onChange={(e) => setCompanyData({ ...companyData, why_good_fit: e.target.value })}
                      className={getFieldClassName(companyData.why_good_fit)}
                      rows={4}
                      placeholder="Why would this be a good fit for Gandhi Capital specifically?"
                    />
                    <p className="text-sm text-muted-foreground">
                      {(companyData.why_good_fit || '').length} characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pitch_deck_url">
                      Pitch Deck URL
                      {showEmptyIndicators && isFieldEmpty(otherData.pitch_deck_url) && !noPitchDeck && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <div className="space-y-2">
                      <Input
                        id="pitch_deck_url"
                        type="url"
                        value={otherData.pitch_deck_url}
                        onChange={(e) => setOtherData({ ...otherData, pitch_deck_url: e.target.value })}
                        className={getFieldClassName(noPitchDeck ? '' : otherData.pitch_deck_url)}
                        disabled={noPitchDeck}
                        placeholder={noPitchDeck ? "No pitch deck available" : "https://..."}
                      />
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="no_pitch_deck"
                          checked={noPitchDeck}
                          onCheckedChange={(checked) => {
                            setNoPitchDeck(!!checked);
                            if (checked) {
                              setOtherData({ ...otherData, pitch_deck_url: '' });
                            }
                          }}
                        />
                        <Label 
                          htmlFor="no_pitch_deck" 
                          className="text-sm font-normal cursor-pointer"
                        >
                          No pitch deck available
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stage">Deal Stage</Label>
                    <Select
                      value={otherData.stage}
                      onValueChange={(value) => setOtherData({ ...otherData, stage: value as Deal['stage'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sourcing">Sourcing</SelectItem>
                        <SelectItem value="sourcing_reached_out">Sourcing / Reached out</SelectItem>
                        <SelectItem value="sourcing_meeting_booked">Sourcing / Meeting booked</SelectItem>
                        <SelectItem value="sourcing_meeting_done_deciding">Sourcing / Meeting done - deciding</SelectItem>
                        <SelectItem value="partner_review">Partner Review</SelectItem>
                        <SelectItem value="offer">Offer</SelectItem>
                        <SelectItem value="signed">Signed</SelectItem>
                        <SelectItem value="signed_and_wired">Signed and Wired (Closed won)</SelectItem>
                        <SelectItem value="closed_lost_passed">Closed Lost / We Passed</SelectItem>
                        <SelectItem value="closed_lost_rejected">Closed Lost / They Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Close Date - Only show for signed deals */}
                  {(otherData.stage === 'signed' || otherData.stage === 'signed_and_wired') && (
                    <div className="space-y-2">
                      <Label htmlFor="close_date">Close Date</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="close_date"
                          type="date"
                          value={closeDate}
                          onChange={(e) => { setCloseDate(e.target.value); setCloseDateTouched(true); }}
                          className="max-w-xs"
                        />
                        {closeDate && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => { setCloseDate(''); setCloseDateTouched(true); }}>
                            Clear
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Set the date the deal was closed. Leave blank to not set a close date.</p>
                    </div>
                  )}

                  {/* Contract Link - Only show for signed deals */}
                  {(otherData.stage === 'signed' || otherData.stage === 'signed_and_wired') && (
                    <div className="space-y-2">
                      <Label htmlFor="contract_link">
                        Signed Contract (SAFE) Link
                      </Label>
                      <Input
                        id="contract_link"
                        type="url"
                        value={otherData.contract_link}
                        onChange={(e) => setOtherData({ ...otherData, contract_link: e.target.value })}
                        placeholder="https://drive.google.com/file/d/..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Link to the signed SAFE contract PDF (e.g., Google Drive link)
                      </p>
                    </div>
                  )}

                </CardContent>
              </Card>
            </TabsContent>

            {/* Founders Tab */}
            <TabsContent value="founders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>About the Founders</CardTitle>
                  <CardDescription>Information about the founding team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="founders_location">
                        Where are the founders located?
                        {showEmptyIndicators && isFieldEmpty(foundersData.founders_location) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        id="founders_location"
                        value={foundersData.founders_location}
                        onChange={(e) => setFoundersData({ ...foundersData, founders_location: e.target.value })}
                        className={getFieldClassName(foundersData.founders_location)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_base_location">
                        Where would the company be based after being funded?
                        {showEmptyIndicators && isFieldEmpty(foundersData.company_base_location) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        id="company_base_location"
                        value={foundersData.company_base_location}
                        onChange={(e) => setFoundersData({ ...foundersData, company_base_location: e.target.value })}
                        className={getFieldClassName(foundersData.company_base_location)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Founder Information</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addFounder}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Founder
                      </Button>
                    </div>
                    
                    {foundersData.founders.map((founder, index) => (
                      <Card key={index} className={cn(
                        showEmptyIndicators && (isFieldEmpty(founder.name) || isFieldEmpty(founder.email)) && "border-red-500"
                      )}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Founder {index + 1}</CardTitle>
                            {foundersData.founders.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeFounder(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>
                                Name
                                {showEmptyIndicators && isFieldEmpty(founder.name) && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </Label>
                              <Input
                                value={founder.name}
                                onChange={(e) => updateFounder(index, 'name', e.target.value)}
                                className={getFieldClassName(founder.name)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>
                                Email
                                {showEmptyIndicators && isFieldEmpty(founder.email) && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </Label>
                              <Input
                                type="email"
                                value={founder.email}
                                onChange={(e) => updateFounder(index, 'email', e.target.value)}
                                className={getFieldClassName(founder.email)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>
                              LinkedIn Profile
                              {showEmptyIndicators && isFieldEmpty(founder.linkedin_url) && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </Label>
                            <Input
                              type="url"
                              value={founder.linkedin_url}
                              onChange={(e) => updateFounder(index, 'linkedin_url', e.target.value)}
                              className={getFieldClassName(founder.linkedin_url)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Photo URL</Label>
                            <Input
                              type="url"
                              value={founder.avatar_url}
                              onChange={(e) => updateFounder(index, 'avatar_url', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>
                              Bio
                              {showEmptyIndicators && isFieldEmpty(founder.bio) && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </Label>
                            <Textarea
                              value={founder.bio}
                              onChange={(e) => updateFounder(index, 'bio', e.target.value)}
                              rows={3}
                              className={getFieldClassName(founder.bio)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Product & Market Tab */}
            <TabsContent value="product-market" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product & Market</CardTitle>
                  <CardDescription>Information about your product, traction, and market understanding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Product Section */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Product</h4>
                    <div className="space-y-2">
                      <Label htmlFor="demo_url">
                        If you have a demo, give us a link
                        {showEmptyIndicators && isFieldEmpty(productData.demo_url) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        id="demo_url"
                        type="url"
                        value={productData.demo_url}
                        onChange={(e) => setProductData({ ...productData, demo_url: e.target.value })}
                        className={getFieldClassName(productData.demo_url)}
                      />
                    </div>
                  </div>

                  <hr className="border-muted" />

                  {/* Traction Section */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Traction & Progress</h4>
                    <div className="space-y-2">
                      <Label htmlFor="working_duration">
                        How long have you been working on this? (Please specify part-time vs full-time)
                        {showEmptyIndicators && isFieldEmpty(tractionData.working_duration) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Textarea
                        id="working_duration"
                        value={tractionData.working_duration}
                        onChange={(e) => setTractionData({ ...tractionData, working_duration: e.target.value })}
                        className={getFieldClassName(tractionData.working_duration)}
                        rows={3}
                        placeholder="e.g., 'Working on this for 8 months, 6 months part-time while in college and 2 months full-time'"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customer_traction">
                        Customer Traction
                        {showEmptyIndicators && isFieldEmpty(tractionData.customer_traction) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Textarea
                        id="customer_traction"
                        value={tractionData.customer_traction}
                        onChange={(e) => setTractionData({ ...tractionData, customer_traction: e.target.value })}
                        className={getFieldClassName(tractionData.customer_traction)}
                        rows={5}
                        placeholder="How far along are you? Are people using your product? Please describe your current progress and user adoption."
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_revenue"
                        checked={tractionData.has_revenue}
                        onCheckedChange={(checked) => 
                          setTractionData({ ...tractionData, has_revenue: !!checked })
                        }
                      />
                      <Label htmlFor="has_revenue">Do you have revenue?</Label>
                    </div>
                    
                    {tractionData.has_revenue && (
                      <div className="space-y-2">
                        <Label htmlFor="revenue_amount">
                          Revenue Amount ($)
                          {showEmptyIndicators && isFieldEmpty(tractionData.revenue_amount) && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        <Input
                          id="revenue_amount"
                          type="number"
                          value={tractionData.revenue_amount}
                          onChange={(e) => setTractionData({ ...tractionData, revenue_amount: e.target.value })}
                          className={getFieldClassName(tractionData.revenue_amount)}
                        />
                      </div>
                    )}
                  </div>

                  <hr className="border-muted" />

                  {/* Story & Market Section */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Story & Market Insight</h4>
                    <div className="space-y-2">
                      <Label htmlFor="founder_motivation">
                        Why did you pick this idea? Do you have domain expertise in this area? How do you know people need what you're making?
                        {showEmptyIndicators && isFieldEmpty(storyData.founder_motivation) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Textarea
                        id="founder_motivation"
                        value={storyData.founder_motivation}
                        onChange={(e) => setStoryData({ ...storyData, founder_motivation: e.target.value })}
                        rows={4}
                        className={getFieldClassName(storyData.founder_motivation)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="competition_differentiation">
                        Who are your competitors? What do you understand about your business that they don't?
                        {showEmptyIndicators && isFieldEmpty(storyData.competition_differentiation) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Textarea
                        id="competition_differentiation"
                        value={storyData.competition_differentiation}
                        onChange={(e) => setStoryData({ ...storyData, competition_differentiation: e.target.value })}
                        rows={4}
                        className={getFieldClassName(storyData.competition_differentiation)}
                      />
                    </div>



                    <div className="space-y-2">
                      <Label htmlFor="industry">
                        Industry
                        {showEmptyIndicators && isFieldEmpty(otherData.industry) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        id="industry"
                        value={otherData.industry}
                        onChange={(e) => setOtherData({ ...otherData, industry: e.target.value })}
                        className={getFieldClassName(otherData.industry)}
                        placeholder="e.g., AI/ML, FinTech, Enterprise Software"
                      />
                    </div>
                  </div>

                  <hr className="border-muted" />


                </CardContent>
              </Card>
            </TabsContent>

            {/* Funding Tab */}
            <TabsContent value="round" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Funding Details</CardTitle>
                  <CardDescription>Investment and funding round information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="raising_amount">
                        How much are they raising? ($)
                        {showEmptyIndicators && isFieldEmpty(roundData.raising_amount) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        id="raising_amount"
                        type="text"
                        value={formatNumberWithCommas(roundData.raising_amount)}
                        onChange={handleRaisingAmountChange}
                        className={getFieldClassName(roundData.raising_amount)}
                        placeholder="e.g. 2,000,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmed_amount">
                        How much is already confirmed? ($)
                        {showEmptyIndicators && isFieldEmpty(roundData.confirmed_amount) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        id="confirmed_amount"
                        type="text"
                        value={formatNumberWithCommas(roundData.confirmed_amount)}
                        onChange={handleConfirmedAmountChange}
                        className={getFieldClassName(roundData.confirmed_amount)}
                        placeholder="e.g. 500,000"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="safe_or_equity">
                        SAFE or Equity?
                        {showEmptyIndicators && isFieldEmpty(roundData.safe_or_equity) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Select
                        value={roundData.safe_or_equity}
                        onValueChange={(value) => setRoundData({ ...roundData, safe_or_equity: value })}
                      >
                        <SelectTrigger className={getFieldClassName(roundData.safe_or_equity)}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SAFE">SAFE</SelectItem>
                          <SelectItem value="Equity">Equity</SelectItem>
                          <SelectItem value="Convertible Note">Convertible Note</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="funding_round">
                        Funding Round
                        {showEmptyIndicators && isFieldEmpty(otherData.funding_round) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        id="funding_round"
                        value={otherData.funding_round}
                        onChange={(e) => setOtherData({ ...otherData, funding_round: e.target.value })}
                        placeholder="e.g., Seed, Series A"
                        className={getFieldClassName(otherData.funding_round)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deal_size">
                        Gandhi Capital Investment Amount ($)
                        {showEmptyIndicators && isFieldEmpty(otherData.deal_size) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        id="deal_size"
                        type="text"
                        value={formatNumberWithCommas(otherData.deal_size)}
                        onChange={handleDealSizeChange}
                        className={getFieldClassName(otherData.deal_size)}
                        placeholder="e.g. 50,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valuation">
                        What's the valuation? ($)
                        {showEmptyIndicators && isFieldEmpty(otherData.valuation) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        id="valuation"
                        type="text"
                        value={formatNumberWithCommas(otherData.valuation)}
                        onChange={handleValuationChange}
                        className={getFieldClassName(otherData.valuation)}
                        placeholder="e.g. 5,000,000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lead_investor">
                      Is there a lead investor?
                      {showEmptyIndicators && isFieldEmpty(roundData.lead_investor) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Input
                      id="lead_investor"
                      value={roundData.lead_investor}
                      onChange={(e) => setRoundData({ ...roundData, lead_investor: e.target.value })}
                      className={getFieldClassName(roundData.lead_investor)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Any other co-investor?</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={roundData.co_investor_input}
                        onChange={(e) => setRoundData({ ...roundData, co_investor_input: e.target.value })}
                        placeholder="Enter co-investor name"
                      />
                      <Button type="button" onClick={addCoInvestor}>Add</Button>
                    </div>
                    {roundData.co_investors.length > 0 && (
                      <div className="space-y-2">
                        {roundData.co_investors.map((investor, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                            <span>{investor}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeCoInvestor(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>

          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading || isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Deal
              </Button>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-empty"
                  checked={showEmptyIndicators}
                  onCheckedChange={(checked) => setShowEmptyIndicators(!!checked)}
                />
                <Label htmlFor="show-empty" className="text-sm font-normal cursor-pointer">
                  Highlight empty fields
                </Label>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isDeleting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isDeleting}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Deal
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Deal
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-semibold">{deal.company_name}</span>? 
            This action cannot be undone and will permanently remove the deal and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Deal'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <TranscriptAnalysisDialog
      open={showTranscriptDialog}
      onOpenChange={setShowTranscriptDialog}
      allFields={getAllFields()}
      onApplyValues={handleApplyTranscriptValues}
    />
    </>
  );
}