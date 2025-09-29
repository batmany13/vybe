export interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  tz: string;
  tz_label: string;
  tz_offset: number;
  profile: {
    avatar_hash: string;
    real_name: string | null;
    display_name: string | null;
    real_name_normalized: string | null;
    display_name_normalized: string | null;
    email: string | null;
    image_original: string | null | undefined;
  };
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_bot: boolean;
  updated: number;
  is_app_user: boolean;
  raw_json: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  created: number;
  creator: string;
  is_archived: boolean;
  is_general: boolean;
  name_normalized: string;
  is_shared: boolean;
  is_private: boolean;
  is_mpim: boolean;
  updated: number;
  num_members: number;
  raw_json: string;
}

export interface SlackMessage {
  id: string;
  ts: string;
  channel_id: string;
  thread_ts: string | null;
  app_id: string | null;
  bot_id: string | null;
  display_as_bot: boolean | null;
  is_locked: boolean | null;
  metadata: { event_type: string };
  parent_user_id: string | null;
  subtype: string | null;
  text: string | null;
  topic: string | null;
  user_id: string | null;
  raw_json: string;
}

export interface SlackMessageReply {
  id: string;
  ts: string;
  channel_id: string;
  thread_ts: string | null;
  app_id: string | null;
  bot_id: string | null;
  display_as_bot: boolean | null;
  is_locked: boolean | null;
  metadata: { event_type: string };
  parent_user_id: string | null;
  subtype: string | null;
  text: string | null;
  topic: string | null;
  user_id: string | null;
  root: { message_id: string | null; ts: string };
  raw_json: string;
}

export interface SlackMessageReaction {
  id: string;
  message_ts: string;
  thread_ts: string;
  channel_id: string;
  user_id: string;
  reaction_name: string;
}

export interface SlackSendMessageInput {
  channel: string;
  text: string;
}

export interface SlackSendMessageOutput {
  ok: boolean;
  channel?: string | undefined;
  ts?: string | undefined;
  message?: string | undefined;
  warning?: string | undefined;
  error?: string | undefined;
  raw_json: string;
}

export interface GoogleCalendarEvent {
  kind: string;
  etag: string;
  id: string;
  status: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  summary?: string;
  description?: string;
  location?: string;
  colorId?: string;
  creator?: {
    id?: string;
    email: string;
    displayName?: string;
    self?: boolean;
  };
  organizer?: {
    id?: string;
    email: string;
    displayName?: string;
    self?: boolean;
  };
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  endTimeUnspecified?: boolean;
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: { date?: string; dateTime?: string; timeZone?: string };
  transparency?: string;
  visibility?: string;
  iCalUID?: string;
  sequence?: number;
  attendees?: {
    id?: string;
    email: string;
    displayName?: string;
    organizer?: boolean;
    self?: boolean;
    resource?: boolean;
    optional?: boolean;
    responseStatus: string;
    comment?: string;
    additionalGuests?: number;
  }[];
  attendeesOmitted?: boolean;
  extendedProperties?: {
    private?: { [key: string]: string };
    shared?: { [key: string]: string };
  };
  hangoutLink?: string;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: { type: string };
      status: { statusCode: string };
    };
    entryPoints: {
      entryPointType: string;
      uri: string;
      label?: string;
      pin?: string;
      accessCode?: string;
      meetingCode?: string;
      passcode?: string;
      password?: string;
      regionCode?: string;
    }[];
    conferenceSolution: {
      key: { type: string };
      name: string;
      iconUri: string;
    };
    conferenceId: string;
    signature?: string;
    notes?: string;
    parameters?: {
      addOnParameters?: { parameters: { [key: string]: string } };
    };
  };
  gadget?: {
    type: string;
    title: string;
    link: string;
    iconLink: string;
    width: number;
    height: number;
    display: string;
    preferences: { key: string };
  };
  anyoneCanAddSelf?: boolean;
  guestsCanInviteOthers?: boolean;
  guestsCanModify?: boolean;
  guestsCanSeeOtherGuests?: boolean;
  privateCopy?: boolean;
  locked?: boolean;
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
  outOfOfficeProperties?: { autoDeclineMode: string; declineMessage: string };
  source?: { url: string; title: string };
  workingLocationProperties?: {
    type: string;
    homeOffice: string;
    customLocation: { label: string };
    officeLocation: {
      buildingId: string;
      floorId: string;
      floorSectionId: string;
      deskId: string;
      label: string;
    };
  };
  attachments?: {
    fileUrl: string;
    title: string;
    mimeType: string;
    iconLink: string;
    fileId: string;
  }[];
  eventType?: string;
}

export interface Attachments {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export interface GmailEmail {
  id: string;
  sender: string;
  recipients?: string | undefined;
  date: string;
  subject: string;
  body?: string | undefined;
  attachments: Attachments[];
  threadId: string;
}

export interface GmailEmailInput {
  from: string;
  to: string;
  headers: Record<string, any> | undefined;
  subject: string;
  body: string;
};

export interface GmailEmailSentOutput {
  id: string;
  threadId: string;
};

export interface JiraProjectId {
  id: string;
}

export interface JiraIssueMetadata {
  projectIdsToSync: JiraProjectId[];
  cloudId?: string;
  baseUrl?: string;
}

export interface JiraTimestamps {
  createdAt: string;
  updatedAt: string;
}

export interface JiraAuthor {
  accountId: string | null;
  active: boolean;
  displayName: string;
  emailAddress: string | null;
}

export interface JiraComment {
  id: string;
  createdAt: string;
  updatedAt: string;
  author: JiraAuthor;
  body: Record<string, any>;
}

export interface JiraIssue {
  id: string;
  createdAt: string;
  updatedAt: string;
  key: string;
  summary: string;
  issueType: string;
  status: string;
  assignee: string | null;
  url: string;
  webUrl: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  comments: JiraComment[];
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  url: string;
  projectTypeKey: string;
  webUrl: string;
}

export interface JiraIssueType {
  projectId: string;
  id: string;
  name: string;
  description: string | null;
  url: string;
}

export interface CreateJiraIssueInput {
  /**
   * The summary of the issue to create.
   */
  summary: string;
  /**
   * The description of the issue to create.
   */
  description?: string;
  /**
   * The id of the user to assign the issue to.
   * @deprecated Use assigneeEmail instead
   */
  assignee?: string;
  /**
   * The labels to add to the issue.
   */
  labels?: string[];
  /**
   * The id of the project to create the issue in.
   */
  project: string;
  /**
   * The id of the issue type to create the issue as.
   */
  issueType: string;
}

export interface CreateJiraIssueOutput {
  id: string;
  key: string;
  self: string;
}

export interface JiraSearchIssuesInput {
  jql: string;
  nextPageToken: string | null;
};

export interface JiraSearchIssue {
  expand: string;
  id: string;
  self: string;
  key: string;
  fields: any;
  editmeta?: any | undefined;
};

export interface JiraFieldNames {
  [key: string]: string;
};

export interface JiraFieldSchemas {
  [key: string]: any;
};

export interface JiraSearchIssuesOutput {
  issues: JiraSearchIssue[];
  names: JiraFieldNames;
  schema: JiraFieldSchemas;
  nextPageToken: string | null;
  isLast: boolean;
};

export interface AttioPerson {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  description: string;
  excitement_note?: string; // Note on why we're excited
  email_address: string;
  job_title: string;
  linkedin: string;
  twitter: string;
  created_at: Date;
  avatar_url: string;
}

/**
 * Type definitions for People Data Labs API responses
 */

export interface PDLPersonResponse {
  status: number;
  likelihood: number; // Confidence score integer between 1 and 10
  data: PDLPerson;
  error?: {
    type: string;
    message: string;
  };
}

export interface PDLPerson {
  id: string;
  full_name: string;
  first_name: string;
  middle_initial?: string | null;
  middle_name?: string | null;
  last_initial?: string;
  last_name: string;
  sex?: string;
  birth_year?: number | boolean;
  birth_date?: string | boolean;
  linkedin_url?: string | null;
  linkedin_username?: string | null;
  linkedin_id?: string | null;
  facebook_url?: string | null;
  facebook_username?: string | null;
  facebook_id?: string | null;
  twitter_url?: string | null;
  twitter_username?: string | null;
  github_url?: string | null;
  github_username?: string | null;
  work_email?: string | boolean;
  personal_emails?: string[] | boolean;
  recommended_personal_email?: string | boolean;
  mobile_phone?: string | boolean;
  industry?: string | null;
  job_title?: string | null;
  job_title_role?: string | null;
  job_title_sub_role?: string | null;
  job_title_class?: string | null;
  job_title_levels?: string[];
  job_company_id?: string | null;
  job_company_name?: string | null;
  job_company_website?: string | null;
  job_company_size?: string | null;
  job_company_founded?: number | null;
  job_company_industry?: string | null;
  job_company_linkedin_url?: string | null;
  job_company_linkedin_id?: string | null;
  job_company_facebook_url?: string | null;
  job_company_twitter_url?: string | null;
  job_company_location_name?: string | null;
  job_company_location_locality?: string | null;
  job_company_location_metro?: string | null;
  job_company_location_region?: string | null;
  job_company_location_geo?: string | null;
  job_company_location_street_address?: string | null;
  job_company_location_address_line_2?: string | null;
  job_company_location_postal_code?: string | null;
  job_company_location_country?: string | null;
  job_company_location_continent?: string | null;
  job_last_changed?: string | null;
  job_last_verified?: string | null;
  job_start_date?: string | null;
  location_name?: string | boolean;
  location_locality?: string | boolean;
  location_metro?: string | boolean;
  location_region?: string | boolean;
  location_country?: string;
  location_continent?: string;
  location_street_address?: string | boolean;
  location_address_line_2?: string | null;
  location_postal_code?: string | boolean;
  location_geo?: string | boolean;
  location_last_updated?: string | null;
  phone_numbers?: string[] | boolean;
  emails?: string[] | boolean;
  interests?: string[];
  skills?: string[];
  location_names?: string[] | boolean;
  regions?: string[] | boolean;
  countries?: string[];
  street_addresses?: string[] | boolean;
  experience?: PDLExperience[];
  education?: PDLEducation[];
  profiles?: PDLProfile[];
  dataset_version?: string;
}

export interface PDLEducation {
  school: {
    name: string;
    type?: string | null;
    id?: string | null;
    location?: {
      name: string;
      locality: string;
      region: string;
      country: string;
      continent: string;
    } | null;
    linkedin_url?: string | null;
    facebook_url?: string | null;
    twitter_url?: string | null;
    linkedin_id?: string | null;
    website?: string | null;
    domain?: string | null;
  };
  degrees?: string[];
  start_date?: string | null;
  end_date?: string | null;
  majors?: string[];
  minors?: string[];
  gpa?: number | null;
}

export interface PDLExperience {
  company: {
    name: string;
    size?: string | null;
    id?: string | null;
    founded?: number | null;
    industry?: string | null;
    location?: {
      name: string;
      locality: string;
      region: string;
      metro?: string | null;
      country: string;
      continent: string;
      street_address?: string | null;
      address_line_2?: string | null;
      postal_code: string;
      geo: string;
    } | null;
    linkedin_url?: string | null;
    linkedin_id?: string | null;
    facebook_url?: string | null;
    twitter_url?: string | null;
    website?: string | null;
  };
  location_names?: string[];
  end_date?: string | null;
  start_date: string;
  title: {
    name: string;
    class?: string | null;
    role?: string | null;
    sub_role?: string | null;
    levels?: string[];
  };
  is_primary?: boolean;
}

export interface PDLProfile {
  network: string;
  id?: string | null;
  url: string;
  username: string;
}

export interface PDLPhone {
  number: string;
  first_seen: string;
  last_seen: string;
  num_sources: number;
}

export interface PDLEmail {
  address: string;
  type: string;
  first_seen: string;
  last_seen: string;
  num_sources: number;
}

export interface IntercomContact {
  id: string;
  workspace_id: string;
  external_id: string | null;
  type: string;
  email: string;
  phone: string | null;
  name: string | null;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
  last_replied_at: string | null;
  created_by: {  type: string;
  name: string;
  id: string;};
};

export interface IntercomConversationMessage {
  id: string;
  conversation_id: string;
  body: string;
  type: string;
  created_at: string;
  updated_at: string;
  author: {  type: string;
  name: string;
  id: string;};
};

export interface IntercomConversation {
  id: string;
  created_at: string;
  updated_at: string;
  waiting_since: string | null;
  snoozed_until: string | null;
  title: string | null;
  contacts: ({  contact_id: string;})[];
  state: string;
  open: boolean;
  read: boolean;
  priority: string;
};

export interface HubspotCompany {
  id: string;
  created_date: string | null;
  name: string | null;
  industry: string | null;
  description: string | null;
  country: string | null;
  city: string | null;
  lead_status: string | null;
  lifecycle_stage: string | null;
  owner: string | null;
  year_founded: string | null;
  website_url: string | null;
};

export interface HubspotContact {
  id: string;
  created_date: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  job_title: string | null;
  last_contacted: string | null;
  last_activity_date: string | null;
  lead_status: string | null;
  lifecycle_stage: string | null;
  salutation: string | null;
  mobile_phone_number: string | null;
  website_url: string | null;
  owner: string | null;
};

export interface HubspotAssociationCompany {
  id: string;
  name: string | null;
};

export interface HubspotAssociationContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

export interface HubspotAssociationDeal {
  id: string;
  name: string | null;
};

export interface HubspotReturnedAssociations {
  companies?: {  id: string;
  name: string | null;};
  contacts?: {  id: string;
  first_name: string | null;
  last_name: string | null;};
  deals?: {  id: string;
  name: string | null;};
};

export interface HubspotDeal {
  id: string;
  name: string | null;
  amount: string | null;
  close_date: string | null;
  deal_description: string | null;
  owner: string | null;
  deal_stage: string | null;
  deal_probability: string | null;
  returned_associations?: HubspotReturnedAssociations | undefined;
};

export interface HubspotUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleIds: string[];
  primaryTeamId?: string | undefined;
  superAdmin: boolean;
};

