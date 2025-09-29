import axios from "axios";
import {
  type GoogleCalendarEvent,
  type SlackUser,
  type GmailEmail,
  type JiraProject,
  type JiraIssueType,
  type CreateJiraIssueInput,
  type JiraSearchIssuesInput,
  type JiraSearchIssuesOutput,
  type AttioPerson,
  type SlackChannel,
  type PDLPersonResponse,
  type IntercomContact,
  type IntercomConversation,
  type IntercomConversationMessage,
  type SlackMessageReply,
  type SlackMessageReaction,
  type SlackMessage,
  type HubspotCompany,
  type HubspotContact,
  type HubspotDeal,
  type HubspotUser,
  type LinearIssue,
  type LinearProject,
  type LinearTeam,
  type LinearUser,

  type PostHogQLQueryInput,
  type PostHogProject,
  type NotionContent,
  type NotionContentSingleUrlOrIdBodyInput,
  type NotionUser,
  type NotionDatabaseComplete,
  type NotionDatabaseSingleInput,
  type NotionDatabase,
  type NotionRichPageInput,
  type NotionRichPage,
  type GitLabProjectsQueryParams,
  type GitLabProjectSimpleResponse,
  type GitLabMergeRequestQueryParams,
  type GitLabMergeRequest,
  type SalesforceLead,
  type SalesforceContact,
  type SalesforceAccount,
  type SalesforceOpportunity,
  type SalesforceArticle,
  type SalesforceTicket,
  type ChargebeeFullSubscription,
  type ChargebeeFullCustomer,
  type ChargebeeEntitlement,
  type StripeSubscription,
  type SmartleadCampaign,
  type ShortcutEpic,
  type ShortcutMember,
  type ShortcutGroup,
  type ShortcutObjective,
  type StripeCustomer,
  type StripeProduct,
  type SupabaseProject,
  type SmartleadLeadsCategory,
  type SmartleadClient,
  type SmartleadCampaignStatisticResponse,
  type SmartleadQueryParams,
  type SmartleadLead,
  type SmartleadCampaignTopLevelAnalytics,
  type PostHogQLQuery,
  type SlackSendMessageOutput,
  type GmailEmailSentOutput,
  type CreateJiraIssueOutput,
  type SalesforceCreateAccountInput,
  type SalesforceCreateObjectResponse,
  type SalesforceUpdateAccountInput,
  type SalesforceSuccessResponse,
  type UpdateSalesforceCustomFieldInput,
  type SalesforceCustomField,
  type GetSalesforceObjectInput,
  type SalesforceCustomObject,
  type SalesforceCustomObjectRecord,
  type SalesforceGetCustomObjectRecordsMetadataInput,
  type SalesforceCreateRecordInput,
  type SalesforceCustomObjectNameInput,
  type SalesforceCustomObjectDescribe,
  type AsanaProject,
  type AsanaUser,
  type AsanaTask,
  type AsanaWorkspace,
  type AsanaProjectTasksQueryParams,
  type AsanaProjectTasksResponse,
  type SalesforceWhoAmI,
  type AsanaWorkspaceCustomFieldsQueryParams,
  type AsanaWorkspaceCustomFieldsResponse,
  type AttioCompany,
  type AttioDeal,
  type LemlistCampaign,
  type LemlistCampaignStatsQueryParams,
  type LemlistCampaignStats,
  type LemlistAddLeadToCampaignInput,
  type LemlistAddLeadToCampaignResponse,
  type CrustdataEnrichmentApiQueryParams, 
  type CrustdataPersonProfile 
} from "@/shared/models";
import useSWR from "swr";
import { buildQueryParams } from "@/shared/utils";

const vybeDomain = process.env.NEXT_PUBLIC_VYBE_INTEGRATIONS_DOMAIN ?? "https://vybe.build";
const showLiveData = process.env.NEXT_PUBLIC_SHOW_LIVE_DATA === "true";
const showFakeData = process.env.NODE_ENV === "development" && !showLiveData;

export const integrationsClient = axios.create({
  baseURL: vybeDomain + "/api",
  withCredentials: true,
});

