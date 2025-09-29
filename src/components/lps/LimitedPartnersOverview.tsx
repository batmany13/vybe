"use client";

import { useState } from 'react';
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ExternalLink,
  Mail,
  Phone,
  Building,
  DollarSign,
  Badge as BadgeIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LimitedPartner } from '@/shared/models';
import { CreateLPDialog } from './CreateLPDialog';
import { EditLPDialog } from './EditLPDialog';
import { deleteLimitedPartner } from '@/client-lib/api-client';
import { toast } from 'sonner';

interface LimitedPartnersOverviewProps {
  lps: LimitedPartner[];
}

export function LimitedPartnersOverview({ lps }: LimitedPartnersOverviewProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLP, setEditingLP] = useState<LimitedPartner | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this Limited Partner?')) {
      try {
        await deleteLimitedPartner(id);
        toast.success('Limited Partner deleted successfully');
      } catch (error) {
        toast.error('Failed to delete Limited Partner');
      }
    }
  };

  const sortedLPs = [...lps].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      default:
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (column: 'name' | 'created_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const activeLPs = lps.filter(lp => lp.status === 'active');

  // Get top expertise areas
  const expertiseCount = lps.reduce((acc, lp) => {
    lp.expertise_areas.forEach(area => {
      acc[area] = (acc[area] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topExpertise = Object.entries(expertiseCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Limited Partners</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New LP
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active LPs</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLPs.length}</div>
            <p className="text-xs text-muted-foreground">
              of {lps.length} total
            </p>
          </CardContent>
        </Card>



        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Expertise</CardTitle>
            <BadgeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {topExpertise.slice(0, 2).map(([area, count]) => (
                <div key={area} className="flex justify-between">
                  <span className="truncate">{area}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LPs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Limited Partners</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('name')}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Company & Title</TableHead>
                <TableHead>Contact</TableHead>

                <TableHead>Expertise</TableHead>
                <TableHead>Status</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('created_at')}
                >
                  Joined {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLPs.map((lp) => (
                <TableRow key={lp.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={lp.avatar_url || undefined} alt={`${lp.name} profile picture`} />
                        <AvatarFallback className="text-xs">
                          {lp.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        {lp.name}
                        {lp.linkedin_url && (
                          <a 
                            href={lp.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{lp.company}</div>
                      <div className="text-sm text-muted-foreground">{lp.title}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        <a href={`mailto:${lp.email}`} className="hover:underline">
                          {lp.email}
                        </a>
                      </div>
                      {lp.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <a href={`tel:${lp.phone}`} className="hover:underline">
                            {lp.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {lp.expertise_areas.slice(0, 2).map((area) => (
                        <Badge key={area} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                      {lp.expertise_areas.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{lp.expertise_areas.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lp.status)}>
                      {lp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(lp.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingLP(lp)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(lp.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateLPDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />

      {editingLP && (
        <EditLPDialog 
          lp={editingLP}
          open={!!editingLP} 
          onOpenChange={(open) => !open && setEditingLP(null)} 
        />
      )}
    </div>
  );
}