export interface LinearIssue {
  id: string;
  assigneeId: string | null;
  creatorId: string | null;
  createdAt: string;
  updatedAt: string;
  description: string | null;
  dueDate: string | null;
  projectId: string | null;
  teamId: string;
  title: string;
  status: string;
  estimate: string | null;
};

export interface LinearProject {
  id: string;
  url: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  teamId: string;
};

export interface LinearTeam {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface LinearUser {
  id: string;
  admin: boolean;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export interface GithubRepository {
  allow_forking: boolean;
  archive_url: string;
  archived: boolean;
  assignees_url: string;
  blobs_url: string;
  branches_url: string;
  clone_url: string;
  collaborators_url: string;
  comments_url: string;
  commits_url: string;
  compare_url: string;
  contents_url: string;
  contributors_url: string;
  created_at: string;
  default_branch: string;
  deployments_url: string;
  description: string;
  disabled: boolean;
  downloads_url: string;
  events_url: string;
  fork: boolean;
  forks: number;
  forks_count: number;
  forks_url: string;
  full_name: string;
  git_commits_url: string;
  git_refs_url: string;
  git_tags_url: string;
  git_url: string;
  has_discussions: boolean;
  has_downloads: boolean;
  has_issues: boolean;
  has_pages: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  homepage: string | null;
  hooks_url: string;
  html_url: string;
  id: number;
  is_template: boolean;
  issue_comment_url: string;
  issue_events_url: string;
  issues_url: string;
  keys_url: string;
  labels_url: string;
  language: string;
  languages_url: string;
  license: string | null;
  merges_url: string;
  milestones_url: string;
  mirror_url: string | null;
  name: string;
  node_id: string;
  notifications_url: string;
  open_issues: number;
  open_issues_count: number;
  owner: {  avatar_url: string;
  events_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  gravatar_id: string;
  html_url: string;
  id: number;
  login: string;
  node_id: string;
  organizations_url: string;
  received_events_url: string;
  repos_url: string;
  site_admin: boolean;
  starred_url: string;
  subscriptions_url: string;
  type: string;
  url: string;};
  permissions: {  admin: boolean;
  maintain: boolean;
  pull: boolean;
  push: boolean;
  triage: boolean;};
  private: boolean;
  pulls_url: string;
  pushed_at: string;
  releases_url: string;
  size: number;
  ssh_url: string;
  stargazers_count: number;
  stargazers_url: string;
  statuses_url: string;
  subscribers_url: string;
  subscription_url: string;
  svn_url: string;
  tags_url: string;
  teams_url: string;
  topics: (string)[];
  trees_url: string;
  updated_at: string;
  url: string;
  visibility: string;
  watchers: number;
  watchers_count: number;
  web_commit_signoff_required: boolean;
};

export interface GithubUser {
  id: string;
  url?: string;
};

export interface GithubComment {
  id: string;
  body: string;
  user: GithubUser;
};

export interface GithubPullRequest {
  id: string;
  url: string;
  state: string;
  title: string;
  user: GithubUser;
  assignees: (GithubUser)[];
  reviewers: (GithubUser)[];
  draft: boolean;
  labels: (string)[];
  reviewDecision: string;
  latestComment: GithubComment;
};

export interface GithubCommit {
  id: string;
  url: string;
  branch: string;
  author: GithubUser;
  message: string;
  date: string;
};

export interface PostHogQLQueryRequest {
  query: {  kind: string;
  query: string;};
  client_query_id?: string;
  resfresh?: string;
  filters_override?: any;
  variables_override?: any;
  name?: string;
};

export interface PostHogQLQueryInput {
  projectId: string;
  query: {  kind: string;
  query: string;};
  clientQueryId?: string;
  resfresh?: string;
  filtersOverride?: any;
  variablesOverride?: any;
  name?: string;
};

export interface PostHogQLQuery {
  /** An array of result arrays */
  results: any[];
  /** Returned column types */
  types?: any[] | null;
  /** Returned column names/aliases */
  columns?: string[] | null;
  limit?: number | null;
  offset?: number | null;
  hasMore?: boolean | null;
  /** The input query */
  query?: string | null;
  /** Generated ClickHouse query for debugging */
  clickhouse?: string | null;
  /** Generated HogQL query with expressions inlined */
  hogql?: string | null;
};

export interface PostHogProject {
  id: number;
  uuid: string;
  organization: string;
  name: string;
};

export interface NotionContent {
  id: string;
  path?: string;
  type: 'page' | 'database';
  last_modified: string;
  title?: string;
  parent_id?: string | undefined;
};

export interface NotionContentSingleUrlOrIdBodyInput {
  url?: string | null;
  id?: string | null;
};

export interface NotionUser {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  isBot: boolean;
};

export interface NotionDatabaseComplete {
  id: string;
  row: Record<string, any>;
  meta: {  
    databaseId: string;
    path: string;
    title: string;
    last_modified: string;
  };
};

export interface NotionDatabaseSingleInput {
  databaseId: string;
};

export interface NotionDatabaseRowEntry {
  id: string;
  row: Record<string, any>;
};

export interface NotionDatabase {
  id: string;
  path: string;
  title: string;
  meta: Record<string, any>;
  last_modified: string;
  entries: NotionDatabaseRowEntry[];
};

export interface NotionRichPageInput {
  pageId: string;
};

export interface NotionRichPage {
  id: string;
  path: string;
  title: string;
  content: string;
  contentType: string;
  meta: Record<string, any>;
  last_modified: string;
  parent_id?: string | undefined;
};

export interface GitLabProjectsQueryParams {
  /**
   * Limit by archived status.
   */
  archived?: boolean;

  /**
   * Limit results to projects with IDs greater than the specified ID.
   */
  id_after?: number;

  /**
   * Limit results to projects with IDs less than the specified ID.
   */
  id_before?: number;

  /**
   * Limit results to projects which were imported from external systems by current user.
   */
  imported?: boolean;

  /**
   * Include hidden projects. (administrators only) Premium and Ultimate only.
   */
  include_hidden?: boolean;

  /**
   * Include projects pending deletion. (administrators only)
   */
  include_pending_delete?: boolean;

  /**
   * Limit results to projects with last activity after specified time.
   * Format: ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)
   */
  last_activity_after?: string;

  /**
   * Limit results to projects with last activity before specified time.
   * Format: ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)
   */
  last_activity_before?: string;

  /**
   * Limit by projects that the current user is a member of.
   */
  membership?: boolean;

  /**
   * Limit by current user minimal role (access_level).
   */
  min_access_level?: number;

  /**
   * Return projects ordered by id, name, path, created_at, updated_at, star_count,
   * last_activity_at, or similarity fields.
   * repository_size, storage_size, packages_size or wiki_size fields are only allowed for administrators.
   * similarity is only available when searching and is limited to projects that the current user is a member of.
   * Default is created_at.
   */
  order_by?: string;

  /**
   * Limit by projects explicitly owned by the current user.
   */
  owned?: boolean;

  /**
   * Limit projects where the repository checksum calculation has failed.
   */
  repository_checksum_failed?: boolean;

  /**
   * Limit results to projects stored on repository_storage. (administrators only)
   */
  repository_storage?: string;