const fetcher = <T>(url: string) =>
  integrationsClient.get<T>(url).then((res) => res.data);

// Default empty responses for development mode
const emptyArray = () => Promise.resolve([]);
const emptyObject = () => Promise.resolve({} as any);
const emptyResponse = { issues: [], names: {}, schema: {}, nextPageToken: null, isLast: true };

/**
 * Send a message to a Slack channel or user
 * @param channel - Channel ID, channel name, or user ID (for direct messages)
 * @param text - The message to send
 */
export async function sendSlackMessage(channel: string, text: string) {
  if (showFakeData) {
    return Promise.resolve({
      ok: true,
      message: "Message sent successfully (development mode)",
    });
  }
  return integrationsClient
    .post<SlackSendMessageOutput>(`/integrations/slack/messages`, { channel, text })
    .then((res) => res.data);
}

export function useGoogleCalendarEvents() {
  if (showFakeData) {
    return useSWR<GoogleCalendarEvent[]>("/integrations/google-calendar/events", emptyArray);
  }
  return useSWR<GoogleCalendarEvent[]>("/integrations/google-calendar/events", fetcher);
}

export function useSlackUsers() {
  if (showFakeData) {
    return useSWR<SlackUser[]>("/integrations/slack/users", emptyArray);
  }
  return useSWR<SlackUser[]>("/integrations/slack/users", fetcher);
}

export function useSlackChannels() {
  if (showFakeData) {
    return useSWR<SlackChannel[]>("/integrations/slack/channels", emptyArray);
  }
  return useSWR<SlackChannel[]>("/integrations/slack/channels", fetcher);
}

export function generateText(prompt: string, enableWebSearch = false, enableDeepResearch = false) {
  if (showFakeData) {
    return Promise.resolve("Generated text will be displayed here (unavailable in development mode)");
  }
  return integrationsClient
    .post<string>("/integrations/ai/generate-text", { prompt, enableWebSearch, enableDeepResearch })
    .then((res) => res.data);
}

export function sendGmailEmail(from: string, to: string, subject: string, body: string) {
  if (showFakeData) {
    return Promise.resolve("Email sent successfully (development mode)");
  }
  return integrationsClient
    .post<GmailEmailSentOutput>("/integrations/gmail/emails", { from, to, subject, body })
    .then((res) => res.data);
}

export function useGmailEmails() {
  if (showFakeData) {
    return useSWR<GmailEmail[]>("/integrations/gmail/emails", emptyArray);
  }
  return useSWR<GmailEmail[]>("/integrations/gmail/emails", fetcher);
}

export function useJiraSearchIssues(input: JiraSearchIssuesInput) {
  const params = buildQueryParams(input as unknown as Record<string, string>).toString();
  const fetchFunction = showFakeData ? () => Promise.resolve(emptyResponse as JiraSearchIssuesOutput) : fetcher;
  return useSWR<JiraSearchIssuesOutput>(`/integrations/jira/search-issues?${params}`, fetchFunction);
}

export function useJiraProjects() {
  if (showFakeData) {
    return useSWR<JiraProject[]>("/integrations/jira/projects", emptyArray);
  }
  return useSWR<JiraProject[]>("/integrations/jira/projects", fetcher);
}

export function useJiraIssueTypes() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<JiraIssueType[]>(`/integrations/jira/issue-types`, fetchFunction);
}

export function createJiraIssue(input: CreateJiraIssueInput) {
  if (showFakeData) {
    return Promise.resolve("Jira issue created successfully (development mode)");
  }
  return integrationsClient
    .post<CreateJiraIssueOutput>("/integrations/jira/issues", input)
    .then((res) => res.data);
}

export function useAttioPeople() {
  if (showFakeData) {
    return useSWR<AttioPerson[]>("/integrations/attio/people", emptyArray);
  }
  return useSWR<AttioPerson[]>("/integrations/attio/people", fetcher);
}

/**
 * Enrich a person's data using People Data Labs API
 * @param email
 * @returns Enriched person data from People Data Labs
 */
