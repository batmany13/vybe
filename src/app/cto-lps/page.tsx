"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLimitedPartners } from '@/client-lib/api-client'
import { LimitedPartner } from '@/shared/models'
import { 
  Mail, 
  Linkedin, 
  Building2, 
  Search, 
  User, 
  Phone, 
  Sparkles, 
  ExternalLink,
  MapPin,
  Briefcase,
  Globe,
  Star,
  Users,
  ChevronRight,
  Filter,
  Grid3x3,
  List
} from 'lucide-react'
import { cn } from '@/client-lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function CTOLPsPage() {
  const { data: lps = [], isLoading } = useLimitedPartners()
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null)

  // Get all unique expertise areas for filter chips
  const allExpertiseAreas = Array.from(
    new Set(lps.flatMap(lp => lp.expertise_areas || []))
  ).sort()

  // Apply filters
  const filteredCTOs = lps.filter(lp => {
    const matchesSearch = !searchTerm || 
      lp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lp.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lp.expertise_areas?.some(area => 
        area.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    const matchesExpertise = !selectedExpertise || 
      lp.expertise_areas?.includes(selectedExpertise)
    
    return matchesSearch && matchesExpertise
  })

  // Sort by status (active first) then by name
  const sortedLPs = [...filteredCTOs].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1
    if (a.status !== 'active' && b.status === 'active') return 1
    return a.name.localeCompare(b.name)
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const LPCard = ({ lp }: { lp: LimitedPartner }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-muted overflow-hidden">
      <div className="absolute top-3 right-3 z-10">
        {lp.status === 'active' && (
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" title="Active LP" />
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-background shadow-md">
            <AvatarImage src={lp.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
              {lp.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">{lp.name}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {lp.title || 'Limited Partner'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground truncate">{lp.company}</span>
            </div>
          </div>
        </div>

        {/* Expertise Areas */}
        {lp.expertise_areas && lp.expertise_areas.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {lp.expertise_areas.slice(0, 2).map((area, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs px-2 py-0 h-5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                {area}
              </Badge>
            ))}
            {lp.expertise_areas.length > 2 && (
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-0 h-5"
              >
                +{lp.expertise_areas.length - 2}
              </Badge>
            )}
          </div>
        )}



        {/* Action buttons */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 flex-1 text-xs hover:bg-primary/10 hover:text-primary"
            onClick={() => window.location.href = `mailto:${lp.email}`}
          >
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Button>
          {lp.linkedin_url && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 flex-1 text-xs hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
              onClick={() => window.open(lp.linkedin_url, '_blank')}
            >
              <Linkedin className="h-3 w-3 mr-1" />
              LinkedIn
            </Button>
          )}
          {lp.phone && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0 text-xs"
              onClick={() => window.location.href = `tel:${lp.phone}`}
              title="Call"
            >
              <Phone className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-3 py-8">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">Gandhi Capital Network</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Limited Partners
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect with {lps.length} experienced technology leaders, operators, and investors 
            who are part of the Gandhi Capital ecosystem
          </p>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{lps.filter(lp => lp.status === 'active').length}</p>
              <p className="text-xs text-muted-foreground">Active LPs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{new Set(lps.map(lp => lp.company)).size}</p>
              <p className="text-xs text-muted-foreground">Companies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{allExpertiseAreas.length}</p>
              <p className="text-xs text-muted-foreground">Expertise Areas</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="border-muted">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, company, title, or expertise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-10"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-10"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Expertise Filter Chips */}
            {allExpertiseAreas.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                <Button
                  variant={selectedExpertise === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedExpertise(null)}
                  className="h-7 text-xs"
                >
                  All Expertise
                </Button>
                {allExpertiseAreas.slice(0, 8).map(area => (
                  <Button
                    key={area}
                    variant={selectedExpertise === area ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedExpertise(selectedExpertise === area ? null : area)}
                    className="h-7 text-xs"
                  >
                    {area}
                  </Button>
                ))}
                {allExpertiseAreas.length > 8 && (
                  <Badge variant="outline" className="px-2 py-1">
                    +{allExpertiseAreas.length - 8} more
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Showing {sortedLPs.length} of {lps.length} Limited Partners
            {selectedExpertise && ` • Filtered by: ${selectedExpertise}`}
          </p>
        </div>

        {/* LPs Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedLPs.map((lp) => (
              <LPCard key={lp.id} lp={lp} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLPs.map((lp) => (
              <Card key={lp.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                      <AvatarImage src={lp.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                        {lp.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{lp.name}</h3>
                        {lp.status === 'active' && (
                          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {lp.title || 'Limited Partner'} at {lp.company}
                      </p>
                    </div>
                    
                    {lp.expertise_areas && lp.expertise_areas.length > 0 && (
                      <div className="hidden md:flex flex-wrap gap-1 max-w-sm">
                        {lp.expertise_areas.slice(0, 3).map((area, index) => (
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
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => window.location.href = `mailto:${lp.email}`}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      {lp.linkedin_url && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => window.open(lp.linkedin_url, '_blank')}
                        >
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {sortedLPs.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Limited Partners Found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {searchTerm || selectedExpertise
                  ? 'Try adjusting your filters or search terms'
                  : 'No Limited Partners have been added to the network yet'
                }
              </p>
              {(searchTerm || selectedExpertise) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedExpertise(null)
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}