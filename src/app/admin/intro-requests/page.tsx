"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Mail, Calendar, ChevronRight, Loader2, Send, Check, X, Plus, Eye, MessageSquare, TrendingUp, ShoppingCart, Lightbulb } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";
import { authClient } from "@/client-lib/auth-client";
import { useRouter } from "next/navigation";
import { useLimitedPartners, useDealsWithVotesAndFounders } from "@/client-lib/api-client";

interface IntroductionRequest {
  vote_id: string;
  deal_id: string;
  lp_id: string;
  lp_name: string;
  lp_email: string;
  lp_company: string;
  lp_title: string;
  lp_avatar_url?: string;
  company_name: string;
  company_description: string;
  founders: Array<{
    id: string;
    name: string;
    email?: string;
    linkedin_url?: string;
    bio?: string;
  }>;
  pilot_customer_interest: boolean;
  pilot_customer_response?: string;
  pilot_customer_feedback?: string;
  would_buy: boolean;
  buying_interest_response?: string;
  buying_interest_feedback?: string;
  price_feedback?: string;
  additional_notes?: string;
  pain_point_level?: string;
  solution_feedback?: string;
  conviction_level: number;
  comments?: string;
  created_at: string;
  intro_status?: "pending" | "sent" | "declined";
  intro_sent_at?: string;
}