export function enrichPerson(email: string) {
  if (showFakeData) {
    return Promise.resolve({ status: 200, likelihood: 0, data: {} } as PDLPersonResponse);
  }
  return integrationsClient
    .post<PDLPersonResponse>("/integrations/people-data-labs/enrich-person", { email })
    .then((res) => res.data);
}

export function useIntercomContacts() {
  if (showFakeData) {
    return useSWR<IntercomContact[]>("/integrations/intercom/contacts", emptyArray);
  }
  return useSWR<IntercomContact[]>("/integrations/intercom/contacts", fetcher);
}

export function useIntercomConversations() {
  if (showFakeData) {
    return useSWR<IntercomConversation[]>("/integrations/intercom/conversations", emptyArray);
  }
  return useSWR<IntercomConversation[]>("/integrations/intercom/contacts", fetcher);
}

export function useIntercomConversationMessages() {
  if (showFakeData) {
    return useSWR<IntercomConversationMessage[]>("/integrations/intercom/conversation-messages", emptyArray);
  }
  return useSWR<IntercomConversationMessage[]>("/integrations/intercom/conversation-messages", fetcher);
}

export function useSlackMessagesReply() {
  if (showFakeData) {
    return useSWR<SlackMessageReply[]>("/integrations/slack/messages-reply", emptyArray);
  }
  return useSWR<SlackMessageReply[]>("/integrations/slack/messages-reply", fetcher);
}

export function useSlackMessagesReaction() {
  if (showFakeData) {
    return useSWR<SlackMessageReaction[]>("/integrations/slack/messages-reaction", emptyArray);
  }
  return useSWR<SlackMessageReaction[]>("/integrations/slack/messages-reaction", fetcher);
}

export function useSlackMessages() {
  if (showFakeData) {
    return useSWR<SlackMessage[]>("/integrations/slack/messages", emptyArray);
  }
  return useSWR<SlackMessage[]>("/integrations/slack/messages", fetcher);
}

export function useHubspotCompanies() {
  if (showFakeData) {
    return useSWR<HubspotCompany[]>("/integrations/hubspot/companies", emptyArray);
  }
  return useSWR<HubspotCompany[]>("/integrations/hubspot/companies", fetcher);
}

export function useHubspotContacts() {
  if (showFakeData) {
    return useSWR<HubspotContact[]>("/integrations/hubspot/contacts", emptyArray);
  }
  return useSWR<HubspotContact[]>("/integrations/hubspot/contacts", fetcher);
}

export function useHubspotDeals() {
  if (showFakeData) {
    return useSWR<HubspotDeal[]>("/integrations/hubspot/deals", emptyArray);
  }
  return useSWR<HubspotDeal[]>("/integrations/hubspot/deals", fetcher);
}

export function useHubspotUsers() {
  if (showFakeData) {
    return useSWR<HubspotUser[]>("/integrations/hubspot/users", emptyArray);
  }
  return useSWR<HubspotUser[]>("/integrations/hubspot/users", fetcher);
}

export function useLinearIssues() {
  if (showFakeData) {
    return useSWR<LinearIssue[]>("/integrations/linear/issues", emptyArray);
  }
  return useSWR<LinearIssue[]>("/integrations/linear/issues", fetcher);
}

export function useLinearProjects() {
  if (showFakeData) {
    return useSWR<LinearProject[]>("/integrations/linear/projects", emptyArray);
  }
  return useSWR<LinearProject[]>("/integrations/linear/projects", fetcher);
}

export function useLinearTeams() {
  if (showFakeData) {
    return useSWR<LinearTeam[]>("/integrations/linear/teams", emptyArray);
  }
  return useSWR<LinearTeam[]>("/integrations/linear/teams", fetcher);
}

export function useLinearUsers() {
  if (showFakeData) {
    return useSWR<LinearUser[]>("/integrations/linear/users", emptyArray);
  }
  return useSWR<LinearUser[]>("/integrations/linear/users", fetcher);
}



export async function sendPostHogQlQuery(query: PostHogQLQueryInput) {
  if (showFakeData) {
    return Promise.resolve({ results: [] } as PostHogQLQuery);
  }
  return integrationsClient.post<PostHogQLQuery>(`/integrations/posthog/ql-query`, query).then((res) => res.data);
}

