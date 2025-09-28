"use client"

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight, Edit, Rocket, Send, Trash2 } from "lucide-react";
import { MonthlyUpdate } from "@/shared/models";

export function UpdatesSection({
  updates,
  onEditUpdate,
  onLaunchUpdate,
  onDeleteUpdate,
  onDeleteAllDrafts,
}: {
  updates: MonthlyUpdate[];
  onEditUpdate: (u: MonthlyUpdate) => void;
  onLaunchUpdate: (u: MonthlyUpdate) => void;
  onDeleteUpdate: (u: MonthlyUpdate) => void;
  onDeleteAllDrafts: () => void;
}) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthUpdate = updates.find(u => u.month === currentMonth + 1 && u.year === currentYear);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monthly Updates Management</CardTitle>
              <CardDescription>Create, edit metrics, and send investor updates via Lemlist</CardDescription>
            </div>
            <div className="flex gap-2">

              <Link href="/admin/monthly-updates/create">
                <Button variant="outline">Create</Button>
              </Link>
              <Link href="/monthly-updates">
                <Button variant="outline">
                  View Public Page
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentMonthUpdate && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Current Month: {monthNames[currentMonth]} {currentYear}</CardTitle>
                      <CardDescription>{currentMonthUpdate.title}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {!currentMonthUpdate.lemlist_campaign_id ? (
                        <>
                          <Button size="sm" onClick={() => onEditUpdate(currentMonthUpdate)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit & Add Stats
                          </Button>
                          <Button size="sm" variant="default" onClick={() => onLaunchUpdate(currentMonthUpdate)}>
                            <Send className="h-3 w-3 mr-1" />
                            Send via Lemlist
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => onDeleteUpdate(currentMonthUpdate)}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline" className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                            <Send className="h-3 w-3 mr-1" />
                            Campaign Sent
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => onEditUpdate(currentMonthUpdate)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => onDeleteUpdate(currentMonthUpdate)}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {currentMonthUpdate.metrics && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Deals Evaluated</p>
                        <p className="font-semibold">{currentMonthUpdate.metrics.deals_evaluated || 0}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground">New Investments</p>
                        <p className="font-semibold">{currentMonthUpdate.metrics.new_investments || 0}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground">Portfolio Companies</p>
                        <p className="font-semibold">{currentMonthUpdate.metrics.portfolio_companies || 0}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground">Total Invested</p>
                        <p className="font-semibold">${((currentMonthUpdate.metrics.total_investment_amount || 0) / 1000000).toFixed(1)}M</p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {updates.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  {updates.length} total updates • {updates.filter(u => !u.lemlist_campaign_id).length} drafts • {updates.filter(u => u.lemlist_campaign_id).length} sent
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onDeleteAllDrafts}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete All Drafts
                  </Button>
                </div>
              </div>
            )}

            {/* Update Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Updates</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{updates.length}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">This Year</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{updates.filter(u => u.year === currentYear).length}</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">With Metrics</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{updates.filter(u => u.metrics).length}</p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Sent via Lemlist</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{updates.filter(u => u.lemlist_campaign_id).length}</p>
              </div>
            </div>

            {/* Updates Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">Update</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Period</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Metrics</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                    <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {updates.length > 0 ? (
                    updates.map((update) => (
                      <tr key={update.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm line-clamp-1">{update.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{update.content.substring(0, 60)}...</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{monthNames[update.month - 1]} {update.year}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs space-y-1">
                            {update.metrics ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Deals:</span>
                                  <span className="font-medium">{update.metrics.deals_evaluated || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">New:</span>
                                  <span className="font-medium">{update.metrics.new_investments || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Portfolio:</span>
                                  <span className="font-medium">{update.metrics.portfolio_companies || 0}</span>
                                </div>
                                {update.metrics.total_investment_amount && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Total:</span>
                                    <span className="font-medium">${(update.metrics.total_investment_amount / 1000000).toFixed(1)}M</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-primary"
                                onClick={() => onEditUpdate(update)}
                              >
                                + Add Metrics
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {update.lemlist_campaign_id ? (
                            <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                              <Send className="h-3 w-3 mr-1" />
                              Sent
                            </Badge>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <Badge variant="secondary" className="text-xs">Draft</Badge>
                              {update.metrics && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0 text-xs text-primary"
                                  onClick={() => onLaunchUpdate(update)}
                                >
                                  Send →
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => onEditUpdate(update)} title="Edit update and metrics">
                              <Edit className="h-3 w-3" />
                            </Button>
                            {!update.lemlist_campaign_id && (
                              <Button variant="ghost" size="sm" onClick={() => onLaunchUpdate(update)} title="Send via Lemlist">
                                <Send className="h-3 w-3" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => onDeleteUpdate(update)} title="Delete update" className={update.lemlist_campaign_id ? "text-destructive hover:text-destructive" : ""}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No monthly updates found. Click "Create" to create your first update.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Workflow Instructions */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">Monthly Update Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  <li className="flex gap-2"><span className="font-semibold text-primary">1.</span><span>Create a new monthly update with title and content</span></li>
                  <li className="flex gap-2"><span className="font-semibold text-primary">2.</span><span>Edit the update to add metrics (deals evaluated, investments, etc.)</span></li>
                  <li className="flex gap-2"><span className="font-semibold text-primary">3.</span><span>Review the update and ensure all information is accurate</span></li>
                  <li className="flex gap-2"><span className="font-semibold text-primary">4.</span><span>Click "Send via Lemlist" to launch the email campaign to all LPs</span></li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