  /**
   * Include ancestor namespaces when matching search criteria. Default is false.
   */
  search_namespaces?: boolean;

  /**
   * Return list of projects with a path, name, or description matching the search criteria (case-insensitive, substring match).
   * Multiple terms can be provided, separated by an escaped space, either + or %20, and will be ANDed together.
   * Example: one+two will match substrings one and two (in any order).
   */
  search?: string;

  /**
   * Return only limited fields for each project.
   * This operation is a no-op without authentication where only simple fields are returned.
   */
  simple?: boolean;

  /**
   * Return projects sorted in asc or desc order. Default is desc.
   */
  sort?: string;

  /**
   * Limit by projects starred by the current user.
   */
  starred?: boolean;

  /**
   * Include project statistics. Available only to users with at least the Reporter role.
   */
  statistics?: boolean;

  /**
   * Limit results to projects with the assigned topic given by the topic ID.
   */
  topic_id?: number;

  /**
   * Comma-separated topic names. Limit results to projects that match all of given topics.
   */
  topic?: string;

  /**
   * Limit results to projects last updated after the specified time.
   * Format: ISO 8601 (YYYY-MM-DDTHH:MM:SSZ).
   * For this filter to work, you must also provide updated_at as the order_by attribute.
   */
  updated_after?: string;

  /**
   * Limit results to projects last updated before the specified time.
   * Format: ISO 8601 (YYYY-MM-DDTHH:MM:SSZ).
   * For this filter to work, you must also provide updated_at as the order_by attribute.
   */
  updated_before?: string;

  /**
   * Limit by visibility public, internal, or private.
   */
  visibility?: string;

  /**
   * Limit projects where the wiki checksum calculation has failed.
   * Premium and Ultimate only.
   */
  wiki_checksum_failed?: boolean;

  /**
   * Include custom attributes in response. (administrator only)
   */
  with_custom_attributes?: boolean;

  /**
   * Limit by enabled issues feature.
   */
  with_issues_enabled?: boolean;

  /**
   * Limit by enabled merge requests feature.
   */
  with_merge_requests_enabled?: boolean;

  /**
   * Limit by projects which use the given programming language.
   */
  with_programming_language?: string;

  /**
   * Filter by date when project was marked for deletion.
   * Introduced in GitLab 17.1. Premium and Ultimate only.
   */
  marked_for_deletion_on?: string;

  /**
   * Limit by projects that are not archived and not marked for deletion.
   */
  active?: boolean;
}

export interface GitLabProjectSimpleResponse {
  id: number;
  description?: string | null;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  created_at: string;
  default_branch: string;
  tag_list: string[];
  topics: string[];
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  web_url: string;
  readme_url?: string | null;
  forks_count?: number | null;
  avatar_url?: string | null;
  star_count: number;
  last_activity_at: string;
  namespace: {
    id: number;
    name: string;
    path: string;
    kind: string;
    full_path: string;
    parent_id?: number | null;
    avatar_url?: string | null;
    web_url: string;
  };
}

export interface GitLabMergeRequestQueryParams {
  /**
   * Returns the merge requests approved by all the users with the given id, up to 5 users. None returns merge requests with no approvals. Any returns merge requests with an approval. Premium and Ultimate only.
   */
  approved_by_ids?: number[];

  /**
   * Returns merge requests which have specified all the users with the given id as individual approvers. None returns merge requests without approvers. Any returns merge requests with an approver. Premium and Ultimate only.
   */
  approver_ids?: number[];

  /**
   * Filters merge requests by their approved status. 'yes' returns only approved merge requests. 'no' returns only non-approved merge requests. Requires the mr_approved_filter feature flag, disabled by default.
   */
  approved?: 'yes' | 'no';

  /**
   * Returns merge requests assigned to the given user id. None returns unassigned merge requests. Any returns merge requests with an assignee.
   */
  assignee_id?: number | 'None' | 'Any';

  /**
   * Returns merge requests created by the given user id. Mutually exclusive with author_username.
   */
  author_id?: number;

  /**
   * Returns merge requests created by the given username. Mutually exclusive with author_id.
   */
  author_username?: string;

  /**
   * Returns merge requests created on or after the given time. Expected in ISO 8601 format.
   */
  created_after?: string;

  /**
   * Returns merge requests created on or before the given time. Expected in ISO 8601 format.
   */
  created_before?: string;

  /**
   * Returns merge requests deployed after the given date/time. Expected in ISO 8601 format.
   */
  deployed_after?: string;

  /**
   * Returns merge requests deployed before the given date/time. Expected in ISO 8601 format.
   */
  deployed_before?: string;

  /**
   * Returns merge requests deployed to the given environment.
   */
  environment?: string;

  /**
   * Change the scope of the search attribute. 'title', 'description', or a string joining them with comma. Default is 'title,description'.
   */
  in?: string;

  /**
   * Returns requests ordered by 'created_at', 'title', 'merged_at' (introduced in GitLab 17.2), or 'updated_at'. Default is 'created_at'.
   */
  order_by?: 'created_at' | 'title' | 'merged_at' | 'updated_at';

  /**
   * Returns merge requests which have the user as a reviewer with the given user id. 'None' returns with no reviewers. 'Any' returns with any reviewer. Mutually exclusive with reviewer_username.
   */
  reviewer_id?: number | 'None' | 'Any';

  /**
   * Returns merge requests which have the user as a reviewer with the given username. 'None' returns with no reviewers. 'Any' returns with any reviewer. Mutually exclusive with reviewer_id.
   */
  reviewer_username?: string;

  /**
   * Returns merge requests for the given scope: 'created_by_me', 'assigned_to_me', or 'all'. Defaults to 'created_by_me'.
   */
  scope?: 'created_by_me' | 'assigned_to_me' | 'all';

  /**
   * Search merge requests against their title and description.
   */
  search?: string;

  /**
   * Returns requests sorted in 'asc' or 'desc' order. Default is 'desc'.
   */
  sort?: 'asc' | 'desc';

  /**
   * Returns merge requests with the given source branch.
   */
  source_branch?: string;

  /**
   * Returns all merge requests or just those that are 'opened', 'closed', 'locked', or 'merged'.
   */
  state?: 'opened' | 'closed' | 'locked' | 'merged';

  /**
   * Returns merge requests with the given target branch.
   */
  target_branch?: string;

  /**
   * Returns merge requests updated on or after the given time. Expected in ISO 8601 format.
   */
  updated_after?: string;

  /**
   * Returns merge requests updated on or before the given time. Expected in ISO 8601 format.
   */
  updated_before?: string;

  /**
   * If true, response returns more details for each label in labels field: name, color, description, description_html, text_color. Default is false.
   */
  with_labels_details?: boolean;

  /**
   * If true, this projection requests (but does not guarantee) an asynchronous recalculation of the merge_status field. Enable restrict_merge_status_recheck feature flag to ignore when used by users without at least Developer role.
   */
  with_merge_status_recheck?: boolean;