export function usePostHogProjects() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<PostHogProject[]>('/integrations/posthog/projects', fetchFunction);
}

export function useNotionContents() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<NotionContent[]>("/integrations/notion/contents", fetchFunction);
}

export function useNotionContentsSingle(input: NotionContentSingleUrlOrIdBodyInput) {
  const url = input?.url ?? "";
  const id = input?.id ?? "";
  const fetchFunction = showFakeData ? emptyObject : fetcher;
  return useSWR<NotionContent>(`/integrations/notion/contents/single?url=${url}&id=${id}`, fetchFunction);
}

export function useNotionUsers() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<NotionUser[]>("/integrations/notion/users", fetchFunction);
}

export function useNotionDatabases() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<NotionDatabaseComplete[]>("/integrations/notion/databases", fetchFunction);
}

export function useNotionDatabaseSingle(input: NotionDatabaseSingleInput) {
  const databaseId = input?.databaseId ?? "";
  const fetchFunction = showFakeData ? emptyObject : fetcher;
  return useSWR<NotionDatabase>(`/integrations/notion/databases/single?databaseId=${databaseId}`, fetchFunction);
}

export function useNotionRichPageSingle(input: NotionRichPageInput) {
  const pageId = input?.pageId ?? "";
  const fetchFunction = showFakeData ? emptyObject : fetcher;
  return useSWR<NotionRichPage>(`/integrations/notion/pages/single?pageId=${pageId}`, fetchFunction);
}

export function useGitLabProjects(queryParams?: GitLabProjectsQueryParams) {
  const params = new URLSearchParams(queryParams as Record<string, string>).toString();
  const url = queryParams ? `/integrations/gitlab/projects?${params}` : '/integrations/gitlab/projects';
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<GitLabProjectSimpleResponse[]>(url, fetchFunction);
}

export function useGitLabMergeRequests(queryParams?: GitLabMergeRequestQueryParams) {
  const params = buildQueryParams(queryParams as Record<string, unknown>);
  const url = params ? `/integrations/gitlab/merge_requests?${params}` : '/integrations/gitlab/merge_requests';
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<GitLabMergeRequest[]>(url, fetchFunction);
}

export function useSalesforceLeads() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SalesforceLead[]>("/integrations/salesforce/leads", fetchFunction);
}

export function useSalesforceContacts() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SalesforceContact[]>("/integrations/salesforce/contacts", fetchFunction);
}

export function useSalesforceAccounts() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SalesforceAccount[]>("/integrations/salesforce/accounts", fetchFunction);
}

export function createSalesforceAccount(input: SalesforceCreateAccountInput) {
  if (showFakeData) {
    return Promise.resolve({ id: 'fake-id', success: true, errors: [] } as SalesforceCreateObjectResponse);
  }
  return integrationsClient.post<SalesforceCreateObjectResponse>("/integrations/salesforce/accounts", input).then((res) => res.data);
}

export function updateSalesforceAccount(input: SalesforceUpdateAccountInput) {
  if (showFakeData) {
    return Promise.resolve({ success: true } as SalesforceSuccessResponse);
  }
  return integrationsClient.patch<SalesforceSuccessResponse>("/integrations/salesforce/accounts", input).then((res) => res.data);
}

export function useSalesforceOpportunities() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SalesforceOpportunity[]>("/integrations/salesforce/opportunities", fetchFunction);
}

export function useSalesforceArticles() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SalesforceArticle[]>("/integrations/salesforce/articles", fetchFunction);
}

export function useSalesforceTickets() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SalesforceTicket[]>("/integrations/salesforce/tickets", fetchFunction);
}

export function useSalesforceCustomFields() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SalesforceCustomField[]>("/integrations/salesforce/custom-fields", fetchFunction);
}

export function updateSalesforceCustomFieldMetadata(input: UpdateSalesforceCustomFieldInput) {
  if (showFakeData) {
    return Promise.resolve({ success: true } as SalesforceSuccessResponse);
  }
  return integrationsClient.patch<SalesforceSuccessResponse>(`/integrations/salesforce/custom-fields/${input.id}`, input).then((res) => res.data);
}

