"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Sparkles, 
  CheckCircle, 
  XCircle,
  Edit3,
  Users,
  AlertTriangle,
  X
} from "lucide-react";
import { generateText } from '@/client-lib/integrations-client';
import { createLimitedPartner } from '@/client-lib/api-client';
import { LimitedPartner } from '@/shared/models';
import { toast } from 'sonner';

interface BulkLPImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedLP {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  formerNotableTitle?: string;
  phone?: string;
  linkedin?: string;
  investmentAmount: string;
  commitmentDate: string;
  expertiseAreas: string[];
  notes?: string;
  originalText: string;
  status: 'parsed' | 'error' | 'edited';
  errorMessage?: string;
}

const COMMON_EXPERTISE_AREAS = [
  'AI/ML',
  'Enterprise Software',
  'FinTech',
  'HealthTech',
  'DevOps',
  'Cloud Infrastructure',
  'Security',
  'Data Engineering',
  'Mobile Development',
  'Consumer Apps',
  'Gaming',
  'Analytics',
  'Machine Learning',
  'CleanTech',
  'IoT',
  'Blockchain',
  'EdTech',
  'E-commerce',
  'API/Platform',
  'Robotics'
];

export function BulkLPImportDialog({ open, onOpenChange }: BulkLPImportDialogProps) {
  const [step, setStep] = useState<'input' | 'parsing' | 'review' | 'importing'>('input');
  const [textInput, setTextInput] = useState('');
  const [parsedLPs, setParsedLPs] = useState<ParsedLP[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const exampleText = `Format 1 (Pipe-separated):
Luca Bonmassar | CTO @ Checkr
Manish Gupta | EVP Engineering @ Coinbase
Surabhi Gupta | CTO @ Klavyio | ex SVP Engineering @ Robinhood

Format 2 (Comma-separated):
Sarah Chen, sarah.chen@techcorp.com, TechCorp Inc, CTO, Former VP Engineering at Google, $500,000
Marcus Rodriguez, marcus@innovatetech.com, InnovateTech, CTO & Co-founder, $300,000`;

  const handleParseText = async () => {
    if (!textInput.trim()) {
      toast.error('Please enter some LP data to parse');
      return;
    }

    setStep('parsing');
    setIsProcessing(true);

    try {
      const lines = textInput.trim().split('\n').filter(line => line.trim());
      const parsed: ParsedLP[] = [];

      for (const line of lines) {
        try {
          const aiPrompt = `
Parse this line of Limited Partner information and extract the following fields in JSON format.

Handle various formats including:
- "Name | Title @ Company" 
- "Name | Title @ Company | ex Previous Title @ Previous Company"
- "Name, email, Company, Title, Previous role, $amount"

Extract these fields:
- firstName: First name
- lastName: Last name  
- email: Email address if provided, otherwise generate a professional email like firstname.lastname@company.com (lowercase, no spaces)
- company: Company name
- title: Current job title
- formerNotableTitle: Any previous notable position mentioned (like "ex SVP Engineering @ Robinhood")
- phone: Phone number if mentioned (optional, can be empty string)
- linkedin: LinkedIn URL if mentioned (optional, can be empty string)
- investmentAmount: Investment amount as number (extract from $ amount, default to 250000 if not specified)
- expertiseAreas: Array of 2-4 expertise areas based on title/company/background (choose from: ${COMMON_EXPERTISE_AREAS.join(', ')})

For CTOs, typically assign: ["Enterprise Software", "Cloud Infrastructure", "DevOps"] or similar relevant areas.

Line to parse: "${line}"

Examples:
- "John Smith | CTO @ TechCorp" → email: "john.smith@techcorp.com"
- "Jane Doe | CTO @ Startup | ex VP Engineering @ BigTech" → formerNotableTitle: "VP Engineering @ BigTech"

Return ONLY valid JSON without any markdown formatting or additional text.
`;

          const aiResponse = await generateText(aiPrompt);
          const cleanResponse = aiResponse.replace(/```json|```/g, '').trim();
          const parsedData = JSON.parse(cleanResponse);

          const lpData: ParsedLP = {
            firstName: parsedData.firstName || '',
            lastName: parsedData.lastName || '',
            email: parsedData.email || '',
            company: parsedData.company || '',
            title: parsedData.title || '',
            formerNotableTitle: parsedData.formerNotableTitle || '',
            phone: parsedData.phone || '',
            linkedin: parsedData.linkedin || '',
            investmentAmount: parsedData.investmentAmount?.toString() || '250000',
            commitmentDate: new Date().toISOString().split('T')[0],
            expertiseAreas: parsedData.expertiseAreas || [],
            notes: parsedData.formerNotableTitle ? `Former: ${parsedData.formerNotableTitle}` : '',
            originalText: line,
            status: 'parsed'
          };

          // Validation
          if (!lpData.firstName || !lpData.lastName || !lpData.company) {
            lpData.status = 'error';
            lpData.errorMessage = 'Missing required fields (name or company)';
          } else if (!lpData.email) {
            // Generate email if missing
            const emailName = `${lpData.firstName}.${lpData.lastName}`.toLowerCase().replace(/\s+/g, '');
            const emailDomain = lpData.company.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '');
            lpData.email = `${emailName}@${emailDomain}.com`;
          }

          parsed.push(lpData);
        } catch (error) {
          parsed.push({
            firstName: '',
            lastName: '',
            email: '',
            company: '',
            title: '',
            investmentAmount: '250000',
            commitmentDate: new Date().toISOString().split('T')[0],
            expertiseAreas: [],
            originalText: line,
            status: 'error',
            errorMessage: 'Failed to parse this line'
          });
        }
      }

      setParsedLPs(parsed);
      setStep('review');
    } catch (error) {
      toast.error('Failed to parse LP data. Please check the format and try again.');
      setStep('input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditLP = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (index: number, updatedLP: ParsedLP) => {
    const updated = [...parsedLPs];
    updated[index] = { ...updatedLP, status: 'edited' };
    setParsedLPs(updated);
    setEditingIndex(null);
  };

  const handleRemoveLP = (index: number) => {
    const updated = parsedLPs.filter((_, i) => i !== index);
    setParsedLPs(updated);
  };

  const handleFinalImport = async () => {
    const validLPs = parsedLPs.filter(lp => lp.status !== 'error' && lp.firstName && lp.lastName && lp.company);
    
    if (validLPs.length === 0) {
      toast.error('No valid LPs to import');
      return;
    }

    setStep('importing');
    setIsProcessing(true);

    let successCount = 0;
    let errorCount = 0;

    for (const lp of validLPs) {
      try {
        await createLimitedPartner({
          name: `${lp.firstName} ${lp.lastName}`,
          email: lp.email,
          company: lp.company,
          title: lp.title,
          phone: lp.phone || undefined,
          linkedin_url: lp.linkedin || undefined,
          investment_amount: parseFloat(lp.investmentAmount),
          commitment_date: lp.commitmentDate,
          status: 'active',
          expertise_areas: lp.expertiseAreas,
          notes: lp.notes || undefined
        });
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    setIsProcessing(false);
    
    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} Limited Partner${successCount > 1 ? 's' : ''}`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} Limited Partner${errorCount > 1 ? 's' : ''}`);
    }

    onOpenChange(false);
    
    // Reset state
    setStep('input');
    setTextInput('');
    setParsedLPs([]);
    setEditingIndex(null);
  };

  const validLPsCount = parsedLPs.filter(lp => lp.status !== 'error').length;
  const errorLPsCount = parsedLPs.filter(lp => lp.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Import Limited Partners
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="lpData">Limited Partner Data</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Enter LP information, one per line. The AI will automatically extract names, emails, companies, titles, and investment amounts.
                </p>
                <Textarea
                  id="lpData"
                  placeholder="Supported formats:

Format 1: Name | Title @ Company
John Smith | CTO @ TechCorp
Jane Doe | VP Engineering @ StartupInc | ex Principal Engineer @ Netflix

Format 2: Name, email, Company, Title, Previous role, $amount
John Smith, john@techcorp.com, TechCorp, CTO, Former VP at Google, $500,000"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={10}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Example Format:</h4>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {exampleText}
                </pre>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleParseText} disabled={!textInput.trim()}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Parse with AI
                </Button>
              </div>
            </div>
          )}

          {step === 'parsing' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium">Parsing LP Data with AI</h3>
              <p className="text-muted-foreground">
                Extracting names, companies, titles, and other details...
              </p>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Review Parsed Data</h3>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {validLPsCount} Valid
                  </Badge>
                  {errorLPsCount > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {errorLPsCount} Errors
                    </Badge>
                  )}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company & Title</TableHead>
                      <TableHead>Investment</TableHead>
                      <TableHead>Expertise</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedLPs.map((lp, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {lp.status === 'parsed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {lp.status === 'edited' && <Edit3 className="h-4 w-4 text-blue-600" />}
                          {lp.status === 'error' && (
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-xs text-red-600" title={lp.errorMessage}>
                                Error
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lp.firstName} {lp.lastName}</div>
                            {lp.formerNotableTitle && (
                              <div className="text-xs text-muted-foreground">
                                Former: {lp.formerNotableTitle}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{lp.email}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lp.company}</div>
                            <div className="text-sm text-muted-foreground">{lp.title}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          ${parseInt(lp.investmentAmount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {lp.expertiseAreas.slice(0, 2).map((area) => (
                              <Badge key={area} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                            {lp.expertiseAreas.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{lp.expertiseAreas.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditLP(index)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveLP(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('input')}>
                  Back to Edit
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleFinalImport} 
                    disabled={validLPsCount === 0}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Import {validLPsCount} LP{validLPsCount !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium">Importing Limited Partners</h3>
              <p className="text-muted-foreground">
                Adding {validLPsCount} Limited Partner{validLPsCount !== 1 ? 's' : ''} to the database...
              </p>
            </div>
          )}

          {/* Edit Modal */}
          {editingIndex !== null && (
            <EditParsedLPDialog
              lp={parsedLPs[editingIndex]}
              onSave={(updatedLP) => handleSaveEdit(editingIndex, updatedLP)}
              onCancel={() => setEditingIndex(null)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Sub-component for editing parsed LP data
interface EditParsedLPDialogProps {
  lp: ParsedLP;
  onSave: (lp: ParsedLP) => void;
  onCancel: () => void;
}

function EditParsedLPDialog({ lp, onSave, onCancel }: EditParsedLPDialogProps) {
  const [editedLP, setEditedLP] = useState<ParsedLP>({ ...lp });

  const handleSave = () => {
    onSave(editedLP);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium mb-4">Edit LP Information</h3>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">First Name</Label>
              <Input
                value={editedLP.firstName}
                onChange={(e) => setEditedLP({ ...editedLP, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Last Name</Label>
              <Input
                value={editedLP.lastName}
                onChange={(e) => setEditedLP({ ...editedLP, lastName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={editedLP.email}
              onChange={(e) => setEditedLP({ ...editedLP, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Company</Label>
              <Input
                value={editedLP.company}
                onChange={(e) => setEditedLP({ ...editedLP, company: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={editedLP.title}
                onChange={(e) => setEditedLP({ ...editedLP, title: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Investment Amount ($)</Label>
            <Input
              type="number"
              value={editedLP.investmentAmount}
              onChange={(e) => setEditedLP({ ...editedLP, investmentAmount: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}