  /**
   * Filter merge requests against their wip (draft) status. Use 'yes' to return only draft MRs, 'no' to return non-draft MRs.
   */
  wip?: 'yes' | 'no';
}

export interface GitLabMergeRequestUser {
  id: number;
  name: string;
  username: string;
  public_email: string | null;
  state: string;
  locked?: boolean;
  avatar_url: string | null;
  web_url: string;
}

export interface GitLabMergeRequestMilestone {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  due_date: string;
  start_date: string;
  web_url: string;
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  imported: boolean;
  imported_from: string;
  merged_by: GitLabMergeRequestUser | null;
  merge_user: GitLabMergeRequestUser | null;
  merged_at: string | null;
  merge_after: string | null;
  prepared_at: string;
  closed_by: GitLabMergeRequestUser | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  target_branch: string;
  source_branch: string;
  upvotes: number;
  downvotes: number;
  author: GitLabMergeRequestUser;
  assignee: GitLabMergeRequestUser;
  assignees: GitLabMergeRequestUser[];
  reviewers: GitLabMergeRequestUser[];
  source_project_id: number;
  target_project_id: number;
  labels: string[];
  draft: boolean;
  work_in_progress: boolean;
  milestone: GitLabMergeRequestMilestone | null;
  merge_when_pipeline_succeeds: boolean;
  merge_status: string;
  detailed_merge_status: string;
  sha: string;
  merge_commit_sha: string | null;
  squash_commit_sha: string | null;
  user_notes_count: number;
  discussion_locked: boolean | null;
  should_remove_source_branch: boolean | null;
  force_remove_source_branch: boolean;
  allow_collaboration?: boolean;
  allow_maintainer_to_push?: boolean;
  web_url: string;
  reference?: string | null;
  references: {
    short: string;
    relative: string;
    full: string;
  };
  time_stats: {
    time_estimate: number;
    total_time_spent: number;
    human_time_estimate: string | null;
    human_total_time_spent: string | null;
  };
  squash: boolean;
  squash_on_merge: boolean;
  task_completion_status: {
    count: number;
    completed_count: number;
  };
  has_conflicts?: boolean | null;
  blocking_discussions_resolved?: boolean | null;
  approvals_before_merge: number | null;
}

export interface SalesforceLead {
  id: string;
  first_name?: string | null;
  last_name: string;
  company_name: string;
  email?: string | null;
  owner_id: string;
  owner_name: string;
  phone?: string | null;
  salutation?: string | null;
  title?: string | null;
  website?: string | null;
  industry?: string | null;
  last_modified_date: string;
};

export interface SalesforceContact {
  id: string;
  first_name?: string | null;
  last_name: string;
  account_name?: string | null;
  account_id?: string | null;
  email?: string | null;
  owner_id: string;
  owner_name: string;
  mobile?: string | null;
  phone?: string | null;
  salutation?: string | null;
  title?: string | null;
  last_modified_date: string;
};

export interface SalesforceAccount {
  id: string;
  name: string;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  billing_city?: string | null;
  billing_country?: string | null;
  owner_id: string;
  owner_name: string;
  last_modified_date: string;
};

export interface SalesforceOpportunity {
  id: string;
  opportunity_name: string;
  account_name?: string | null;
  account_id?: string | null;
  amount?: number | null;
  description?: string | null;
  close_date: string;
  created_by_id: string;
  created_by: string;
  owner_id: string;
  owner_name: string;
  stage: string;
  probability?: number | null;
  type?: string | null;
  last_modified_date: string;
};

export interface SalesforceArticle {
  id: string;
  title: string;
  content: string;
  last_modified_date: string;
};

export interface SalesforceTicketConversation {
  id: string;
  body: string;
  created_date: string;
  created_by: string;
};

export interface SalesforceTicket {
  id: string;
  case_number: string;
  subject?: string | null;
  account_id?: string | null;
  account_name?: string | null;
  contact_id?: string | null;
  contact_name?: string | null;
  owner_id: string;
  owner_name?: string | null;
  priority: string;
  status: string;
  description?: string | null;
  type?: string | null;
  created_date: string;
  closed_date?: string | null;
  origin?: string | null;
  is_closed: boolean;
  is_escalated: boolean;
  conversation: SalesforceTicketConversation[];
  last_modified_date: string;
};

export type ChargebeeSubscriptionCancelReasonType = 'not_paid' | 'no_card' | 'fraud_review_failed' | 'non_complaiant_eu_customer' | 'tax_calculation_failed' | 'currency_incompatible_with_gateway' | 'non_compliant_customer';
export type ChargebeeSubscriptionTrialEndActionType = 'site_default' | 'plan_default' | 'activate_subscription' | 'cancel_subscription';
export type ChargebeeSubscriptionStatusType = 'future' | 'in_trial' | 'active' | 'non_renewing' | 'paused' | 'cancelled' | 'transferred';
export type ChargebeeCustomerAutoCollectionType = 'on' | 'off';
export type ChargebeeSubscriptionChannelType = 'web' | 'app_store' | 'play_store';

export interface ChargebeeCustomer {
  id: string;
  active_id?: string;
  allow_direct_debit: boolean;
  auto_collection: string;
  balances?: ({  promotional_credits?: number;
  excess_payments?: number;
  refundable_credits?: number;
  unbilled_charges?: number;
  object?: string;
  currency_code?: string;
  balance_currency_code?: string;})[];
  billing_address?: {  first_name?: string;
  last_name?: string;
  email?: string;
  company?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  state_code?: string;
  state?: string;
  country?: string;
  zip?: string;
  object?: string;
  validation_status?: string;};
  billing_date?: number;
  billing_month?: number;
  billing_day_of_week?: string;
  business_entity_id?: string;
  card_status?: string;
  channel?: string;
  company?: string;
  contacts?: (any)[];
  created_at: number;
  customer_type?: string;
  deleted: boolean;
  email?: string;
  einvoicing_method?: string;
  excess_payments: number;
  first_name?: string;
  fraud_flag?: string;
  invoice_notes?: string;
  is_einvoice_enabled?: boolean;
  is_location_valid?: boolean;
  is_location_validated?: boolean;
  last_name?: string;
  locale?: string;
  mrr?: number;
  net_term_days: number;
  object: string;
  offline_payment_method?: string;
  meta_data?: any;
  payment_method?: {  object?: string;
  type?: string;
  reference_id?: string;
  gateway?: string;
  gateway_account_id?: string;
  status?: string;};
  parent_account_access?: any;
  child_account_access?: any;
  pii_cleared?: string;
  phone?: string;
  preferred_currency_code?: string;
  primary_payment_source_id?: string;
  promotional_credits: number;
  refundable_credits: number;
  relationship?: {  parent_id?: string;
  payment_owner_id: string;
  invoice_owner_id: string;};
  resource_version?: number;
  referral_urls?: (any)[];
  taxability?: string;
  unbilled_charges: number;
  updated_at?: number;
};

export interface ChargebeeCard {
  card_type: string;
  created_at: number;
  customer_id: string;
  expiry_month: number;
  expiry_year: number;
  first_name?: string;
  last_name?: string;
  funding_type: string;
  gateway: string;
  gateway_account_id?: string;
  iin: string;
  last4: string;
  masked_number?: string;
  object: string;
  payment_source_id: string;
  resource_version?: number;
  status: string;
  updated_at?: number;
};

export interface ChargebeeFullSubscription {
  id: string;
  activated_at?: number;
  auto_collection?: ChargebeeCustomerAutoCollectionType;
  base_currency_code?: string;
  exchange_rate?: number;
  billing_period: number;
  billing_period_unit: string;
  cancelled_at?: number;
  cancel_schedule_created_at?: number;
  channel?: ChargebeeSubscriptionChannelType;
  charged_items?: {
    item_price_id?: string;
    last_charged_at?: number;
    object?: string;
  }[];
  cancel_reason?: ChargebeeSubscriptionCancelReasonType;
  contract_term_billing_cycle_on_renewal?: number;
  created_at?: number;
  currency_code: string;
  current_term_end?: number;
  current_term_start?: number;
  customer_id: string;
  deleted: boolean;
  due_invoices_count: number;
  due_since?: number;
  has_scheduled_advance_invoices?: boolean;
  has_scheduled_changes: boolean;
  mrr?: number;
  next_billing_at?: number;
  object: string;
  override_relationship?: boolean;
  pause_date?: number;
  po_number?: string;
  plan_quantity_in_decimal?: string;
  plan_unit_price_in_decimal?: string;
  remaining_billing_cycles?: number;
  resource_version: number;
  resume_date?: number;
  started_at?: number;
  start_date?: number;
  trial_end?: number;
  trial_start?: number;
  trial_end_action?: ChargebeeSubscriptionTrialEndActionType;
  status: ChargebeeSubscriptionStatusType;
  subscription_items: unknown[];
  total_dues?: number;
  updated_at: number;
  customer: ChargebeeCustomer;
  card?: ChargebeeCard;
};

export interface ChargebeeFullCustomer extends ChargebeeCustomer {
  card?: ChargebeeCard;
}

export interface ChargebeeEntitlement {
  id: string;
  entity_id?: string;
  entity_type?: string;
  feature_id?: string;
  feature_name?: string;
  value?: string;
  name?: string;
  embedded?: any;
  object?: string;
};

export interface StripeCancellationDetails {
  comment: string | null;
  feedback: string | null;
  reason: string | null;
};

export interface StripeIssuer {
  type: string;
};

export interface StripeInvoiceSettings {
  issuer: StripeIssuer;
  account_tax_ids: null | string | string[];
};

export interface StripePlan {
  id: string;
  object: string;
  active: boolean;
  aggregate_usage?: any;
  amount: number;
  amount_decimal: string;
  billing_scheme: string;
  created: number;
  currency: string;
  discounts?: any;
  interval: string;
  interval_count: number;
  livemode: boolean;
  metadata?: any;
  meter?: any;
  nickname: any;
  product: string;
  tiers_mode: any;
  transform_usage: any;
  trial_period_days: any;
  usage_type: string;
};

export interface StripeRecurring {
  aggregate_usage?: any;
  interval: string;
  interval_count: number;
  trial_period_days: any;
  usage_type: string;
  meter?: any;
};

export interface StripePrice {
  id: string;
  object: string;
  active: boolean;
  billing_scheme: string;
  created: number;
  currency: string;
  custom_unit_amount: any;
  livemode: boolean;
  lookup_key: any;
  metadata?: any;
  nickname: any;
  product: string;
  recurring: StripeRecurring;
  tax_behavior: string;
  tiers_mode: any;
  transform_quantity: any;
  type: string;
  unit_amount: number;
  unit_amount_decimal: string;
};

export interface StripeItem {
  id: string;
  object: string;
  billing_thresholds: string | null;
  created: number;
  current_period_end?: number;
  current_period_start?: number;
  discounts?: any[];
  metadata?: any;
  plan: StripePlan;
  price: StripePrice;
  quantity: number;
  subscription: string;
  tax_rates: string[];
};

export interface StripePaymentSettings {
  payment_method_options: string | null;
  payment_method_types: string | null;
  save_default_payment_method: string;
};

export interface StripeEndBehavior {
  missing_payment_method: string;
};

export interface StripeTrialSettings {
  end_behavior: StripeEndBehavior;
};

export interface StripeSubscription {
  id: string;
  automatic_tax: {  enabled: boolean;
  liability: unknown;
  disabled_reason: string | null;};
  billing_cycle_anchor: number;
  billing_thresholds: string | null;
  cancel_at: number | null;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  cancellation_details: StripeCancellationDetails;
  collection_method: string;
  created: number;
  currency: string;
  current_period_end?: number;
  current_period_start?: number;
  customer: string;
  days_until_due: number | null;
  default_payment_method: string | null;
  description: string | null;
  discount?: string | null;
  discounts: string[] | null;
  ended_at: string | null;
  invoice_settings: StripeInvoiceSettings;
  items: StripeItem[];
  latest_invoice: string;
  livemode: boolean;
  next_pending_invoice_item_invoice: string | null;
  on_behalf_of: string | null;
  pause_collection: string | null;
  payment_settings: StripePaymentSettings;
  pending_invoice_item_interval: string | null;
  pending_setup_intent: string | null;
  schedule: string | null;
  start_date: number;
  status: string;
  transfer_data: string | null;
  trial_end?: number | null;
  trial_settings: StripeTrialSettings;
  trial_start?: number | null;
};

export interface StripeSubscriptionsResponse {
  object: string;
  data: StripeSubscription[];
  has_more: boolean;
  url: string;
};

export interface ShortcutEpicAssociatedGroup {
  associated_stories_count: number;
  group_id: string;
};

export interface ShortcutEpicLabelSlim {
  app_url: string;
  archived: boolean;
  color: string | null;
  created_at: string | null;
  description: string | null;
  entity_type: string;
  external_id: string | null;
  id: number;
  name: string;
  updated_at: string | null;
};

export interface ShortcutEpicStats {
  last_story_update: string | null;
  num_points: number;
  num_points_backlog: number;
  num_points_done: number;
  num_points_started: number;
  num_points_unstarted: number;
  num_related_documents: number;
  num_stories_backlog: number;
  num_stories_done: number;
  num_stories_started: number;
  num_stories_total: number;
  num_stories_unestimated: number;
  num_stories_unstarted: number;
};

export interface ShortcutEpicThreadedComment {
  app_url: string;
  author_id: string;
  comments: any[];
  created_at: string;
  deleted: boolean;
  entity_type: string;
  external_id: string | null;
  group_mention_ids: string[];
  id: number;
  member_mention_ids: string[];
  mention_ids: string[];
  text: string;
  updated_at: string;
};

export interface ShortcutEpic {
  app_url: string;
  archived: boolean;
  associated_groups: ShortcutEpicAssociatedGroup[] | null;
  completed: boolean;
  completed_at: string | null;
  completed_at_override: string | null;
  comments?: ShortcutEpicThreadedComment[] | null;
  created_at: string | null;
  deadline: string | null;
  description: string;
  entity_type: string;
  epic_state_id: number;
  external_id: string | null;
  follower_ids: string[];
  group_id: string;
  group_ids: string[];
  group_mention_ids: string[];
  health?: any | null;
  id: number;
  label_ids: number[];
  labels: ShortcutEpicLabelSlim[];
  member_mention_ids: string[];
  mention_ids: string[];
  milestone_id: number | null;
  name: string | null;
  global_id: string | null;
  objective_ids: number[];
  owner_ids: string[];
  planned_start_date: string | null;
  position: number;
  productboard_id: string | null;
  productboard_name: string | null;
  productboard_plugin_id: string | null;
  productboard_url: string | null;
  project_ids: number[];
  requested_by_id: string;
  started: boolean;
  started_at: string | null;
  started_at_override: string | null;
  state: string;
  stats: ShortcutEpicStats;
  stories_without_projects: number;
  updated_at: string | null;
};

export interface ShortcutObjectiveCategory {
  archived: boolean;
  color: string | null;
  created_at: string;
  entity_type: string;
  external_id: string | null;
  id: number;
  name: string;
  updated_at: string;
};

export interface ShortcutObjectiveStats {
  average_cycle_time?: number;
  average_lead_time?: number;
  num_related_documents?: number;
};

export interface ShortcutObjective {
  app_url: string;
  archived: boolean;
  categories: ShortcutObjectiveCategory[];
  completed: boolean;
  completed_at: string | null;
  completed_at_override: string | null;
  created_at: string;
  description: string;
  entity_type: string;
  global_id?: string | null;
  id: number;
  key_result_ids: string[];
  name: string;
  position: number;
  started: boolean;
  started_at: string | null;
  started_at_override: string | null;
  state: string;
  stats: ShortcutObjectiveStats;
  updated_at: string;
};

export interface ShortcutMemberIcon {
  created_at: string;
  entity_type: string;
  id: string;
  updated_at: string;
  url: string;
};

export interface ShortcutMemberProfile {
  deactivated: boolean;
  display_icon: ShortcutMemberIcon | null;
  email_address: string | null;
  entity_type: string;
  gravatar_hash: string | null;
  id: string;
  is_owner: boolean;
  mention_name: string;
  name: string | null;
  two_factor_auth_activated: boolean;
};

export interface ShortcutMember {
  created_at: string | null;
  created_without_invite?: boolean;
  disabled: boolean;
  entity_type: string;
  global_id?: string | null;
  group_ids: string[];
  id: string;
  profile: ShortcutMemberProfile;
  role: string;
  state: string;
  updated_at: string | null;
};

export interface ShortcutGroup {
  app_url: string;
  archived: boolean;
  color: string | null;
  color_key: string | null;
  default_workflow_id: number | null;
  description: string;
  display_icon: ShortcutMemberIcon | null;
  entity_type: string;
  global_id?: string | null;
  id: string;
  member_ids: string[];
  mention_name: string;
  name: string;
  num_epics_started: number;
  num_stories: number;
  num_stories_backlog: number;
  num_stories_started: number;
  workflow_ids: number[];
};

export interface StripeCustomerAddress {
  city: string | null;
  country: string | null;
  line1: string | null;
  line2: string | null;
  postal_code: string | null;
  state: string | null;
}

export interface StripeCustomerShipping {
  address: StripeCustomerAddress;
  name: string;
  phone: string | null;
}

export type StripeAutomaticTaxStatus = 'failed' | 'not_collecting' | 'supported' | 'unrecognized_location';

export type StripeTaxLocationSource = 'billing_address' | 'ip_address' | 'payment_method' | 'shipping_address';

export interface StripeCustomerTaxLocation {
  country: string;
  source: StripeTaxLocationSource;
  state: string | null;
}

export interface StripeCustomerTax {
  automatic_tax: StripeAutomaticTaxStatus;
  ip_address: string | null;
  location: StripeCustomerTaxLocation | null;
}

export type StripeReconciliationMode = 'automatic' | 'manual';

export interface StripeCashBalanceSettings {
  reconciliation_mode: StripeReconciliationMode;
  using_merchant_default: boolean;
}

export interface StripeCashBalance {
  object: string;
  available: any | null;
  customer: string;
  livemode: boolean;
  settings: StripeCashBalanceSettings;
}

export type StripeTaxExempt = 'exempt' | 'none' | 'reverse';

export interface StripeCustomer {
  id: string;
  address?: StripeCustomerAddress | null;
  description?: string | null;
  email?: string | null;
  metadata: Record<string, string>;
  name?: string | null;
  phone?: string | null;
  shipping?: StripeCustomerShipping | null;
  tax?: StripeCustomerTax;
  object: string;
  balance: number;
  cash_balance?: StripeCashBalance | null;
  created: number;
  currency?: string | null;
  default_source?: string | null;
  delinquent?: boolean | null;
  discount?: any | null;
  invoice_credit_balance?: any | null;
  invoice_prefix?: string | null;
  invoice_settings: any;
  livemode: boolean;
  next_invoice_sequence?: number | null;
  preferred_locales?: string[] | null;
  sources?: any | null;
  subscriptions?: any | null;
  tax_exempt?: StripeTaxExempt | null;
  tax_ids?: any | null;
  test_clock?: string | null;
}

export interface StripeProductPackageDimensions {
  height: number;
  length: number;
  weight: number;
  width: number;
}

export interface StripeProductMarketingFeature {
  name?: string | null;
}

export interface StripeProduct {
  id: string;
  object: string;
  active: boolean;
  attributes?: string[] | null;
  default_price?: StripePrice | null;
  description?: string | null;
  metadata: Record<string, string>;
  name: string;
  tax_code: string | null;
  created: number; // UNIX timestamp
  images: string[];
  livemode: boolean;
  marketing_features?: StripeProductMarketingFeature[];
  package_dimensions?: StripeProductPackageDimensions | null;
  shippable?: boolean | null;
  statement_descriptor?: string | null;
  type?: string | null;
  unit_label?: string | null;
  updated: number; // UNIX timestamp
  url?: string | null;
}

export interface SupabaseProject {
  id: string; // Id of your project
  organization_id: string; // Slug of your organization
  name: string; // Name of your project
  region: string; // Region of your project (e.g., "us-east-1")
  created_at: string; // ISO 8601 timestamp (e.g., "2023-03-29T16:32:59Z")
  status:
    | "INACTIVE"
    | "ACTIVE_HEALTHY"
    | "ACTIVE_UNHEALTHY"
    | "COMING_UP"
    | "UNKNOWN"
    | "GOING_DOWN"
    | "INIT_FAILED"
    | "REMOVED"
    | "RESTORING"
    | "UPGRADING"
    | "PAUSING"
    | "RESTORE_FAILED"
    | "RESTARTING"
    | "PAUSE_FAILED"
    | "RESIZING";
  database: {
    host: string; // Database host
    version: string; // Database version
    postgres_engine: string; // Database engine
    release_channel: string; // Release channel
  };
}

export interface SmartleadCampaign {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  status: string;
  name: string;
  track_settings: string | string[];
  scheduler_cron_value: {  tz: string;
  days: number[];
  endHour: string;
  startHour: string;};
  min_time_btwn_emails: number;
  max_leads_per_day: number;
  stop_lead_settings: string;
  unsubscribe_text: string | null;
  client_id: number | null;
  enable_ai_esp_matching?: boolean;
  send_as_plain_text?: boolean;
  follow_up_percentage?: number;
  parent_campaign_id?: number | null;
};

export interface SmartleadClient {
  id: number;
  name: string;
  email: string;
  uuid: string;
  created_at: string;
  user_id: number;
  logo: string | null;
  logo_url: string | null;
  client_permision: {  permission: string[];
  retricted_category: string[];};
};

export interface SmartleadLeadsCategory {
  id: number;
  created_at: string;
  name: string;
};

export interface SmartleadCampaignStatistic {
  lead_name: string;
  lead_email: string;
  lead_category: string | null;
  sequence_number: number;
  email_campaign_seq_id: number;
  seq_variant_id: number;
  email_subject: string;
  email_message: string;
  sent_time: string;
  open_time: string | null;
  click_time: string | null;
  reply_time: string | null;
  open_count: number;
  click_count: number;
  is_unsubscribed: boolean;
  is_bounced: boolean;
  stats_id?: string | null;
};

export interface SmartleadCampaignStatisticResponse {
  offset: number;
  limit: number;
  data: SmartleadCampaignStatistic[];
  total_stats: string;
};

export interface SmartleadCampaignTopLevelAnalytics {
  id: number;
  user_id: number;
  created_at: string;
  status: string;
  name: string;
  sent_count: string;
  open_count: string;
  click_count: string;
  reply_count: string;
  block_count: string;
  total_count: string;
  drafted_count: string;
  bounce_count: string;
  unsubscribed_count: string;
  sequence_count: string;
  tags: any[] | null;
  unique_open_count: string;
  unique_click_count: string;
  unique_sent_count: string;
  client_id: number;
  client_name: string;
  client_email: string;
  parent_campaign_id: number | null;
  campaign_lead_stats: {  total: number;
  blocked: number;
  stopped: number;
  completed: number;
  inprogress: number;
  notStarted: number;
  paused: number;
  revenue: number;
  interested: number;};
  team_member_id: number | null;
  send_as_plain_text: boolean;
  client_company_name?: string;
};

export interface SmartleadLead {
  id: number | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  company_name?: string | null;
  website?: string | null;
  location?: string | null;
  custom_fields: any | null;
  linkedin_profile?: string | null;
  company_url?: string | null;
  is_unsubscribed: boolean | null;
  unsubscribed_client_id_map?: any | null;
  lead_category_id?: string | null;
};

export interface SmartleadQueryParams {
  limit?: number;
  offset?: number;
  campaign_id: string;
};

export interface SalesforceObjAttributes {
  type: string;
  url: string;
};

export interface SalesforceCampaign {
  attributes: SalesforceObjAttributes;
  id: string;
  actual_cost: number | null;
  budgeted_cost: number | null;
  amount_won_opportunities: number;
  expected_revenue: number | null;
  number_sent: number | null;
  total_emails_delivered: number | null;
  unique_email_opens: number | null;
  unique_email_tracked_link_clicks: number | null;
  number_of_responses: number | null;
  number_of_leads: number | null;
  number_of_converted_leads: number | null;
  number_of_opportunities: number | null;
  number_of_won_opportunities: number | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
};

export interface SalesforceCustomField {
  attributes: SalesforceObjAttributes;
  id: string;
  developer_name: string | null;
  manageable_state: string | null;
  metadata?: any | null;
  namespace_prefix: string | null;
  table_enum_or_id: string | null;
};

export interface SalesforceCustomObjectField {
  aggregatable?: boolean;
  aiPredictionField?: boolean;
  autoNumber?: boolean;
  byteLength?: number;
  calculated?: boolean;
  calculatedFormula?: string | null;
  cascadeDelete?: boolean;
  caseSensitive?: boolean;
  compoundFieldName?: string | null;
  controllerName?: string | null;
  createable?: boolean;
  custom?: boolean;
  defaultValue?: string | boolean | null;
  defaultValueFormula?: string | null;
  defaultedOnCreate?: boolean;
  dependentPicklist?: boolean;
  deprecatedAndHidden?: boolean;
  digits?: number;
  displayLocationInDecimal?: boolean;
  encrypted?: boolean;
  externalId?: boolean;
  extraTypeInfo?: string | null;
  filterable?: boolean;
  filteredLookupInfo?: string | null;
  formulaTreatNullNumberAsZero?: boolean;
  groupable?: boolean;
  highScaleNumber?: boolean;
  htmlFormatted?: boolean;
  idLookup?: boolean;
  inlineHelpText?: string | null;
  label?: string;
  length?: number;
  mask?: string | null;
  maskType?: string | null;
  name?: string;
  nameField?: boolean;
  namePointing?: boolean;
  nillable?: boolean;
  permissionable?: boolean;
  picklistValues?: string[];
  polymorphicForeignKey?: boolean;
  precision?: number;
  queryByDistance?: boolean;
  referenceTargetField?: string | null;
  referenceTo?: string[];
  relationshipName?: string | null;
  relationshipOrder?: string | null;
  restrictedDelete?: boolean;
  restrictedPicklist?: boolean;
  scale?: number;
  searchPrefilterable?: boolean;
  soapType?: string;
  sortable?: boolean;
  type?: string;
  unique?: boolean;
  updateable?: boolean;
  writeRequiresMasterRead?: boolean;
};

export interface SalesforceCustomObject {
  attributes: SalesforceObjAttributes;
  id: string;
  custom_help_id: string | null;
  description: string | null;
  developer_name: string | null;
  external_name: string | null;
  language: string | null;
  manageable_state: string | null;
  namespace_prefix: string | null;
  sharing_model: string | null;
};

export interface SalesforceSuccessResponse {
  success: boolean;
};

export interface UpdateSalesforceCustomFieldInput {
  id: string;
  developer_name?: string | undefined;
  manageable_state?: string | undefined;
  metadata?: any | undefined;
  namespace_prefix?: string | undefined;
  table_enum_or_id?: string | undefined;
};

export interface GetSalesforceObjectInput {
  id: string;
};

export interface SalesforceCreateOpportunityInput {
  account_id?: string | undefined;
  amount?: number | undefined;
  description?: string | undefined;
  created_by_id?: string | undefined;
  owner_id?: string | undefined;
  probability?: number | undefined;
  type?: string | undefined;
  opportunity_name: string;
  close_date: string;
  stage: string;
};

export interface SalesforceCreateObjectResponse {
  id: string;
  success: boolean;
  errors: any[];
};

export interface SalesforceUpdateOpportunityInput {
  account_id?: string | undefined;
  amount?: number | undefined;
  description?: string | undefined;
  created_by_id?: string | undefined;
  owner_id?: string | undefined;
  probability?: number | undefined;
  type?: string | undefined;
  opportunity_name?: string | undefined;
  close_date?: string | undefined;
  stage?: string | undefined;
};

export interface SalesforceCreateAccountInput {
  description?: string | undefined;
  website?: string | undefined;
  industry?: string | undefined;
  billing_city?: string | undefined;
  billing_country?: string | undefined;
  owner_id?: string | undefined;
  name: string;
};

export interface SalesforceUpdateAccountInput {
  description?: string | undefined;
  website?: string | undefined;
  industry?: string | undefined;
  billing_city?: string | undefined;
  billing_country?: string | undefined;
  owner_id?: string | undefined;
  name?: string | undefined;
};

export interface SalesforceCreateLeadInput {
  first_name?: string | undefined;
  email?: string | undefined;
  owner_id?: string | undefined;
  phone?: string | undefined;
  salutation?: string | undefined;
  title?: string | undefined;
  website?: string | undefined;
  industry?: string | undefined;
  last_name: string;
  company_name: string;
};

export interface SalesforceUpdateLeadInput {
  first_name?: string | undefined;
  email?: string | undefined;
  owner_id?: string | undefined;
  phone?: string | undefined;
  salutation?: string | undefined;
  title?: string | undefined;
  website?: string | undefined;
  industry?: string | undefined;
  last_name?: string | undefined;
  company_name?: string | undefined;
};

export interface SalesforceCreateRecordInput {
  object_name: string;
  fields: any;
};

export interface SalesforceGetCustomObjectRecordsMetadataInput {
  object_name: string;
};

export interface SalesforceCustomObjectRecord {
  attributes: SalesforceObjAttributes;
  id: string;
  owner_id?: string;
  is_deleted?: boolean;
  name?: string;
  created_date?: string;
  created_by_id?: string;
  last_modified_date?: string;
  last_modified_by_id?: string;
};

export interface SalesforceCustomObjectNameInput {
  object_name: string;
};

export interface SalesforceCustomObjectDescribe {
  action_overrides: any[];
  activateable: boolean;
  associate_entity_type: string | null;
  associate_parent_entity: string | null;
  child_relationships: any[];
  compact_layoutable: boolean;
  createable: boolean;
  custom: boolean;
  custom_setting: boolean;
  data_translation_enabled?: boolean | undefined;
  deep_cloneable: boolean;
  default_implementation: string | null;
  deletable: boolean;
  deprecated_and_hidden: boolean;
  extended_by: string | null;
  extends_interfaces: string | null;
  feed_enabled: boolean;
  fields: SalesforceCustomObjectField[];
  implemented_by: string | null;
  implements_interfaces: string | null;
  is_interface: boolean;
  key_prefix: string;
  label: string;
  label_plural: string;
  layoutable: boolean;
  mergeable: boolean;
  mru_enabled: boolean;
  name: string;
  named_layout_infos: any[];
  network_scope_field_name: string | null;
  queryable: boolean;
  record_type_infos: any[];
  replicateable: boolean;
  retrieveable: boolean;
  searchable: boolean;
  search_layoutable: boolean;
  supported_scopes: ({  label: string;
  name: string;})[];
  triggerable: boolean;
  undeletable: boolean;
  updateable: boolean;
  url_detail?: string | undefined;
  url_edit?: string | undefined;
  url_new?: string | undefined;
};

export interface AsanaProject {
  id: string;
  gid: string;
  name: string;
  resource_type: string;
};

export interface AsanaUser {
  created_at: string | null;
  modified_at: string | null;
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
};

export interface AsanaTask {
  created_at: string | null;
  modified_at: string | null;
  id: string;
  title: string;
  url: string;
  status: string;
  description: string | null;
  assignee: AsanaUser | null;
  due_date: string | null;
};

export interface AsanaWorkspace {
  gid: string;
  resource_type: string;
  name: string;
  id: string;
  is_organization: boolean;
};

/**
 * Parameters for querying tasks within an Asana project.
 * This interface represents the supported query parameters for the
 * Asana "Get tasks from a project" API endpoint.
 */
export interface AsanaProjectTasksQueryParams {
  project_gid: string;
  /**
   * Optional fields to include in the response.
   * By default, some fields are omitted. To retrieve them,
   * provide a comma-separated list of field names here.
   * Example: "name,created_by.name,assignee_section.name"
   */
  opt_fields?: string;

