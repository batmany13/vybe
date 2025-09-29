import useSWR, { mutate } from "swr";
import axios from "axios";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Default fetcher for SWR
const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

// Helper to invalidate all relevant deals keys so UIs refresh instantly
async function invalidateDeals() {
  await Promise.all([
    mutate('/deals'),
    mutate('/deals?include_votes=true&include_founders=true')
  ]);
}

// User Profile types
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  karma_points: number;
  created_at: string;
  updated_at: string;
}

// Category types
export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  rules?: string;
  is_private: boolean;
  subscriber_count: number;
  created_by?: string;
  post_count?: number;
  created_at: string;
  updated_at: string;
}

// Post types
export interface Post {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  content?: string;
  url?: string;
  post_type: "text" | "link" | "image" | "poll";
  is_pinned: boolean;
  is_locked: boolean;
  is_deleted: boolean;
  vote_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  category?: {
    id: string;
    slug: string;
    name: string;
  };
  user_vote?: 1 | -1 | null; // Current user's vote
}

// Comment types
export interface Comment {
  id: string;
  post_id: string;
  parent_id?: string;
  author_id: string;
  content: string;
  is_deleted: boolean;
  is_edited: boolean;
  vote_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  replies?: Comment[];
  user_vote?: 1 | -1 | null;
}

// Vote types
export interface Vote {
  id: string;
  user_id: string;
  vote_type: 1 | -1;
  created_at: string;
}

// API Hooks

// Categories
export function useCategories() {
  return useSWR<Category[]>("/categories", fetcher);
}

