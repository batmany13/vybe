"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TractionStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export function TractionStep({ formData, updateFormData }: TractionStepProps) {
  const handleInputChange = (field: string, value: string | number | boolean) => {
    updateFormData({ [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Revenue Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="has_revenue"
              checked={formData.has_revenue || false}
              onCheckedChange={(checked) => handleInputChange('has_revenue', checked)}
            />
            <Label htmlFor="has_revenue">Company has revenue</Label>
          </div>

          {formData.has_revenue && (
            <div className="space-y-2">
              <Label htmlFor="revenue_amount">Monthly/Annual Revenue (USD)</Label>
              <Input
                id="revenue_amount"
                type="number"
                placeholder="Enter revenue amount"
                value={formData.revenue_amount || ''}
                onChange={(e) => handleInputChange('revenue_amount', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Traction Progress */}
      <div className="space-y-2">
        <Label htmlFor="traction_progress">Traction Progress</Label>
        <Textarea
          id="traction_progress"
          placeholder="Describe key traction milestones, growth metrics, partnerships, customer wins, etc."
          value={formData.traction_progress || ''}
          onChange={(e) => handleInputChange('traction_progress', e.target.value)}
          rows={4}
        />
      </div>

      {/* User Traction */}
      <div className="space-y-2">
        <Label htmlFor="user_traction">User Traction & Metrics</Label>
        <Textarea
          id="user_traction"
          placeholder="User growth, retention rates, engagement metrics, user testimonials, etc."
          value={formData.user_traction || ''}
          onChange={(e) => handleInputChange('user_traction', e.target.value)}
          rows={4}
        />
      </div>

      {/* Business Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product & Development</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Include information about:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Product milestones</li>
              <li>Technical achievements</li>
              <li>Development progress</li>
              <li>Feature launches</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Market & Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Include information about:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Customer acquisition</li>
              <li>Market validation</li>
              <li>Customer feedback</li>
              <li>Market share</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Partnerships & Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Include information about:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Strategic partnerships</li>
              <li>Integration partners</li>
              <li>Channel partnerships</li>
              <li>Ecosystem participation</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recognition & Awards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Include information about:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Awards and recognition</li>
              <li>Media coverage</li>
              <li>Industry rankings</li>
              <li>Speaking opportunities</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}