  /**
   * Only return tasks that are incomplete or have been completed
   * after the specified time.
   * Accepts either an ISO 8601 date-time string or the keyword `"now"`.
   * Example: "2025-07-01T00:00:00Z" or "now"
   */
  completed_since?: string;

  /**
   * Format the response to be human-readable.
   * Adds whitespace and indentation to the response JSON for easier debugging.
   * Not recommended for production due to increased payload size.
   */
  opt_pretty?: boolean;

  /**
   * Maximum number of tasks to return per page.
   * Must be an integer between 1 and 100.
   * Helps control pagination and response size.
   */
  limit?: number;

  /**
   * Offset token for paginated results.
   * Use the `offset` value returned from a previous API response to
   * retrieve the next page of results.
   * Only use offsets provided by the Asana API—do not construct your own.
   */
  offset?: string;
}

/**
 * Represents a task object returned from the Asana API when querying tasks in a project.
 * Includes core task metadata and pagination support (if returned at the root level).
 */
export interface AsanaProjectTask {
  /**
   * Globally unique identifier for the task.
   * Always returned as a string.
   * Example: "1234567890"
   */
  gid: string;

  /**
   * The base type of the resource.
   * For tasks, this will usually be "task".
   * Example: "task"
   */
  resource_type?: string;

  /**
   * The name or title of the task.
   * This is typically user-defined.
   * Example: "Fix login bug"
   */
  name?: string;

