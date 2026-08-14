export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          context_id: string | null
          context_type: Database["public"]["Enums"]["ai_context_type"]
          created_at: string
          id: string
          org_id: string
          owner_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          context_id?: string | null
          context_type?: Database["public"]["Enums"]["ai_context_type"]
          created_at?: string
          id?: string
          org_id: string
          owner_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          context_id?: string | null
          context_type?: Database["public"]["Enums"]["ai_context_type"]
          created_at?: string
          id?: string
          org_id?: string
          owner_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      ai_generated_content: {
        Row: {
          created_at: string
          customer_id: string | null
          deal_id: string | null
          id: string
          input: Json
          lead_id: string | null
          org_id: string
          output: string | null
          owner_id: string
          type: Database["public"]["Enums"]["ai_content_type"]
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          deal_id?: string | null
          id?: string
          input?: Json
          lead_id?: string | null
          org_id: string
          output?: string | null
          owner_id: string
          type: Database["public"]["Enums"]["ai_content_type"]
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          deal_id?: string | null
          id?: string
          input?: Json
          lead_id?: string | null
          org_id?: string
          output?: string | null
          owner_id?: string
          type?: Database["public"]["Enums"]["ai_content_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_content_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generated_content_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generated_content_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generated_content_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generated_content_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generated_content_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          ai_conversation_id: string
          content: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["ai_message_role"]
        }
        Insert: {
          ai_conversation_id: string
          content: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["ai_message_role"]
        }
        Update: {
          ai_conversation_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["ai_message_role"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_ai_conversation_id_fkey"
            columns: ["ai_conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json
          module: string
          org_id: string | null
          record_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          module: string
          org_id?: string | null
          record_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          module?: string
          org_id?: string | null
          record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          details: Json
          id: string
          org_id: string
          rule_id: string
          status: Database["public"]["Enums"]["automation_log_status"]
          target_id: string | null
          target_type: string | null
          triggered_at: string
        }
        Insert: {
          details?: Json
          id?: string
          org_id: string
          rule_id: string
          status: Database["public"]["Enums"]["automation_log_status"]
          target_id?: string | null
          target_type?: string | null
          triggered_at?: string
        }
        Update: {
          details?: Json
          id?: string
          org_id?: string
          rule_id?: string
          status?: Database["public"]["Enums"]["automation_log_status"]
          target_id?: string | null
          target_type?: string | null
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "automation_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string
          platform_user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          platform_user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          platform_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel: Database["public"]["Enums"]["channel_type"]
          created_at: string
          customer_id: string | null
          external_identifier: string | null
          id: string
          last_message_at: string | null
          lead_id: string | null
          org_id: string
          owner_id: string
          status: Database["public"]["Enums"]["conversation_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          customer_id?: string | null
          external_identifier?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          org_id: string
          owner_id: string
          status?: Database["public"]["Enums"]["conversation_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          customer_id?: string | null
          external_identifier?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          org_id?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          ai_summary: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          org_id: string
          owner_id: string
          phone: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          ai_summary?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          org_id: string
          owner_id: string
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          ai_summary?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          org_id?: string
          owner_id?: string
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      deal_discount_requests: {
        Row: {
          created_at: string
          deal_id: string
          decided_at: string | null
          decided_by: string | null
          discount_percent: number
          id: string
          notes: string | null
          org_id: string
          requested_by: string
          required_approver: Database["public"]["Enums"]["discount_required_approver"]
          status: Database["public"]["Enums"]["discount_approval_status"]
        }
        Insert: {
          created_at?: string
          deal_id: string
          decided_at?: string | null
          decided_by?: string | null
          discount_percent: number
          id?: string
          notes?: string | null
          org_id: string
          requested_by: string
          required_approver: Database["public"]["Enums"]["discount_required_approver"]
          status?: Database["public"]["Enums"]["discount_approval_status"]
        }
        Update: {
          created_at?: string
          deal_id?: string
          decided_at?: string | null
          decided_by?: string | null
          discount_percent?: number
          id?: string
          notes?: string | null
          org_id?: string
          requested_by?: string
          required_approver?: Database["public"]["Enums"]["discount_required_approver"]
          status?: Database["public"]["Enums"]["discount_approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "deal_discount_requests_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_discount_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_discount_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "deal_discount_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_discount_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_discount_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      deals: {
        Row: {
          closed_at: string | null
          code: string
          created_at: string
          currency: string
          customer_id: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          lost_reason: string | null
          notes: string | null
          org_id: string
          owner_id: string
          property_id: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          closed_at?: string | null
          code?: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          org_id: string
          owner_id: string
          property_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          closed_at?: string | null
          code?: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          org_id?: string
          owner_id?: string
          property_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          org_id: string
          owner_id: string
          related_id: string
          related_type: Database["public"]["Enums"]["document_related_type"]
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          org_id: string
          owner_id: string
          related_id: string
          related_type: Database["public"]["Enums"]["document_related_type"]
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          org_id?: string
          owner_id?: string
          related_id?: string
          related_type?: Database["public"]["Enums"]["document_related_type"]
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_id: string | null
          deal_id: string | null
          due_at: string
          id: string
          lead_id: string | null
          notes: string | null
          org_id: string
          owner_id: string
          status: Database["public"]["Enums"]["follow_up_status"]
          type: Database["public"]["Enums"]["follow_up_type"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          deal_id?: string | null
          due_at: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          org_id: string
          owner_id: string
          status?: Database["public"]["Enums"]["follow_up_status"]
          type?: Database["public"]["Enums"]["follow_up_type"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          deal_id?: string | null
          due_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          org_id?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["follow_up_status"]
          type?: Database["public"]["Enums"]["follow_up_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      integration_providers: {
        Row: {
          auth_type: Database["public"]["Enums"]["integration_auth_type"]
          category: string
          config_schema: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          auth_type: Database["public"]["Enums"]["integration_auth_type"]
          category: string
          config_schema?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          auth_type?: Database["public"]["Enums"]["integration_auth_type"]
          category?: string
          config_schema?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_providers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_providers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_score: number | null
          budget_max: number | null
          budget_min: number | null
          converted_customer_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          interested_property_id: string | null
          is_archived: boolean
          org_id: string
          owner_id: string | null
          phone: string | null
          requirement: string | null
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          temperature: Database["public"]["Enums"]["lead_temperature"]
          updated_at: string
        }
        Insert: {
          ai_score?: number | null
          budget_max?: number | null
          budget_min?: number | null
          converted_customer_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          interested_property_id?: string | null
          is_archived?: boolean
          org_id: string
          owner_id?: string | null
          phone?: string | null
          requirement?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
        }
        Update: {
          ai_score?: number | null
          budget_max?: number | null
          budget_min?: number | null
          converted_customer_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          interested_property_id?: string | null
          is_archived?: boolean
          org_id?: string
          owner_id?: string | null
          phone?: string | null
          requirement?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_customer_id_fkey"
            columns: ["converted_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_interested_property_id_fkey"
            columns: ["interested_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      login_approval_queue: {
        Row: {
          decided_at: string | null
          decided_by: string | null
          device_id: string
          id: string
          platform_user_id: string
          requested_at: string
          status: Database["public"]["Enums"]["login_status"]
        }
        Insert: {
          decided_at?: string | null
          decided_by?: string | null
          device_id: string
          id?: string
          platform_user_id: string
          requested_at?: string
          status?: Database["public"]["Enums"]["login_status"]
        }
        Update: {
          decided_at?: string | null
          decided_by?: string | null
          device_id?: string
          id?: string
          platform_user_id?: string
          requested_at?: string
          status?: Database["public"]["Enums"]["login_status"]
        }
        Relationships: [
          {
            foreignKeyName: "login_approval_queue_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "login_approval_queue_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "login_approval_queue_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "login_approval_queue_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      login_sessions: {
        Row: {
          device_id: string
          ended_at: string | null
          id: string
          is_active: boolean
          platform_user_id: string
          started_at: string
        }
        Insert: {
          device_id: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          platform_user_id: string
          started_at?: string
        }
        Update: {
          device_id?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          platform_user_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_sessions_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "login_sessions_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      messages: {
        Row: {
          channel: Database["public"]["Enums"]["channel_type"]
          content: string | null
          conversation_id: string
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          external_message_id: string | null
          id: string
          media_url: string | null
          org_id: string
          sender_platform_user_id: string | null
          status: Database["public"]["Enums"]["message_status"]
        }
        Insert: {
          channel: Database["public"]["Enums"]["channel_type"]
          content?: string | null
          conversation_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          external_message_id?: string | null
          id?: string
          media_url?: string | null
          org_id: string
          sender_platform_user_id?: string | null
          status?: Database["public"]["Enums"]["message_status"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel_type"]
          content?: string | null
          conversation_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          external_message_id?: string | null
          id?: string
          media_url?: string | null
          org_id?: string
          sender_platform_user_id?: string | null
          status?: Database["public"]["Enums"]["message_status"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_platform_user_id_fkey"
            columns: ["sender_platform_user_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_platform_user_id_fkey"
            columns: ["sender_platform_user_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          org_id: string
          read_at: string | null
          recipient_id: string
          related_id: string | null
          related_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          org_id: string
          read_at?: string | null
          recipient_id: string
          related_id?: string | null
          related_type?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          org_id?: string
          read_at?: string | null
          recipient_id?: string
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      org_integrations: {
        Row: {
          config: Json
          connected_at: string | null
          connected_by: string | null
          created_at: string
          id: string
          last_error: string | null
          org_id: string
          provider_id: string
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
        }
        Insert: {
          config?: Json
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          org_id: string
          provider_id: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Update: {
          config?: Json
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          org_id?: string
          provider_id?: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_integrations_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_integrations_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "org_integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_integrations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integration_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          current_device_id: string | null
          full_name: string
          id: string
          is_active: boolean
          must_reset_password: boolean
          notification_preferences: Json
          org_id: string | null
          parent_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          username: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          current_device_id?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          must_reset_password?: boolean
          notification_preferences?: Json
          org_id?: string | null
          parent_id?: string | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          current_device_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          must_reset_password?: boolean
          notification_preferences?: Json
          org_id?: string | null
          parent_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_users_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_users_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      projects: {
        Row: {
          city: string | null
          created_at: string
          description: string | null
          developer_name: string | null
          id: string
          location: string | null
          name: string
          org_id: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string | null
          developer_name?: string | null
          id?: string
          location?: string | null
          name: string
          org_id: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string | null
          developer_name?: string | null
          id?: string
          location?: string | null
          name?: string
          org_id?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          created_at: string
          currency: string
          floor: string | null
          id: string
          notes: string | null
          org_id: string
          owner_id: string
          price: number | null
          project_id: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          size_sqft: number | null
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          currency?: string
          floor?: string | null
          id?: string
          notes?: string | null
          org_id: string
          owner_id: string
          price?: number | null
          project_id?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          size_sqft?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          currency?: string
          floor?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          owner_id?: string
          price?: number | null
          project_id?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          size_sqft?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "properties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_forecasts: {
        Row: {
          basis: Json
          created_at: string
          currency: string
          forecast_value: number
          id: string
          org_id: string
          owner_id: string
          period_end: string
          period_start: string
        }
        Insert: {
          basis?: Json
          created_at?: string
          currency?: string
          forecast_value: number
          id?: string
          org_id: string
          owner_id: string
          period_end: string
          period_start: string
        }
        Update: {
          basis?: Json
          created_at?: string
          currency?: string
          forecast_value?: number
          id?: string
          org_id?: string
          owner_id?: string
          period_end?: string
          period_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_forecasts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_forecasts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_forecasts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      revenue_targets: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          id: string
          org_id: string
          owner_id: string | null
          period_end: string
          period_start: string
          target_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          org_id: string
          owner_id?: string | null
          period_end: string
          period_start: string
          target_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          org_id?: string
          owner_id?: string | null
          period_end?: string
          period_start?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_targets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_targets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "revenue_targets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_targets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_targets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      saved_reports: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          org_id: string
          owner_id: string
          report_type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          name: string
          org_id: string
          owner_id: string
          report_type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          owner_id?: string
          report_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_reports_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_reports_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      site_visits: {
        Row: {
          created_at: string
          customer_id: string | null
          feedback: string | null
          id: string
          lead_id: string | null
          org_id: string
          owner_id: string
          property_id: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["site_visit_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          feedback?: string | null
          id?: string
          lead_id?: string | null
          org_id: string
          owner_id: string
          property_id?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["site_visit_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          feedback?: string | null
          id?: string
          lead_id?: string | null
          org_id?: string
          owner_id?: string
          property_id?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["site_visit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visits_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visits_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "site_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string | null
          category: Database["public"]["Enums"]["task_category"]
          checklist: Json
          created_at: string
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          notes: string | null
          org_id: string
          owner_id: string
          priority: Database["public"]["Enums"]["task_priority"]
          related_id: string | null
          related_type: Database["public"]["Enums"]["task_related_type"]
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          category?: Database["public"]["Enums"]["task_category"]
          checklist?: Json
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          notes?: string | null
          org_id: string
          owner_id: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_id?: string | null
          related_type?: Database["public"]["Enums"]["task_related_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          category?: Database["public"]["Enums"]["task_category"]
          checklist?: Json
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          owner_id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_id?: string | null
          related_type?: Database["public"]["Enums"]["task_related_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "platform_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_staff_performance"
            referencedColumns: ["staff_id"]
          },
        ]
      }
    }
    Views: {
      v_staff_performance: {
        Row: {
          deals_closed: number | null
          follow_ups_completed: number | null
          follow_ups_missed: number | null
          full_name: string | null
          hot_leads: number | null
          lead_conversion_pct: number | null
          leads_lost: number | null
          leads_won: number | null
          org_id: string | null
          reports_to: string | null
          revenue_generated: number | null
          role: string | null
          site_visits_completed: number | null
          site_visits_conducted: number | null
          staff_id: string | null
          total_follow_ups: number | null
          total_leads: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      fn_auto_assign_lead: { Args: { p_org_id: string }; Returns: string }
      fn_can_access_record: {
        Args: { record_org_id: string; record_owner_id: string }
        Returns: boolean
      }
      fn_condition_matches: {
        Args: { p_conditions: Json; p_record: Json }
        Returns: boolean
      }
      fn_convert_lead_to_customer: {
        Args: { p_lead_id: string }
        Returns: string
      }
      fn_current_org_id: { Args: never; Returns: string }
      fn_current_org_id_text: { Args: never; Returns: string }
      fn_current_platform_user_id: { Args: never; Returns: string }
      fn_current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      fn_execute_action: {
        Args: {
          p_action: Json
          p_org_id: string
          p_owner_id: string
          p_record: Json
          p_record_id: string
          p_record_table: string
        }
        Returns: string
      }
      fn_generate_due_reminders: { Args: never; Returns: undefined }
      fn_global_search: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          id: string
          result_type: string
          subtitle: string
          title: string
        }[]
      }
      fn_is_in_scope: {
        Args: { target_org_id: string; target_owner_id: string }
        Returns: boolean
      }
      fn_run_automations: {
        Args: {
          p_org_id: string
          p_record: Json
          p_table: string
          p_trigger_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      ai_content_type:
        | "email_draft"
        | "proposal"
        | "customer_summary"
        | "call_summary"
        | "brochure_search"
        | "lead_score"
        | "daily_brief"
      ai_context_type: "lead" | "customer" | "deal" | "property" | "general"
      ai_message_role: "user" | "assistant" | "system"
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "login"
        | "logout"
        | "approve"
        | "reject"
        | "assign"
        | "status_change"
        | "other"
      automation_log_status: "success" | "failed" | "skipped"
      channel_type: "whatsapp" | "email" | "call" | "internal_chat"
      conversation_status: "open" | "closed"
      deal_stage:
        | "new"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "contract"
        | "booked"
        | "lost"
      discount_approval_status:
        | "auto_approved"
        | "pending"
        | "approved"
        | "rejected"
      discount_required_approver: "self" | "manager" | "admin"
      document_related_type:
        | "lead"
        | "customer"
        | "deal"
        | "property"
        | "project"
      follow_up_status: "pending" | "done" | "missed"
      follow_up_type: "call" | "email" | "whatsapp" | "meeting" | "other"
      integration_auth_type: "api_key" | "oauth2" | "webhook"
      integration_status: "disconnected" | "connected" | "error"
      lead_stage:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "site_visit"
        | "won"
        | "lost"
        | "archive"
      lead_temperature: "hot" | "warm" | "cold"
      login_status: "pending" | "approved" | "rejected"
      message_direction: "inbound" | "outbound"
      message_status: "queued" | "sent" | "delivered" | "read" | "failed"
      notification_type:
        | "task_due"
        | "follow_up_due"
        | "approval_pending"
        | "lead_assigned"
        | "deal_update"
        | "site_visit_reminder"
        | "system"
        | "other"
      property_status: "available" | "on_hold" | "sold" | "rented"
      property_type:
        | "apartment"
        | "villa"
        | "plot"
        | "commercial"
        | "office"
        | "other"
      site_visit_status: "scheduled" | "completed" | "cancelled" | "no_show"
      task_category:
        | "follow_up"
        | "call"
        | "whatsapp"
        | "email"
        | "site_visit"
        | "meeting"
        | "documentation"
        | "payment_collection"
        | "property_verification"
        | "internal"
        | "administration"
        | "marketing"
        | "training"
        | "other"
      task_priority: "critical" | "high" | "medium" | "low"
      task_related_type:
        | "lead"
        | "customer"
        | "deal"
        | "property"
        | "project"
        | "site_visit"
        | "general"
      task_status:
        | "pending"
        | "accepted"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
        | "overdue"
      user_role: "super_admin" | "admin" | "manager" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_content_type: [
        "email_draft",
        "proposal",
        "customer_summary",
        "call_summary",
        "brochure_search",
        "lead_score",
        "daily_brief",
      ],
      ai_context_type: ["lead", "customer", "deal", "property", "general"],
      ai_message_role: ["user", "assistant", "system"],
      audit_action: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "approve",
        "reject",
        "assign",
        "status_change",
        "other",
      ],
      automation_log_status: ["success", "failed", "skipped"],
      channel_type: ["whatsapp", "email", "call", "internal_chat"],
      conversation_status: ["open", "closed"],
      deal_stage: [
        "new",
        "qualified",
        "proposal",
        "negotiation",
        "contract",
        "booked",
        "lost",
      ],
      discount_approval_status: [
        "auto_approved",
        "pending",
        "approved",
        "rejected",
      ],
      discount_required_approver: ["self", "manager", "admin"],
      document_related_type: [
        "lead",
        "customer",
        "deal",
        "property",
        "project",
      ],
      follow_up_status: ["pending", "done", "missed"],
      follow_up_type: ["call", "email", "whatsapp", "meeting", "other"],
      integration_auth_type: ["api_key", "oauth2", "webhook"],
      integration_status: ["disconnected", "connected", "error"],
      lead_stage: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "site_visit",
        "won",
        "lost",
        "archive",
      ],
      lead_temperature: ["hot", "warm", "cold"],
      login_status: ["pending", "approved", "rejected"],
      message_direction: ["inbound", "outbound"],
      message_status: ["queued", "sent", "delivered", "read", "failed"],
      notification_type: [
        "task_due",
        "follow_up_due",
        "approval_pending",
        "lead_assigned",
        "deal_update",
        "site_visit_reminder",
        "system",
        "other",
      ],
      property_status: ["available", "on_hold", "sold", "rented"],
      property_type: [
        "apartment",
        "villa",
        "plot",
        "commercial",
        "office",
        "other",
      ],
      site_visit_status: ["scheduled", "completed", "cancelled", "no_show"],
      task_category: [
        "follow_up",
        "call",
        "whatsapp",
        "email",
        "site_visit",
        "meeting",
        "documentation",
        "payment_collection",
        "property_verification",
        "internal",
        "administration",
        "marketing",
        "training",
        "other",
      ],
      task_priority: ["critical", "high", "medium", "low"],
      task_related_type: [
        "lead",
        "customer",
        "deal",
        "property",
        "project",
        "site_visit",
        "general",
      ],
      task_status: [
        "pending",
        "accepted",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
        "overdue",
      ],
      user_role: ["super_admin", "admin", "manager", "user"],
    },
  },
} as const