export function useSalesforceCustomFieldSingle(input: GetSalesforceObjectInput) {
  const fetchFunction = showFakeData ? emptyObject : fetcher;
  return useSWR<SalesforceCustomField>(`/integrations/salesforce/custom-fields/${input.id}`, fetchFunction);
}

export function useSalesforceCustomObjects() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SalesforceCustomObject[]>("/integrations/salesforce/custom-objects", fetchFunction);
}

export function useSalesforceCustomObjectRecords(input: SalesforceGetCustomObjectRecordsMetadataInput) {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SalesforceCustomObjectRecord[]>(`/integrations/salesforce/custom-object-records?object_name=${input.object_name}`, fetchFunction);
}

export function createSalesforceCustomObjectRecord(input: SalesforceCreateRecordInput) {
  if (showFakeData) {
    return Promise.resolve({ id: 'fake-id', success: true, errors: [] } as SalesforceCreateObjectResponse);
  }
  return integrationsClient.post<SalesforceCreateObjectResponse>(`/integrations/salesforce/custom-object-records?object_name=${input.object_name}`, input).then((res) => res.data);
}

export function useSalesforceCustomObjectDescribe(input: SalesforceCustomObjectNameInput) {
  const fetchFunction = showFakeData ? emptyObject : fetcher;
  return useSWR<SalesforceCustomObjectDescribe>(`/integrations/salesforce/custom-objects/${input.object_name}`, fetchFunction);
}

export function useChargebeeSubscriptions() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<ChargebeeFullSubscription[]>("/integrations/chargebee/subscriptions", fetchFunction);
}

export function useChargebeeCustomers() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<ChargebeeFullCustomer[]>("/integrations/chargebee/customers", fetchFunction);
}

export function useChargebeeEntitlements() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<ChargebeeEntitlement[]>("/integrations/chargebee/entitlements", fetchFunction);
}

export function useSmartleadCampaigns() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SmartleadCampaign[]>("/integrations/smartlead-ai/campaigns", fetchFunction);
}

export function useShortcutEpics() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<ShortcutEpic[]>("/integrations/shortcut/epics", fetchFunction);
}

export function useShortcutMembers() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<ShortcutMember[]>("/integrations/shortcut/members", fetchFunction);
}

export function useShortcutGroups() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<ShortcutGroup[]>("/integrations/shortcut/groups", fetchFunction);
}

export function useShortcutObjectives() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<ShortcutObjective[]>("/integrations/shortcut/objectives", fetchFunction);
}

export function useStripeAppSubscriptions() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<StripeSubscription[]>("/integrations/stripe-app/subscriptions", fetchFunction);
}

export function useStripeAppCustomers() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<StripeCustomer[]>("/integrations/stripe-app/customers", fetchFunction);
}

export function useStripeAppProducts() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<StripeProduct[]>("/integrations/stripe-app/products", fetchFunction);
}

export function useSupabaseProjects() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SupabaseProject[]>("/integrations/supabase/projects", fetchFunction);
}

export function executeSupabaseQuery(projectRef: string, query: string) {
  if (showFakeData) {
    return Promise.resolve("Supabase query executed successfully (development mode)");
  }
  return integrationsClient
    .post<unknown>(`/integrations/supabase/projects/${projectRef}/database/query`, { query })
    .then((res) => res.data);
}

export function useSmartleadCampaignAnalytics(input: SmartleadQueryParams) {
  const fetchFunction = showFakeData ? emptyObject : fetcher;
  return useSWR<SmartleadCampaignTopLevelAnalytics>(`/integrations/smartlead-ai/campaign-analytics?campaign_id=${input.campaign_id}`, fetchFunction);
}

export function useSmartleadCampaignLeads(input: SmartleadQueryParams) {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SmartleadLead[]>(`/integrations/smartlead-ai/campaign-leads?campaign_id=${input.campaign_id}`, fetchFunction);
}