export async function createCategory(data: {
  slug: string;
  name: string;
  description?: string;
  is_private?: boolean;
}) {
  try {
    const response = await apiClient.post<Category>("/categories", data);
    await mutate("/categories");
    return response.data;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
}

// Posts
export function usePosts() {
  return useSWR<Post[]>("/posts", fetcher);
}

export function usePost(postId: string) {
  return useSWR<Post>(postId ? `/posts/${postId}` : null, fetcher);
}

export function usePostsByCategory(categorySlug: string) {
  return useSWR<Post[]>(
    categorySlug ? `/posts?category=${categorySlug}` : null,
    fetcher
  );
}

export async function createPost(data: {
  title: string;
  content?: string;
  category_id: string;
  post_type?: "text" | "link" | "image" | "poll";
  url?: string;
}) {
  try {
    const response = await apiClient.post<Post>("/posts", data);
    await mutate("/posts");
    return response.data;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

export async function updatePost(postId: string, data: Partial<Post>) {
  try {
    const response = await apiClient.patch<Post>(`/posts/${postId}`, data);
    await mutate("/posts");
    await mutate(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
}

export async function deletePost(postId: string) {
  try {
    await apiClient.delete(`/posts/${postId}`);
    await mutate("/posts");
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

// Comments
export function useComments(postId: string) {
  return useSWR<Comment[]>(
    postId ? `/comments?postId=${postId}` : null,
    fetcher
  );
}

export async function createComment(data: {
  post_id: string;
  parent_id?: string;
  content: string;
}) {
  try {
    const response = await apiClient.post<Comment>("/comments", data);
    await mutate(`/comments?postId=${data.post_id}`);
    await mutate("/posts"); // Update post comment count
    return response.data;
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
}

export async function updateComment(commentId: string, content: string) {
  try {
    const response = await apiClient.patch<Comment>(`/comments/${commentId}`, {
      content,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
}

export async function deleteComment(commentId: string, postId: string) {
  try {
    await apiClient.delete(`/comments/${commentId}`);
    await mutate(`/comments?postId=${postId}`);
    await mutate("/posts");
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

// Voting
export async function voteOnPost(postId: string, voteType: 1 | -1) {
  try {
    const response = await apiClient.post(`/posts/${postId}/vote`, {
      vote_type: voteType,
    });
    await mutate("/posts");
    await mutate(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error("Error voting on post:", error);
    throw error;
  }
}

export async function voteOnComment(commentId: string, voteType: 1 | -1, postId: string) {
  try {
    const response = await apiClient.post(`/comments/${commentId}/vote`, {
      vote_type: voteType,
    });
    await mutate(`/comments?postId=${postId}`);
    return response.data;
  } catch (error) {
    console.error("Error voting on comment:", error);
    throw error;
  }
}

// User Profiles
export function useUserProfile(username: string) {
  return useSWR<UserProfile>(
    username ? `/users/${username}` : null,
    fetcher
  );
}

export async function updateUserProfile(
  username: string,
  data: Partial<UserProfile>
) {
  try {
    const response = await apiClient.patch<UserProfile>(
      `/users/${username}`,
      data
    );
    await mutate(`/users/${username}`);
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

// Search
export function useSearch(query: string) {
  return useSWR<{
    posts: Post[];
    comments: Comment[];
    users: UserProfile[];
  }>(query ? `/search?q=${encodeURIComponent(query)}` : null, fetcher);
}

// Trending/Hot Posts
export function useTrendingPosts() {
  return useSWR<Post[]>("/posts/trending", fetcher);
}

export function useHotPosts() {
  return useSWR<Post[]>("/posts/hot", fetcher);
}

// Dinner Events
export interface GoogleCalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  organizer?: boolean;
  self?: boolean;
}

export interface DinnerEvent {
  id: number;
  title: string;
  starts_at: string;
  city?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  google_calendar_event_id?: string;
  google_calendar_sync_status?: 'not_synced' | 'synced' | 'sync_failed';
  google_calendar_last_synced_at?: string;
  google_calendar_attendees_data?: GoogleCalendarAttendee[];
}

// Export Dinner type for compatibility
export type Dinner = DinnerEvent;

export function useDinners() {
  return useSWR<DinnerEvent[]>("/dinners", fetcher);
}

export function useDinner(dinnerId: number) {
  return useSWR<DinnerEvent>(dinnerId ? `/dinners/${dinnerId}` : null, fetcher);
}

// Monthly Updates
export interface MonthlyUpdate {
  id: string;
  title: string;
  content: string;
  month: number;
  year: number;
  metrics?: any;
  lemlist_campaign_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useMonthlyUpdates() {
  return useSWR<MonthlyUpdate[]>("/monthly-updates", fetcher);
}

export async function createMonthlyUpdate(data: Partial<MonthlyUpdate>) {
  try {
    const response = await apiClient.post<MonthlyUpdate>("/monthly-updates", data);
    await mutate("/monthly-updates");
    return response.data;
  } catch (error) {
    console.error("Error creating monthly update:", error);
    throw error;
  }
}

// Limited Partners
export interface LimitedPartner {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  phone?: string;
  linkedin_url?: string;
  avatar_url?: string;
  investment_amount: number;
  commitment_date: string;
  status: 'active' | 'inactive';
  partner_type: 'general_partner' | 'venture_partner' | 'limited_partner';
  expertise_areas: string[];
  notes?: string;
  added_to_google_group?: boolean;
  created_at: string;
  updated_at: string;
}

export function useLimitedPartners() {
  return useSWR<LimitedPartner[]>("/limited-partners", fetcher);
}

// Deals
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
  sourcing_meeting_booked_at?: string;
  partner_review_started_at?: string;
  close_date?: string;
  id: string;
  company_name: string;
  company_url?: string;
  company_description_short?: string;
  founders_location?: string;
  company_base_location?: string;
  demo_url?: string;
  working_duration?: string;
  has_revenue: boolean;
  revenue_amount?: number;
  traction_progress?: string;
  user_traction?: string;
  founder_motivation?: string;
  why_good_fit?: string;
  competition_differentiation?: string;
  raising_amount?: number;
  safe_or_equity?: string;
  confirmed_amount: number;
  lead_investor?: string;
  co_investors?: string[];
  contract_link?: string;
  industry: string;
  stage: 'sourcing' | 'sourcing_reached_out' | 'sourcing_meeting_booked' | 'sourcing_meeting_done_deciding' | 'partner_review' | 'offer' | 'signed' | 'signed_and_wired' | 'closed_lost_passed' | 'closed_lost_rejected';
  deal_size: number;
  valuation?: number;
  description: string | null;
  pitch_deck_url?: string;
  website_url?: string;
  funding_round: string;
  status: 'active' | 'archived';
  survey_deadline?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Pain/Solution Assessment types from models
export type PainPointResponse = 
  | 'not_at_all'
  | 'rarely'
  | 'sometimes'
  | 'annoying'
  | 'real_problem'
  | 'major_pain'
  | 'critical';

export type PilotCustomerResponse = 
  | 'not_interested'
  | 'not_right_now'
  | 'need_more_info'
  | 'cautiously_interested'
  | 'interested_with_conditions'
  | 'very_interested'
  | 'hell_yes';

export type BuyingInterestResponse = 
  | 'definitely_not'
  | 'unlikely'
  | 'not_sure'
  | 'maybe'
  | 'probably'
  | 'very_likely'
  | 'absolutely';

export interface Vote {
  id: string;
  deal_id: string;
  lp_id: string;
  conviction_level?: 1 | 2 | 3 | 4;
  review_status?: 'to_review';
  strong_no?: boolean;
  comments?: string;
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
  created_at: string;
  updated_at: string;
}

export interface DealWithVotesAndFounders extends Deal {
  excitement_note?: string;
  founders?: Founder[];
  votes: Vote[]; // Made required to match DealWithVotes from models
  total_votes: number;
  strong_yes_plus_votes: number;
  strong_yes_votes: number;
  following_pack_votes: number;
  no_votes: number;
  strong_no_votes?: number;
  to_review_votes?: number;
  net_score?: number;
}

// Also export as DealWithVotes for compatibility
export type DealWithVotes = DealWithVotesAndFounders;

export function useDealsWithVotesAndFounders() {
  return useSWR<DealWithVotesAndFounders[]>("/deals?include_votes=true&include_founders=true", fetcher);
}

export function useVotes() {
  return useSWR<Vote[]>("/votes", fetcher);
}

export async function deleteDeal(dealId: string) {
  try {
    await apiClient.delete(`/deals/${dealId}`);
    await invalidateDeals();
  } catch (error) {
    console.error("Error deleting deal:", error);
    throw error;
  }
}

export async function updateDeal(dealId: string, data: Partial<Deal>) {
  try {
    const response = await apiClient.put<Deal>(`/deals/${dealId}`, data);
    await invalidateDeals();
    await mutate(`/deals/${dealId}`);
    await mutate(`/deals/${dealId}?include_votes=true&include_founders=true`);
    return response.data;
  } catch (error) {
    console.error("Error updating deal:", error);
    throw error;
  }
}

export async function deleteMonthlyUpdate(updateId: string) {
  try {
    await apiClient.delete(`/monthly-updates/${updateId}`);
    await mutate("/monthly-updates");
  } catch (error) {
    console.error("Error deleting monthly update:", error);
    throw error;
  }
}

export async function updateMonthlyUpdate(updateId: string, data: Partial<MonthlyUpdate>) {
  try {
    const response = await apiClient.patch<MonthlyUpdate>(`/monthly-updates/${updateId}`, data);
    await mutate("/monthly-updates");
    return response.data;
  } catch (error) {
    console.error("Error updating monthly update:", error);
    throw error;
  }
}

// Deal functions
export function useDeals() {
  return useSWR<Deal[]>("/deals", fetcher);
}

export function useDeal(dealId: string) {
  return useSWR<DealWithVotesAndFounders>(dealId ? `/deals/${dealId}?include_votes=true&include_founders=true` : null, fetcher);
}



export async function createDeal(data: Partial<Deal>) {
  try {
    const response = await apiClient.post<Deal>("/deals", data);
    await invalidateDeals();
    return response.data;
  } catch (error) {
    console.error("Error creating deal:", error);
    throw error;
  }
}

// Limited Partner functions
export async function createLimitedPartner(data: Partial<LimitedPartner>) {
  try {
    const response = await apiClient.post<LimitedPartner>("/limited-partners", data);
    await mutate("/limited-partners");
    return response.data;
  } catch (error) {
    console.error("Error creating limited partner:", error);
    throw error;
  }
}

export async function updateLimitedPartner(lpId: string, data: Partial<LimitedPartner>) {
  try {
    const response = await apiClient.patch<LimitedPartner>(`/limited-partners/${lpId}`, data);
    await mutate("/limited-partners");
    return response.data;
  } catch (error) {
    console.error("Error updating limited partner:", error);
    throw error;
  }
}

export async function deleteLimitedPartner(lpId: string) {
  try {
    await apiClient.delete(`/limited-partners/${lpId}`);
    await mutate("/limited-partners");
  } catch (error) {
    console.error("Error deleting limited partner:", error);
    throw error;
  }
}

// Vote functions
export async function createVote(data: Partial<Vote> & { deal_links?: { title: string; url: string }[] }) {
  try {
    const response = await apiClient.post<Vote>("/votes", data);
    
    // Save deal links if provided
    if (data.deal_links && data.deal_links.length > 0 && data.deal_id && data.lp_id) {
      await apiClient.post(`/deals/${data.deal_id}/links`, {
        links: data.deal_links,
        lp_id: data.lp_id
      });
    }
    
    await mutate("/votes");
    await invalidateDeals();
    // Also invalidate the specific deal cache
    if (data.deal_id) {
      await mutate(`/deals/${data.deal_id}?include_votes=true&include_founders=true`);
    }
    return response.data;
  } catch (error) {
    console.error("Error creating vote:", error);
    throw error;
  }
}

// Deal Links
export function useDealLinks(dealId: string) {
  return useSWR<{ id: string; title: string; url: string; lp_id: string | null; created_at: string }[]>(
    dealId ? `/deals/${dealId}/links` : null,
    fetcher
  );
}

export async function deleteVote(voteId: string) {
  try {
    await apiClient.delete(`/votes/${voteId}`);
    await mutate("/votes");
    await invalidateDeals();
  } catch (error) {
    console.error("Error deleting vote:", error);
    throw error;
  }
}

// Dinner functions
export async function createDinner(data: Partial<DinnerEvent>) {
  try {
    const response = await apiClient.post<DinnerEvent>("/dinners", data);
    await mutate("/dinners");
    return response.data;
  } catch (error) {
    console.error("Error creating dinner:", error);
    throw error;
  }
}

export async function updateDinner(dinnerId: number, data: Partial<DinnerEvent>) {
  try {
    const response = await apiClient.put<DinnerEvent>(`/dinners/${dinnerId}`, data);
    await mutate("/dinners");
    await mutate(`/dinners/${dinnerId}`);
    return response.data;
  } catch (error) {
    console.error("Error updating dinner:", error);
    throw error;
  }
}

export async function deleteDinner(dinnerId: number) {
  try {
    await apiClient.delete(`/dinners/${dinnerId}`);
    await mutate("/dinners");
  } catch (error) {
    console.error("Error deleting dinner:", error);
    throw error;
  }
}

export async function syncDinnerWithCalendar(dinnerId: number) {
  try {
    const response = await apiClient.post(`/dinners/sync-calendar`, { dinner_id: dinnerId });
    await mutate("/dinners");
    await mutate(`/dinners/${dinnerId}`);
    return response.data;
  } catch (error) {
    console.error("Error syncing dinner with calendar:", error);
    throw error;
  }
}

// Investment Goals & Quarterly Stats
export interface InvestmentGoal {
  id?: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  target_deals: number;
  target_investment: number;
  actual_deals?: number;
  actual_investment?: number;
  created_at?: string;
  updated_at?: string;
}

export interface QuarterlyStats {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  deals_evaluated: number;
  deals_invested: number;
  total_invested: number;
  average_deal_size: number;
  portfolio_companies: number;
}

export function useInvestmentGoals() {
  return useSWR<InvestmentGoal[]>("/investment-goals", fetcher);
}

export function useQuarterlyStats() {
  return useSWR<QuarterlyStats[]>("/investment-goals/quarterly-stats", fetcher);
}

export async function createInvestmentGoals(data: Partial<InvestmentGoal>) {
  try {
    const response = await apiClient.post<InvestmentGoal>("/investment-goals", data);
    await mutate("/investment-goals");
    return response.data;
  } catch (error) {
    console.error("Error creating investment goals:", error);
    throw error;
  }
}

export async function updateInvestmentGoals(id: string, data: Partial<InvestmentGoal>) {
  try {
    const response = await apiClient.patch<InvestmentGoal>(`/investment-goals/${id}`, data);
    await mutate("/investment-goals");
    return response.data;
  } catch (error) {
    console.error("Error updating investment goals:", error);
    throw error;
  }
}

// Channel/Chat functions
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

export function useChannels() {
  return useSWR<ChannelWithDetails[]>("/channels", fetcher);
}

export function useChannel(channelId: string) {
  return useSWR<Channel>(channelId ? `/channels/${channelId}` : null, fetcher);
}

export function useMessages(channelId: string) {
  return useSWR<Message[]>(channelId ? `/channels/${channelId}/messages` : null, fetcher);
}

export function useChannelMembers(channelId: string) {
  return useSWR<ChannelMember[]>(channelId ? `/channels/${channelId}/members` : null, fetcher);
}

export async function createChannel(data: Partial<Channel>) {
  try {
    const response = await apiClient.post<Channel>("/channels", data);
    await mutate("/channels");
    return response.data;
  } catch (error) {
    console.error("Error creating channel:", error);
    throw error;
  }
}

export async function addChannelMember(channelId: string, userEmail: string) {
  try {
    const response = await apiClient.post(`/channels/${channelId}/members`, { user_email: userEmail });
    await mutate(`/channels/${channelId}/members`);
    return response.data;
  } catch (error) {
    console.error("Error adding channel member:", error);
    throw error;
  }
}

export async function sendMessage(channelId: string, content: string) {
  try {
    const response = await apiClient.post<Message>(`/channels/${channelId}/messages`, { content });
    await mutate(`/channels/${channelId}/messages`);
    await mutate("/channels");
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

export async function deleteMessage(channelId: string, messageId: string) {
  try {
    await apiClient.delete(`/channels/${channelId}/messages/${messageId}`);
    await mutate(`/channels/${channelId}/messages`);
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
}

// Deal sharing functions
export interface DealShare {
  id: number;
  deal_id: string;
  share_key: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  view_count: number;
  last_viewed_at: string | null;
}

export function useDealShares(dealId: string) {
  return useSWR<DealShare[]>(dealId ? `/deals/${dealId}/share` : null, fetcher);
}

export async function createDealShare(dealId: string, data: { createdBy: string; expiresInDays?: number }) {
  try {
    const response = await apiClient.post(`/deals/${dealId}/share`, data);
    await mutate(`/deals/${dealId}/share`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function revokeDealShare(dealId: string, shareId: string) {
  try {
    await apiClient.delete(`/deals/${dealId}/share/${shareId}`);
    await mutate(`/deals/${dealId}/share`);
  } catch (error) {
    throw error;
  }
}

export async function getPublicDeal(shareKey: string) {
  const response = await apiClient.get(`/public/deals/${shareKey}`);
  return response.data;
}