  /**
   * The specific subtype of the task.
   * Determines semantic meaning and UI behavior in Asana.
   * Common subtypes: "default_task", "milestone", "approval".
   * Note: Tasks with subtype "milestone" represent a single moment in time
   * and cannot have a `start_date`.
   */
  resource_subtype?: string;

  /**
   * (Optional) The user who created the task.
   * This field requires opt-in via `opt_fields=created_by`.
   */
  created_by?: {
    /**
     * Globally unique identifier of the user.
     */
    gid: string;

    /**
     * The base type of this resource. Usually "user".
     */
    resource_type: string;
  };
}

/**
 * Optional pagination metadata that may be included in the response
 * when using the `limit` query parameter.
 */
export interface AsanaResponseNextPage {
  /**
   * The offset token used to fetch the next page of results.
   * Pass this value as the `offset` parameter in the next request.
   */
  offset: string;

  /**
   * A relative path (to the API base URL) for the next page of results.
   */
  path: string;

  /**
   * A fully-qualified URI for the next page of results.
   */
  uri: string;
}

/**
 * Represents the full response structure when querying project tasks,
 * including the list of tasks and optional pagination metadata.
 */
export interface AsanaProjectTasksResponse {
  data: AsanaProjectTask[] | Partial<AsanaProjectTask>[] | Record<string, unknown>[];

  /**
   * Optional pagination object.
   * Present only if the number of tasks exceeds the `limit` and there are more results to fetch.
   * If no more pages are available, this will be null.
   */
  next_page?: AsanaResponseNextPage | null;
}

export interface SalesforceWhoAmI {
  id: string;
  email: string;
};

/**
 * Parameters for querying custom fields within an Asana workspace.
 * This interface represents the supported query parameters for the
 * Asana "Get custom fields from a workspace" API endpoint.
 */
export interface AsanaWorkspaceCustomFieldsQueryParams {
  workspace_gid: string;
  /**
   * Optional fields to include in the response.
   * By default, some fields are omitted. To retrieve them,
   * provide a comma-separated list of field names here.
   * Example: "name,created_by.name,assignee_section.name"
   */
  opt_fields?: string;

