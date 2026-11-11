// Gerado a partir do schema do Supabase.
// Para regenerar: Supabase MCP `generate_typescript_types` ou
// `npx supabase gen types typescript --project-id dfzaadgemrmldjowbetg`.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          body: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          meta: Json
          organization_id: string
          proposal_id: string | null
          title: string | null
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          body?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          meta?: Json
          organization_id: string
          proposal_id?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          body?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          meta?: Json
          organization_id?: string
          proposal_id?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          city: string | null
          created_at: string
          created_by: string | null
          customer_since: string | null
          document: string | null
          email: string | null
          id: string
          industry: string | null
          kind: string
          lead_id: string | null
          legal_name: string | null
          monthly_value: number
          name: string
          notes: string | null
          organization_id: string
          owner_id: string | null
          phone: string | null
          position: number
          state: string | null
          status: Database["public"]["Enums"]["client_status"]
          status_changed_at: string
          tags: string[]
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          customer_since?: string | null
          document?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          kind?: string
          lead_id?: string | null
          legal_name?: string | null
          monthly_value?: number
          name: string
          notes?: string | null
          organization_id: string
          owner_id?: string | null
          phone?: string | null
          position?: number
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          status_changed_at?: string
          tags?: string[]
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          customer_since?: string | null
          document?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          kind?: string
          lead_id?: string | null
          legal_name?: string | null
          monthly_value?: number
          name?: string
          notes?: string | null
          organization_id?: string
          owner_id?: string | null
          phone?: string | null
          position?: number
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          status_changed_at?: string
          tags?: string[]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          job_title: string | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          job_title?: string | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          job_title?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          product_id: string | null
          status: Database["public"]["Enums"]["funnel_status"]
          updated_at: string
          variants: Json
          winner_variant: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          product_id?: string | null
          status?: Database["public"]["Enums"]["funnel_status"]
          updated_at?: string
          variants?: Json
          winner_variant?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          product_id?: string | null
          status?: Database["public"]["Enums"]["funnel_status"]
          updated_at?: string
          variants?: Json
          winner_variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          converted_at: string | null
          converted_client_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          estimated_value: number
          expected_close_date: string | null
          id: string
          job_title: string | null
          lost_reason: string | null
          name: string
          notes: string | null
          organization_id: string
          owner_id: string | null
          phone: string | null
          pipeline_id: string
          position: number
          qual_authority: boolean
          qual_budget: boolean
          qual_need: boolean
          qual_timing: boolean
          source: string | null
          stage_changed_at: string
          stage_id: string
          tags: string[]
          temperature: Database["public"]["Enums"]["lead_temperature"]
          updated_at: string
        }
        Insert: {
          company?: string | null
          converted_at?: string | null
          converted_client_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value?: number
          expected_close_date?: string | null
          id?: string
          job_title?: string | null
          lost_reason?: string | null
          name: string
          notes?: string | null
          organization_id: string
          owner_id?: string | null
          phone?: string | null
          pipeline_id: string
          position?: number
          qual_authority?: boolean
          qual_budget?: boolean
          qual_need?: boolean
          qual_timing?: boolean
          source?: string | null
          stage_changed_at?: string
          stage_id: string
          tags?: string[]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
        }
        Update: {
          company?: string | null
          converted_at?: string | null
          converted_client_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value?: number
          expected_close_date?: string | null
          id?: string
          job_title?: string | null
          lost_reason?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          owner_id?: string | null
          phone?: string | null
          pipeline_id?: string
          position?: number
          qual_authority?: boolean
          qual_budget?: boolean
          qual_need?: boolean
          qual_timing?: boolean
          source?: string | null
          stage_changed_at?: string
          stage_id?: string
          tags?: string[]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_client_id_fkey"
            columns: ["converted_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["member_role"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["member_role"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["member_role"]
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          proposal_counter: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          proposal_counter?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          proposal_counter?: number
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          category: Database["public"]["Enums"]["stage_category"]
          color: string
          created_at: string
          id: string
          name: string
          organization_id: string
          pipeline_id: string
          position: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["stage_category"]
          color?: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          pipeline_id: string
          position?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["stage_category"]
          color?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          pipeline_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          organization_id: string
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          billing: Database["public"]["Enums"]["billing_cycle"]
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          preferred_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          preferred_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          preferred_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proposal_items: {
        Row: {
          billing: Database["public"]["Enums"]["billing_cycle"]
          created_at: string
          description: string | null
          discount_pct: number
          id: string
          name: string
          organization_id: string
          position: number
          product_id: string | null
          proposal_id: string
          quantity: number
          total: number | null
          unit_price: number
        }
        Insert: {
          billing?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          description?: string | null
          discount_pct?: number
          id?: string
          name: string
          organization_id: string
          position?: number
          product_id?: string | null
          proposal_id: string
          quantity?: number
          total?: number | null
          unit_price?: number
        }
        Update: {
          billing?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          description?: string | null
          discount_pct?: number
          id?: string
          name?: string
          organization_id?: string
          position?: number
          product_id?: string | null
          proposal_id?: string
          quantity?: number
          total?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          intro: string | null
          lead_id: string | null
          number: number
          organization_id: string
          owner_id: string | null
          public_token: string
          responded_at: string | null
          response_comment: string | null
          response_name: string | null
          sections: Json
          sent_at: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          terms: string | null
          title: string
          total_monthly: number
          total_one_time: number
          updated_at: string
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          intro?: string | null
          lead_id?: string | null
          number?: number
          organization_id: string
          owner_id?: string | null
          public_token?: string
          responded_at?: string | null
          response_comment?: string | null
          response_name?: string | null
          sections?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          terms?: string | null
          title: string
          total_monthly?: number
          total_one_time?: number
          updated_at?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          intro?: string | null
          lead_id?: string | null
          number?: number
          organization_id?: string
          owner_id?: string | null
          public_token?: string
          responded_at?: string | null
          response_comment?: string | null
          response_name?: string | null
          sections?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          terms?: string | null
          title?: string
          total_monthly?: number
          total_one_time?: number
          updated_at?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_pending_invites: { Args: never; Returns: string }
      convert_lead_to_client: { Args: { p_lead_id: string }; Returns: string }
      create_organization: {
        Args: { p_name: string; p_with_demo?: boolean }
        Returns: string
      }
      get_public_proposal: { Args: { p_token: string }; Returns: Json }
      mark_proposal_viewed: { Args: { p_token: string }; Returns: undefined }
      respond_proposal: {
        Args: {
          p_accept: boolean
          p_comment?: string
          p_name: string
          p_token: string
        }
        Returns: string
      }
      save_proposal: {
        Args: { p_data: Json; p_id: string }
        Returns: undefined
      }
    }
    Enums: {
      activity_type:
        | "note"
        | "call"
        | "email"
        | "meeting"
        | "whatsapp"
        | "task"
        | "stage_change"
        | "status_change"
        | "proposal"
        | "system"
      billing_cycle: "one_time" | "monthly"
      client_status: "onboarding" | "active" | "at_risk" | "paused" | "churned"
      funnel_status: "draft" | "testing" | "active" | "paused" | "archived"
      lead_temperature: "cold" | "warm" | "hot"
      member_role: "owner" | "admin" | "member"
      proposal_status:
        | "draft"
        | "sent"
        | "viewed"
        | "accepted"
        | "rejected"
        | "expired"
      stage_category: "open" | "won" | "lost"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
