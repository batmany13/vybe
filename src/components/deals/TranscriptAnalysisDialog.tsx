"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateText } from '@/client-lib/integrations-client';
import { toast } from 'sonner';
import { Loader2, FileText, Sparkles, CheckCircle2, AlertCircle, Copy, ArrowRight, Plus, RefreshCw } from 'lucide-react';
import { cn } from "@/client-lib/utils";

interface Field {
  fieldName: string;
  fieldLabel: string;
  tabName: string;
  currentValue?: string;
  isEmpty: boolean;
}

interface ExtractedField extends Field {
  extractedValue: string;
  isUpdate: boolean;
  confidence?: 'high' | 'medium' | 'low';
}

interface TranscriptAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allFields: Field[];
  onApplyValues: (values: Record<string, any>) => void;
}

export function TranscriptAnalysisDialog({ 
  open, 
  onOpenChange, 
  allFields,
  onApplyValues 
}: TranscriptAnalysisDialogProps) {
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'updates'>('all');

  const analyzeTranscript = async () => {
    if (!transcript.trim()) {
      toast.error('Please enter a transcript to analyze');
      return;
    }

    setIsAnalyzing(true);
    setExtractedFields([]);
    setSelectedFields(new Set());

    try {
      // Create a prompt for the AI to extract and improve information
      const fieldsPrompt = allFields.map(field => {
        if (field.currentValue) {
          return `- ${field.fieldLabel} (field: ${field.fieldName}, current value: "${field.currentValue}")`;
        }
        return `- ${field.fieldLabel} (field: ${field.fieldName}, currently empty)`;
      }).join('\n');

      const prompt = `
        Analyze the following transcript from a startup pitch or meeting. Extract information for ALL fields listed below.
        For fields that already have values, propose improvements or updates ONLY if the transcript provides better, more accurate, or more complete information.
        
        Fields to analyze:
        ${fieldsPrompt}

        Transcript:
        "${transcript}"

        Instructions:
        1. For empty fields: Extract relevant information if available
        2. For fields with existing values: Only suggest updates if the transcript provides:
           - More accurate information
           - More complete details
           - More recent data
           - Corrections to existing information
        3. Include a confidence level (high/medium/low) for each extraction
        4. If no relevant information found or no improvement needed, respond with "NO_CHANGE"
        5. For "Co-Investors" field: Extract ALL mentioned co-investors and return as comma-separated list (e.g., "Sequoia Capital, Andreessen Horowitz, Y Combinator")

        Format your response as a JSON object with this structure:
        {
          "field_name": {
            "value": "extracted or improved value",
            "confidence": "high|medium|low",
            "reason": "brief explanation of why this is new or an improvement"
          }
        }
        
        Example:
        {
          "company_name": {
            "value": "TechStartup Inc.",
            "confidence": "high",
            "reason": "Company name mentioned multiple times"
          },
          "industry": {
            "value": "FinTech",
            "confidence": "medium",
            "reason": "More specific than current value"
          },
          "co_investors": {
            "value": "Sequoia Capital, Andreessen Horowitz, Y Combinator",
            "confidence": "high",
            "reason": "Multiple co-investors mentioned in the transcript"
          },
          "raising_amount": "NO_CHANGE"
        }
      `;

      const response = await generateText(prompt, false, false);

      if (!response) {
        throw new Error('Failed to analyze transcript');
      }

      // Parse the AI response
      try {
        // Log the response type for debugging
        console.log('AI Response type:', typeof response);
        console.log('AI Response:', response);
        
        // Convert response to string if it isn't already
        const responseText = typeof response === 'string' ? response : JSON.stringify(response);
        
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        let extractedData: any = {};
        
        if (jsonMatch) {
          // Parse the extracted JSON
          try {
            extractedData = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error('Failed to parse extracted JSON:', e);
            extractedData = {};
          }
        }
        
        // Convert to ExtractedField format
        const fields: ExtractedField[] = [];
        
        for (const field of allFields) {
          const fieldData = extractedData[field.fieldName];
          
          if (fieldData && fieldData !== 'NO_CHANGE') {
            const value = typeof fieldData === 'object' ? fieldData.value : fieldData;
            const confidence = typeof fieldData === 'object' ? fieldData.confidence : 'medium';
            
            if (value && value !== 'NO_CHANGE') {
              // Check if this is an update or new value
              const isUpdate = !field.isEmpty && field.currentValue !== value;
              
              // Only add if it's a new value or a meaningful update
              if (field.isEmpty || (isUpdate && value !== field.currentValue)) {
                fields.push({
                  ...field,
                  extractedValue: String(value),
                  isUpdate,
                  confidence: confidence as 'high' | 'medium' | 'low'
                });
              }
            }
          }
        }

        setExtractedFields(fields);
        
        // Auto-select all high confidence fields
        const highConfidenceFields = fields
          .filter(f => f.confidence === 'high')
          .map(f => f.fieldName);
        setSelectedFields(new Set(highConfidenceFields));

        if (fields.length === 0) {
          toast.warning('No relevant information or improvements found in the transcript');
        } else {
          const newCount = fields.filter(f => !f.isUpdate).length;
          const updateCount = fields.filter(f => f.isUpdate).length;
          toast.success(`Found ${newCount} new field(s) and ${updateCount} improvement(s)`);
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('Raw response:', response);
        toast.error('Failed to parse extracted information. Please try again.');
      }
    } catch (error) {
      console.error('Error analyzing transcript:', error);
      toast.error('Failed to analyze transcript');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    const valuesToApply: Record<string, any> = {};
    
    extractedFields.forEach(field => {
      if (selectedFields.has(field.fieldName)) {
        valuesToApply[field.fieldName] = field.extractedValue;
      }
    });

    if (Object.keys(valuesToApply).length === 0) {
      toast.error('Please select at least one field to apply');
      return;
    }

    onApplyValues(valuesToApply);
    
    // Show detailed success message
    const newFields = extractedFields
      .filter(f => selectedFields.has(f.fieldName) && !f.isUpdate)
      .map(f => f.fieldLabel);
    const updatedFields = extractedFields
      .filter(f => selectedFields.has(f.fieldName) && f.isUpdate)
      .map(f => f.fieldLabel);
    
    let message = '';
    if (newFields.length > 0) {
      message += `Filled ${newFields.length} empty field(s)`;
    }
    if (updatedFields.length > 0) {
      if (message) message += ' and ';
      message += `Updated ${updatedFields.length} existing field(s)`;
    }
    
    toast.success(message, { duration: 5000 });
    
    onOpenChange(false);
    
    // Reset state
    setTranscript('');
    setExtractedFields([]);
    setSelectedFields(new Set());
  };

  const toggleFieldSelection = (fieldName: string) => {
    const newSelection = new Set(selectedFields);
    if (newSelection.has(fieldName)) {
      newSelection.delete(fieldName);
    } else {
      newSelection.add(fieldName);
    }
    setSelectedFields(newSelection);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Filter fields based on active tab
  const filteredFields = extractedFields.filter(field => {
    if (activeTab === 'new') return !field.isUpdate;
    if (activeTab === 'updates') return field.isUpdate;
    return true;
  });

  const newFieldsCount = extractedFields.filter(f => !f.isUpdate).length;
  const updateFieldsCount = extractedFields.filter(f => f.isUpdate).length;

  const getConfidenceBadge = (confidence?: 'high' | 'medium' | 'low') => {
    if (!confidence) return null;
    
    const variants = {
      high: 'default' as const,
      medium: 'secondary' as const,
      low: 'outline' as const
    };
    
    const colors = {
      high: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <Badge variant={variants[confidence]} className={cn("text-xs", colors[confidence])}>
        {confidence} confidence
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Analyze Transcript - Fill & Improve Fields
          </DialogTitle>
          <DialogDescription>
            Paste a transcript to fill empty fields and get suggestions for improving existing ones.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Summary Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Analyzing <strong>{allFields.length} total fields</strong>: {
                allFields.filter(f => f.isEmpty).length
              } empty, {
                allFields.filter(f => !f.isEmpty).length
              } with existing values
            </AlertDescription>
          </Alert>

          {/* Transcript Input */}
          <div className="space-y-2">
            <Label htmlFor="transcript">Transcript</Label>
            <Textarea
              id="transcript"
              placeholder="Paste your call transcript, meeting notes, or any relevant text here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[150px] resize-none"
              disabled={isAnalyzing}
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {transcript.length} characters
              </p>
              <Button 
                onClick={analyzeTranscript}
                disabled={!transcript.trim() || isAnalyzing}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze Transcript
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Extracted Fields */}
          {extractedFields.length > 0 && (
            <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between">
                <Label>Extracted Information</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedFields.size === extractedFields.length) {
                      setSelectedFields(new Set());
                    } else {
                      setSelectedFields(new Set(extractedFields.map(f => f.fieldName)));
                    }
                  }}
                >
                  {selectedFields.size === extractedFields.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              {/* Tabs for filtering */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="relative">
                    All
                    {extractedFields.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1">
                        {extractedFields.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="new" className="relative">
                    <Plus className="h-3 w-3 mr-1" />
                    New Fields
                    {newFieldsCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1 bg-green-100">
                        {newFieldsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="updates" className="relative">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Updates
                    {updateFieldsCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1 bg-blue-100">
                        {updateFieldsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="flex-1 mt-2">
                  <ScrollArea className="h-[300px] border rounded-lg">
                    <div className="p-4 space-y-3">
                      {filteredFields.map((field) => (
                        <Card 
                          key={field.fieldName}
                          className={cn(
                            "cursor-pointer transition-all",
                            selectedFields.has(field.fieldName) && "border-primary ring-2 ring-primary/20",
                            field.isUpdate ? "bg-blue-50/50 dark:bg-blue-950/20" : "bg-green-50/50 dark:bg-green-950/20"
                          )}
                          onClick={() => toggleFieldSelection(field.fieldName)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2 flex-1">
                                <div className={cn(
                                  "h-5 w-5 rounded border-2 flex items-center justify-center mt-0.5",
                                  selectedFields.has(field.fieldName) 
                                    ? "border-primary bg-primary" 
                                    : "border-muted-foreground"
                                )}>
                                  {selectedFields.has(field.fieldName) && (
                                    <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <CardTitle className="text-sm font-medium">
                                      {field.fieldLabel}
                                    </CardTitle>
                                    <Badge variant={field.isUpdate ? "default" : "secondary"} className="text-xs">
                                      {field.isUpdate ? (
                                        <>
                                          <RefreshCw className="h-3 w-3 mr-1" />
                                          Update
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="h-3 w-3 mr-1" />
                                          New
                                        </>
                                      )}
                                    </Badge>
                                    {getConfidenceBadge(field.confidence)}
                                  </div>
                                  <CardDescription className="text-xs mt-1">
                                    {field.tabName} Tab
                                  </CardDescription>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(field.extractedValue);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {field.isUpdate && field.currentValue ? (
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <div className="flex-1">
                                    <p className="text-xs text-muted-foreground mb-1">Current value:</p>
                                    {field.fieldName === 'co_investors' && field.currentValue.includes(',') ? (
                                      <ul className="text-sm opacity-60 line-through list-disc list-inside">
                                        {field.currentValue.split(',').map((inv, idx) => (
                                          <li key={idx}>{inv.trim()}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm line-through opacity-60">{field.currentValue}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs text-muted-foreground mb-1">Proposed value:</p>
                                    {field.fieldName === 'co_investors' && field.extractedValue.includes(',') ? (
                                      <ul className="text-sm font-medium text-primary list-disc list-inside">
                                        {field.extractedValue.split(',').map((inv, idx) => (
                                          <li key={idx}>{inv.trim()}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm font-medium text-primary">{field.extractedValue}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">New value:</p>
                                {field.fieldName === 'co_investors' && field.extractedValue.includes(',') ? (
                                  <ul className="text-sm list-disc list-inside">
                                    {field.extractedValue.split(',').map((inv, idx) => (
                                      <li key={idx}>{inv.trim()}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap">{field.extractedValue}</p>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedFields.size > 0 && (
              <>
                Selected: {selectedFields.size} of {extractedFields.length} field(s)
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              disabled={selectedFields.size === 0}
            >
              Apply {selectedFields.size} Field(s)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}