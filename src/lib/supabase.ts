import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Types ───
export interface Character {
  id: string;
  name: string;
  type: string;
  role: string;
  style: string;
  body_shape: string;
  body_color: string;
  accent_color: string;
  eye_style: string;
  mouth_style: string;
  special_feature: string;
  personality: string;
  catchphrase: string;
  full_prompt: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // from view
  plan_count?: number;
  sticker_count?: number;
}

export interface Plan {
  id: string;
  theme: string;
  character_id: string | null;
  target_count: number;
  notes: string;
  created_at: string;
  updated_at: string;
  // joined
  character?: Character;
  plan_items?: PlanItem[];
}

export interface PlanItem {
  id: string;
  plan_id: string;
  sort_order: number;
  emotion: string;
  scenario: string;
  text: string;
  description: string;
  is_confirmed: boolean;
  created_at: string;
}

export interface Sticker {
  id: string;
  character_id: string | null;
  plan_id: string | null;
  plan_item_id: string | null;
  prompt: string;
  image_path: string;
  image_url: string;
  status: 'generating' | 'generated' | 'approved' | 'rejected' | 'published';
  emotion: string;
  text: string;
  width: number;
  height: number;
  file_size: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Pack {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'submitted' | 'approved' | 'published';
  line_product_id: string;
  price: string;
  created_at: string;
  updated_at: string;
  // from view
  sticker_count?: number;
  approved_count?: number;
  published_count?: number;
}

export interface PackSticker {
  id: string;
  pack_id: string;
  sticker_id: string;
  sort_order: number;
}

// ─── Character CRUD ───
export const db = {
  characters: {
    async list() {
      const { data, error } = await supabase
        .from('character_stats')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Character[];
    },
    async get(id: string) {
      const { data, error } = await supabase.from('characters').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Character;
    },
    async create(char: Partial<Character>) {
      const { data, error } = await supabase.from('characters').insert(char).select().single();
      if (error) throw error;
      return data as Character;
    },
    async update(id: string, updates: Partial<Character>) {
      const { data, error } = await supabase.from('characters').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Character;
    },
    async delete(id: string) {
      const { error } = await supabase.from('characters').delete().eq('id', id);
      if (error) throw error;
    },
  },

  plans: {
    async list() {
      const { data, error } = await supabase
        .from('plans')
        .select('*, character:characters(*), plan_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Plan[];
    },
    async get(id: string) {
      const { data, error } = await supabase
        .from('plans')
        .select('*, character:characters(*), plan_items(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Plan;
    },
    async create(plan: Partial<Plan>) {
      const { data, error } = await supabase.from('plans').insert(plan).select().single();
      if (error) throw error;
      return data as Plan;
    },
    async update(id: string, updates: Partial<Plan>) {
      const { data, error } = await supabase.from('plans').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Plan;
    },
    async delete(id: string) {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
    },
  },

  planItems: {
    async bulkCreate(items: Partial<PlanItem>[]) {
      const { data, error } = await supabase.from('plan_items').insert(items).select();
      if (error) throw error;
      return data as PlanItem[];
    },
    async update(id: string, updates: Partial<PlanItem>) {
      const { data, error } = await supabase.from('plan_items').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as PlanItem;
    },
    async delete(id: string) {
      const { error } = await supabase.from('plan_items').delete().eq('id', id);
      if (error) throw error;
    },
    async deleteByPlan(planId: string) {
      const { error } = await supabase.from('plan_items').delete().eq('plan_id', planId);
      if (error) throw error;
    },
    async toggleConfirm(id: string, confirmed: boolean) {
      const { error } = await supabase.from('plan_items').update({ is_confirmed: confirmed }).eq('id', id);
      if (error) throw error;
    },
    async confirmAll(planId: string) {
      const { error } = await supabase.from('plan_items').update({ is_confirmed: true }).eq('plan_id', planId);
      if (error) throw error;
    },
  },

  stickers: {
    async list(filters?: { status?: string; plan_id?: string; character_id?: string }) {
      let query = supabase.from('stickers').select('*').order('created_at', { ascending: false });
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.plan_id) query = query.eq('plan_id', filters.plan_id);
      if (filters?.character_id) query = query.eq('character_id', filters.character_id);
      const { data, error } = await query;
      if (error) throw error;
      return data as Sticker[];
    },
    async create(sticker: Partial<Sticker>) {
      const { data, error } = await supabase.from('stickers').insert(sticker).select().single();
      if (error) throw error;
      return data as Sticker;
    },
    async update(id: string, updates: Partial<Sticker>) {
      const { data, error } = await supabase.from('stickers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Sticker;
    },
    async delete(id: string) {
      const { error } = await supabase.from('stickers').delete().eq('id', id);
      if (error) throw error;
    },
    async updateStatus(id: string, status: Sticker['status']) {
      const { error } = await supabase.from('stickers').update({ status }).eq('id', id);
      if (error) throw error;
    },
  },

  packs: {
    async list() {
      const { data, error } = await supabase
        .from('pack_overview')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Pack[];
    },
    async create(pack: Partial<Pack>) {
      const { data, error } = await supabase.from('packs').insert(pack).select().single();
      if (error) throw error;
      return data as Pack;
    },
    async update(id: string, updates: Partial<Pack>) {
      const { data, error } = await supabase.from('packs').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Pack;
    },
    async delete(id: string) {
      const { error } = await supabase.from('packs').delete().eq('id', id);
      if (error) throw error;
    },
    async addSticker(packId: string, stickerId: string, sortOrder: number) {
      const { error } = await supabase.from('pack_stickers').insert({ pack_id: packId, sticker_id: stickerId, sort_order: sortOrder });
      if (error) throw error;
    },
    async removeSticker(packId: string, stickerId: string) {
      const { error } = await supabase.from('pack_stickers').delete().eq('pack_id', packId).eq('sticker_id', stickerId);
      if (error) throw error;
    },
    async getStickers(packId: string) {
      const { data, error } = await supabase
        .from('pack_stickers')
        .select('*, sticker:stickers(*)')
        .eq('pack_id', packId)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  },

  storage: {
    async uploadImage(path: string, base64Data: string) {
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const { data, error } = await supabase.storage
        .from('sticker-images')
        .upload(path, buffer, { contentType: 'image/png', upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('sticker-images').getPublicUrl(path);
      return urlData.publicUrl;
    },
    async deleteImage(path: string) {
      const { error } = await supabase.storage.from('sticker-images').remove([path]);
      if (error) throw error;
    },
    getPublicUrl(path: string) {
      const { data } = supabase.storage.from('sticker-images').getPublicUrl(path);
      return data.publicUrl;
    },
  },
};