export function useSmartleadCampaignStatistics(input: SmartleadQueryParams) {
  const fetchFunction = showFakeData ? emptyObject : fetcher;
  return useSWR<SmartleadCampaignStatisticResponse>(`/integrations/smartlead-ai/campaign-statistics?campaign_id=${input.campaign_id}&offset=${input.offset}`, fetchFunction);
}

export function useSmartleadClients() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SmartleadClient[]>(`/integrations/smartlead-ai/clients`, fetchFunction);
}

export function useSmartleadLeadsCategories() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<SmartleadLeadsCategory[]>(`/integrations/smartlead-ai/leads-categories`, fetchFunction);
}

export function useAsanaProjects() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<AsanaProject[]>("/integrations/asana/projects", fetchFunction);
}

export function useAsanaUsers() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<AsanaUser[]>("/integrations/asana/users", fetchFunction);
}

export function useAsanaTasks() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<AsanaTask[]>("/integrations/asana/tasks", fetchFunction);
}

export function useAsanaWorkspaces() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<AsanaWorkspace[]>("/integrations/asana/workspaces", fetchFunction);
}

export function useAsanaProjectTasks(queryParams: AsanaProjectTasksQueryParams) {
  const params = buildQueryParams(queryParams as unknown as Record<string, unknown>);
  const fetchFunction = showFakeData ? () => Promise.resolve({ data: [] }) : fetcher;
  return useSWR<AsanaProjectTasksResponse>(`/integrations/asana/projects/tasks?${params}`, fetchFunction);
}

export function useSalesforceWhoAmI() {
  const fetchFunction = showFakeData ? () => Promise.resolve({ id: 'fake-id', email: 'fake@example.com' }) : fetcher;
  return useSWR<SalesforceWhoAmI>("/integrations/salesforce/whoami", fetchFunction);
}

export function useAsanaWorkspaceCustomFields(queryParams: AsanaWorkspaceCustomFieldsQueryParams) {
  const params = buildQueryParams(queryParams as unknown as Record<string, unknown>);
  const fetchFunction = showFakeData ? () => Promise.resolve({ data: [] }) : fetcher;
  return useSWR<AsanaWorkspaceCustomFieldsResponse>(`/integrations/asana/workspaces/custom-fields?${params}`, fetchFunction);
}

export function useAttioCompanies() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<AttioCompany[]>("/integrations/attio/companies", fetchFunction);
}

export function useAttioDeals() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<AttioDeal[]>("/integrations/attio/deals", fetchFunction);
}

export function useLemlistCampaigns() {
  const fetchFunction = showFakeData ? emptyArray : fetcher;
  return useSWR<LemlistCampaign[]>("/integrations/lemlist/campaigns", fetchFunction);
}

export function useLemlistCampaignStats(queryParams: LemlistCampaignStatsQueryParams) {
  const params = new URLSearchParams(queryParams as unknown as Record<string, string>).toString();
  const fetchFunction = showFakeData ? emptyObject : fetcher;
  return useSWR<LemlistCampaignStats>(`/integrations/lemlist/campaigns/${queryParams.campaignId}/stats?${params}`, fetchFunction);
}

export function addLeadToLemlistCampaign(input: LemlistAddLeadToCampaignInput) {
  if (showFakeData) {
    return Promise.resolve({
      campaignId: input.campaignId,
      email: input.email,
      firstName: input.firstName || '',
      lastName: input.lastName || '',
      id: 'fake-id'
    } as LemlistAddLeadToCampaignResponse);
  }
  return integrationsClient
    .post<LemlistAddLeadToCampaignResponse>(`/integrations/lemlist/campaigns/${input.campaignId}/lead`, input)
    .then((res) => res.data);
}

export function useCrustdataEnrichPerson(searchParams: CrustdataEnrichmentApiQueryParams) {
  if (showFakeData) {
    return Promise.resolve([]);
  }

  const params = buildQueryParams(searchParams as unknown as Record<string, unknown>);

  return integrationsClient.get<CrustdataPersonProfile[]>(`/integrations/crustdata/enrich-person?${params}`)
  .then((res) => res.data);
}