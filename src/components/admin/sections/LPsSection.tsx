"use client"

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Mail, Phone, Building, User } from "lucide-react";
import { LimitedPartner } from "@/shared/models";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LPsSection({
  lps,
  onCreateLP,
  onEditLP,
}: {
  lps: LimitedPartner[];
  votes?: any[];
  dinners?: any[];
  onCreateLP: () => void;
  onEditLP: (lp: LimitedPartner) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<'all' | LimitedPartner['partner_type']>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter and sort LPs based on search query and partner type
  const filteredLPs = lps
    .filter(lp => {
      const matchesSearch = lp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lp.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lp.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = partnerTypeFilter === 'all' || lp.partner_type === partnerTypeFilter;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // Sort by partner type: GP first, then VP, then LP
      const typeOrder = { 'general_partner': 0, 'venture_partner': 1, 'limited_partner': 2 };
      const aOrder = typeOrder[a.partner_type] ?? 3;
      const bOrder = typeOrder[b.partner_type] ?? 3;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // If same partner type, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fund Partners</h1>
          <p className="text-muted-foreground mt-1">Manage your fund partners</p>
        </div>
        <Button onClick={onCreateLP}>
          <Plus className="h-4 w-4 mr-2" />
          Add Partner
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 max-w-2xl">
        <div className="flex-1">
          <Input
            placeholder="Search partners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            value={partnerTypeFilter}
            onValueChange={(value) => setPartnerTypeFilter(value as typeof partnerTypeFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Partners</SelectItem>
              <SelectItem value="general_partner">General Partners</SelectItem>
              <SelectItem value="venture_partner">Venture Partners</SelectItem>
              <SelectItem value="limited_partner">Limited Partners</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Partners List */}
      <div className="grid gap-4">
        {filteredLPs.length > 0 ? (
          filteredLPs.map((lp) => (
            <Card key={lp.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={lp.avatar_url || undefined} alt={lp.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                        {lp.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{lp.name}</h3>
                        <Badge 
                          variant={
                            lp.partner_type === 'general_partner' ? 'default' :
                            lp.partner_type === 'venture_partner' ? 'secondary' : 'outline'
                          }
                          className={
                            lp.partner_type === 'general_partner' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                            lp.partner_type === 'venture_partner' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }
                        >
                          {lp.partner_type === 'general_partner' ? 'GP' :
                           lp.partner_type === 'venture_partner' ? 'VP' : 'LP'}
                        </Badge>
                        <Badge 
                          variant={lp.status === 'active' ? 'outline' : 'secondary'}
                          className={lp.status === 'active' 
                            ? 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400' 
                            : ''
                          }
                        >
                          {lp.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <span>{lp.company}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{lp.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{lp.email}</span>
                        </div>
                        {lp.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{lp.phone}</span>
                          </div>
                        )}
                      </div>



                      {lp.expertise_areas && lp.expertise_areas.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {lp.expertise_areas.map((area, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-xs"
                            >
                              {area}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEditLP(lp)}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No fund partners found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || partnerTypeFilter !== 'all'
                  ? "Try adjusting your search query or filters"
                  : "Get started by adding your first fund partner"
                }
              </p>
              {!searchQuery && (
                <Button onClick={onCreateLP}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Partner
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}