  /**
   * Format the response to be human-readable.
   * Adds whitespace and indentation to the response JSON for easier debugging.
   * Not recommended for production due to increased payload size.
   */
  opt_pretty?: boolean;

  /**
   * Maximum number of tasks to return per page.
   * Must be an integer between 1 and 100.
   * Helps control pagination and response size.
   */
  limit?: number;

  /**
   * Offset token for paginated results.
   * Use the `offset` value returned from a previous API response to
   * retrieve the next page of results.
   * Only use offsets provided by the Asana API—do not construct your own.
   */
  offset?: string;
}

/**
 * Represents a single enum option used in enum or multi_enum custom fields.
 */
export interface AsanaWorkspaceCustomFieldEnumOption {
  /** Unique identifier of the enum option */
  gid: string;

  /** The base type of this resource. Typically "enum_option" */
  resource_type: string;

  /** Display name of the enum option */
  name: string;

  /** If true, the enum option can be selected in forms/UI */
  enabled: boolean;

  /** Visual color tag associated with this enum option */
  color: string;
}

/**
 * Represents a compact user object.
 */
export interface AsanaWorkspaceCustomFieldUserCompact {
  gid: string;
  resource_type: string;
  name: string;
}

/**
 * Represents a single custom field within a workspace.
 */
export interface AsanaWorkspaceCustomField {
  gid: string;
  resource_type: string;
  name: string;

  /**
   * Deprecated. Use `resource_subtype` instead.
   * Type of the custom field: text, enum, multi_enum, number, date, people
   */
  type: string;

  /** If the field is enum or multi_enum, this lists possible enum options. */
  enum_options?: AsanaWorkspaceCustomFieldEnumOption[];

  /** Whether this field is globally available in the workspace */
  is_global_to_workspace: boolean;

  /** If true, this field is enabled and can be used */
  enabled?: boolean;

  /** Provides the data type this field represents */
  representation_type: 'text' | 'enum' | 'multi_enum' | 'number' | 'date' | 'people' | 'formula' | 'custom_id';

  /** Custom field ID prefix, if available */
  id_prefix: string | null;

  /** Indicates if this is a formula-based custom field */
  is_formula_field?: boolean;

  /** Description of the custom field (opt-in) */
  description?: string;

  /** Precision for number-type fields (0–6), e.g., 2 = hundredths */
  precision?: number;

  /**
   * Format of the number: currency, percentage, identifier, etc.
   * Only relevant for number fields.
   */
  format?: 'currency' | 'identifier' | 'percentage' | 'custom' | 'duration' | 'none';

  /** ISO 4217 currency code, e.g., "USD", "EUR" — only for `currency` format */
  currency_code?: string | null;

  /** Custom string shown next to the field value — only for custom format */
  custom_label?: string | null;

  /** Position of custom label (prefix or suffix) — only for custom format */
  custom_label_position?: 'prefix' | 'suffix' | null;

  /** If true, followers are notified of changes */
  has_notifications_enabled?: boolean;

  /** System-defined ID that links the field to a template source */
  asana_created_field?: string | null;

  /** Readable string representation of the field’s value */
  display_value?: string | null;

  /** Actual text value if this is a text field */
  text_value?: string | null;

  /** Actual number value if this is a number field */
  number_value?: number | null;

  /** Chosen enum value for enum fields */
  enum_value?: AsanaWorkspaceCustomFieldEnumOption | null;

  /** Selected values for multi_enum fields */
  multi_enum_values?: AsanaWorkspaceCustomFieldEnumOption[];

  /** Date value object for date-type custom fields */
  date_value?: {
    /** Date in YYYY-MM-DD format */
    date: string;

    /** ISO 8601 datetime string (can be null) */
    date_time: string | null;
  } | null;

  /** True if this field is read-only */
  is_value_read_only?: boolean;

  /** Assigned people for people-type fields */
  people_value?: AsanaWorkspaceCustomFieldUserCompact[];

  /** Creator of the field */
  created_by?: AsanaWorkspaceCustomField | null;

  /** Controls who can view the custom field */
  privacy_setting?: 'public_with_guests' | 'public' | 'private';

  /** Default access level when inviting new users */
  default_access_level?: 'admin' | 'editor' | 'user';

    /**
   * Newer replacement for `type`.
   * Indicates the specific type/subtype of the custom field.
   */
  resource_subtype: 'text' | 'enum' | 'multi_enum' | 'number' | 'date' | 'people';
}

/**
 * Represents pagination metadata for paged custom field results.
 */
export interface AsanaNextPage {
  /** Token to use in the next request to continue paging */
  offset: string;

  /** Relative path to fetch the next page */
  path: string;

  /** Full URI to fetch the next page */
  uri: string;
}

/**
 * Full API response structure for listing custom fields in a workspace.
 */
export interface AsanaWorkspaceCustomFieldsResponse {
  /** Array of custom field definitions available in the workspace */
  data: AsanaWorkspaceCustomField[] | Partial<AsanaWorkspaceCustomField>[] | Record<string, unknown>[];