export default function IntroRequestsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [introRequests, setIntroRequests] = useState<IntroductionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<IntroductionRequest | null>(null);
  const [introMessage, setIntroMessage] = useState("");
  const [sendingIntro, setSendingIntro] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "sent" | "declined">("pending");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedLPId, setSelectedLPId] = useState<string>("");
  const [selectedDealId, setSelectedDealId] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedDetailsRequest, setSelectedDetailsRequest] = useState<IntroductionRequest | null>(null);
  
  // Fetch LPs and Deals for manual creation
  const { data: lps = [] } = useLimitedPartners();
  const { data: deals = [] } = useDealsWithVotesAndFounders();

  useEffect(() => {
    fetchIntroRequests();
  }, []);

  const fetchIntroRequests = async () => {
    try {
      const response = await fetch("/api/intro-requests");
      if (!response.ok) throw new Error("Failed to fetch introduction requests");
      const data = await response.json();
      setIntroRequests(data);
    } catch (error) {
      console.error("Error fetching intro requests:", error);
      toast.error("Failed to load introduction requests");
    } finally {
      setLoading(false);
    }
  };

  const handleSendIntro = async () => {
    if (!selectedRequest || !introMessage.trim()) return;

    setSendingIntro(true);
    try {
      const response = await fetch(`/api/intro-requests/${selectedRequest.vote_id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: introMessage,
          lp_email: selectedRequest.lp_email,
          founder_emails: selectedRequest.founders.map(f => f.email).filter(Boolean),
        }),
      });

      if (!response.ok) throw new Error("Failed to send introduction");

      toast.success("Introduction sent successfully!");
      setSelectedRequest(null);
      setIntroMessage("");
      fetchIntroRequests();
    } catch (error) {
      console.error("Error sending introduction:", error);
      toast.error("Failed to send introduction");
    } finally {
      setSendingIntro(false);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/intro-requests/${requestId}/decline`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to decline request");

      toast.success("Request declined");
      fetchIntroRequests();
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error("Failed to decline request");
    }
  };

  const filteredRequests = introRequests.filter(req => {
    if (filter === "all") return true;
    return (req.intro_status || "pending") === filter;
  });

  const getInterestLevel = (response?: string) => {
    const levels: Record<string, { label: string; color: string }> = {
      "hell_yes": { label: "Hell Yes!", color: "green" },
      "very_interested": { label: "Very Interested", color: "blue" },
      "interested_with_conditions": { label: "Interested", color: "cyan" },
      "absolutely": { label: "Absolutely", color: "green" },
      "very_likely": { label: "Very Likely", color: "blue" },
      "probably": { label: "Probably", color: "cyan" },
    };
    return levels[response || ""] || null;
  };

  const getPainLevelLabel = (level?: string) => {
    const levels: Record<string, { label: string; color: string }> = {
      "critical": { label: "Critical", color: "red" },
      "major_pain": { label: "Major Pain", color: "orange" },
      "real_problem": { label: "Real Problem", color: "yellow" },
      "annoying": { label: "Annoying", color: "blue" },
      "sometimes": { label: "Sometimes", color: "cyan" },
      "rarely": { label: "Rarely", color: "gray" },
      "not_at_all": { label: "Not at all", color: "slate" },
    };
    return levels[level || ""] || null;
  };

  const getConvictionLabel = (level: number) => {
    const labels = {
      1: { label: "No", color: "red" },
      2: { label: "Following Pack", color: "yellow" },
      3: { label: "Strong Yes", color: "green" },
      4: { label: "Strong Yes + Investment", color: "purple" },
    };
    return labels[level as keyof typeof labels] || { label: "Unknown", color: "gray" };
  };

  const prepareIntroMessage = (request: IntroductionRequest) => {
    const founderNames = request.founders.map(f => f.name).join(" and ");
    const lpFirstName = request.lp_name.split(" ")[0];
    const founderFirstNames = request.founders.map(f => f.name.split(" ")[0]).join("/");
    
    return `Hi ${lpFirstName} and ${founderFirstNames},

I wanted to make this introduction based on ${lpFirstName}'s interest in ${request.company_name} from our recent LP survey.

${lpFirstName} - ${founderNames} ${request.founders.length > 1 ? "are" : "is"} building ${request.company_name}. ${request.company_description}

${founderFirstNames} - ${lpFirstName} is ${request.lp_title} at ${request.lp_company}. ${lpFirstName} expressed strong interest in potentially ${request.pilot_customer_interest ? "being a pilot customer" : "exploring your solution"}.

${request.pilot_customer_feedback ? `\n${lpFirstName}'s feedback: "${request.pilot_customer_feedback}"\n` : ""}

I'll let you both take it from here!

Best,
${session?.user?.name || "The Gandhi Capital Team"}`;
  };

  const handleCreateManualIntro = async () => {
    if (!selectedLPId || !selectedDealId || !customMessage.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSendingIntro(true);
    try {
      const response = await fetch("/api/intro-requests/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lp_id: selectedLPId,
          deal_id: selectedDealId,
          message: customMessage,
        }),
      });

      if (!response.ok) throw new Error("Failed to create introduction request");

      toast.success("Introduction request created successfully!");
      setShowCreateDialog(false);
      setSelectedLPId("");
      setSelectedDealId("");
      setCustomMessage("");
      fetchIntroRequests();
    } catch (error) {
      console.error("Error creating introduction:", error);
      toast.error("Failed to create introduction request");
    } finally {
      setSendingIntro(false);
    }
  };

  const prepareManualIntroMessage = () => {
    const lp = lps.find(l => l.id === selectedLPId);
    const deal = deals.find(d => d.id === selectedDealId);
    
    if (!lp || !deal) return "";
    
    const founderNames = deal.founders?.map(f => f.name).join(" and ") || "the founder";
    const lpFirstName = lp.name.split(" ")[0];
    const founderFirstNames = deal.founders?.map(f => f.name.split(" ")[0]).join("/") || "Founder";
    
    return `Hi ${lpFirstName} and ${founderFirstNames},

I wanted to make this introduction as I think there could be great synergy between you both.

${lpFirstName} - ${founderNames} ${deal.founders?.length > 1 ? "are" : "is"} building ${deal.company_name}. ${deal.description}

${founderFirstNames} - ${lpFirstName} is ${lp.title} at ${lp.company} and brings expertise in ${lp.expertise_areas?.join(", ") || "various areas"}.

I'll let you both take it from here!

Best,
${session?.user?.name || "The Gandhi Capital Team"}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">LP-Startup Introduction Requests</h1>
              <p className="text-muted-foreground">
                Manage introduction requests from LPs interested in meeting portfolio companies
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Introduction
            </Button>
          </div>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({introRequests.filter(r => (r.intro_status || "pending") === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent ({introRequests.filter(r => r.intro_status === "sent").length})
            </TabsTrigger>
            <TabsTrigger value="declined">
              Declined ({introRequests.filter(r => r.intro_status === "declined").length})
            </TabsTrigger>
            <TabsTrigger value="all">All ({introRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No introduction requests found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredRequests.map((request) => {
                  const pilotLevel = getInterestLevel(request.pilot_customer_response);
                  const buyingLevel = getInterestLevel(request.buying_interest_response);
                  
                  return (
                    <Card key={request.vote_id} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={request.lp_avatar_url} />
                              <AvatarFallback>
                                {request.lp_name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">
                                {request.lp_name} → {request.company_name}
                              </CardTitle>
                              <CardDescription>
                                {request.lp_title} at {request.lp_company}
                              </CardDescription>
                            </div>
                          </div>
                          {request.intro_status === "sent" && (
                            <Badge variant="outline" className="bg-green-50">
                              <Check className="h-3 w-3 mr-1" />
                              Introduced
                            </Badge>
                          )}
                          {request.intro_status === "declined" && (
                            <Badge variant="outline" className="bg-red-50">
                              <X className="h-3 w-3 mr-1" />
                              Declined
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Interest Level</h4>
                            <div className="flex gap-2">
                              {request.pilot_customer_interest && pilotLevel && (
                                <Badge variant={pilotLevel.color as any}>
                                  Pilot: {pilotLevel.label}
                                </Badge>
                              )}
                              {request.would_buy && buyingLevel && (
                                <Badge variant={buyingLevel.color as any}>
                                  Buy: {buyingLevel.label}
                                </Badge>
                              )}
                              <Badge variant="outline">
                                Conviction: {request.conviction_level}/4
                              </Badge>
                            </div>
                          </div>

                          {(request.pilot_customer_feedback || request.buying_interest_feedback) && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">LP Feedback</h4>
                              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                                {request.pilot_customer_feedback && (
                                  <p className="mb-2">
                                    <strong>Pilot Interest:</strong> {request.pilot_customer_feedback}
                                  </p>
                                )}
                                {request.buying_interest_feedback && (
                                  <p>
                                    <strong>Buying Interest:</strong> {request.buying_interest_feedback}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          <div>
                            <h4 className="text-sm font-medium mb-2">Founders</h4>
                            <div className="flex flex-wrap gap-2">
                              {request.founders.map((founder) => (
                                <div key={founder.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                                  <span className="text-sm font-medium">{founder.name}</span>
                                  {founder.email && (
                                    <span className="text-xs text-muted-foreground">{founder.email}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDetailsRequest(request);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Survey Details
                            </Button>
                            {request.intro_status === "pending" && (
                              <>
                                <Button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setIntroMessage(prepareIntroMessage(request));
                                  }}
                                  className="flex-1"
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Prepare Introduction
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleDeclineRequest(request.vote_id)}
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                          </div>
                          
                          {request.intro_sent_at && (
                            <p className="text-xs text-muted-foreground">
                              Introduced on {new Date(request.intro_sent_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Prepare Introduction Email</DialogTitle>
              <DialogDescription>
                Review and customize the introduction email before sending
              </DialogDescription>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-4">
                <div>
                  <Label>Recipients</Label>
                  <div className="mt-1 p-2 bg-muted rounded-lg text-sm">
                    <strong>To:</strong> {selectedRequest.lp_email}
                    {selectedRequest.founders.map(f => f.email).filter(Boolean).map(email => (
                      <span key={email}>, {email}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intro-message">Message</Label>
                  <Textarea
                    id="intro-message"
                    value={introMessage}
                    onChange={(e) => setIntroMessage(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Compose your introduction message..."
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Cancel
              </Button>
              <Button onClick={handleSendIntro} disabled={sendingIntro || !introMessage.trim()}>
                {sendingIntro ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Introduction
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Manual Introduction Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Manual Introduction</DialogTitle>
              <DialogDescription>
                Manually create an introduction between an LP and a startup
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lp-select">Select Limited Partner</Label>
                <Select value={selectedLPId} onValueChange={setSelectedLPId}>
                  <SelectTrigger id="lp-select">
                    <SelectValue placeholder="Choose an LP..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lps.filter(lp => lp.status === 'active').map((lp) => (
                      <SelectItem key={lp.id} value={lp.id}>
                        {lp.name} - {lp.title} at {lp.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deal-select">Select Deal/Startup</Label>
                <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                  <SelectTrigger id="deal-select">
                    <SelectValue placeholder="Choose a deal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deals.filter(d => d.status === 'active' && d.stage !== 'closed_lost_passed' && d.stage !== 'closed_lost_rejected').map((deal) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.company_name} - {deal.stage.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedLPId && selectedDealId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="intro-message-manual">Introduction Message</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCustomMessage(prepareManualIntroMessage())}
                    >
                      Generate Template
                    </Button>
                  </div>
                  <Textarea
                    id="intro-message-manual"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="min-h-[250px] font-mono text-sm"
                    placeholder="Compose your introduction message..."
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                setSelectedLPId("");
                setSelectedDealId("");
                setCustomMessage("");
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateManualIntro} 
                disabled={sendingIntro || !selectedLPId || !selectedDealId || !customMessage.trim()}
              >
                {sendingIntro ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Introduction
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Survey Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Survey Response Details</DialogTitle>
              <DialogDescription>
                Complete survey response from {selectedDetailsRequest?.lp_name} for {selectedDetailsRequest?.company_name}
              </DialogDescription>
            </DialogHeader>
            
            {selectedDetailsRequest && (
              <div className="space-y-6">
                {/* LP & Company Info */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Limited Partner</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="text-sm font-semibold">{selectedDetailsRequest.lp_name}</p>
                      <p className="text-xs text-muted-foreground">{selectedDetailsRequest.lp_title}</p>
                      <p className="text-xs text-muted-foreground">{selectedDetailsRequest.lp_company}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Startup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="text-sm font-semibold">{selectedDetailsRequest.company_name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {selectedDetailsRequest.company_description}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Conviction & Overall Assessment */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Overall Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Conviction Level:</span>
                      <Badge variant={getConvictionLabel(selectedDetailsRequest.conviction_level).color as any}>
                        {getConvictionLabel(selectedDetailsRequest.conviction_level).label}
                      </Badge>
                    </div>
                    {selectedDetailsRequest.comments && (
                      <div>
                        <p className="text-sm font-medium mb-1">General Comments:</p>
                        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                          {selectedDetailsRequest.comments}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pain Point Assessment */}
                {selectedDetailsRequest.pain_point_level && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Pain Point Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Pain Level:</span>
                        {getPainLevelLabel(selectedDetailsRequest.pain_point_level) && (
                          <Badge variant={getPainLevelLabel(selectedDetailsRequest.pain_point_level)?.color as any}>
                            {getPainLevelLabel(selectedDetailsRequest.pain_point_level)?.label}
                          </Badge>
                        )}
                      </div>
                      {selectedDetailsRequest.solution_feedback && (
                        <div>
                          <p className="text-sm font-medium mb-1">Solution Feedback:</p>
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                            {selectedDetailsRequest.solution_feedback}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Customer Interest */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Customer Interest
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedDetailsRequest.pilot_customer_interest && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Pilot Interest:</span>
                          {getInterestLevel(selectedDetailsRequest.pilot_customer_response) && (
                            <Badge variant={getInterestLevel(selectedDetailsRequest.pilot_customer_response)?.color as any}>
                              {getInterestLevel(selectedDetailsRequest.pilot_customer_response)?.label}
                            </Badge>
                          )}
                        </div>
                        {selectedDetailsRequest.pilot_customer_feedback && (
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                            {selectedDetailsRequest.pilot_customer_feedback}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {selectedDetailsRequest.would_buy && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Buying Interest:</span>
                          {getInterestLevel(selectedDetailsRequest.buying_interest_response) && (
                            <Badge variant={getInterestLevel(selectedDetailsRequest.buying_interest_response)?.color as any}>
                              {getInterestLevel(selectedDetailsRequest.buying_interest_response)?.label}
                            </Badge>
                          )}
                        </div>
                        {selectedDetailsRequest.buying_interest_feedback && (
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                            {selectedDetailsRequest.buying_interest_feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pricing Feedback */}
                {selectedDetailsRequest.price_feedback && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Pricing Feedback
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                        {selectedDetailsRequest.price_feedback}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Notes */}
                {selectedDetailsRequest.additional_notes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Additional Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                        {selectedDetailsRequest.additional_notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Response Date */}
                <div className="text-xs text-muted-foreground text-center">
                  Survey submitted on {new Date(selectedDetailsRequest.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}