  /** Pagination information if there are more results to retrieve */
  next_page?: AsanaResponseNextPage | null;
}

export interface AttioDomain {
  domain: string;
  root_domain: string;
}

export interface AttioCompanyLocation {
  country_code?: string | undefined;
  line_1?: string | undefined | null;
  line_2?: string | undefined | null;
  city?: string | undefined;
  state?: string | undefined;
  postal_code?: string | undefined;
}

export interface AttioSocialLink {
  linkedin?: string[] | undefined;
  twitter?: string[] | undefined;
  facebook?: string[] | undefined;
  instagram?: string[] | undefined;
  angellist?: string[] | undefined;
}

export interface AttioCompany {
  id: string;
  workspace_id: string;
  created_at: string;
  web_url: string;
  name?: string | undefined;
  domains?: AttioDomain[] | undefined;
  description?: string | undefined;
  team_member_ids?: string[] | undefined;
  location?: AttioCompanyLocation | undefined;
  categories?: string[] | undefined;
  logo_url?: string | undefined;
  twitter_follower_count?: number | undefined;
  foundation_date?: string | undefined;
  estimated_arr_usd?: number | undefined;
  social_links?: AttioSocialLink | undefined;
}

export interface AttioDeal {
  id: string;
  workspace_id: string;
  created_at: string;
  web_url: string;
  name?: string | undefined;
  stage?: string | undefined;
  stage_id?: string | undefined;
  owner_id?: string | undefined;
  value?: number | undefined;
  currency?: string | undefined;
  associated_people_ids?: string[] | undefined;
  associated_company_id?: string | undefined;
}

export interface LemlistCampaign {
  id: string;
  name: string;
  labels?: string[];
  createdAt: string;
  createdBy: string;
  archived?: boolean;
  status: string;
  isEnded?: boolean;
  hasError?: boolean;
  errors?: string[];
};

export interface LemlistAddLeadToCampaignInput {
  campaignId: string;
  firstName?: string;
  email: string;
  lastName?: string;
  companyName?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  picture?: string;
  phone?: string;
  companyDomain?: string;
  icebreaker?: string;
};

export interface LemlistAddLeadToCampaignResponse {
  campaignId: string;
  campaignName: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  phone: string;
  linkedinUrl: string;
  companyName: string;
  companyDomain: string;
  icebreaker: string;
  jobTitle: string;
  isPaused?: boolean;
  id: string;
};

export interface LemlistCampaignStatsStep {
  /**
   * Step index in the sequence
   */
  index: number;
  /**
   * ID of the sequence
   */
  sequenceId: string;
  /**
   * Step number within the sequence
   */
  sequenceStep: number;
  /**
   * A/B test variant (if applicable)
   */
  abTest?: string;
  /**
   * Type of task (email, linkedinVisit, linkedinInvite, linkedinSend, phone, manual, conditional)
   */
  taskType?: string;
  /**
   * Label for conditional steps
   */
  conditionLabel?: string;
  /**
   * Number of LinkedIn invitations sent
   */
  invited: number;
  /**
   * Number of messages sent
   */
  sent: number;
  /**
   * Number of messages delivered
   */
  delivered: number;
  /**
   * Number of messages opened
   */
  opened: number;
  /**
   * Number of clicks from a message from this step
   */
  clicked: number;
  /**
   * Number of replies
   */
  replied: number;
  /**
   * Number of messages not delivered
   */
  notDelivered: number;
  /**
   * Number of messages bounced
   */
  bounced: number;
  /**
   * Number of unsubscribes from this step
   */
  unsubscribed: number;
};

export interface LemlistCampaignStats {
  /**
   * Total number of leads in the campaign
   */
  nbLeads: number;
  /**
   * Number of leads launched in the campaign
   */
  nbLeadsLaunched: number;
  /**
   * Number of leads that were successfully reached
   */
  nbLeadsReached: number;
  /**
   * Number of leads that opened messages
   */
  nbLeadsOpened: number;
  /**
   * Number of leads that interacted with messages (clicked, replied)
   */
  nbLeadsInteracted: number;
  /**
   * Number of leads that answered
   */
  nbLeadsAnswered: number;
  /**
   * Number of leads marked as interested
   */
  nbLeadsInterested: number;
  /**
   * Number of leads that unsubscribed
   */
  nbLeadsUnsubscribed: number;
  /**
   * Number of leads with interrupted sequences
   */
  nbLeadsInterrupted: number;
  /**
   * Total number of messages sent
   */
  messagesSent: number;
  /**
   * Number of messages that failed to send
   */
  messagesNotSent: number;
  /**
   * Number of messages that bounced
   */
  messagesBounced: number;
  /**
   * Number of messages successfully delivered
   */
  delivered: number;
  /**
   * Number of messages opened
   */
  opened: number;
  /**
   * Number of messages with clicks
   */
  clicked: number;
  /**
   * Number of messages that received replies
   */
  replied: number;
  /**
   * Number of LinkedIn invitations accepted
   */
  invitationAccepted: number;
  /**
   * Number of meetings booked
   */
  meetingBooked: number;
  steps: LemlistCampaignStatsStep[];
};

export interface LemlistCampaignStatsQueryParams {
  campaignId: string;
  /**
   * Start date in YYYY-MM-DD format
   * Default: 1960-01-01
   */
  startDate?: string;
  /**
   * End date in YYYY-MM-DD format
   * Default: today
   */
  endDate?: string;
  /**
   * Sender user ID (must start with 'usr_' and be 21 characters long)
   */
  sendUser?: string;
  /**
   * A/B version filter (possible values: 'A' or 'B')
   */
  ABSelected?: string;
  /**
   * JSON array of channels to include (possible values: 'email', 'linkedin', 'others')
   * example: '["email", "linkedin"]'
   */
  channels?: string;
};

// Gandhi Capital Tracker Models
export interface LimitedPartner {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  phone?: string;
  linkedin_url?: string;
  avatar_url?: string; // URL to the LP's profile picture
  investment_amount: number;
  commitment_date: string;
  status: 'active' | 'inactive';
  partner_type: 'general_partner' | 'venture_partner' | 'limited_partner';
  expertise_areas: string[]; // e.g., ['AI/ML', 'Enterprise Software', 'FinTech']
  notes?: string;
  added_to_google_group?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Founder {
  id: string;
  deal_id: string;
  name: string;
  bio?: string;
  linkedin_url?: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  sourcing_meeting_booked_at?: string; // timestamp when stage changed to sourcing_meeting_booked
  partner_review_started_at?: string; // timestamp when stage changed to partner_review
  close_date?: string; // date the deal was closed (signed_and_wired)
  id: string;
  // About the company
  company_name: string;
  company_url?: string;
  company_description_short?: string; // 50 characters or less
  
  // About the founders
  founders_location?: string; // Where are the founders located?
  company_base_location?: string; // Where would the company be based after being funded?
  
  // About the product
  demo_url?: string; // If you have a demo, give us a link
  
  // Traction / Progress
  working_duration?: string; // How long have each of you been working on this? (Please specify part-time vs full-time)
  has_revenue: boolean; // Do you have revenue?
  revenue_amount?: number; // If yes, how much?
  traction_progress?: string; // How far along are you?
  user_traction?: string; // Are people using your product?
  
  // Founder story & market insight
  founder_motivation?: string; // Why did you pick this idea? Domain expertise? How do you know people need this?
  why_good_fit?: string; // Why this could be a good fit for Gandhi Capital
  
  // Competition & differentiation
  competition_differentiation?: string; // Competitors and what you understand that they don't
  
  // About the round
  raising_amount?: number; // How much are they raising?
  safe_or_equity?: string; // SAFE or Equity?
  confirmed_amount: number; // How much is already confirmed?
  lead_investor?: string; // Is there a lead investor?
  co_investors?: string[]; // Any other co-investor?
  
  // Contract documentation
  contract_link?: string; // Link to the signed SAFE contract PDF
  
  // Existing fields
  industry: string;
  stage: 'sourcing' | 'sourcing_reached_out' | 'sourcing_meeting_booked' | 'sourcing_meeting_done_deciding' | 'partner_review' | 'offer' | 'signed' | 'signed_and_wired' | 'closed_lost_passed' | 'closed_lost_rejected';
  deal_size: number;
  valuation?: number;
  description: string;
  pitch_deck_url?: string;
  website_url?: string; // This might be duplicate with company_url, keeping for backward compatibility
  funding_round: string; // e.g., 'Seed', 'Series A', 'Series B'
  status: 'active' | 'archived';
  survey_deadline?: string; // Deadline for LPs to complete the survey (YYYY-MM-DD)
  created_by: string; // user who created the deal
  created_at: string;
  updated_at: string;
}

export interface DealWithFounders extends Deal {
  founders: Founder[];
}

// Response scales for customer development questions
export type PilotCustomerResponse = 
  | 'not_interested'          // Not interested - This doesn't seem like a fit for us
  | 'not_right_now'          // Not right now - Maybe in the future, but not currently a priority
  | 'need_more_info'         // Need more info - Tell me more about what's involved
  | 'cautiously_interested'  // Cautiously interested - Could be worth exploring, but I have concerns
  | 'interested_with_conditions' // Interested with conditions - Yes, if you can address [specific requirements]
  | 'very_interested'        // Very interested - This sounds promising, let's discuss details
  | 'hell_yes';              // Hell yes! - Absolutely, when can we start?

export type BuyingInterestResponse = 
  | 'definitely_not'         // Definitely not - This isn't something we'd purchase
  | 'unlikely'              // Unlikely - Hard to see us buying this
  | 'not_sure'              // Not sure - Would need to see pricing and more details
  | 'maybe'                 // Maybe - Could work if the price and features align
  | 'probably'              // Probably - Looks promising, assuming reasonable pricing
  | 'very_likely'           // Very likely - This solves a real problem we have
  | 'absolutely';           // Absolutely - We'd buy this right now if available

export type PainPointResponse = 
  | 'not_at_all'            // Not at all - This isn't an issue for us
  | 'rarely'                // Rarely - Happens occasionally but not a big deal
  | 'sometimes'             // Sometimes - It comes up but we manage fine
  | 'annoying'              // It's annoying - Definitely frustrating when it happens
  | 'real_problem'          // It's a real problem - This causes us significant issues
  | 'major_pain'            // It's a major pain - This is a serious problem that costs us time/money
  | 'critical';             // It's critical - This is one of our biggest challenges

export interface Vote {
  id: string;
  deal_id: string;
  lp_id: string;
  conviction_level?: 1 | 2 | 3 | 4; // 1=No, 2=Following pack, 3=Strong yes, 4=Strong yes + additional investment
  review_status?: 'to_review'; // Non-numeric review status for "To Review" votes
  strong_no?: boolean; // Strong no flag; counts separately and contributes -1 to net score
  comments?: string;
  // Pain/Solution Assessment
  has_pain_point?: boolean;
  pain_point_level?: PainPointResponse;
  solution_feedback?: string;
  pilot_customer_interest?: boolean;
  pilot_customer_response?: PilotCustomerResponse;
  pilot_customer_feedback?: string;
  would_buy?: boolean;
  buying_interest_response?: BuyingInterestResponse;
  buying_interest_feedback?: string;
  price_feedback?: string;
  additional_notes?: string;
  // Founder feedback
  founder_notes?: string; // General notes about the founding team
  founder_specific_notes?: string; // JSON string containing founder-specific notes
  created_at: string;
  updated_at: string;
}

export interface DecisionRequest {
  id: string;
  deal_id: string;
  title: string;
  description: string;
  voting_deadline: string;
  status: 'pending' | 'voting' | 'completed' | 'expired';
  required_votes?: number; // minimum number of votes needed
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Communication {
  id: string;
  type: 'email' | 'meeting' | 'call' | 'note';
  subject: string;
  content: string;
  deal_id?: string;
  lp_id?: string;
  sent_by: string;
  recipients: string[]; // array of LP IDs or email addresses
  scheduled_at?: string;
  sent_at?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface DealWithVotes extends Deal {
  excitement_note?: string;
  founders?: Founder[];
  votes: Vote[];
  total_votes: number;
  strong_yes_plus_votes: number; // Level 4: Strong yes + additional investment
  strong_yes_votes: number; // Level 3: Strong yes
  following_pack_votes: number; // Level 2: Following the pack
  no_votes: number; // Level 1: No
  strong_no_votes?: number; // Strong No votes (separate flag)
  net_score?: number; // Net score = (L3 + L4) - strong_no_votes
}

export interface LPEngagement {
  lp_id: string;
  name: string; // LP name
  company: string; // LP company
  total_votes: number;
  response_rate: number; // percentage of survey requests they responded to
  average_confidence: number; // average conviction level (1-4)
  last_activity: string;
}

export interface FundMetrics {
  total_lps: number;
  total_committed: number;
  active_deals: number;
  deals_in_voting: number;
  average_response_rate: number;
  top_expertise_areas: { area: string; count: number }[];
}

export interface MonthlyUpdateMetrics {
  deals_evaluated?: number;
  new_investments?: number;
  portfolio_companies?: number;
  total_investment_amount?: number;
}

export interface Dinner {
  id: number;
  title: string;
  starts_at: string; // ISO timestamp
  city?: string;
  location?: string;
  google_calendar_event_id?: string;
  google_calendar_sync_status?: 'not_synced' | 'synced' | 'sync_failed';
  google_calendar_last_synced_at?: string;
  google_calendar_attendees_data?: GoogleCalendarAttendee[];
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  organizer?: boolean;
  self?: boolean;
}

export interface MonthlyUpdate {
  id: string;
  title: string;
  content: string;
  month: number; // 1-12
  year: number;
  metrics?: MonthlyUpdateMetrics; // Snapshot of metrics at time of update
  lemlist_campaign_id?: string; // Associated Lemlist campaign
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Chat/Channel Models for LP Communication
export interface Channel {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_email: string;
  joined_at: string;
  last_read_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_email: string;
  user_name: string;
  content: string;
  edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChannelWithDetails extends Channel {
  member_count?: number;
  unread_count?: number;
  last_message?: Message;
}

/**
 * Type definitions for CrustdataAPI responses
 */

/**
 * You must provide at least one of linkedin_profile_url or business_email
 */
export interface CrustdataEnrichmentApiQueryParams {
  /**
   * Comma-separated list of LinkedIn profile URLs.
   */
  linkedin_profile_url: string;
  /**
   * Comma-separated list of business email addresses.
   */
  business_email?: string;
  /**
   * If set to true, performs a real-time search from the web if data is not found in the database.
   */
  enrich_realtime?: boolean;
  /**
   * Comma-separated list of fields to return.
   */
  fields?: string;
}

export interface CrustdataEnrichmentApiResponse {
  profiles: CrustdataPersonProfile[];
  error?: string;
}

interface CrustdataEmployer {
  employer_name?: string;
  employer_linkedin_id?: string;
  employer_logo_url?: string;
  employer_linkedin_description?: string;
  employer_company_id?: number[];
  employer_company_website_domain?: string[];
  employee_position_id?: number;
  employee_title?: string;
  employee_description?: string;
  employee_location?: string;
  start_date?: string;
  end_date?: string;
}

interface CrustdataEducation {
  degree_name?: string;
  institute_name?: string;
  institute_linkedin_id?: string;
  institute_linkedin_url?: string;
  institute_logo_url?: string;
  field_of_study?: string;
  activities_and_societies?: string;
  start_date?: string;
  end_date?: string;
}

export interface CrustdataPersonProfile {
  linkedin_profile_url?: string;
  linkedin_flagship_url?: string;
  name?: string;
  location?: string;
  email?: string;
  title?: string;
  last_updated?: string;
  headline?: string;
  summary?: string;
  num_of_connections?: number;
  profile_picture_url?: string;
  profile_picture_permalink?: string;
  twitter_handle?: string;
  languages?: string[];
  enriched_realtime?: boolean;
  business_email?: string[];
  query_linkedin_profile_urn_or_slug?: string[];
  skills?: string[];
  all_employers?: CrustdataEmployer[];
  all_employers_company_id?: number[];
  all_titles?: string[];
  all_schools?: string[];
  all_degrees?: string[];
  current_employers?: CrustdataEmployer[];
  past_employers?: CrustdataEmployer[];
  education_background?: CrustdataEducation[];
  person_id?: number;
  score?: number;
}

